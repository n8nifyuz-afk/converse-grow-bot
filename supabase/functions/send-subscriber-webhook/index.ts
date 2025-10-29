import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WEBHOOK_URL = "https://adsgbt.app.n8n.cloud/webhook/subscriber";

// Extract IP from request headers with comprehensive header checking
const getClientIP = (req: Request): string | null => {
  console.log("[IP-DETECTION] Checking headers for IP...");
  
  // Log all relevant headers for debugging
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  const xForwardedFor = req.headers.get('x-forwarded-for');
  const xRealIP = req.headers.get('x-real-ip');
  const xClientIP = req.headers.get('x-client-ip');
  const forwardedFor = req.headers.get('forwarded');
  
  console.log(`[IP-DETECTION] cf-connecting-ip: ${cfConnectingIP}`);
  console.log(`[IP-DETECTION] x-forwarded-for: ${xForwardedFor}`);
  console.log(`[IP-DETECTION] x-real-ip: ${xRealIP}`);
  console.log(`[IP-DETECTION] x-client-ip: ${xClientIP}`);
  console.log(`[IP-DETECTION] forwarded: ${forwardedFor}`);
  
  // Try various headers that might contain the real IP
  if (cfConnectingIP) {
    console.log(`[IP-DETECTION] Using cf-connecting-ip: ${cfConnectingIP}`);
    return cfConnectingIP;
  }
  if (xForwardedFor) {
    const ip = xForwardedFor.split(',')[0].trim();
    console.log(`[IP-DETECTION] Using x-forwarded-for: ${ip}`);
    return ip;
  }
  if (xRealIP) {
    console.log(`[IP-DETECTION] Using x-real-ip: ${xRealIP}`);
    return xRealIP;
  }
  if (xClientIP) {
    console.log(`[IP-DETECTION] Using x-client-ip: ${xClientIP}`);
    return xClientIP;
  }
  
  console.log("[IP-DETECTION] No IP found in headers");
  return null;
};

// Fetch country from IP using ipapi with retry logic
const getCountryFromIP = async (ip: string): Promise<string | null> => {
  try {
    console.log(`[COUNTRY-DETECTION] Fetching country for IP: ${ip}`);
    
    // Try ipapi.co first
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: {
        'User-Agent': 'ChatL-Webhook/1.0'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const country = data.country_code || data.country_name || null;
      console.log(`[COUNTRY-DETECTION] ipapi.co returned: ${country}`);
      return country;
    }
    
    console.log(`[COUNTRY-DETECTION] ipapi.co failed with status: ${response.status}`);
    
    // Fallback to ip-api.com (free, no key required)
    const fallbackResponse = await fetch(`http://ip-api.com/json/${ip}`);
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      const country = fallbackData.countryCode || fallbackData.country || null;
      console.log(`[COUNTRY-DETECTION] ip-api.com returned: ${country}`);
      return country;
    }
    
    console.log(`[COUNTRY-DETECTION] ip-api.com also failed with status: ${fallbackResponse.status}`);
  } catch (error) {
    console.error(`[COUNTRY-DETECTION] Error fetching country for IP ${ip}:`, error);
  }
  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, username, ipAddress, country, signupMethod, gclid, urlParams, referer } = await req.json();

    console.log(`[SUBSCRIBER-WEBHOOK] Processing webhook for user: ${userId}`);
    console.log(`[SUBSCRIBER-WEBHOOK] Email: ${email}, Username: ${username}`);
    console.log(`[SUBSCRIBER-WEBHOOK] IP: ${ipAddress}, Country: ${country}, Signup Method: ${signupMethod}`);
    console.log(`[SUBSCRIBER-WEBHOOK] GCLID: ${gclid}, Referer: ${referer}`);
    console.log(`[SUBSCRIBER-WEBHOOK] URL Params:`, urlParams);

    // Prepare webhook payload with proper formatting
    const webhookPayload = {
      email,
      username,
      country: country || 'Unknown',
      ip_address: ipAddress || 'Unknown',
      user_id: userId,
      signup_method: signupMethod || 'email',
      gclid: gclid || null,
      urlParams: JSON.stringify(urlParams || {}), // Stringified JSON
      referer: referer ? String(referer) : "null", // String, not null
      timestamp: new Date().toISOString(),
      hasDocument: "false"
    };
    
    console.log(`[SUBSCRIBER-WEBHOOK] Sending payload:`, JSON.stringify(webhookPayload, null, 2));

    // Send to webhook
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error(`[SUBSCRIBER-WEBHOOK] Webhook failed with status ${webhookResponse.status}: ${errorText}`);
      throw new Error(`Webhook request failed: ${webhookResponse.statusText}`);
    }

    const responseText = await webhookResponse.text();
    console.log(`[SUBSCRIBER-WEBHOOK] ✅ Webhook response: ${responseText}`);
    console.log(`[SUBSCRIBER-WEBHOOK] ✅ Successfully sent data for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[SUBSCRIBER-WEBHOOK] ❌ Error:", error);
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
