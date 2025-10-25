import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEBHOOK_URL = "https://adsgbt.app.n8n.cloud/webhook/subscriber";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, username, country, ipAddress } = await req.json();

    console.log(`[SUBSCRIBER-WEBHOOK] Sending data for user: ${userId}`);

    // Send to webhook
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        username,
        country,
        ip_address: ipAddress,
        user_id: userId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!webhookResponse.ok) {
      console.error(`[SUBSCRIBER-WEBHOOK] Webhook failed: ${webhookResponse.status}`);
      throw new Error(`Webhook request failed: ${webhookResponse.statusText}`);
    }

    console.log(`[SUBSCRIBER-WEBHOOK] Successfully sent data for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[SUBSCRIBER-WEBHOOK] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
