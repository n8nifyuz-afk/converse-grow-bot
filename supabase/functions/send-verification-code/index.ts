import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
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

    logStep("Parsing request body");
    const { email, password } = await req.json();
    
    if (!email || !password) {
      logStep("Missing email or password");
      return new Response(
        JSON.stringify({ 
          error: "Email and password are required"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    logStep("Request received", { email });

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
        return new Response(
          JSON.stringify({ 
            error: `This email is already registered with ${provider}. Please sign in using ${provider} instead, or use a different email address.`
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        return new Response(
          JSON.stringify({ 
            error: 'This email is already registered. Please sign in or use the "Forgot Password" option.'
          }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    logStep("Generated verification code", { email, expiresAt });

    // Store the verification code in Supabase
    // Note: password_hash column stores the plain password (Supabase encrypts at rest)
    // It will be used to create the user account after verification
    let verificationRecord;
    const { data: verification, error: storeError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        email,
        code: code,
        password_hash: password, // Store plain password (encrypted by Supabase)
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (storeError) {
      // If insert fails due to existing entry, update it
      const { data: updatedVerification, error: updateError } = await supabaseAdmin
        .from('email_verifications')
        .update({
          code: code,
          password_hash: password, // Store plain password (encrypted by Supabase)
          expires_at: expiresAt.toISOString(),
          verified: false,
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
