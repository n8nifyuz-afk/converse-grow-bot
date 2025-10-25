import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY") as string;
const webhookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    console.log("[WELCOME-EMAIL] Function invoked");

    // Verify webhook secret from header
    const secret = req.headers.get("webhook-secret");
    if (webhookSecret && secret !== webhookSecret) {
      console.error("[WELCOME-EMAIL] Invalid webhook secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    console.log("[WELCOME-EMAIL] Webhook secret verified");

    const payload = await req.json();
    console.log("[WELCOME-EMAIL] Received payload:", JSON.stringify(payload, null, 2));
    
    // Database webhook sends: { type: "INSERT", table: "users", record: {...}, old_record: null }
    const user = payload.record;
    
    if (!user || !user.email) {
      console.error("[WELCOME-EMAIL] Missing user data in payload");
      return new Response(
        JSON.stringify({ error: "Missing user data" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    console.log(`[WELCOME-EMAIL] Sending welcome email to: ${user.email}`);

    const userName = user.raw_user_meta_data?.full_name || user.raw_user_meta_data?.name || user.email.split('@')[0];

    // Send email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "ChatL <no-reply@chatl.ai>",
        to: [user.email],
        subject: "Welcome to ChatL! 🎉",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f6f6f6; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Welcome to ChatL! 🎉</h1>
                </div>
                
                <div style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">Hi ${userName}!</h2>
                  
                  <p style="color: #555555; line-height: 1.6; margin: 0 0 15px 0; font-size: 16px;">
                    Thank you for joining ChatL! We're excited to have you on board.
                  </p>
                  
                  <p style="color: #555555; line-height: 1.6; margin: 0 0 15px 0; font-size: 16px;">
                    ChatL is your AI-powered chat assistant that helps you with various tasks. Here's what you can do:
                  </p>
                  
                  <ul style="color: #555555; line-height: 1.8; margin: 0 0 25px 0; padding-left: 20px; font-size: 16px;">
                    <li>Chat with advanced AI models</li>
                    <li>Generate and edit images</li>
                    <li>Organize conversations in projects</li>
                    <li>Access powerful AI tools</li>
                  </ul>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.chatl.ai" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Start Chatting
                    </a>
                  </div>
                  
                  <p style="color: #555555; line-height: 1.6; margin: 25px 0 0 0; font-size: 16px;">
                    If you have any questions, feel free to reach out to our support team.
                  </p>
                  
                  <p style="color: #555555; line-height: 1.6; margin: 15px 0 0 0; font-size: 16px;">
                    Best regards,<br>
                    <strong>The ChatL Team</strong>
                  </p>
                </div>
                
                <div style="background-color: #f8f8f8; padding: 20px 30px; border-top: 1px solid #eeeeee;">
                  <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                    You received this email because you signed up for ChatL.<br>
                    © 2025 ChatL. All rights reserved.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("[WELCOME-EMAIL] Resend API error:", errorData);
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log("[WELCOME-EMAIL] Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent", data: emailData }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("[WELCOME-EMAIL] Error in function:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : "Unknown error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
