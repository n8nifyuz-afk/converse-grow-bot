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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Starting subscription sync");

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
        
        if (!periodEndTimestamp) {
          const fullSubscription = await stripe.subscriptions.retrieve(highestTierSub.id);
          periodEndTimestamp = fullSubscription.current_period_end;
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
        } else {
          logStep("Synced subscription", { 
            userId: profile.user_id, 
            plan: planMapping.tier 
          });
          syncedCount++;
        }

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
