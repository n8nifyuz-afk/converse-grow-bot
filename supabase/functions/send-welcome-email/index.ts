import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const rawHookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;
// Strip "v1," prefix if present (Supabase format)
const hookSecret = rawHookSecret?.startsWith("v1,") 
  ? rawHookSecret.substring(3) 
  : rawHookSecret;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the raw payload
    const payload = await req.text();
    console.log("Received webhook payload");
    
    // Verify webhook signature
    const headers = Object.fromEntries(req.headers);
    
    // Skip verification if secret is not properly configured
    if (!hookSecret || hookSecret === 'your-webhook-secret-here') {
      console.warn("SEND_EMAIL_HOOK_SECRET not configured - skipping verification (NOT RECOMMENDED FOR PRODUCTION)");
    } else {
      try {
        const wh = new Webhook(hookSecret);
        const verifiedPayload = wh.verify(payload, headers);
        console.log("Webhook signature verified successfully");
      } catch (error) {
        console.error("Webhook verification failed:", error);
        return new Response(
          JSON.stringify({ error: "Invalid webhook signature" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }
    
    // Parse the payload
    const data = JSON.parse(payload);

    const { user } = data as {
      user: {
        id: string;
        email: string;
        raw_user_meta_data?: {
          full_name?: string;
          name?: string;
          display_name?: string;
        };
      };
    };

    console.log("Processing welcome email for user:", user.email);
    const userName = user.raw_user_meta_data?.full_name || 
                     user.raw_user_meta_data?.name || 
                     user.raw_user_meta_data?.display_name || 
                     user.email?.split("@")[0] || 
                     "there";

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ChatL</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Welcome to ChatL! 🎉</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hi ${userName},
                      </p>
                      
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        We're thrilled to have you join ChatL! You've just unlocked access to powerful AI conversations with multiple models including ChatGPT, Claude, Gemini, and more.
                      </p>
                      
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Here's what you can do with ChatL:
                      </p>
                      
                      <ul style="color: #333333; font-size: 16px; line-height: 1.8; margin: 0 0 30px 0; padding-left: 20px;">
                        <li>Chat with multiple AI models in one place</li>
                        <li>Generate stunning images with AI</li>
                        <li>Organize your conversations into projects</li>
                        <li>Switch between models seamlessly</li>
                      </ul>
                      
                      <div style="text-align: center; margin: 40px 0;">
                        <a href="https://chatl.ai" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          Start Chatting Now
                        </a>
                      </div>
                      
                      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; padding-top: 30px; border-top: 1px solid #eeeeee;">
                        Need help? Have questions? Feel free to reach out to us anytime.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                      <p style="color: #999999; font-size: 14px; margin: 0 0 10px 0;">
                        © ${new Date().getFullYear()} ChatL. All rights reserved.
                      </p>
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        <a href="https://chatl.ai" style="color: #667eea; text-decoration: none;">Visit Website</a> • 
                        <a href="https://chatl.ai/help" style="color: #667eea; text-decoration: none;">Help Center</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: "welcome@chatl.ai",
      to: [user.email],
      subject: "Welcome to ChatL - Start Your AI Journey! 🚀",
      html: htmlContent,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log("Welcome email sent successfully to:", user.email);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
