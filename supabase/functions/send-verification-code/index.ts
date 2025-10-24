import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-VERIFICATION-CODE] ${step}${detailsStr}`);
};

// Generate a 6-digit code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { email, password } = await req.json();
    
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    logStep("Request received", { email });

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      logStep("User already exists", { email });
      throw new Error("An account with this email already exists. Please sign in instead.");
    }

    // Generate 6-digit verification code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    logStep("Generated verification code", { email, expiresAt });

    // Store the verification code in Supabase (we'll create a table for this)
    const { error: storeError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        email,
        code,
        password_hash: password, // We'll hash this properly in production
        expires_at: expiresAt.toISOString(),
      });

    if (storeError) {
      // If insert fails due to existing entry, update it
      const { error: updateError } = await supabaseAdmin
        .from('email_verifications')
        .update({
          code,
          password_hash: password,
          expires_at: expiresAt.toISOString(),
          verified: false,
        })
        .eq('email', email);

      if (updateError) {
        logStep("Error storing verification code", { error: updateError });
        throw updateError;
      }
    }

    // Send verification email
    const { error: emailError } = await resend.emails.send({
      from: "ChatL <no-reply@chatl.ai>",
      to: [email],
      subject: "Verify Your Email - ChatL.ai",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #ffffff;">
            <div style="max-width: 600px; margin: 0 auto; padding: 12px;">
              <h1 style="color: #333; font-size: 24px; font-weight: bold; margin: 40px 0 20px 0; padding: 0; text-align: center;">Verify Your Email</h1>
              
              <p style="color: #333; font-size: 14px; margin: 16px 0; line-height: 24px;">
                Thank you for signing up! Please use the verification code below to complete your registration:
              </p>
              
              <div style="background-color: #f4f4f4; border-radius: 8px; padding: 32px 20px; margin: 32px 0; text-align: center; border: 2px solid #e0e0e0;">
                <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #333; margin: 0; font-family: monospace;">
                  ${code}
                </div>
              </div>
              
              <p style="color: #333; font-size: 14px; margin: 16px 0; line-height: 24px;">
                This code will expire in 10 minutes.
              </p>
              
              <p style="color: #ababab; font-size: 14px; margin: 14px 0 16px 0; line-height: 24px;">
                If you didn't create an account with ${email}, you can safely ignore this email.
              </p>
              
              <p style="color: #898989; font-size: 12px; line-height: 22px; margin: 32px 0 24px 0; text-align: center;">
                <a href="https://www.chatl.ai" target="_blank" style="color: #2754C5; text-decoration: underline;">ChatL.ai</a> - Your AI Assistant
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      logStep("Error sending email", { error: emailError });
      throw emailError;
    }

    logStep("Verification email sent successfully", { email });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Verification code sent to your email"
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
