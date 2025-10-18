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
    logStep("Starting cleanup of dead/orphaned subscriptions");

    const now = new Date();
    
    // CRITICAL FIX: Only clean up subscriptions in failed states
    // NEVER delete 'active' subscriptions - let webhooks handle period renewals
    // This cron is a safety net for orphaned records, not primary handler
    
    // Add 24-hour grace period - only clean up truly stale records
    const gracePeriod = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const gracePeriodISO = gracePeriod.toISOString();
    
    logStep("Using 24-hour grace period for safety", { 
      now: now.toISOString(), 
      gracePeriod: gracePeriodISO 
    });

    // ONLY delete subscriptions that are:
    // 1. In a failed/terminal state (NOT active)
    // 2. Haven't been updated in 24 hours (webhook must have failed)
    // 3. Period ended long ago (7+ days to be extra safe)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();
    
    const { data: deadSubs, error: fetchError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .in('status', ['canceled', 'unpaid', 'past_due', 'incomplete_expired', 'paused'])
      .lt('updated_at', gracePeriodISO)
      .lt('current_period_end', sevenDaysAgoISO);

    if (fetchError) {
      logStep("Error fetching dead subscriptions", { error: fetchError.message });
      throw fetchError;
    }

    if (!deadSubs || deadSubs.length === 0) {
      logStep("No orphaned subscriptions found (safety net not needed)");
      return new Response(JSON.stringify({ 
        cleaned: 0, 
        message: "No orphaned subscriptions - webhooks working correctly" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found orphaned subscriptions to clean", { 
      count: deadSubs.length,
      statuses: deadSubs.map(s => s.status)
    });

    // Delete orphaned subscriptions (webhooks should have handled these)
    const { error: deleteError } = await supabaseClient
      .from('user_subscriptions')
      .delete()
      .in('status', ['canceled', 'unpaid', 'past_due', 'incomplete_expired', 'paused'])
      .lt('updated_at', gracePeriodISO)
      .lt('current_period_end', sevenDaysAgoISO);

    if (deleteError) {
      logStep("Error deleting orphaned subscriptions", { error: deleteError.message });
      throw deleteError;
    }

    logStep("Successfully cleaned up orphaned subscriptions (safety net)", { count: deadSubs.length });

    return new Response(JSON.stringify({
      cleaned: deadSubs.length,
      message: `Safety net: Cleaned up ${deadSubs.length} orphaned subscription records`
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
