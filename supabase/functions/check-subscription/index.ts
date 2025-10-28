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

// Helper function to fetch product mappings from database
const getProductMappings = async (supabaseClient: any): Promise<{ [key: string]: { planName: string, planTier: string } }> => {
  const { data: products, error } = await supabaseClient
    .from('stripe_products')
    .select('stripe_product_id, plan_name, plan_tier');
  
  if (error) {
    logStep("ERROR fetching product mappings", { error: error.message });
    return {};
  }
  
  const mappings: { [key: string]: { planName: string, planTier: string } } = {};
  for (const product of products || []) {
    mappings[product.stripe_product_id] = {
      planName: product.plan_name,
      planTier: product.plan_tier
    };
  }
  
  logStep("Loaded product mappings from database", { count: Object.keys(mappings).length });
  return mappings;
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
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email || 'none', phone: user.phone || 'none' });

    // Fetch product mappings from database
    const productToPlanMap = await getProductMappings(supabaseClient);
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Look up customer by email if available, otherwise by user ID metadata
    let customers;
    if (user.email) {
      customers = await stripe.customers.list({ email: user.email, limit: 1 });
    } else {
      // For phone-only users, search by user_id metadata
      customers = await stripe.customers.search({ 
        query: `metadata['user_id']:'${user.id}'`,
        limit: 1 
      });
    }
    
    if (customers.data.length === 0) {
      logStep("No customer found, user not subscribed");
      
      // CRITICAL FIX: Make this function READ-ONLY
      // stripe-webhook is the single source of truth for subscription updates
      // This prevents race conditions between webhook and verification
      
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

    // Fetch ALL active and trialing subscriptions to handle upgrade scenarios
    // IMPORTANT: Include "trialing" status to recognize trial subscriptions
    const allSubscriptions = await Promise.all([
      stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 10,
      }),
      stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 10,
      })
    ]);
    
    // Combine both active and trialing subscriptions
    const subscriptions = {
      data: [...allSubscriptions[0].data, ...allSubscriptions[1].data]
    };
    
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
        
        // Determine tier from database mapping
        const productMapping = productToPlanMap[subProductId];
        let subTier = productMapping.planTier || 'free';
        const planName = productMapping.planName;
        
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
          
          // CRITICAL FIX: Check if subscription has expired
          const now = new Date();
          const periodEnd = new Date(subscriptionEnd);
          
          if (periodEnd < now) {
            logStep("EXPIRED: Subscription period ended", { 
              subscriptionId: subscription.id,
              endDate: subscriptionEnd,
              now: now.toISOString()
            });
            
            // CRITICAL FIX: Don't delete - let webhook or cron handle it
            // This function is READ-ONLY verification only
            
            logStep("Expired subscription detected - cron will clean up", { userId: user.id });
            
            return new Response(JSON.stringify({
              subscribed: false,
              product_id: null,
              subscription_end: null
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          }
          
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
      const productMapping = productToPlanMap[productId];
      const planName = productMapping?.planName;
      
      // CRITICAL: Reject if no valid plan found (should never happen after filtering above)
      if (!planName) {
        logStep("ERROR: No valid subscription found with known product ID");
        throw new Error("No valid subscription plan found. Please contact support.");
      }
      
      logStep("Final subscription details", { productId, planName, planTier: highestTier });
      
      // CRITICAL FIX: Make this function READ-ONLY
      // stripe-webhook is the authoritative source for subscription data
      // This function only verifies against Stripe API, doesn't write to DB
      // This prevents race conditions when webhook and verification run simultaneously
      
      logStep("Subscription verified via Stripe API (webhook manages DB)", { 
        highestTier,
        subscriptionId 
      });
    } else {
      logStep("No active subscription found in Stripe");
      
      // CRITICAL FIX: Don't delete - let webhook handle it
      // This is READ-ONLY verification
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
