import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const WEBHOOK_SECRET = Deno.env.get("SEND_EMAIL_HOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WELCOME-EMAIL] ${step}${detailsStr}`);
};

// Verify webhook signature using Web Crypto API
const verifyWebhookSignature = async (payload: string, signature: string | null): Promise<boolean> => {
  if (!signature || !WEBHOOK_SECRET) {
    logStep("WARNING: Missing signature or webhook secret");
    return false;
  }

  try {
    // Extract the secret from the v1,whsec_ format
    const secret = WEBHOOK_SECRET.replace(/^v1,whsec_/, '');
    
    // Import the key for HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    // Create HMAC-SHA256 signature
    const payloadData = encoder.encode(payload);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, payloadData);
    
    // Convert to base64
    const signatureArray = new Uint8Array(signatureBuffer);
    const expectedSignature = btoa(String.fromCharCode(...signatureArray));
    
    // Compare signatures
    const isValid = signature === expectedSignature;
    logStep("Signature verification", { isValid });
    return isValid;
  } catch (error) {
    logStep("Signature verification error", { error: error.message });
    return false;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Get the raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    
    // Verify webhook signature
    const isValidSignature = await verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      logStep("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    logStep("Received payload", { type: payload.type, user: payload.user?.email });

    // Get user data from Auth webhook payload
    const user = payload.user;
    if (!user || !user.email) {
      throw new Error("No user email found in payload");
    }

    const { email, id } = user;
    
    if (!email) {
      throw new Error("No email found in payload");
    }

    logStep("Sending welcome email", { email, userId: id });

    const emailResponse = await resend.emails.send({
      from: "ChatL <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to ChatL! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome to ChatL!</h1>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Thank you for joining ChatL! We're excited to have you on board.
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            You can now start using ChatL to:
          </p>
          
          <ul style="color: #555; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <li>Chat with multiple AI models</li>
            <li>Generate and edit images</li>
            <li>Manage your conversations in projects</li>
            <li>And much more!</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.chatl.ai" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Get Started
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            If you have any questions or need help, feel free to reach out to our support team.
          </p>
          
          <p style="color: #888; font-size: 14px;">
            Best regards,<br>
            The ChatL Team
          </p>
        </div>
      `,
    });

    logStep("Email sent successfully", { emailId: emailResponse.id });

    return new Response(
      JSON.stringify({ 
        success: true,
        emailId: emailResponse.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
