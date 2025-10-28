import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  userEmail: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userEmail, userName }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to user ${userId} at ${userEmail}`);

    const displayName = userName || userEmail.split('@')[0];

    // Send email using Resend with inline HTML
    const emailResponse = await resend.emails.send({
      from: "ChatL <no-reply@chatl.ai>",
      to: [userEmail],
      subject: "Welcome to ChatLearn",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="x-apple-disable-message-reformatting">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <div style="display: none; max-height: 0; overflow: hidden;">Your AI workspace is ready start exploring now.</div>
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to ChatL! 🎉</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                          Hi ${displayName},
                        </p>
                        <p style="margin: 0 0 10px; font-size: 16px; line-height: 1.6; color: #333333;">
                          Thank you for joining ChatLearn.
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                          We're excited to have you on board. Your account has been successfully created, and you're ready to start exploring the full power of AI.
                        </p>
                        <p style="margin: 0 0 10px; font-size: 16px; line-height: 1.6; color: #333333; font-weight: 600;">
                          What You Can Do:
                        </p>
                        <ul style="margin: 0 0 30px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #333333;">
                          <li>Chat with multiple AI models (GPT-5, Gemini, Claude, and more)</li>
                          <li>Generate and edit images with AI</li>
                          <li>Use voice mode for hands-free conversations</li>
                          <li>Analyze PDFs and documents</li>
                        </ul>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="https://www.chatl.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Start Chatting Now
                          </a>
                        </div>
                        <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                          Need help getting started? Contact us at <a href="mailto:support@chatl.ai" style="color: #667eea; text-decoration: none;">support@chatl.ai</a>.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                        <p style="margin: 0; font-size: 14px; color: #666666;">
                          Best regards,<br>
                          <strong>The ChatLearn Team</strong>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
      // Add these headers to improve deliverability
      headers: {
        "X-Entity-Ref-ID": userId,
      },
      // Add tags for tracking
      tags: [
        {
          name: "category",
          value: "welcome",
        },
      ],
    });

    if (emailResponse.error) {
      console.error("Error sending welcome email:", emailResponse.error);
      throw emailResponse.error;
    }

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
