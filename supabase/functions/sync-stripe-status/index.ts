import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-STRIPE-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { userId } = await req.json();

    if (!userId) {
      throw new Error("userId is required");
    }

    logStep("Syncing Stripe status for user", { userId });

    // Get user's subscription from database
    const { data: dbSubscription, error: dbError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (!dbSubscription) {
      logStep("No subscription in database", { userId });
      return new Response(JSON.stringify({ 
        status: "no_subscription",
        message: "No subscription found in database" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found subscription in database", { 
      subscriptionId: dbSubscription.stripe_subscription_id,
      status: dbSubscription.status,
      plan: dbSubscription.plan
    });

    // Check actual status in Stripe
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        dbSubscription.stripe_subscription_id
      );

      logStep("Retrieved Stripe subscription", {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end
      });

      // Check if subscription is actually cancelled/expired in Stripe
      if (['canceled', 'incomplete_expired', 'unpaid', 'past_due'].includes(stripeSubscription.status)) {
        logStep("Stripe subscription is cancelled/expired, cleaning up database", {
          stripeStatus: stripeSubscription.status
        });

        // Delete from database
        await supabaseClient
          .from('user_subscriptions')
          .delete()
          .eq('user_id', userId);

        await supabaseClient
          .from('usage_limits')
          .delete()
          .eq('user_id', userId);

        logStep("✅ Database cleaned up - user reverted to free", { userId });

        return new Response(JSON.stringify({ 
          status: "reverted_to_free",
          message: "Subscription was cancelled in Stripe, database cleaned up",
          stripeStatus: stripeSubscription.status
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Subscription is still active in Stripe
      return new Response(JSON.stringify({ 
        status: "synced",
        message: "Subscription is active in both Stripe and database",
        stripeStatus: stripeSubscription.status,
        dbStatus: dbSubscription.status
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });

    } catch (stripeError: any) {
      // Subscription not found in Stripe (deleted or never existed)
      if (stripeError?.code === 'resource_missing') {
        logStep("Subscription not found in Stripe, cleaning up database", {
          subscriptionId: dbSubscription.stripe_subscription_id
        });

        // Delete from database
        await supabaseClient
          .from('user_subscriptions')
          .delete()
          .eq('user_id', userId);

        await supabaseClient
          .from('usage_limits')
          .delete()
          .eq('user_id', userId);

        logStep("✅ Database cleaned up - subscription didn't exist in Stripe", { userId });

        return new Response(JSON.stringify({ 
          status: "reverted_to_free",
          message: "Subscription not found in Stripe, database cleaned up"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      throw stripeError;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});