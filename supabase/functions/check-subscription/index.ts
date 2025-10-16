import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// LIVE Product IDs
const productToPlanMap: { [key: string]: string } = {
  'prod_TFM1M1I5vYy7fk': 'Pro',        // Pro Monthly Cheap (LIVE)
  'prod_TEx5Xda5BPBuHv': 'Pro',        // Pro Yearly (LIVE)
  'prod_TDSbGJB9U4Xt7b': 'Ultra Pro',  // Ultra Pro Monthly (LIVE)
  'prod_TDSHzExQNjyvJD': 'Ultra Pro',  // Ultra Pro Yearly (LIVE)
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
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    // CRITICAL: Reject test mode keys to prevent test subscriptions
    if (stripeKey.startsWith("sk_test_")) {
      throw new Error("TEST MODE DETECTED: Use live Stripe keys only. Change STRIPE_SECRET_KEY to sk_live_...");
    }
    
    logStep("Stripe key verified (LIVE mode)");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      
      // Delete any existing subscription record
      await supabaseClient
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id);
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        product_id: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Fetch ALL active subscriptions to handle upgrade scenarios
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 10, // Get multiple subscriptions in case user upgraded
    });
    
    logStep("Found active subscriptions", { count: subscriptions.data.length });
    
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let subscriptionId = null;
    let highestTier = 'free';

    if (hasActiveSub) {
      // If multiple subscriptions exist (e.g., during upgrade), pick the highest tier
      let selectedSubscription = subscriptions.data[0];
      
      // Define tier hierarchy: ultra_pro > pro > free
      const tierPriority: { [key: string]: number } = {
        'free': 0,
        'pro': 1,
        'ultra_pro': 2
      };
      
      for (const sub of subscriptions.data) {
        const subProductId = sub.items.data[0].price.product as string;
        
        // CRITICAL: Only process known product IDs
        if (!productToPlanMap[subProductId]) {
          logStep("WARNING: Unknown product ID found - skipping", { 
            subscriptionId: sub.id, 
            productId: subProductId 
          });
          continue; // Skip unknown products entirely
        }
        
        // Determine tier - match with your live product IDs above
        let subTier = 'free';
        const planName = productToPlanMap[subProductId];
        
        if (planName === 'Pro') {
          subTier = 'pro';
        } else if (planName === 'Ultra Pro') {
          subTier = 'ultra_pro';
        }
        
        logStep("Evaluating subscription", { 
          subscriptionId: sub.id, 
          productId: subProductId, 
          tier: subTier,
          status: sub.status 
        });
        
        // Pick the subscription with the highest tier
        if (tierPriority[subTier] > tierPriority[highestTier]) {
          highestTier = subTier;
          selectedSubscription = sub;
        }
      }
      
      // Use the selected subscription (highest tier)
      const subscription = selectedSubscription;
      subscriptionId = subscription.id;
      
      // Safely handle the date conversion
      try {
        if (subscription.current_period_end) {
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
          logStep("Selected highest-tier subscription", { 
            subscriptionId: subscription.id, 
            tier: highestTier,
            endDate: subscriptionEnd,
            currentPeriodEnd: subscription.current_period_end 
          });
        } else {
          logStep("Warning: subscription has no current_period_end", { subscriptionId: subscription.id });
        }
      } catch (dateError) {
        logStep("ERROR converting date", { 
          error: dateError instanceof Error ? dateError.message : String(dateError),
          currentPeriodEnd: subscription.current_period_end 
        });
        // Continue without the date if conversion fails
      }
      
      productId = subscription.items.data[0].price.product as string;
      const planName = productToPlanMap[productId];
      
      // CRITICAL: Reject if no valid plan found (should never happen after filtering above)
      if (!planName) {
        logStep("ERROR: No valid subscription found with known product ID");
        throw new Error("No valid subscription plan found. Please contact support.");
      }
      
      logStep("Final subscription details", { productId, planName, planTier: highestTier });
      
      // Save/update subscription in database
      try {
        const { error: upsertError } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            product_id: productId,
            plan_name: planName,
            plan: highestTier, // Use the highest tier determined from evaluation
            status: 'active',
            current_period_end: subscriptionEnd
          }, {
            onConflict: 'user_id'
          });
        
        if (upsertError) {
          logStep("ERROR upserting subscription to DB", { error: upsertError.message });
        } else {
          logStep("Successfully saved subscription to DB");
        }
      } catch (dbError) {
        logStep("ERROR saving to DB", { error: dbError instanceof Error ? dbError.message : String(dbError) });
      }
    } else {
      logStep("No active subscription found");
      
      // Delete any existing subscription record
      await supabaseClient
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      subscribed: false,
      product_id: null,
      subscription_end: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
