import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RESTORE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, userEmail } = await req.json();
    
    if (!userId || !userEmail) {
      throw new Error('userId and userEmail are required');
    }

    logStep("Starting subscription restoration", { userId, userEmail });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get product mappings from database
    const { data: products, error: productsError } = await supabaseClient
      .from('stripe_products')
      .select('stripe_product_id, plan_name, plan_tier');

    if (productsError) {
      logStep("Error fetching product mappings", { error: productsError });
      throw new Error('Failed to fetch product mappings');
    }

    const productMappings: { [key: string]: { planName: string, planTier: string } } = {};
    products.forEach((product: any) => {
      productMappings[product.stripe_product_id] = {
        planName: product.plan_name,
        planTier: product.plan_tier
      };
    });

    logStep("Product mappings loaded", { count: Object.keys(productMappings).length });

    // Find Stripe customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found", { email: userEmail });
      return new Response(JSON.stringify({ 
        restored: false,
        message: 'No Stripe customer found for this email'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const customer = customers.data[0];
    logStep("Found Stripe customer", { customerId: customer.id });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 10
    });

    // Include trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'trialing',
      limit: 10
    });

    const allActiveSubscriptions = [...subscriptions.data, ...trialingSubscriptions.data];

    if (allActiveSubscriptions.length === 0) {
      logStep("No active subscriptions found", { customerId: customer.id });
      return new Response(JSON.stringify({ 
        restored: false,
        message: 'No active subscriptions found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    logStep("Found active subscriptions", { count: allActiveSubscriptions.length });

    // Find highest tier subscription
    const tierOrder: { [key: string]: number } = {
      'free': 0,
      'pro': 1,
      'ultra_pro': 2
    };

    let highestTierSub = allActiveSubscriptions[0];
    let highestTier = 0;

    for (const sub of allActiveSubscriptions) {
      const productId = typeof sub.items.data[0].price.product === 'string' 
        ? sub.items.data[0].price.product 
        : sub.items.data[0].price.product.id;
      
      const mapping = productMappings[productId];
      if (mapping) {
        const tier = tierOrder[mapping.planTier] || 0;
        if (tier > highestTier) {
          highestTier = tier;
          highestTierSub = sub;
        }
      }
    }

    const productId = typeof highestTierSub.items.data[0].price.product === 'string'
      ? highestTierSub.items.data[0].price.product
      : highestTierSub.items.data[0].price.product.id;

    const mapping = productMappings[productId];
    
    if (!mapping) {
      logStep("Product not found in mappings", { productId });
      throw new Error('Product mapping not found');
    }

    // Calculate period end
    const isTrial = highestTierSub.trial_end !== null;
    const periodEndTimestamp = isTrial && highestTierSub.trial_end 
      ? highestTierSub.trial_end 
      : highestTierSub.current_period_end;
    
    const periodEnd = new Date(periodEndTimestamp * 1000).toISOString();

    logStep("Restoring subscription", {
      plan: mapping.planTier,
      planName: mapping.planName,
      periodEnd,
      isTrial
    });

    // Upsert user subscription
    const { error: subError } = await supabaseClient
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan: mapping.planTier,
        plan_name: mapping.planName,
        product_id: productId,
        stripe_subscription_id: highestTierSub.id,
        stripe_customer_id: customer.id,
        status: 'active',
        current_period_end: periodEnd,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (subError) {
      logStep("Error upserting subscription", { error: subError });
      throw subError;
    }

    // Initialize usage limits based on plan
    let imageGenerationsLimit = 0;
    if (mapping.planTier === 'pro') {
      imageGenerationsLimit = 500;
    } else if (mapping.planTier === 'ultra_pro') {
      imageGenerationsLimit = 2000;
    }

    if (imageGenerationsLimit > 0) {
      // CRITICAL: Check if usage_limits already exist - only insert if missing!
      const { data: existingLimits } = await supabaseClient
        .from('usage_limits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingLimits) {
        // User already has limits - only update limit and period_end, preserve usage!
        logStep("Usage limits already exist, preserving usage", { 
          currentUsage: existingLimits.image_generations_used,
          currentLimit: existingLimits.image_generations_limit 
        });

        const { error: updateError } = await supabaseClient
          .from('usage_limits')
          .update({
            image_generations_limit: imageGenerationsLimit,
            period_end: periodEnd,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (updateError) {
          logStep("Error updating usage limits", { error: updateError });
          throw updateError;
        }

        logStep("Usage limits updated without resetting usage", { 
          limit: imageGenerationsLimit,
          preservedUsage: existingLimits.image_generations_used 
        });
      } else {
        // No existing limits - create new with 0 usage
        logStep("Creating new usage limits", { limit: imageGenerationsLimit });

        const { error: insertError } = await supabaseClient
          .from('usage_limits')
          .insert({
            user_id: userId,
            period_start: new Date().toISOString(),
            period_end: periodEnd,
            image_generations_used: 0,
            image_generations_limit: imageGenerationsLimit,
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          logStep("Error inserting usage limits", { error: insertError });
          throw insertError;
        }

        logStep("Usage limits created", { limit: imageGenerationsLimit });
      }
    }

    logStep("Subscription restoration complete");

    return new Response(JSON.stringify({ 
      restored: true,
      plan: mapping.planTier,
      plan_name: mapping.planName,
      image_limit: imageGenerationsLimit,
      period_end: periodEnd
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      restored: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
