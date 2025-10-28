import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { provider, email } = await req.json();

    if (!provider) {
      throw new Error('Provider is required');
    }

    // Create admin client for checking other users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Case 1: Check if trying to link a provider that's already linked to another user
    if (email) {
      // Query auth.users to find if this email with this provider already exists
      const { data: existingUsers, error: queryError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (queryError) {
        console.error('Error querying users:', queryError);
        throw new Error('Failed to validate account');
      }

      // Check if any other user has this provider identity
      const conflictingUser = existingUsers.users.find(u => {
        if (u.id === user.id) return false; // Skip current user
        
        // Check if this user has the provider we're trying to link
        const hasProvider = u.app_metadata?.providers?.includes(provider);
        const hasEmail = u.email === email;
        
        return hasProvider && hasEmail;
      });

      if (conflictingUser) {
        return new Response(
          JSON.stringify({
            canLink: false,
            reason: 'identity_exists',
            message: `This ${provider} account is already connected to another user. Please use a different ${provider} account or sign in to the existing account.`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
    }

    // Case 2: Check if current user's phone number is already linked to another account with the provider
    if (user.phone) {
      const { data: existingUsers, error: queryError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (queryError) {
        console.error('Error querying users:', queryError);
        throw new Error('Failed to validate account');
      }

      // Check if any other user has the same phone AND the provider we're trying to link
      const phoneConflict = existingUsers.users.find(u => {
        if (u.id === user.id) return false; // Skip current user
        
        const hasPhone = u.phone === user.phone;
        const hasProvider = u.app_metadata?.providers?.includes(provider);
        
        return hasPhone && hasProvider;
      });

      if (phoneConflict) {
        return new Response(
          JSON.stringify({
            canLink: false,
            reason: 'phone_conflict',
            message: `Your phone number is already associated with another account that has ${provider} connected. Please contact support if you need help.`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
    }

    // Case 3: Check if the user already has this provider linked
    const alreadyLinked = user.app_metadata?.providers?.includes(provider);
    if (alreadyLinked) {
      return new Response(
        JSON.stringify({
          canLink: false,
          reason: 'already_linked',
          message: `Your account is already connected to ${provider}.`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // All checks passed
    return new Response(
      JSON.stringify({
        canLink: true,
        message: 'Account can be linked'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({
        canLink: false,
        reason: 'error',
        message: error.message || 'Failed to validate account linking'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
