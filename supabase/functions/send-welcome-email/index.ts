import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
      from: "ChatLearn <onboarding@resend.dev>",
      to: [userEmail],
      subject: "Welcome to ChatLearn",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light">
            <meta name="supported-color-schemes" content="light">
            <!--[if !mso]><!-->
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <!--<![endif]-->
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
            <!-- Preheader text -->
            <div style="display: none; max-height: 0; overflow: hidden;">
              Your AI workspace is ready start exploring now.
            </div>
            <table role="presentation" style="width: 100%; border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 20px 0 48px; margin-bottom: 64px;">
                  <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; margin: 0 auto;">
                    <!-- Logo Section -->
                    <tr>
                      <td style="padding: 32px 20px; text-align: center;">
                        <img src="https://www.chatl.ai/favicon.png" alt="ChatLearn Logo" width="120" style="display: block; margin: 0 auto;">
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 0 20px;">
                        <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; line-height: 1.3; margin: 0 0 24px; text-align: center;">Welcome to ChatLearn</h1>
                        
                        <p style="color: #484848; font-size: 16px; line-height: 24px; margin: 0 0 16px;">
                          Hi ${displayName},
                        </p>
                        
                        <p style="color: #484848; font-size: 16px; line-height: 24px; margin: 0 0 16px;">
                          Thank you for joining ChatLearn.
                        </p>
                        
                        <p style="color: #484848; font-size: 16px; line-height: 24px; margin: 0 0 16px;">
                          We're excited to have you on board. Your account has been successfully created, and you're ready to start exploring the full power of AI.
                        </p>
                        
                        <!-- Features Section -->
                        <table role="presentation" style="width: 100%; margin: 32px 0; background-color: #f8f9fa; border-radius: 8px; padding: 24px 20px;">
                          <tr>
                            <td>
                              <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 600; line-height: 1.4; margin: 0 0 16px;">What You Can Do:</h2>
                              <p style="color: #484848; font-size: 15px; line-height: 24px; margin: 0 0 12px; padding-left: 8px;">
                                • Chat with multiple AI models (GPT-5, Gemini, Claude, and more)
                              </p>
                              <p style="color: #484848; font-size: 15px; line-height: 24px; margin: 0 0 12px; padding-left: 8px;">
                                • Generate and edit images with AI
                              </p>
                              <p style="color: #484848; font-size: 15px; line-height: 24px; margin: 0 0 12px; padding-left: 8px;">
                                • Use voice mode for hands-free conversations
                              </p>
                              <p style="color: #484848; font-size: 15px; line-height: 24px; margin: 0 0 12px; padding-left: 8px;">
                                • Analyze PDFs and documents
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Button Section -->
                        <table role="presentation" style="width: 100%; margin: 32px 0;">
                          <tr>
                            <td align="center">
                              <a href="https://www.chatl.ai" target="_blank" style="background-color: #000000; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center; display: inline-block; padding: 14px 40px;">
                                Start Chatting Now
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #484848; font-size: 16px; line-height: 24px; margin: 0 0 16px;">
                          Need help getting started? Contact us at <a href="mailto:support@chatl.ai" style="color: #000000; text-decoration: underline;">support@chatl.ai</a>.
                        </p>
                        
                        <p style="color: #484848; font-size: 16px; line-height: 24px; margin: 0 0 16px;">
                          Best regards,
                        </p>
                        
                        <p style="color: #484848; font-size: 16px; line-height: 24px; margin: 0 0 16px;">
                          The ChatLearn Team
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="border-top: 1px solid #e6ebf1; margin-top: 48px; padding: 20px 20px 0; text-align: center;">
                        <p style="color: #8898aa; font-size: 13px; line-height: 20px; margin: 0 0 8px;">
                          © ${new Date().getFullYear()} ChatLearn. All rights reserved.
                        </p>
                        <p style="color: #8898aa; font-size: 13px; line-height: 20px; margin: 0 0 8px;">
                          <a href="https://www.chatl.ai/privacy" style="color: #8898aa; text-decoration: underline;">Privacy Policy</a>
                          •
                          <a href="https://www.chatl.ai/terms" style="color: #8898aa; text-decoration: underline;">Terms of Service</a>
                        </p>
                        <p style="color: #8898aa; font-size: 13px; line-height: 20px; margin: 0 0 8px;">
                          You received this email because you created an account at ChatLearn.
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
