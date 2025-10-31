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

    // Get authenticated user
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { email, password, userId } = await req.json();
    
    if (!email || !password || !userId) {
      throw new Error("Email, password, and userId are required");
    }

    // Verify user making request matches userId
    if (user.id !== userId) {
      throw new Error('Unauthorized: user mismatch');
    }

    logStep("Request received", { email, userId });

    // Check if email already exists in auth.users
    const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
    if (searchError) {
      throw new Error('Failed to check email availability');
    }

    const emailExists = existingUsers.users.some(u => u.email === email && u.id !== userId);
    if (emailExists) {
      throw new Error('This email is already registered. Please use a different email.');
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    logStep("Generated verification code", { email, expiresAt });

    // Hash password properly
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store the verification code in Supabase
    let verificationRecord;
    const { data: verification, error: storeError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        email,
        code: code,
        password_hash: passwordHash,
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
          password_hash: passwordHash,
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
