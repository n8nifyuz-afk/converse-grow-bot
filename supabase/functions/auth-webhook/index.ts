import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const payload = await req.json();
    console.log('🔔 Auth webhook received:', payload.type);

    // Handle user.created event
    if (payload.type === 'INSERT' && payload.table === 'users' && payload.record) {
      const user = payload.record;
      console.log('👤 New user created:', user.id, user.email);

      // Extract display name from various metadata fields
      const displayName = 
        user.raw_user_meta_data?.display_name ||
        user.raw_user_meta_data?.full_name ||
        user.raw_user_meta_data?.name ||
        user.email?.split('@')[0] ||
        'User';

      // Detect signup method
      let signupMethod = 'email';
      if (user.raw_user_meta_data?.iss === 'https://appleid.apple.com') {
        signupMethod = 'apple';
      } else if (user.raw_user_meta_data?.iss === 'https://accounts.google.com') {
        signupMethod = 'google';
      } else if (user.raw_app_metadata?.provider === 'google') {
        signupMethod = 'google';
      } else if (user.raw_app_metadata?.provider === 'apple') {
        signupMethod = 'apple';
      } else if (user.raw_user_meta_data?.provider) {
        signupMethod = user.raw_user_meta_data.provider;
      }

      // Get avatar URL
      const avatarUrl = 
        user.raw_user_meta_data?.avatar_url ||
        user.raw_user_meta_data?.picture ||
        user.raw_user_meta_data?.photo ||
        null;

      // Insert profile using service role (bypasses RLS)
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          display_name: displayName,
          email: user.email,
          signup_method: signupMethod,
          avatar_url: avatarUrl,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create profile:', error);
        // Don't throw error - we don't want to block user creation
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { 
            status: 200, // Return 200 so Supabase doesn't retry
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('✅ Profile created successfully:', data);
      return new Response(
        JSON.stringify({ success: true, profile: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Other event types - just acknowledge
    return new Response(
      JSON.stringify({ success: true, message: 'Event received' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Webhook error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 200, // Return 200 to prevent retries
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

