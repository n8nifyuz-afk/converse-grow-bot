import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const requestSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(128),
  gclid: z.string().max(500).optional(),
  urlParams: z.record(z.string()).optional(),
  initialReferer: z.string().max(1000).optional(),
  ipAddress: z.string().max(50).optional(),
  country: z.string().max(2).optional(),
  // Bot protection fields
  website: z.string().optional(), // honeypot field
  timeElapsed: z.number().optional(), // time in milliseconds
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-VERIFICATION-CODE] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Log environment check
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      logStep("Missing environment variables", { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!serviceRoleKey 
      });
      throw new Error("Server configuration error - missing credentials");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    logStep("Parsing and validating request body");
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

    const { email, password, gclid, urlParams, initialReferer, ipAddress, country, website, timeElapsed } = validationResult.data;
    
    logStep("Request received", { email });

    // BOT PROTECTION 1: Honeypot validation
    if (website && website.trim() !== '') {
      logStep("Bot detected - honeypot field filled", { email, website });
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // BOT PROTECTION 2: Time-based validation (minimum 2 seconds)
    if (timeElapsed !== undefined && timeElapsed < 2000) {
      logStep("Bot detected - form submitted too quickly", { email, timeElapsed });
      return new Response(
        JSON.stringify({ error: "Please wait a moment before submitting" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    logStep("Bot protection checks passed", { timeElapsed });

    // RATE LIMITING: Check signup attempts for this email
    logStep("Checking rate limits");
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseAdmin
      .rpc('check_signup_rate_limit', { 
        p_identifier: email.toLowerCase(),
        p_max_attempts: 5,
        p_window_minutes: 60,
        p_block_minutes: 60
      });

    if (rateLimitError) {
      logStep("Rate limit check failed", { error: rateLimitError });
      // Continue anyway - don't block on rate limit failures
    } else if (rateLimitCheck && !rateLimitCheck.allowed) {
      logStep("Rate limit exceeded", { email, ...rateLimitCheck });
      return new Response(
        JSON.stringify({ 
          error: rateLimitCheck.reason || "Too many attempts. Please try again later.",
          blockedUntil: rateLimitCheck.blocked_until
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    logStep("Rate limit check passed", rateLimitCheck);

    // Check if email already exists in auth.users
    logStep("Checking if email exists");
    const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (searchError) {
      logStep("Error checking email availability", { error: searchError });
      throw new Error(`Failed to check email availability: ${searchError.message}`);
    }

    const existingUser = existingUsers.users.find(u => u.email === email);
    if (existingUser) {
      logStep("Email already exists", { email, providers: existingUser.app_metadata?.providers });
      
      // Check if user signed up with OAuth (Google, Apple, etc.)
      const providers = existingUser.app_metadata?.providers || [];
      if (providers.length > 0 && !providers.includes('email')) {
        const provider = providers[0].charAt(0).toUpperCase() + providers[0].slice(1);
        // Return 200 status with error in body for user-facing errors
        return new Response(
          JSON.stringify({ 
            error: `This email is already registered with ${provider}. Please sign in using ${provider} instead, or use a different email address.`
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        // Return 200 status with error in body for user-facing errors
        return new Response(
          JSON.stringify({ 
            error: 'This email is already registered. Please sign in or use the "Forgot Password" option.'
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // SECURITY: Hash the password before storing
    logStep("Hashing password");
    const hashedPassword = await bcrypt.hash(password);
    logStep("Password hashed successfully");

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    logStep("Generated verification code", { email, expiresAt });
    // Store the verification code with HASHED password
    let verificationRecord;
    const { data: verification, error: storeError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        email,
        code: code,
        password_hash: hashedPassword, // Store HASHED password
        expires_at: expiresAt.toISOString(),
        gclid: gclid || null,
        url_params: urlParams || {},
        initial_referer: initialReferer || null,
        ip_address: ipAddress || null,
        country: country || null,
      })
      .select()
      .single();

    if (storeError) {
      // If insert fails due to existing entry, update it
      const { data: updatedVerification, error: updateError } = await supabaseAdmin
        .from('email_verifications')
        .update({
          code: code,
          password_hash: hashedPassword, // Store HASHED password
          expires_at: expiresAt.toISOString(),
          verified: false,
          gclid: gclid || null,
          url_params: urlParams || {},
          initial_referer: initialReferer || null,
          ip_address: ipAddress || null,
          country: country || null,
        })
        .eq('email', email)
        .select()
        .single();

      if (updateError) {
        logStep("Error storing verification code", { error: updateError });
        throw updateError;
      }
      
      if (!updatedVerification) {
        throw new Error('Failed to create verification record');
      }
      
      verificationRecord = updatedVerification;
    } else {
      verificationRecord = verification;
    }
    
    if (!verificationRecord) {
      throw new Error('Failed to create verification record');
    }

    // Send simple verification code email
    const { error: emailError } = await resend.emails.send({
      from: "ChatLearn <no-reply@chatl.ai>",
      to: [email],
      subject: "Your ChatLearn Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Verify Your Email</h2>
          <p style="color: #666; font-size: 16px;">Your verification code is:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">© 2025 ChatLearn. All rights reserved.</p>
        </div>
      `,
      headers: {
        'X-Entity-Ref-ID': `email-verification-${Date.now()}`,
      },
      tags: [
        {
          name: 'category',
          value: 'email_verification',
        },
      ],
    });

    if (emailError) {
      logStep("Error sending email", { error: emailError });
      // Delete verification record if email fails
      await supabaseAdmin
        .from('email_verifications')
        .delete()
        .eq('email', email);
      throw emailError;
    }

    logStep("Verification code sent successfully", { email });

    return new Response(
      JSON.stringify({ 
        success: true,
        verificationId: verificationRecord.id,
        message: "Verification code sent to your email"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logStep("ERROR", { 
      message: errorMessage,
      stack: errorStack,
      errorType: error?.constructor?.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: "Check edge function logs for more information"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
