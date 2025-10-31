import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'https://esm.sh/react@18.3.1';
import { EmailLinkedEmail } from './_templates/email-linked.tsx';

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

    const { code, email } = await req.json();
    
    if (!code || !email) {
      throw new Error("Code and email are required");
    }

    logStep("Verification attempt", { email });

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get verification record by code
    const { data: verification, error: fetchError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('code', code)
      .eq('email', email)
      .single();

    if (fetchError || !verification) {
      logStep("Invalid verification code", { email });
      throw new Error("Invalid or expired verification code");
    }

    // Check if code is expired
    const expiresAt = new Date(verification.expires_at);
    if (expiresAt < new Date()) {
      logStep("Code expired", { email, expiresAt });
      throw new Error("Verification code has expired. Please request a new one.");
    }

    // Check if already verified
    if (verification.verified) {
      logStep("Already verified", { email });
      throw new Error("This code has already been used");
    }

    // Get the password from the verification record
    const password = verification.password_hash;

    logStep("Code verified, creating new user");

    // Create new user with verified email
    const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        signup_method: 'email',
      }
    });

    if (signUpError) {
      logStep("Error creating user", { error: signUpError.message });
      throw new Error(signUpError.message);
    }

    logStep("User created successfully", { userId: newUser.user?.id });

    // Mark verification as used
    await supabaseAdmin
      .from('email_verifications')
      .update({ verified: true })
      .eq('code', code)
      .eq('email', email);

    // Get user's display name for personalized email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('display_name')
      .eq('user_id', newUser.user?.id)
      .single();

    // Send welcome email
    try {
      const html = await renderAsync(
        React.createElement(EmailLinkedEmail, {
          email,
          userName: profile?.display_name || 'there',
        })
      );

      await resend.emails.send({
        from: "ChatLearn <no-reply@chatl.ai>",
        to: [email],
        subject: "Welcome to ChatLearn!",
        html,
        headers: {
          'X-Entity-Ref-ID': `email-signup-${Date.now()}`,
        },
        tags: [
          {
            name: 'category',
            value: 'email_signup',
          },
        ],
      });

      logStep("Welcome email sent", { email });
    } catch (emailError) {
      // Don't fail the request if email fails
      logStep("Failed to send welcome email", { error: emailError });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Account created successfully! Please sign in with your email and password."
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
