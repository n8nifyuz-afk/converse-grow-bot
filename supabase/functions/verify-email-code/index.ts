import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-EMAIL-CODE] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { email, code } = await req.json();
    
    if (!email || !code) {
      throw new Error("Email and code are required");
    }

    logStep("Verification attempt", { email, code });

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get verification record
    const { data: verification, error: fetchError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .single();

    if (fetchError || !verification) {
      logStep("Invalid code", { email });
      throw new Error("Invalid or expired verification code");
    }

    // Check if code is expired
    const expiresAt = new Date(verification.expires_at);
    if (expiresAt < new Date()) {
      logStep("Code expired", { email, expiresAt });
      throw new Error("Verification code has expired");
    }

    // Check if already verified
    if (verification.verified) {
      logStep("Already verified", { email });
      throw new Error("This code has already been used");
    }

    logStep("Code verified, creating user", { email });

    // Create the user account with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: verification.password_hash,
      email_confirm: true, // Mark email as confirmed
    });

    if (authError) {
      logStep("Error creating user", { error: authError.message });
      throw new Error(`Failed to create account: ${authError.message}`);
    }

    // Mark verification as used
    await supabaseAdmin
      .from('email_verifications')
      .update({ verified: true })
      .eq('email', email);

    logStep("User created successfully", { userId: authData.user?.id });

    // Send welcome email
    try {
      logStep("Sending welcome email", { email });
      
      await resend.emails.send({
        from: "ChatL <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to ChatL - Your Account is Ready! 🎉",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to ChatL! 🎉</h1>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px;">
                          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                            Hi there,
                          </p>
                          
                          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                            Thank you for joining <strong>ChatL</strong>! Your account has been successfully created and verified. 
                          </p>
                          
                          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                            You can now access all our features:
                          </p>
                          
                          <ul style="margin: 0 0 30px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #333333;">
                            <li>Chat with multiple AI models (ChatGPT, Claude, Gemini, and more)</li>
                            <li>Generate and edit images with AI</li>
                            <li>Voice conversations with AI</li>
                            <li>Organize your chats with projects</li>
                            <li>And much more!</li>
                          </ul>
                          
                          <div style="text-align: center; margin: 30px 0;">
                            <a href="https://lciaiunzacgvvbvcshdh.supabase.co" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              Start Chatting Now
                            </a>
                          </div>
                          
                          <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                            If you have any questions or need assistance, feel free to reach out to our support team.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                          <p style="margin: 0; font-size: 14px; color: #666666;">
                            Best regards,<br>
                            <strong>The ChatL Team</strong>
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
      });
      
      logStep("Welcome email sent successfully");
    } catch (emailError) {
      // Log but don't fail the request if email fails
      logStep("Failed to send welcome email", { error: emailError });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email verified successfully! You can now sign in."
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
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
