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
    console.log('[ADMIN-BLOCK-USER] Function invoked');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the requesting user's auth header
    const authHeader = req.headers.get('Authorization');
    console.log('[ADMIN-BLOCK-USER] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Extract JWT token from "Bearer <token>" format
    const token = authHeader.replace('Bearer ', '');
    console.log('[ADMIN-BLOCK-USER] Token extracted, length:', token.length);

    // Verify the JWT token and get user using service role
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    console.log('[ADMIN-BLOCK-USER] User verification result:', { 
      hasUser: !!user, 
      hasError: !!userError,
      userId: user?.id 
    });
    
    if (userError || !user) {
      console.error('[ADMIN-BLOCK-USER] User error:', userError);
      throw new Error('Unauthorized');
    }

    // Check if user is admin using service role client
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    console.log('[ADMIN-BLOCK-USER] Admin check result:', { 
      hasAdminRole: !!adminRole, 
      hasError: !!roleError 
    });

    if (roleError || !adminRole) {
      console.error('[ADMIN-BLOCK-USER] Role error:', roleError);
      throw new Error('Admin access required');
    }

    const { userId, blocked } = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    console.log(`Admin ${user.id} ${blocked ? 'blocking' : 'unblocking'} user ${userId}`);

    // Update blocked status using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ blocked })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating blocked status:', error);
      throw error;
    }

    console.log(`User ${userId} ${blocked ? 'blocked' : 'unblocked'} successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${blocked ? 'blocked' : 'unblocked'} successfully`,
        data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-block-user:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
