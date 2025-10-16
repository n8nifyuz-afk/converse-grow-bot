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

// LIVE Product IDs - Updated based on active payment links
const productToPlanMap: { [key: string]: string } = {
  'prod_TFM1M1I5vYy7fk': 'Pro',        // Pro Monthly Cheap (Test/LIVE)
  'prod_TEx5Xda5BPBuHv': 'Pro',        // Pro Yearly (LIVE)
  'prod_TDSbGJB9U4Xt7b': 'Ultra Pro',  // Ultra Pro Monthly (LIVE)
  'prod_TDSHzExQNjyvJD': 'Ultra Pro',  // Ultra Pro Yearly (LIVE)
};

// Price ID to Product ID mapping for reference
const priceToProductMap: { [key: string]: string } = {
  'price_1SIrJEL8Zm4LqDn4JqqrksNA': 'prod_TFM1M1I5vYy7fk',  // Pro Monthly Cheap
  'price_1SH1g3L8Zm4LqDn4WSyw1BzA': 'prod_TEx5Xda5BPBuHv',  // Pro Monthly
  'price_1SITBGL8Zm4LqDn4fd4JLVDA': 'prod_TEx5Xda5BPBuHv',  // Pro Yearly
  'price_1SH1gHL8Zm4LqDn4wDQIGntf': 'prod_TDSbGJB9U4Xt7b',  // Ultra Monthly
  'price_1SH1MjL8Zm4LqDn40swOy4Ar': 'prod_TDSHzExQNjyvJD',  // Ultra Yearly
};

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
    
    // CRITICAL: Reject test mode keys to prevent test subscriptions
    if (stripeKey.startsWith("sk_test_")) {
      throw new Error("TEST MODE DETECTED: Use live Stripe keys only. Change STRIPE_SECRET_KEY to sk_live_...");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    let event: Stripe.Event;

    // Verify webhook signature (if webhook secret is configured)
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err instanceof Error ? err.message : String(err) });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      // Parse without verification (for testing)
      event = JSON.parse(body);
      logStep("Processing unverified webhook (development mode)");
    }

    logStep("Event type", { type: event.type });

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription update", { 
          subscriptionId: subscription.id,
          status: subscription.status 
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
          
          logStep("User reverted to free plan", { userId: user.id });
          break;
        }

        // Check if user has multiple active subscriptions (upgrade scenario)
        const allSubscriptions = await stripe.subscriptions.list({
          customer: subscription.customer as string,
          status: "active",
          limit: 10,
        });
        
        logStep("Found active subscriptions for customer", { count: allSubscriptions.data.length });
        
        // If user has multiple active subscriptions, find the highest tier
        let highestTierSub = subscription;
        let highestTier = 'free';
        
        const tierPriority: { [key: string]: number } = {
          'free': 0,
          'pro': 1,
          'ultra_pro': 2
        };
        
        for (const sub of allSubscriptions.data) {
          const subProductId = sub.items.data[0].price.product as string;
          
          let subTier = 'free';
          // Pro products (all variants) - LIVE
          if (subProductId === 'prod_TFM1M1I5vYy7fk' || 
              subProductId === 'prod_TEx5Xda5BPBuHv') {
            subTier = 'pro';
          // Ultra Pro products (monthly or yearly) - LIVE
          } else if (subProductId === 'prod_TDSbGJB9U4Xt7b' || subProductId === 'prod_TDSHzExQNjyvJD') {
            subTier = 'ultra_pro';
          } else if (subProductId) {
            // Unknown product - log warning and skip
            logStep("WARNING: Unknown product ID detected", { productId: subProductId });
            continue; // Skip this subscription
          }
          
          if (tierPriority[subTier] > tierPriority[highestTier]) {
            highestTier = subTier;
            highestTierSub = sub;
          }
        }
        
        // If there are multiple active subscriptions, just log for now
        // DO NOT cancel lower tiers yet - wait until payment is confirmed
        if (allSubscriptions.data.length > 1) {
          logStep("Multiple active subscriptions detected - will cancel lower tiers after payment confirmation", {
            highestTierSubId: highestTierSub.id,
            totalSubs: allSubscriptions.data.length
          });
        }
        
        // Use the highest tier subscription for database update
        const finalSubscription = highestTierSub;
        const productId = finalSubscription.items.data[0].price.product as string;
        const planName = productToPlanMap[productId];
        
        // CRITICAL: If no valid plan name, reject this webhook event
        if (!planName) {
          logStep("ERROR: Unknown product ID - cannot process subscription", { productId });
          return new Response(JSON.stringify({ 
            received: true, 
            error: "Unknown product ID" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
        
        // Save subscription as 'pending_payment' initially
        // Pro access will only be granted after invoice.payment_succeeded
        const planTier = 'free'; // Keep user on free plan until payment confirmed
        const subscriptionStatus = finalSubscription.status === 'active' ? 'pending_payment' : finalSubscription.status;
        
        const subscriptionEnd = finalSubscription.current_period_end 
          ? new Date(finalSubscription.current_period_end * 1000).toISOString()
          : null;

        logStep("Subscription saved as pending payment", { 
          productId, 
          planName, 
          status: subscriptionStatus,
          subscriptionId: finalSubscription.id
        });

        // Upsert subscription data (user stays on free plan until payment succeeds)
        const { error: upsertError } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: finalSubscription.customer as string,
            stripe_subscription_id: finalSubscription.id,
            product_id: productId,
            plan_name: planName,
            plan: planTier,
            status: subscriptionStatus,
            current_period_end: subscriptionEnd,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) {
          logStep("Error upserting subscription", { error: upsertError.message });
        } else {
          logStep("Subscription saved pending payment", { userId: user.id });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription deletion", { subscriptionId: subscription.id });

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

        // Delete subscription record (user reverts to free plan)
        const { error: deleteError } = await supabaseClient
          .from('user_subscriptions')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          logStep("Error deleting subscription", { error: deleteError.message });
        } else {
          logStep("Subscription deleted successfully", { userId: user.id });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", { invoiceId: invoice.id, amountPaid: invoice.amount_paid });
        
        // Only process if this is a subscription invoice with actual payment
        if (!invoice.subscription || invoice.amount_paid === 0) {
          logStep("Skipping - no subscription or zero payment");
          break;
        }

        // Get customer email
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
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

        // Get the subscription to determine product tier
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const productId = subscription.items.data[0].price.product as string;
        const planName = productToPlanMap[productId];
        
        if (!planName) {
          logStep("Unknown product ID", { productId });
          break;
        }

        // Determine plan tier based on product
        let planTier = 'free';
        if (productId === 'prod_TFM1M1I5vYy7fk' || 
            productId === 'prod_TEx5Xda5BPBuHv') {
          planTier = 'pro';
        } else if (productId === 'prod_TDSbGJB9U4Xt7b' || productId === 'prod_TDSHzExQNjyvJD') {
          planTier = 'ultra_pro';
        }

        const subscriptionEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        logStep("Granting Pro access after payment", { 
          userId: user.id,
          planTier,
          amountPaid: invoice.amount_paid
        });

        // NOW grant Pro access after confirmed payment
        const { error: updateError } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            product_id: productId,
            plan_name: planName,
            plan: planTier,
            status: 'active',
            current_period_end: subscriptionEnd,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (updateError) {
          logStep("Error granting Pro access", { error: updateError.message });
        } else {
          logStep("Pro access granted successfully", { userId: user.id, planTier });
        }

        // NOW cancel lower tier subscriptions after payment is confirmed
        const allSubscriptions = await stripe.subscriptions.list({
          customer: subscription.customer as string,
          status: "active",
          limit: 10,
        });

        if (allSubscriptions.data.length > 1) {
          logStep("Payment confirmed - now cancelling lower tier subscriptions", {
            currentSubId: subscription.id,
            totalSubs: allSubscriptions.data.length
          });

          const tierPriority: { [key: string]: number } = {
            'free': 0,
            'pro': 1,
            'ultra_pro': 2
          };

          let currentTierPriority = tierPriority[planTier] || 0;

          for (const sub of allSubscriptions.data) {
            if (sub.id === subscription.id) continue; // Skip current subscription

            const subProductId = sub.items.data[0].price.product as string;
            let subTier = 'free';

            if (subProductId === 'prod_TFM1M1I5vYy7fk' || subProductId === 'prod_TEx5Xda5BPBuHv') {
              subTier = 'pro';
            } else if (subProductId === 'prod_TDSbGJB9U4Xt7b' || subProductId === 'prod_TDSHzExQNjyvJD') {
              subTier = 'ultra_pro';
            }

            const subTierPriority = tierPriority[subTier] || 0;

            // Cancel if this subscription is lower tier than the current one
            if (subTierPriority < currentTierPriority) {
              try {
                await stripe.subscriptions.cancel(sub.id);
                logStep("Cancelled lower-tier subscription after payment confirmation", { 
                  subscriptionId: sub.id,
                  cancelledTier: subTier,
                  activeTier: planTier
                });
              } catch (cancelError) {
                logStep("ERROR cancelling lower-tier subscription", { 
                  subscriptionId: sub.id, 
                  error: cancelError instanceof Error ? cancelError.message : String(cancelError)
                });
              }
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id });
        
        // Get customer email
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
        if (!customer.email) break;

        // Find user
        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users?.users.find(u => u.email === customer.email);
        if (!user) break;

        // Update subscription status to reflect payment failure
        await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        logStep("Subscription marked as past_due", { userId: user.id });
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Charge refunded", { chargeId: charge.id, amountRefunded: charge.amount_refunded });
        
        // Get customer email
        if (!charge.customer) {
          logStep("No customer associated with charge");
          break;
        }

        const customer = await stripe.customers.retrieve(charge.customer as string) as Stripe.Customer;
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

        // Check if this is a full refund
        if (charge.amount_refunded === charge.amount) {
          logStep("Full refund detected, reverting user to free plan", { userId: user.id });
          
          // Delete subscription record (user reverts to free plan)
          const { error: deleteError } = await supabaseClient
            .from('user_subscriptions')
            .delete()
            .eq('user_id', user.id);

          if (deleteError) {
            logStep("Error deleting subscription after refund", { error: deleteError.message });
          } else {
            logStep("User reverted to free plan after full refund", { userId: user.id });
          }
        } else {
          logStep("Partial refund detected, keeping subscription active", { 
            userId: user.id,
            amountRefunded: charge.amount_refunded,
            totalAmount: charge.amount
          });
        }
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
    logStep("ERROR processing webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
