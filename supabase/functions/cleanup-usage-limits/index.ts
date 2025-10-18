import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CLEANUP-USAGE-LIMITS] ${step}${detailsStr}`);
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
    logStep("Starting cleanup of expired usage limits");

    const now = new Date().toISOString();

    // Delete expired usage periods
    const { data: deletedRecords, error: deleteError } = await supabaseClient
      .from('usage_limits')
      .delete()
      .lt('period_end', now)
      .select('id');

    if (deleteError) {
      logStep("Error deleting expired records", { error: deleteError.message });
      throw deleteError;
    }

    const deletedCount = deletedRecords?.length || 0;
    logStep("Cleanup completed", { deletedCount, timestamp: now });

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount,
        timestamp: now
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
