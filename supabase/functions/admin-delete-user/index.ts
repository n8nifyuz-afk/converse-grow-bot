import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    console.log('[ADMIN-DELETE-USER] Function invoked');
    
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
    console.log('[ADMIN-DELETE-USER] Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Extract JWT token from "Bearer <token>" format
    const token = authHeader.replace('Bearer ', '');
    console.log('[ADMIN-DELETE-USER] Token extracted, length:', token.length);

    // Verify the JWT token and get user using service role
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    console.log('[ADMIN-DELETE-USER] User verification result:', { 
      hasUser: !!user, 
      hasError: !!userError,
      userId: user?.id 
    });
    
    if (userError || !user) {
      console.error('[ADMIN-DELETE-USER] User error:', userError);
      throw new Error('Unauthorized');
    }

    // Check if user is admin using service role client
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    console.log('[ADMIN-DELETE-USER] Admin check result:', { 
      hasAdminRole: !!adminRole, 
      hasError: !!roleError 
    });

    if (roleError || !adminRole) {
      console.error('[ADMIN-DELETE-USER] Role error:', roleError);
      throw new Error('Admin access required');
    }

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      throw new Error('Cannot delete your own account');
    }

    console.log(`Admin ${user.id} deleting user ${userId}`);

    // STEP 1: Get user info before deletion (for logging)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, display_name')
      .eq('user_id', userId)
      .maybeSingle();

    // STEP 2: Get subscription info before deletion
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('plan, status, stripe_subscription_id, current_period_end')
      .eq('user_id', userId)
      .maybeSingle();

    console.log(`Deleting user ${userId}:`, {
      email: profile?.email,
      name: profile?.display_name,
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        stripe_id: subscription.stripe_subscription_id,
        period_end: subscription.current_period_end
      } : 'No subscription'
    });

    // STEP 3: Delete from all related tables manually
    const tables = [
      'message_ratings',
      'messages', 
      'image_analyses',
      'chats',
      'projects',
      'usage_limits',
      'user_subscriptions',
      'user_roles',
      'token_usage',
      'profiles'
    ];

    for (const table of tables) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        console.log(`Error deleting from ${table}:`, error.message);
      } else {
        console.log(`Deleted from ${table}`);
      }
    }

    // STEP 4: Delete from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      throw deleteError;
    }

    console.log(`User ${userId} deleted successfully (had ${subscription?.plan || 'free'} plan)`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully',
        deletedUser: {
          email: profile?.email,
          plan: subscription?.plan || 'free',
          hadActiveSubscription: subscription?.status === 'active'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-delete-user:', error);
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
