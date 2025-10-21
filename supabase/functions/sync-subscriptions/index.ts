import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-SUBSCRIPTIONS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting manual sync");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );


    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    if (stripeKey.startsWith("sk_test_")) {
      throw new Error("TEST MODE DETECTED: Use live Stripe keys only");
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get product mappings from database
    const { data: productMappings, error: mappingError } = await supabaseClient
      .from('stripe_products')
      .select('stripe_product_id, plan_name, plan_tier');

    if (mappingError) {
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

    // Get all profiles with emails
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('user_id, email')
      .not('email', 'is', null);

    if (profilesError) throw profilesError;

    logStep("Found profiles to sync", { count: profiles?.length || 0 });

    let syncedCount = 0;
    let errorCount = 0;

    for (const profile of profiles || []) {
      try {
        // Find Stripe customer by email
        const customers = await stripe.customers.list({ 
          email: profile.email, 
          limit: 1 
        });

        if (customers.data.length === 0) {
          continue; // No customer, skip
        }

        const customerId = customers.data[0].id;

        // Get active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 10,
        });

        if (subscriptions.data.length === 0) {
          continue; // No active subscriptions, skip
        }

        // Find highest tier subscription
        const tierPriority: { [key: string]: number } = {
          'free': 0,
          'pro': 1,
          'ultra_pro': 2
        };

        let highestTier = 'free';
        let highestTierSub = subscriptions.data[0];

        for (const sub of subscriptions.data) {
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
          logStep("Unknown product ID, skipping", { 
            userId: profile.user_id, 
            productId 
          });
          continue;
        }

        // Check if current_period_end exists, if not fetch full subscription
        let periodEndTimestamp = highestTierSub.current_period_end;
        
        logStep("Initial subscription check", {
          userId: profile.user_id,
          subscriptionId: highestTierSub.id,
          hasPeriodEnd: !!periodEndTimestamp,
          periodEndValue: periodEndTimestamp,
          periodEndType: typeof periodEndTimestamp
        });
        
        if (!periodEndTimestamp || typeof periodEndTimestamp !== 'number') {
          try {
            logStep("Fetching full subscription from Stripe", { subscriptionId: highestTierSub.id });
            const fullSubscription = await stripe.subscriptions.retrieve(highestTierSub.id);
            periodEndTimestamp = fullSubscription.current_period_end;
            
            logStep("Full subscription retrieved", {
              hasPeriodEnd: !!periodEndTimestamp,
              periodEndValue: periodEndTimestamp,
              subscriptionStatus: fullSubscription.status,
              subscriptionCreated: fullSubscription.created
            });
            
            // CRITICAL FALLBACK: If still no period end, calculate it from created date
            if (!periodEndTimestamp) {
              logStep("No period_end found, calculating from subscription details", {
                subscriptionId: highestTierSub.id,
                created: fullSubscription.created,
                status: fullSubscription.status
              });
              
              // Get billing interval from price
              const interval = fullSubscription.items.data[0]?.price?.recurring?.interval || 'month';
              const intervalCount = fullSubscription.items.data[0]?.price?.recurring?.interval_count || 1;
              
              // Calculate period end based on creation date
              const createdDate = new Date(fullSubscription.created * 1000);
              const periodEnd = new Date(createdDate);
              
              if (interval === 'year') {
                periodEnd.setFullYear(periodEnd.getFullYear() + intervalCount);
              } else if (interval === 'month') {
                periodEnd.setMonth(periodEnd.getMonth() + intervalCount);
              } else if (interval === 'week') {
                periodEnd.setDate(periodEnd.getDate() + (7 * intervalCount));
              } else { // day
                periodEnd.setDate(periodEnd.getDate() + intervalCount);
              }
              
              periodEndTimestamp = Math.floor(periodEnd.getTime() / 1000);
              logStep("Calculated period_end", { 
                periodEnd: periodEnd.toISOString(),
                interval,
                intervalCount,
                calculatedTimestamp: periodEndTimestamp
              });
            }
          } catch (fetchError) {
            logStep("ERROR fetching full subscription", { 
              error: fetchError instanceof Error ? fetchError.message : String(fetchError),
              stack: fetchError instanceof Error ? fetchError.stack : undefined
            });
          }
        }

        if (!periodEndTimestamp) {
          logStep("No current_period_end, skipping", { 
            userId: profile.user_id,
            subscriptionId: highestTierSub.id 
          });
          continue;
        }

        const periodEndDate = new Date(periodEndTimestamp * 1000);

        // Upsert subscription data
        const { error: upsertError } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: profile.user_id,
            stripe_customer_id: customerId,
            stripe_subscription_id: highestTierSub.id,
            product_id: productId,
            plan: planMapping.tier,
            plan_name: planMapping.name,
            status: 'active',
            current_period_end: periodEndDate.toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) {
          logStep("Error upserting subscription", { 
            userId: profile.user_id, 
            error: upsertError.message 
          });
          errorCount++;
          continue;
        }

        // CRITICAL: Also initialize usage_limits for this user
        const imageLimitValue = planMapping.tier === 'ultra_pro' ? 2000 : 
                                planMapping.tier === 'pro' ? 500 : 0;
        
        if (imageLimitValue > 0) {
          const { error: limitsError } = await supabaseClient
            .from('usage_limits')
            .upsert({
              user_id: profile.user_id,
              period_start: new Date().toISOString(),
              period_end: periodEndDate.toISOString(),
              image_generations_used: 0,
              image_generations_limit: imageLimitValue,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          if (limitsError) {
            logStep("Error initializing usage limits", { 
              userId: profile.user_id, 
              error: limitsError.message 
            });
          } else {
            logStep("Initialized usage limits", { 
              userId: profile.user_id, 
              limit: imageLimitValue 
            });
          }
        }

        logStep("Synced subscription and limits", { 
          userId: profile.user_id, 
          plan: planMapping.tier,
          imageLimit: imageLimitValue
        });
        syncedCount++;

      } catch (profileError) {
        logStep("Error processing profile", { 
          userId: profile.user_id, 
          error: profileError instanceof Error ? profileError.message : String(profileError)
        });
        errorCount++;
      }
    }

    logStep("Sync complete", { syncedCount, errorCount });

    return new Response(JSON.stringify({
      success: true,
      synced: syncedCount,
      errors: errorCount,
      message: `Successfully synced ${syncedCount} subscriptions with ${errorCount} errors`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
