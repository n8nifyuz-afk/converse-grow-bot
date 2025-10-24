import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
