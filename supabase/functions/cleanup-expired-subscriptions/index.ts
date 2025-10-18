import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-EXPIRED] ${step}${detailsStr}`);
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
    logStep("Starting cleanup of expired subscriptions");

    const now = new Date();
    
    // CRITICAL FIX: Add 5-minute grace period to avoid conflicts with webhooks
    // Only clean up subscriptions that expired more than 5 minutes ago
    const gracePeriod = new Date(now.getTime() - 5 * 60 * 1000);
    const gracePeriodISO = gracePeriod.toISOString();
    
    logStep("Using grace period", { 
      now: now.toISOString(), 
      gracePeriod: gracePeriodISO 
    });

    // Get all subscriptions where current_period_end passed > 5 minutes ago
    // AND haven't been updated in last 5 minutes (webhook might be processing)
    const { data: expiredSubs, error: fetchError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .lt('current_period_end', gracePeriodISO)
      .lt('updated_at', gracePeriodISO)
      .eq('status', 'active');

    if (fetchError) {
      logStep("Error fetching expired subscriptions", { error: fetchError.message });
      throw fetchError;
    }

    if (!expiredSubs || expiredSubs.length === 0) {
      logStep("No expired subscriptions found (after grace period)");
      return new Response(JSON.stringify({ 
        cleaned: 0, 
        message: "No expired subscriptions found" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found expired subscriptions (after grace period)", { count: expiredSubs.length });

    // Delete all expired subscriptions with grace period (users revert to free plan)
    const { error: deleteError } = await supabaseClient
      .from('user_subscriptions')
      .delete()
      .lt('current_period_end', gracePeriodISO)
      .lt('updated_at', gracePeriodISO)
      .eq('status', 'active');

    if (deleteError) {
      logStep("Error deleting expired subscriptions", { error: deleteError.message });
      throw deleteError;
    }

    logStep("Successfully cleaned up expired subscriptions", { count: expiredSubs.length });

    return new Response(JSON.stringify({
      cleaned: expiredSubs.length,
      message: `Successfully downgraded ${expiredSubs.length} expired subscriptions to free plan`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in cleanup", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
