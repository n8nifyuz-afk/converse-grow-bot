import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Webhook signature verification timeout (5 minutes)
const WEBHOOK_TIMEOUT_MS = 5 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    let event: Stripe.Event;

    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        logStep("Webhook signature verified");
        
        // Check webhook timestamp to prevent replay attacks
        const eventTimestamp = event.created * 1000; // Convert to milliseconds
        const now = Date.now();
        if (now - eventTimestamp > WEBHOOK_TIMEOUT_MS) {
          logStep("Webhook timestamp expired", { 
            eventAge: Math.floor((now - eventTimestamp) / 1000) + " seconds" 
          });
          return new Response(JSON.stringify({ error: "Webhook timestamp too old" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err instanceof Error ? err.message : String(err) });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      event = JSON.parse(body);
      logStep("WARNING: Processing unverified webhook");
    }

    // Check for duplicate webhook events (idempotency)
    const { data: existingEvent } = await supabaseClient
      .from('stripe_webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent) {
      logStep("Duplicate webhook event detected, skipping", { eventId: event.id });
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Record webhook event for idempotency
    await supabaseClient
      .from('stripe_webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type
      });

    logStep("Event type", { type: event.type, eventId: event.id });

    // Load product mapping from database
    const { data: productMappings, error: mappingError } = await supabaseClient
      .from('stripe_products')
      .select('stripe_product_id, plan_name, plan_tier');

    if (mappingError) {
      logStep("Error loading product mappings", { error: mappingError.message });
      throw mappingError;
    }

    const productToPlanMap: { [key: string]: { name: string, tier: string } } = {};
    productMappings?.forEach((mapping: any) => {
      productToPlanMap[mapping.stripe_product_id] = {
        name: mapping.plan_name,
        tier: mapping.plan_tier
      };
    });

    logStep("Loaded product mappings", { count: Object.keys(productToPlanMap).length });

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription update", { 
          subscriptionId: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        });

        // Get customer email
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        if (!customer.email) {
          logStep("No customer email found");
          break;
        }

        // Find user by email
        const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
        if (userError) throw userError;

        const user = users.users.find(u => u.email === customer.email);
        if (!user) {
          logStep("User not found", { email: customer.email });
          break;
        }

        // CRITICAL: Check cancel_at_period_end flag
        // If true, keep user active until period end, don't downgrade yet
        if (subscription.cancel_at_period_end) {
          logStep("Subscription set to cancel at period end, keeping active until then", { 
            subscriptionId: subscription.id,
            periodEnd: new Date(subscription.current_period_end * 1000).toISOString()
          });
          // Continue processing - user stays active until subscription.deleted fires
        }

        // CRITICAL: Handle paused subscriptions - treat as inactive
        if (subscription.status === 'paused') {
          logStep("Subscription paused, reverting to free plan", { 
            subscriptionId: subscription.id 
          });
          
          await supabaseClient
            .from('user_subscriptions')
            .delete()
            .eq('user_id', user.id);
          
          // ONLY delete usage_limits on downgrade/cancellation
          await supabaseClient
            .from('usage_limits')
            .delete()
            .eq('user_id', user.id);
          
          logStep("User reverted to free plan (paused)", { userId: user.id });
          break;
        }

        // If subscription is canceled, past_due, unpaid, or incomplete_expired, revert to free
        if (['canceled', 'past_due', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
          logStep("Subscription cancelled/expired, reverting to free plan", { 
            subscriptionId: subscription.id,
            status: subscription.status 
          });
          
          await supabaseClient
            .from('user_subscriptions')
            .delete()
            .eq('user_id', user.id);
          
          // ONLY delete usage_limits on downgrade/cancellation
          await supabaseClient
            .from('usage_limits')
            .delete()
            .eq('user_id', user.id);
          
          logStep("User reverted to free plan", { userId: user.id });
          break;
        }

        // Check if user has multiple active subscriptions
        const allSubscriptions = await stripe.subscriptions.list({
          customer: subscription.customer as string,
          status: "active",
          limit: 10,
        });
        
        logStep("Found active subscriptions", { count: allSubscriptions.data.length });
        
        // Find the highest tier subscription
        let highestTierSub = subscription;
        let highestTier = 'free';
        
        const tierPriority: { [key: string]: number } = {
          'free': 0,
          'pro': 1,
          'ultra_pro': 2
        };
        
        for (const sub of allSubscriptions.data) {
          const subProductId = sub.items.data[0].price.product as string;
          const planMapping = productToPlanMap[subProductId];
          
          if (planMapping && tierPriority[planMapping.tier] > tierPriority[highestTier]) {
            highestTier = planMapping.tier;
            highestTierSub = sub;
          }
        }

        const productId = highestTierSub.items.data[0].price.product as string;
        const planMapping = productToPlanMap[productId];
        
        if (!planMapping) {
          logStep("Unknown product ID", { productId });
          break;
        }

        const plan = planMapping.tier;
        logStep("Determined plan", { plan, productId });

        // CRITICAL FIX: If current_period_end is missing, fetch full subscription from Stripe
        let periodEndTimestamp = highestTierSub.current_period_end;
        
        if (!periodEndTimestamp || typeof periodEndTimestamp !== 'number') {
          logStep("Missing current_period_end, fetching full subscription", { 
            subscriptionId: highestTierSub.id 
          });
          
          try {
            const fullSubscription = await stripe.subscriptions.retrieve(highestTierSub.id);
            periodEndTimestamp = fullSubscription.current_period_end;
            
            // FALLBACK: Calculate from subscription creation date
            if (!periodEndTimestamp) {
              logStep("Calculating period_end from subscription details", {
                created: fullSubscription.created,
                status: fullSubscription.status
              });
              
              const interval = fullSubscription.items.data[0]?.price?.recurring?.interval || 'month';
              const intervalCount = fullSubscription.items.data[0]?.price?.recurring?.interval_count || 1;
              const createdDate = new Date(fullSubscription.created * 1000);
              const periodEnd = new Date(createdDate);
              
              if (interval === 'year') {
                periodEnd.setFullYear(periodEnd.getFullYear() + intervalCount);
              } else if (interval === 'month') {
                periodEnd.setMonth(periodEnd.getMonth() + intervalCount);
              }
              
              periodEndTimestamp = Math.floor(periodEnd.getTime() / 1000);
              logStep("Calculated period_end", { periodEnd: periodEnd.toISOString() });
            }
          } catch (fetchError) {
            logStep("ERROR: Failed to determine period end", { error: fetchError });
            throw new Error("Unable to determine subscription billing period");
          }
        }

        const periodEndDate = new Date(periodEndTimestamp * 1000);
        if (isNaN(periodEndDate.getTime())) {
          logStep("ERROR: Date conversion failed", { 
            currentPeriodEnd: periodEndTimestamp 
          });
          throw new Error("Invalid subscription period end date");
        }

        // Upsert subscription
        const { error: upsertError } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customer.id,
            stripe_subscription_id: highestTierSub.id,
            product_id: productId,
            plan: plan,
            plan_name: planMapping.name,
            status: 'active',
            current_period_end: periodEndDate.toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) {
          logStep("Error upserting subscription", { error: upsertError.message });
          throw upsertError;
        }

        logStep("Subscription updated successfully", { userId: user.id, plan });

        // CRITICAL FIX: Don't delete usage_limits on renewal/activation
        // Let check_and_reset_usage_limits handle natural expiry and reset
        // This prevents race conditions with other functions and cron jobs
        // The DB function will create new period when old one expires
        
        logStep("Subscription activated, usage limits will reset naturally at period end", { 
          userId: user.id,
          periodEnd: new Date(highestTierSub.current_period_end * 1000).toISOString()
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        if (!customer.email) break;

        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customer.email);
        if (!user) break;

        // Delete subscription and clean up usage limits (user downgrade)
        await supabaseClient
          .from('user_subscriptions')
          .delete()
          .eq('user_id', user.id);

        // ONLY delete usage_limits on subscription deletion (downgrade)
        await supabaseClient
          .from('usage_limits')
          .delete()
          .eq('user_id', user.id);

        logStep("User subscription deleted, reverted to free, limits cleaned up", { userId: user.id });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", { invoiceId: invoice.id });

        if (!invoice.customer_email) break;

        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users.users.find(u => u.email === invoice.customer_email);
        if (!user) break;

        // Activate subscription
        const { error } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
        
        // CRITICAL FIX: Check updated_at to prevent double reset
        // Use .maybeSingle() instead of .single() to avoid errors when no records exist
        const { data: existingLimits } = await supabaseClient
          .from('usage_limits')
          .select('updated_at')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Don't delete usage_limits - let natural expiry handle it
        // This prevents race conditions with subscription.updated and cron jobs
        if (existingLimits) {
          const timeSinceUpdate = Date.now() - new Date(existingLimits.updated_at).getTime();
          logStep("Subscription activated, usage limits exist", { 
            userId: user.id,
            timeSinceUpdate: Math.floor(timeSinceUpdate / 1000) + " seconds"
          });
        } else {
          logStep("Subscription activated, no usage limits yet (will be created on first use)", { 
            userId: user.id 
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id });

        if (!invoice.customer_email) break;

        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users.users.find(u => u.email === invoice.customer_email);
        if (!user) break;

        // Revert to free plan and clean up limits (downgrade)
        await supabaseClient
          .from('user_subscriptions')
          .delete()
          .eq('user_id', user.id);

        // Delete usage_limits on downgrade
        await supabaseClient
          .from('usage_limits')
          .delete()
          .eq('user_id', user.id);

        logStep("User reverted to free due to payment failure, limits cleaned up", { userId: user.id });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Charge refunded", { 
          chargeId: charge.id,
          amountRefunded: charge.amount_refunded,
          totalAmount: charge.amount
        });

        if (!charge.billing_details.email) break;

        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users.users.find(u => u.email === charge.billing_details.email);
        if (!user) break;

        // CRITICAL: Revert to free plan for ANY refund (partial or full)
        // Policy: Any refund removes subscription access
        if (charge.amount_refunded > 0) {
          await supabaseClient
            .from('user_subscriptions')
            .delete()
            .eq('user_id', user.id);

          await supabaseClient
            .from('usage_limits')
            .delete()
            .eq('user_id', user.id);

          logStep("User reverted to free after refund", { 
            userId: user.id,
            refundType: charge.amount_refunded === charge.amount ? 'full' : 'partial'
          });
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { 
          sessionId: session.id,
          paymentStatus: session.payment_status,
          status: session.status
        });

        // If payment failed or session expired, user should remain on free plan
        if (session.payment_status === 'unpaid' || session.status === 'expired') {
          logStep("Checkout session failed or expired", { 
            sessionId: session.id,
            paymentStatus: session.payment_status
          });
          
          if (session.customer_email) {
            const { data: users } = await supabaseClient.auth.admin.listUsers();
            const user = users.users.find(u => u.email === session.customer_email);
            
            if (user) {
              // Ensure user stays on free plan and clean up limits
              await supabaseClient
                .from('user_subscriptions')
                .delete()
                .eq('user_id', user.id);

              await supabaseClient
                .from('usage_limits')
                .delete()
                .eq('user_id', user.id);
              
              logStep("User kept on free plan after failed checkout, limits cleaned", { userId: user.id });
            }
          }
        }
        // Success case is already handled by subscription.created webhook
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment intent failed", { 
          paymentIntentId: paymentIntent.id,
          lastPaymentError: paymentIntent.last_payment_error?.message
        });

        // Get customer email from payment intent
        if (paymentIntent.customer) {
          const customer = await stripe.customers.retrieve(paymentIntent.customer as string) as Stripe.Customer;
          if (customer.email) {
            const { data: users } = await supabaseClient.auth.admin.listUsers();
            const user = users.users.find(u => u.email === customer.email);
            
            if (user) {
              // Ensure user stays on free plan and clean up limits
              await supabaseClient
                .from('user_subscriptions')
                .delete()
                .eq('user_id', user.id);

              await supabaseClient
                .from('usage_limits')
                .delete()
                .eq('user_id', user.id);
              
              logStep("User kept on free plan after payment failure, limits cleaned", { userId: user.id });
            }
          }
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Async payment failed", { sessionId: session.id });

        if (session.customer_email) {
          const { data: users } = await supabaseClient.auth.admin.listUsers();
          const user = users.users.find(u => u.email === session.customer_email);
          
          if (user) {
            // Revert to free plan and clean up limits
            await supabaseClient
              .from('user_subscriptions')
              .delete()
              .eq('user_id', user.id);

            await supabaseClient
              .from('usage_limits')
              .delete()
              .eq('user_id', user.id);
            
            logStep("User reverted to free after async payment failure, limits cleaned", { userId: user.id });
          }
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute;
        logStep("Dispute/chargeback created", { 
          disputeId: dispute.id,
          chargeId: dispute.charge,
          amount: dispute.amount
        });

        // Get charge to find customer email
        const charge = await stripe.charges.retrieve(dispute.charge as string);
        if (!charge.billing_details.email) break;

        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users.users.find(u => u.email === charge.billing_details.email);
        if (!user) break;

        // CRITICAL: Immediately revert to free plan on chargeback
        await supabaseClient
          .from('user_subscriptions')
          .delete()
          .eq('user_id', user.id);

        await supabaseClient
          .from('usage_limits')
          .delete()
          .eq('user_id', user.id);

        logStep("User reverted to free after chargeback/dispute", { userId: user.id });
        break;
      }

      case "payment_method.attached": {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        logStep("Payment method attached", { 
          paymentMethodId: paymentMethod.id,
          customerId: paymentMethod.customer
        });

        // No action needed - Stripe handles this automatically
        // This is just for logging/monitoring card updates
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
