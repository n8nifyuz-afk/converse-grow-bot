import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-STRIPE-SUB] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { userId, userEmail } = await req.json();
    if (!userId || !userEmail) {
      throw new Error("User ID and email are required");
    }
    logStep("Received user info", { userId, userEmail });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Find customer by email
    const customers = await stripe.customers.list({ 
      email: userEmail, 
      limit: 1 
    });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found", { userEmail });
      return new Response(
        JSON.stringify({ message: "No Stripe customer found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Cancel all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });

    logStep("Found subscriptions", { count: subscriptions.data.length });

    for (const subscription of subscriptions.data) {
      await stripe.subscriptions.cancel(subscription.id);
      logStep("Cancelled subscription", { subscriptionId: subscription.id });
    }

    // Delete user subscription record and usage limits (account is being deleted)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Delete subscription record completely (not just mark as cancelled)
    await supabaseAdmin
      .from("user_subscriptions")
      .delete()
      .eq("user_id", userId);

    // Also delete usage limits
    await supabaseAdmin
      .from("usage_limits")
      .delete()
      .eq("user_id", userId);

    logStep("Deleted user subscription and usage limits from database");

    return new Response(
      JSON.stringify({ 
        message: "Stripe subscriptions cancelled successfully",
        cancelledCount: subscriptions.data.length 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
