import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const userId = userData.user.id;
    console.log("Manually resetting usage for user:", userId);

    // Get active subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('plan, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      throw new Error("No active subscription found");
    }

    const imageLimit = subscription.plan === 'ultra_pro' ? 2000 : subscription.plan === 'pro' ? 500 : 0;

    // Reset usage to 0
    const { error: updateError } = await supabaseClient
      .from('usage_limits')
      .update({
        image_generations_used: 0,
        image_generations_limit: imageLimit,
        period_start: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    console.log("✅ Usage reset successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        usage: 0,
        limit: imageLimit,
        message: `Usage reset to 0/${imageLimit}`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
