import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Idempotency handled by Stripe's webhook retry logic and event IDs

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

        // Lookup user by email via profiles table (handles unlimited users)
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('user_id')
          .ilike('email', customer.email)
          .single();
        
        if (!profile) {
          logStep("User not found in profiles", { email: customer.email, error: profileError?.message });
          break;
        }
        
        // Get full user object from auth
        const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(profile.user_id);
        if (!userData?.user) {
          logStep("User not found in auth", { userId: profile.user_id, error: userError?.message });
          break;
        }
        
        const user = userData.user;
        logStep("Found user successfully", { userId: user.id, email: user.email });

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

        // Track payment complete for GTM
        // Get price and interval details from subscription
        const priceData = highestTierSub.items.data[0].price;
        const planType = planMapping.tier === 'pro' ? 'Pro' : planMapping.tier === 'ultra_pro' ? 'Ultra' : 'Free';
        const interval = priceData.recurring?.interval;
        const intervalCount = priceData.recurring?.interval_count || 1;
        let planDuration = 'monthly';
        if (interval === 'year') {
          planDuration = 'yearly';
        } else if (interval === 'month' && intervalCount === 3) {
          planDuration = '3_months';
        }
        const planPrice = priceData.unit_amount ? (priceData.unit_amount / 100) : 0;

        // Log payment tracking data
        logStep("Payment tracking data", {
          planType,
          planDuration,
          planPrice,
          currency: priceData.currency
        });

        // CRITICAL FIX: Don't delete usage_limits on renewal/activation
        // Let check_and_reset_usage_limits handle natural expiry and reset
        // This prevents race conditions with other functions and cron jobs
        // The DB function will create new period when old one expires
        
        logStep("Subscription activated, usage limits will reset naturally at period end", { 
          userId: user.id,
          periodEnd: periodEndDate.toISOString()
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        if (!customer.email) {
          logStep("No customer email for deletion");
          break;
        }

        // Check if this is a trial subscription
        const isTrial = subscription.metadata?.is_trial === 'true';
        const targetPlan = subscription.metadata?.target_plan;
        const userId = subscription.metadata?.user_id;
        const trialProductId = subscription.metadata?.trial_product_id;

        logStep("Trial check", { isTrial, targetPlan, userId, trialProductId });

        // If trial ended, create monthly subscription
        if (isTrial && targetPlan && userId) {
          logStep("Trial ended - creating monthly subscription", { targetPlan, userId });

          try {
            // Get monthly price ID based on target plan
            const monthlyPriceId = targetPlan === 'pro' 
              ? 'price_1SKKdNL8Zm4LqDn4gBXwrsAq'  // Pro Monthly €19.99
              : 'price_1SKJAxL8Zm4LqDn43kl9BRd8'; // Ultra Pro Monthly €39.99

            // Create new monthly subscription
            const newSubscription = await stripe.subscriptions.create({
              customer: subscription.customer as string,
              items: [{ price: monthlyPriceId }],
              metadata: {
                upgraded_from_trial: 'true',
                trial_subscription_id: subscription.id,
                user_id: userId
              }
            });

            logStep("Monthly subscription created after trial", { 
              newSubscriptionId: newSubscription.id,
              plan: targetPlan 
            });

            // Track conversion
            await supabaseClient
              .from('trial_conversions')
              .insert({
                user_id: userId,
                trial_subscription_id: subscription.id,
                trial_product_id: trialProductId || '',
                target_plan: targetPlan,
                paid_subscription_id: newSubscription.id,
                converted_at: new Date().toISOString()
              });

            logStep("Trial conversion tracked", { userId, trialSubscriptionId: subscription.id });

            // Don't delete user subscription - the new subscription webhook will update it
            break;
          } catch (conversionError) {
            logStep("ERROR: Failed to convert trial to paid", { 
              error: conversionError instanceof Error ? conversionError.message : String(conversionError),
              userId,
              targetPlan
            });
            // Continue to delete logic if conversion fails
          }
        }

        // Lookup user via profiles
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('user_id')
          .ilike('email', customer.email)
          .single();
        
        if (!profile) {
          logStep("User not found for subscription deletion", { email: customer.email });
          break;
        }
        
        const { data: userData } = await supabaseClient.auth.admin.getUserById(profile.user_id);
        if (!userData?.user) {
          logStep("User not found in auth for deletion", { userId: profile.user_id });
          break;
        }
        const user = userData.user;

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

        if (!invoice.customer_email) {
          logStep("No customer email for payment");
          break;
        }

        // Lookup user via profiles
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('user_id')
          .ilike('email', invoice.customer_email)
          .single();
        
        if (!profile) {
          logStep("User not found for payment success", { email: invoice.customer_email });
          break;
        }
        
        const { data: userData } = await supabaseClient.auth.admin.getUserById(profile.user_id);
        if (!userData?.user) {
          logStep("User not found in auth for payment", { userId: profile.user_id });
          break;
        }
        const user = userData.user;

        // Activate subscription
        const { error } = await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (error) throw error;
        
        // Track payment success for GTM
        const { data: subscription } = await supabaseClient
          .from('user_subscriptions')
          .select('plan, plan_name')
          .eq('user_id', user.id)
          .single();
        
        if (subscription) {
          // Map plan to planType
          const planType = subscription.plan === 'pro' ? 'Pro' : subscription.plan === 'ultra_pro' ? 'Ultra' : 'Free';
          
          // Get price details from invoice
          const planPrice = invoice.amount_paid ? (invoice.amount_paid / 100) : 0;
          const currency = invoice.currency;
          
          // Determine duration from invoice (check if it's monthly, 3-month, or yearly)
          let planDuration = 'monthly';
          if (invoice.lines.data.length > 0) {
            const line = invoice.lines.data[0];
            if (line.period && line.period.end && line.period.start) {
              const periodMonths = Math.round((line.period.end - line.period.start) / (30 * 24 * 60 * 60));
              if (periodMonths >= 11) {
                planDuration = 'yearly';
              } else if (periodMonths >= 2) {
                planDuration = '3_months';
              }
            }
          }
          
          logStep("Payment success tracking data", {
            planType,
            planDuration,
            planPrice,
            currency
          });

          // Send payment confirmation email
          try {
            if (!user.email) {
              logStep("No user email for payment confirmation");
            } else {
              const userName = user.email.split("@")[0] || "there";
              const planName = subscription.plan_name || planType;
              const periodText = planDuration === 'yearly' ? 'year' : planDuration === '3_months' ? '3 months' : 'month';
              
              const htmlContent = `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Payment Confirmed - ChatL</title>
                  </head>
                  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
                      <tr>
                        <td align="center">
                          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                            <!-- Header -->
                            <tr>
                              <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">🎉 Payment Confirmed!</h1>
                              </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                              <td style="padding: 40px 30px;">
                                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                  Hi ${userName},
                                </p>
                                
                                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                  Congratulations! Your payment has been successfully processed and your <strong>${planName}</strong> subscription is now active.
                                </p>
                                
                                <!-- Payment Details Box -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; margin: 30px 0; border: 1px solid #e5e7eb;">
                                  <tr>
                                    <td style="padding: 20px;">
                                      <h3 style="color: #111827; font-size: 18px; margin: 0 0 15px 0;">Subscription Details</h3>
                                      <table width="100%" cellpadding="8" cellspacing="0">
                                        <tr>
                                          <td style="color: #6b7280; font-size: 14px;">Plan:</td>
                                          <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${planName}</td>
                                        </tr>
                                        <tr>
                                          <td style="color: #6b7280; font-size: 14px;">Billing Period:</td>
                                          <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">${periodText}</td>
                                        </tr>
                                        <tr>
                                          <td style="color: #6b7280; font-size: 14px;">Amount Paid:</td>
                                          <td style="color: #10b981; font-size: 16px; font-weight: 700; text-align: right;">€${planPrice.toFixed(2)}</td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                                
                                <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                  You now have access to:
                                </p>
                                
                                <ul style="color: #333333; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
                                  <li>✨ Unlimited AI conversations</li>
                                  <li>🚀 Multiple AI models (GPT-4o, Gemini${planType === 'Ultra' ? ', Claude, DeepSeek, Grok' : ''})</li>
                                  <li>🎨 AI image generation (${planType === 'Ultra' ? '2000' : '500'} images/month)</li>
                                  <li>🎤 Voice mode</li>
                                  <li>📄 PDF/Document analysis</li>
                                  <li>💬 Priority support</li>
                                </ul>
                                
                                <div style="text-align: center; margin: 40px 0;">
                                  <a href="https://chatl.ai" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                    Start Using ChatL Pro
                                  </a>
                                </div>
                                
                                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 30px; border-top: 1px solid #eeeeee;">
                                  Need help? Visit our <a href="https://chatl.ai/help" style="color: #10b981; text-decoration: none;">Help Center</a> or reply to this email.
                                </p>
                              </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                              <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                                <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                                  © ${new Date().getFullYear()} ChatL. All rights reserved.
                                </p>
                                <p style="color: #999999; font-size: 12px; margin: 0;">
                                  <a href="https://chatl.ai" style="color: #10b981; text-decoration: none;">Visit Website</a> • 
                                  <a href="https://chatl.ai/help" style="color: #10b981; text-decoration: none;">Help Center</a> • 
                                  <a href="https://chatl.ai/pricing" style="color: #10b981; text-decoration: none;">Manage Subscription</a>
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </body>
                </html>
              `;

              const emailResult = await resend.emails.send({
                from: "no-reply@chatl.ai",
                to: [user.email],
                subject: `🎉 Payment Confirmed - Your ${planName} is Active!`,
                html: htmlContent,
              });

              if (emailResult.error) {
                logStep("ERROR: Failed to send payment confirmation email", { 
                  error: emailResult.error 
                });
              } else {
                logStep("Payment confirmation email sent", { 
                  email: user.email,
                  plan: planName 
                });
              }
            }
          } catch (emailError) {
            logStep("ERROR: Exception sending payment email", { 
              error: emailError instanceof Error ? emailError.message : String(emailError)
            });
            // Don't throw - email failure shouldn't block webhook processing
          }
        }
        
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

        if (!invoice.customer_email) {
          logStep("No customer email for payment failure");
          break;
        }

        // Lookup user via profiles
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('user_id')
          .ilike('email', invoice.customer_email)
          .single();
        
        if (!profile) {
          logStep("User not found for payment failure", { email: invoice.customer_email });
          break;
        }
        
        const { data: userData } = await supabaseClient.auth.admin.getUserById(profile.user_id);
        if (!userData?.user) {
          logStep("User not found in auth for payment failure", { userId: profile.user_id });
          break;
        }
        const user = userData.user;

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

        if (!charge.billing_details.email) {
          logStep("No customer email for charge refund");
          break;
        }

        // Lookup user via profiles
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('user_id')
          .ilike('email', charge.billing_details.email)
          .single();
        
        if (!profile) {
          logStep("User not found for charge refund", { email: charge.billing_details.email });
          break;
        }
        
        const { data: userData } = await supabaseClient.auth.admin.getUserById(profile.user_id);
        if (!userData?.user) {
          logStep("User not found in auth for charge refund", { userId: profile.user_id });
          break;
        }
        const user = userData.user;

        // CRITICAL: Revert to free plan for ANY refund (partial or full)
        // Policy: Any refund removes subscription access
        if (charge.amount_refunded > 0) {
          // CRITICAL FIX: Get user's subscription and cancel it in Stripe
          // This prevents subscription.updated events from re-activating the user
          const { data: userSub } = await supabaseClient
            .from('user_subscriptions')
            .select('stripe_subscription_id')
            .eq('user_id', user.id)
            .single();
          
          if (userSub?.stripe_subscription_id) {
            try {
              // Cancel the subscription immediately in Stripe
              await stripe.subscriptions.cancel(userSub.stripe_subscription_id);
              logStep("Cancelled Stripe subscription after refund", { 
                subscriptionId: userSub.stripe_subscription_id 
              });
            } catch (cancelError) {
              logStep("Failed to cancel Stripe subscription (may already be cancelled)", { 
                error: cancelError instanceof Error ? cancelError.message : String(cancelError)
              });
            }
          }
          
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
            // Use profile lookup for efficiency
            const { data: profile } = await supabaseClient
              .from('profiles')
              .select('user_id')
              .ilike('email', session.customer_email)
              .single();
            
            if (profile) {
              const { data: userData } = await supabaseClient.auth.admin.getUserById(profile.user_id);
              const user = userData?.user;
              
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
            // Use profile lookup for efficiency
            const { data: profile } = await supabaseClient
              .from('profiles')
              .select('user_id')
              .ilike('email', customer.email)
              .single();
            
            if (profile) {
              const { data: userData } = await supabaseClient.auth.admin.getUserById(profile.user_id);
              const user = userData?.user;
              
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
