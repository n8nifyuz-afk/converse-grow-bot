import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEBHOOK_URL = "https://adsgbt.app.n8n.cloud/webhook/subscriber";

// Extract IP from request headers
const getClientIP = (req: Request): string | null => {
  // Try various headers that might contain the real IP
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIP = req.headers.get('x-real-ip');
  
  if (cfConnectingIP) return cfConnectingIP;
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  if (xRealIP) return xRealIP;
  
  return null;
};

// Fetch country from IP using ipapi
const getCountryFromIP = async (ip: string): Promise<string | null> => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (response.ok) {
      const data = await response.json();
      return data.country_code || data.country_name || null;
    }
  } catch (error) {
    console.error(`[SUBSCRIBER-WEBHOOK] Failed to fetch country for IP ${ip}:`, error);
  }
  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, username } = await req.json();

    console.log(`[SUBSCRIBER-WEBHOOK] Processing webhook for user: ${userId}`);

    // Get IP from request headers
    const ipAddress = getClientIP(req);
    console.log(`[SUBSCRIBER-WEBHOOK] Extracted IP: ${ipAddress}`);

    // Fetch country based on IP
    let country: string | null = null;
    if (ipAddress) {
      country = await getCountryFromIP(ipAddress);
      console.log(`[SUBSCRIBER-WEBHOOK] Detected country: ${country}`);
    }

    // Send to webhook
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        username,
        country: country || 'Unknown',
        ip_address: ipAddress || 'Unknown',
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
