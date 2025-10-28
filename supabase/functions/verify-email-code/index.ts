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

    const { verificationId, code, email, password } = await req.json();
    
    if (!verificationId || !code || !email || !password) {
      throw new Error("All fields are required");
    }

    logStep("Verification attempt", { email, verificationId });

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get verification record
    const { data: verification, error: fetchError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('id', verificationId)
      .eq('email', email)
      .single();

    if (fetchError || !verification) {
      logStep("Invalid verification ID", { email, verificationId });
      throw new Error("Invalid verification request");
    }

    // Check if code matches
    if (verification.code !== code) {
      logStep("Invalid code", { email });
      throw new Error("Invalid verification code");
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

    // Hash the password to compare
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Verify password matches
    if (verification.password_hash !== passwordHash) {
      throw new Error('Password mismatch');
    }

    logStep("Code verified, updating user", { userId: user.id });

    // Update the user's email and password using admin API
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        email: email,
        password: password,
        email_confirm: true, // Auto-confirm the email
      }
    );

    if (updateError) {
      logStep("Error updating user", { error: updateError.message });
      throw new Error('Failed to link email to account');
    }

    // Update profile to reflect email
    await supabaseAdmin
      .from('profiles')
      .update({
        email: email,
        signup_method: 'phone+email',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    // Mark verification as used
    await supabaseAdmin
      .from('email_verifications')
      .update({ verified: true })
      .eq('id', verificationId);

    logStep("User email linked successfully", { userId: user.id });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email successfully linked to your account"
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
