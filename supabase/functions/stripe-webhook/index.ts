import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const SUBSCRIPTION_WEBHOOK_URL = "https://adsgbt.app.n8n.cloud/webhook/subscription";

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

        // CRITICAL: Get customer and prioritize user_id metadata for matching
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const customerUserId = customer.metadata?.user_id;
        
        let user;
        let profile;
        
        // STRATEGY 1: Match by user_id metadata (most reliable, works for all auth methods)
        if (customerUserId) {
          logStep("Attempting to match by user_id metadata", { userId: customerUserId });
          
          const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(customerUserId);
          if (userData?.user) {
            user = userData.user;
            logStep("✅ User matched by user_id metadata", { userId: user.id });
          } else {
            logStep("⚠️ user_id metadata present but user not found", { 
              userId: customerUserId, 
              error: userError?.message 
            });
          }
        }
        
        // STRATEGY 2: Fallback to email matching (for backward compatibility)
        if (!user && customer.email) {
          logStep("Falling back to email matching", { email: customer.email });
          
          const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('user_id')
            .ilike('email', customer.email)
            .single();
          
          if (profileData) {
            const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(profileData.user_id);
            if (userData?.user) {
              user = userData.user;
              profile = profileData;
              logStep("✅ User matched by email", { userId: user.id, email: customer.email });
            }
          } else {
            logStep("⚠️ No profile found with email", { email: customer.email, error: profileError?.message });
          }
        }
        
        // STRATEGY 3: Match by phone metadata (for phone-only users)
        if (!user && customer.metadata?.phone) {
          logStep("Attempting to match by phone metadata", { phone: customer.metadata.phone });
          
          const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('user_id')
            .eq('phone_number', customer.metadata.phone)
            .single();
          
          if (profileData) {
            const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(profileData.user_id);
            if (userData?.user) {
              user = userData.user;
              profile = profileData;
              logStep("✅ User matched by phone", { userId: user.id, phone: customer.metadata.phone });
            }
          }
        }
        
        if (!user) {
          logStep("❌ No user found with any matching strategy", { 
            customerId: customer.id,
            email: customer.email || 'none',
            phone: customer.metadata?.phone || 'none',
            userId: customerUserId || 'none'
          });
          break;
        }
        
        logStep("Found user successfully", { userId: user.id, email: user.email || 'none', phone: user.phone || 'none' });

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

        // CRITICAL FIX: Handle trial subscriptions and calculate correct period_end
        let periodEndTimestamp = highestTierSub.current_period_end;
        
        // Check if this is a trial subscription
        const isTrial = highestTierSub.trial_end !== null;
        
        if (isTrial && highestTierSub.trial_end) {
          // For trial subscriptions, use trial_end
          periodEndTimestamp = highestTierSub.trial_end;
          logStep("Trial subscription detected", { 
            trialEnd: new Date(periodEndTimestamp * 1000).toISOString() 
          });
        } else if (!periodEndTimestamp || typeof periodEndTimestamp !== 'number') {
          logStep("Missing current_period_end, fetching full subscription", { 
            subscriptionId: highestTierSub.id 
          });
          
          try {
            const fullSubscription = await stripe.subscriptions.retrieve(highestTierSub.id);
            
            // Check trial_end first
            if (fullSubscription.trial_end) {
              periodEndTimestamp = fullSubscription.trial_end;
              logStep("Using trial_end from full subscription", { 
                trialEnd: new Date(periodEndTimestamp * 1000).toISOString() 
              });
            } else {
              periodEndTimestamp = fullSubscription.current_period_end;
            }
            
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
              } else if (interval === 'day') {
                // Handle day intervals for trials
                periodEnd.setDate(periodEnd.getDate() + intervalCount);
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

        // CRITICAL: Create or update usage_limits for the subscription
        const imageLimit = plan === 'ultra_pro' ? 2000 : plan === 'pro' ? 500 : 0;
        
        if (imageLimit > 0) {
          // Delete expired usage_limits first
          await supabaseClient
            .from('usage_limits')
            .delete()
            .eq('user_id', user.id)
            .lt('period_end', new Date().toISOString());
          
          // Check if active usage_limits exist
          const { data: existingLimits } = await supabaseClient
            .from('usage_limits')
            .select('*')
            .eq('user_id', user.id)
            .gt('period_end', new Date().toISOString())
            .single();
          
          if (!existingLimits) {
            // Create new usage_limits
            const { error: limitsError } = await supabaseClient
              .from('usage_limits')
              .insert({
                user_id: user.id,
                period_start: new Date().toISOString(),
                period_end: periodEndDate.toISOString(),
                image_generations_used: 0,
                image_generations_limit: imageLimit
              });
            
            if (limitsError) {
              logStep("ERROR: Failed to create usage_limits", { error: limitsError.message });
            } else {
              logStep("Created usage_limits", { userId: user.id, limit: imageLimit });
            }
          } else {
            // Update existing limits
            const { error: updateError } = await supabaseClient
              .from('usage_limits')
              .update({
                image_generations_limit: imageLimit,
                period_end: periodEndDate.toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .gt('period_end', new Date().toISOString());
            
            if (updateError) {
              logStep("ERROR: Failed to update usage_limits", { error: updateError.message });
            } else {
              logStep("Updated usage_limits", { userId: user.id, limit: imageLimit });
            }
          }
        }
        
        logStep("Subscription activated with usage limits", { 
          userId: user.id,
          periodEnd: periodEndDate.toISOString(),
          imageLimit
        });

        // DON'T send webhook here - it will be sent on invoice.payment_succeeded
        // This prevents duplicate webhooks when subscription is created
        logStep("Subscription metadata updated (webhook will be sent on payment)", {
          userId: user.id,
          plan: plan,
          planPrice: planPrice
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        // CRITICAL: Use same matching strategy as subscription.created/updated
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const customerUserId = customer.metadata?.user_id;
        
        let user;
        
        // STRATEGY 1: Match by user_id metadata
        if (customerUserId) {
          const { data: userData } = await supabaseClient.auth.admin.getUserById(customerUserId);
          if (userData?.user) {
            user = userData.user;
            logStep("✅ User matched by user_id for deletion", { userId: user.id });
          }
        }
        
        // STRATEGY 2: Fallback to email
        if (!user && customer.email) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('user_id')
            .ilike('email', customer.email)
            .single();
          
          if (profile) {
            const { data: userData } = await supabaseClient.auth.admin.getUserById(profile.user_id);
            if (userData?.user) {
              user = userData.user;
              logStep("✅ User matched by email for deletion", { userId: user.id });
            }
          }
        }
        
        // STRATEGY 3: Match by phone
        if (!user && customer.metadata?.phone) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('user_id')
            .eq('phone_number', customer.metadata.phone)
            .single();
          
          if (profile) {
            const { data: userData } = await supabaseClient.auth.admin.getUserById(profile.user_id);
            if (userData?.user) {
              user = userData.user;
              logStep("✅ User matched by phone for deletion", { userId: user.id });
            }
          }
        }
        
        if (!user) {
          logStep("❌ No user found for subscription deletion");
          break;
        }

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

        // CRITICAL: Use same matching strategy as subscription events
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
        const customerUserId = customer.metadata?.user_id;
        
        let user;
        
        // STRATEGY 1: Match by user_id metadata
        if (customerUserId) {
          const { data: userData } = await supabaseClient.auth.admin.getUserById(customerUserId);
          if (userData?.user) {
            user = userData.user;
            logStep("✅ User matched by user_id for payment", { userId: user.id });
          }
        }
        
        // STRATEGY 2: Fallback to email
        if (!user && invoice.customer_email) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('user_id')
            .ilike('email', invoice.customer_email)
            .single();
          
          if (profile) {
            const { data: userData } = await supabaseClient.auth.admin.getUserById(profile.user_id);
            if (userData?.user) {
              user = userData.user;
              logStep("✅ User matched by email for payment", { userId: user.id });
            }
          }
        }
        
        // STRATEGY 3: Match by phone
        if (!user && customer.metadata?.phone) {
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('user_id')
            .eq('phone_number', customer.metadata.phone)
            .single();
          
          if (profile) {
            const { data: userData } = await supabaseClient.auth.admin.getUserById(profile.user_id);
            if (userData?.user) {
              user = userData.user;
              logStep("✅ User matched by phone for payment", { userId: user.id });
            }
          }
        }
        
        if (!user) {
          logStep("❌ No user found for payment success");
          break;
        }

        // Check if this is the first invoice after trial (trial conversion)
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          // CRITICAL: Detect trial conversion properly
          // Trial has 2 charges: €0.99 upfront (trial fee) + full price after 3 days (conversion)
          // Only mark as converted when the FULL PRICE is charged (not the €0.99 trial fee)
          const isTrialFee = invoice.amount_paid === 99; // €0.99 in cents
          const isTrialSubscription = subscription.metadata?.is_trial === 'true';
          const hasTrialEnded = subscription.trial_end && (subscription.trial_end * 1000) < Date.now();
          
          if (isTrialSubscription && !isTrialFee && hasTrialEnded && subscription.metadata?.target_plan) {
            logStep("Trial conversion detected - first full payment after trial", { 
              subscriptionId: subscription.id,
              targetPlan: subscription.metadata.target_plan,
              amountPaid: invoice.amount_paid / 100,
              currency: invoice.currency
            });

            // Update trial_conversions record - mark as converted
            const { error: conversionError } = await supabaseClient
              .from('trial_conversions')
              .update({
                trial_subscription_id: subscription.id,
                paid_subscription_id: subscription.id,
                converted_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .is('converted_at', null);
            
            if (conversionError) {
              logStep("WARNING: Failed to update trial conversion", { error: conversionError.message });
            } else {
              logStep("✅ Trial converted to paid subscription successfully", { userId: user.id });
            }

            // Remove trial metadata from subscription
            await stripe.subscriptions.update(subscription.id, {
              metadata: {
                ...subscription.metadata,
                is_trial: 'false',
                trial_converted: 'true',
                conversion_date: new Date().toISOString()
              }
            });
          } else if (isTrialSubscription && isTrialFee) {
            logStep("Trial fee payment received (€0.99) - trial period started", {
              subscriptionId: subscription.id,
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : 'unknown'
            });
            
            // Update trial_conversions with subscription ID
            await supabaseClient
              .from('trial_conversions')
              .update({
                trial_subscription_id: subscription.id
              })
              .eq('user_id', user.id)
              .is('converted_at', null);
          }
        }

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
        let { data: subscription } = await supabaseClient
          .from('user_subscriptions')
          .select('plan, plan_name')
          .eq('user_id', user.id)
          .single();
        
        logStep("Fetched subscription from DB", { found: !!subscription, subscription });
        
        // If subscription doesn't exist in DB yet (race condition), fetch from Stripe
        if (!subscription && invoice.subscription) {
          try {
            logStep("Fetching subscription from Stripe due to race condition", { subscriptionId: invoice.subscription });
            const stripeSubscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            const productId = typeof stripeSubscription.items.data[0].price.product === 'string'
              ? stripeSubscription.items.data[0].price.product
              : stripeSubscription.items.data[0].price.product.id;
            
            logStep("Retrieved Stripe subscription", { productId });
            
            const planMapping = productMappings.find(p => p.stripe_product_id === productId);
            if (planMapping) {
              subscription = {
                plan: planMapping.plan_tier,
                plan_name: planMapping.plan_name
              };
              logStep("Fetched subscription from Stripe successfully", { plan: planMapping.plan_tier, planName: planMapping.plan_name });
            } else {
              logStep("WARNING: No plan mapping found for product", { productId });
            }
          } catch (stripeError) {
            logStep("ERROR: Failed to fetch subscription from Stripe", { 
              error: stripeError instanceof Error ? stripeError.message : String(stripeError) 
            });
          }
        }
        
        // ALWAYS send webhook and email, even if we couldn't fetch subscription details
        // Use defaults if subscription info is unavailable
        const planType = subscription?.plan_name || subscription?.plan === 'pro' ? 'Pro' : subscription?.plan === 'ultra_pro' ? 'Ultra' : 'Pro';
        const plan = subscription?.plan || 'pro';
        
        logStep("Processing payment with plan info", { subscription, planType, plan });
        
        // Continue processing regardless of whether subscription was found
        {
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
          
          logStep("Payment tracking data", {
            planType,
            planDuration,
            planPrice,
            currency
          });

          // Send subscription purchase webhook
          try {
            // Fetch user profile including phone_number and display_name
            const { data: userProfile } = await supabaseClient
              .from('profiles')
              .select('ip_address, country, gclid, url_params, initial_referer, phone_number, display_name')
              .eq('user_id', user.id)
              .single();

            // Get all data from database profile only
            const cleanIP = userProfile?.ip_address 
              ? userProfile.ip_address.split(',')[0].trim() 
              : null;
            const countryCode = userProfile?.country || null;

            // For phone signups: use phone_number when email is null
            const emailOrPhone = user.email || userProfile?.phone_number || '';
            // For username: use display_name from profile
            const username = userProfile?.display_name || user.email?.split('@')[0] || 'User';

            const webhookPayload = {
              plan_name: subscription?.plan_name || planType,
              user_id: user.id,
              email: emailOrPhone,
              username: username,
              price: planPrice,
              currency: currency,
              plan_duration: planDuration,
              ip_address: cleanIP,
              country: countryCode,
              gclid: userProfile?.gclid || null,
              urlParams: JSON.stringify(userProfile?.url_params || {}), // Stringified JSON
              referer: userProfile?.initial_referer ? String(userProfile.initial_referer) : null,
              timestamp: new Date().toISOString(),
              hasDocument: "false"
            };

            logStep("Sending subscription webhook", webhookPayload);

            const webhookResponse = await fetch('https://adsgbt.app.n8n.cloud/webhook/subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(webhookPayload),
            });

            if (!webhookResponse.ok) {
              logStep("Subscription webhook failed", { 
                status: webhookResponse.status, 
                statusText: webhookResponse.statusText 
              });
            } else {
              const responseText = await webhookResponse.text();
              logStep("Subscription webhook sent successfully", { response: responseText });
            }
          } catch (webhookError) {
            logStep("Error sending subscription webhook", { 
              error: webhookError instanceof Error ? webhookError.message : String(webhookError) 
            });
            // Don't throw - webhook failure shouldn't stop payment processing
          }

          // Send payment confirmation email
          try {
            if (!user.email) {
              logStep("No user email for payment confirmation");
            } else {
              const userName = user.email.split("@")[0] || "there";
              
              const htmlContent = `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Your ChatLearn Account is Now Active</title>
                  </head>
                  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                      <tr>
                        <td align="center">
                          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; max-width: 600px;">
                            
                            <!-- Logo -->
                            <tr>
                              <td align="center" style="padding: 40px 40px 30px 40px;">
                                <img src="https://www.chatl.ai/favicon.png" 
                                     alt="ChatLearn" 
                                     width="96" 
                                     height="96" 
                                     style="display: block; border: none;">
                              </td>
                            </tr>

                            <!-- Content -->
                            <tr>
                              <td style="padding: 0 40px 40px 40px;">
                                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                  Hi ${userName},
                                </p>

                                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #333333; font-weight: 600;">
                                  Welcome to ChatLearn.<br>
                                  We're delighted to have you with us.
                                </p>

                                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                  Your account is now active, and your personal AI workspace is ready.
                                </p>

                                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                  Take a moment to explore, ask your first question, and experience how effortless intelligent work can feel.
                                </p>

                                <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                  There's nothing you need to set up – just start, and everything else happens naturally.
                                </p>

                                <!-- CTA Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td align="center" style="padding: 0 0 32px 0;">
                                      <a href="https://www.chatl.ai" 
                                         style="display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">
                                        Start Chatting
                                      </a>
                                    </td>
                                  </tr>
                                </table>

                                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                  If you ever need us, we're <a href="https://www.chatl.ai/help" style="color: #000000; text-decoration: underline;">here at our help center</a>.
                                </p>

                                <p style="margin: 0 0 8px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                  Thank you for joining ChatLearn.
                                </p>

                                <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #333333;">
                                  We're looking forward to being part of your everyday workflow.
                                </p>

                                <p style="margin: 0; font-size: 16px; line-height: 24px; color: #333333;">
                                  Best,<br>
                                  The ChatLearn Team
                                </p>
                              </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                              <td style="padding: 24px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
                                <p style="margin: 0; font-size: 13px; line-height: 20px; color: #666666;">
                                  If you have any questions, please contact us through our <a href="https://www.chatl.ai/help" style="color: #000000; text-decoration: underline;">help center</a>.
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
                from: "ChatLearn <no-reply@chatl.ai>",
                to: [user.email],
                subject: "Your ChatLearn account is now active",
                html: htmlContent,
                headers: {
                  'X-Entity-Ref-ID': `payment-${invoice.id}`,
                  'List-Unsubscribe': '<https://www.chatl.ai/account>',
                  'Precedence': 'bulk',
                  'X-Auto-Response-Suppress': 'OOF, AutoReply',
                },
                tags: [
                  {
                    name: 'category',
                    value: 'subscription-activated'
                  }
                ],
              });

              if (emailResult.error) {
                logStep("ERROR: Failed to send subscription activation email", { 
                  error: emailResult.error 
                });
              } else {
                logStep("Subscription activation email sent", { 
                  email: user.email
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
        logStep("Payment failed", { invoiceId: invoice.id, amountDue: invoice.amount_due / 100 });

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

        // CRITICAL: Check if this is a trial conversion failure
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const isTrialConversionFailure = subscription.metadata?.is_trial === 'true' && 
                                           subscription.trial_end && 
                                           (subscription.trial_end * 1000) < Date.now();
          
          if (isTrialConversionFailure) {
            logStep("❌ Trial conversion payment FAILED", {
              subscriptionId: subscription.id,
              targetPlan: subscription.metadata?.target_plan,
              amountAttempted: invoice.amount_due / 100
            });
            
            // Mark trial as failed (not converted)
            await supabaseClient
              .from('trial_conversions')
              .update({
                trial_subscription_id: subscription.id,
                converted_at: null // Keep null to indicate failed conversion
              })
              .eq('user_id', user.id);
            
            logStep("Trial marked as failed - user can potentially retry", { userId: user.id });
          }
        }

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
          status: session.status,
          mode: session.mode
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
        
        // For successful checkouts, subscription.created webhook handles activation
        // Trial subscriptions are automatically managed by Stripe's trial_period_days
        logStep("Checkout completed, waiting for subscription.created webhook");
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
