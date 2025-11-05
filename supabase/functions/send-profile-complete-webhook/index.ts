import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileCompleteRequest {
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📤 [PROFILE-COMPLETE-WEBHOOK] Starting profile completion webhook');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId } = await req.json() as ProfileCompleteRequest;

    if (!userId) {
      console.error('❌ [PROFILE-COMPLETE-WEBHOOK] Missing userId');
      return new Response(
        JSON.stringify({ error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 [PROFILE-COMPLETE-WEBHOOK] Fetching profile for user: ${userId}`);

    // Fetch complete user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ [PROFILE-COMPLETE-WEBHOOK] Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ [PROFILE-COMPLETE-WEBHOOK] Profile fetched for user: ${userId}`);
    console.log(`📊 [PROFILE-COMPLETE-WEBHOOK] Profile data:`, {
      display_name: profile.display_name,
      email: profile.email,
      phone: profile.phone_number,
      country: profile.country,
      signup_method: profile.signup_method,
      date_of_birth: profile.date_of_birth
    });

    // Check if webhook was already sent for this user
    const webhookSentKey = `webhook_sent_${userId}`;
    const { data: existingWebhook } = await supabase
      .from('profiles')
      .select('oauth_metadata')
      .eq('user_id', userId)
      .single();

    const metadata = existingWebhook?.oauth_metadata || {};
    if (metadata.webhook_sent) {
      console.log(`⚠️ [PROFILE-COMPLETE-WEBHOOK] Webhook already sent for user ${userId}, skipping`);
      return new Response(
        JSON.stringify({ message: 'Webhook already sent' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send webhook to external endpoint
    console.log('📡 [PROFILE-COMPLETE-WEBHOOK] Sending webhook to send-subscriber-webhook');
    
    const { error: webhookError } = await supabase.functions.invoke('send-subscriber-webhook', {
      body: {
        userId: userId,
        email: profile.email,
        username: profile.display_name,
        ipAddress: profile.ip_address,
        country: profile.country,
        signupMethod: profile.signup_method,
        gclid: profile.gclid,
        urlParams: profile.url_params || {},
        referer: profile.initial_referer,
        dateOfBirth: profile.date_of_birth,
        phoneNumber: profile.phone_number,
        profileCompleted: true
      }
    });

    if (webhookError) {
      console.error('❌ [PROFILE-COMPLETE-WEBHOOK] Failed to send webhook:', webhookError);
      throw webhookError;
    }

    // Mark webhook as sent
    const updatedMetadata = { ...metadata, webhook_sent: true, webhook_sent_at: new Date().toISOString() };
    await supabase
      .from('profiles')
      .update({ oauth_metadata: updatedMetadata })
      .eq('user_id', userId);

    console.log('✅ [PROFILE-COMPLETE-WEBHOOK] Webhook sent successfully for user:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ [PROFILE-COMPLETE-WEBHOOK] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
