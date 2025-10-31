import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import React from 'https://esm.sh/react@18.3.1';
import { VerificationEmail } from './_templates/verification-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-VERIFICATION-CODE] ${step}${detailsStr}`);
};

// Generate a secure token for email verification link
const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
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

    // Generate secure verification token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    logStep("Generated verification token", { email, expiresAt });

    // Hash password properly
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Store the verification token in Supabase
    let verificationRecord;
    const { data: verification, error: storeError } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        email,
        code: token,
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
          code: token,
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

    // Create verification link
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const verificationLink = `${supabaseUrl.replace('lciaiunzacgvvbvcshdh.supabase.co', 'chatl.ai')}/link-email?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Render email template
    const html = await renderAsync(
      React.createElement(VerificationEmail, {
        verificationLink,
        email,
      })
    );

    // Send verification email with proper headers for deliverability
    const { error: emailError } = await resend.emails.send({
      from: "ChatLearn <no-reply@chatl.ai>",
      to: [email],
      subject: "Link Your Email to ChatLearn",
      html,
      headers: {
        'X-Entity-Ref-ID': `email-link-${Date.now()}`,
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

    logStep("Verification email sent successfully", { email });

    return new Response(
      JSON.stringify({ 
        success: true,
        verificationId: verificationRecord.id,
        message: "Verification link sent to your email"
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
