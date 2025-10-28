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
      from: "ChatLearn <no-reply@chatl.ai>",
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
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
            <div style="display: none; max-height: 0; overflow: hidden;">Welcome to ChatLearn - Your AI workspace is ready</div>
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; border: 1px solid #e6ebf1;">
                    <!-- Logo Section -->
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center;">
                        <img src="https://www.chatl.ai/favicon.png" alt="ChatLearn Logo" width="96" height="96" style="display: block; margin: 0 auto;">
                      </td>
                    </tr>
                    <!-- Title -->
                    <tr>
                      <td style="padding: 0 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">Welcome to ChatLearn</h1>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 0 40px 20px;">
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #484848;">
                          Hi ${displayName},
                        </p>
                        <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #484848;">
                          Thank you for joining ChatLearn. Your account has been successfully created, and you're ready to start exploring the power of AI.
                        </p>
                        <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #484848; font-weight: 600;">
                          What you can do:
                        </p>
                        <ul style="margin: 0 0 30px; padding-left: 20px; font-size: 16px; line-height: 26px; color: #484848;">
                          <li>Chat with multiple AI models (GPT-5, Gemini, Claude, and more)</li>
                          <li>Generate and edit images with AI</li>
                          <li>Use voice mode for hands-free conversations</li>
                          <li>Analyze PDFs and documents</li>
                        </ul>
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="https://www.chatl.ai" style="display: inline-block; padding: 12px 32px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                            Start Chatting Now
                          </a>
                        </div>
                        <p style="margin: 30px 0 0; font-size: 14px; line-height: 20px; color: #666666; padding-top: 20px; border-top: 1px solid #e6ebf1;">
                          If you didn't sign up for ChatLearn, you can safely ignore this message.
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px 40px; text-align: center;">
                        <p style="margin: 0 0 8px; font-size: 14px; color: #484848;">
                          Best,<br>
                          <strong>The ChatLearn Team</strong>
                        </p>
                        <p style="margin: 16px 0 0; font-size: 13px; line-height: 20px; color: #8898aa;">
                          If you have any questions, please contact us through our <a href="https://www.chatl.ai/help" style="color: #000000; text-decoration: none;">help center</a>.
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
