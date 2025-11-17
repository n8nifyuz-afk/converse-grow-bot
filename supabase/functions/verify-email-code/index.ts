import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'https://esm.sh/react@18.3.1';
import { EmailLinkedEmail } from './_templates/email-linked.tsx';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const requestSchema = z.object({
  code: z.string().length(6, { message: "Code must be 6 digits" }),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  gclid: z.string().max(500).optional(),
  urlParams: z.record(z.string()).optional(),
  initialReferer: z.string().max(1000).optional(),
});

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

    const rawBody = await req.json();
    
    // Validate input
    const validationResult = requestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      logStep("Validation failed", { errors: validationResult.error.errors });
      return new Response(
        JSON.stringify({ 
          error: validationResult.error.errors[0]?.message || "Invalid input"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { code, email, gclid, urlParams, initialReferer } = validationResult.data;
    
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

    // Get the HASHED password from the verification record
    const hashedPassword = verification.password_hash;

    logStep("Code verified, checking if user exists");

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    // Mark verification as used regardless of outcome
    await supabaseAdmin
      .from('email_verifications')
      .update({ verified: true })
      .eq('code', code)
      .eq('email', email);

    if (existingUser) {
      logStep("User already exists - verification successful, directing to sign in", { 
        email,
        userId: existingUser.id,
        providers: existingUser.app_metadata?.providers 
      });
      
      // Check how the user originally signed up
      const providers = existingUser.app_metadata?.providers || [];
      
      if (providers.length > 0 && !providers.includes('email')) {
        // User signed up with OAuth
        const provider = providers[0].charAt(0).toUpperCase() + providers[0].slice(1);
        return new Response(
          JSON.stringify({ 
            success: true,
            alreadyExists: true,
            provider: provider,
            message: `This email is already linked to your ${provider} account. Please sign in using ${provider}.`
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        // User already has email/password account
        return new Response(
          JSON.stringify({ 
            success: true,
            alreadyExists: true,
            message: "This email is already registered. Please sign in with your email and password."
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    logStep("Creating new user with hashed password");

    // Use tracking data from verification record, fallback to request body
    const finalGclid = verification.gclid || gclid || null;
    const finalUrlParams = verification.url_params || urlParams || {};
    const finalReferer = verification.initial_referer || initialReferer || null;
    const finalIpAddress = verification.ip_address || null;
    const finalCountry = verification.country || null;

    // SECURITY: Create user with the HASHED password stored in verification
    // Supabase will handle the password correctly since it's already hashed
    const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: hashedPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        signup_method: 'email',
        gclid: finalGclid,
        url_params: finalUrlParams,
        referer: finalReferer,
        ip_address: finalIpAddress,
        country: finalCountry,
      }
    });

    if (signUpError) {
      logStep("Error creating user", { error: signUpError.message });
      throw new Error(signUpError.message);
    }

    logStep("User created successfully", { userId: newUser.user?.id });

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
        newUser: true,
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
    
    // Return 200 status with error in body for better client handling
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
