import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create client with anon key to get current user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not found or not authenticated')
    }

    // First, cancel Stripe subscription if exists
    try {
      const { error: stripeError } = await supabaseAdmin.functions.invoke('delete-stripe-subscription', {
        body: {
          userId: user.id,
          userEmail: user.email
        }
      });
      
      if (stripeError) {
        console.error('Stripe cancellation error occurred');
      }
    } catch (stripeError) {
      console.error('Stripe cancellation failed');
      // Continue with account deletion even if Stripe cancellation fails
    }

    // Then, delete all user images from storage
    try {
      const { error: storageError } = await supabaseAdmin.functions.invoke('delete-all-user-images', {
        body: {
          userId: user.id
        }
      });
      
      if (storageError) {
        console.error('Storage cleanup error occurred');
      }
    } catch (storageError) {
      console.error('Storage cleanup failed');
      // Continue with account deletion even if storage cleanup fails
    }

    // Clean up ALL user data systematically
    console.log('Starting comprehensive user data cleanup', { userId: user.id });

    // 1. Delete usage limits
    const { error: usageLimitsError } = await supabaseAdmin
      .from('usage_limits')
      .delete()
      .eq('user_id', user.id);
    if (usageLimitsError) {
      console.error('Usage limits deletion error:', usageLimitsError);
    }

    // 2. Delete user subscriptions (fully remove, not just mark cancelled)
    const { error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .delete()
      .eq('user_id', user.id);
    if (subscriptionError) {
      console.error('Subscription deletion error:', subscriptionError);
    }

    // 3. Delete user roles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);
    if (rolesError) {
      console.error('User roles deletion error:', rolesError);
    }

    // 4. Delete image analyses
    const { error: imageAnalysesError } = await supabaseAdmin
      .from('image_analyses')
      .delete()
      .eq('user_id', user.id);
    if (imageAnalysesError) {
      console.error('Image analyses deletion error:', imageAnalysesError);
    }

    // 5. Delete message ratings
    const { error: ratingsError } = await supabaseAdmin
      .from('message_ratings')
      .delete()
      .eq('user_id', user.id);
    if (ratingsError) {
      console.error('Message ratings deletion error:', ratingsError);
    }

    // 6. Delete projects
    const { error: projectsError } = await supabaseAdmin
      .from('projects')
      .delete()
      .eq('user_id', user.id);
    if (projectsError) {
      console.error('Projects deletion error:', projectsError);
    }

    // 7. Delete token usage
    const { error: tokenError } = await supabaseAdmin
      .from('token_usage')
      .delete()
      .eq('user_id', user.id);
    if (tokenError) {
      console.error('Token usage deletion error:', tokenError);
    }

    // 8. Delete chats (messages will be cascade deleted)
    const { error: chatsError } = await supabaseAdmin
      .from('chats')
      .delete()
      .eq('user_id', user.id);
    if (chatsError) {
      console.error('Chats deletion error:', chatsError);
    }

    // 9. Delete profile (should be last before auth deletion)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', user.id);
    if (profileError) {
      console.error('Profile deletion error:', profileError);
    }

    console.log('User data cleanup completed', { userId: user.id });

    // Finally, delete the user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error('User deletion failed');
      throw new Error('Account deletion failed')
    }

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error('Account deletion failed', { requestId });
    return new Response(
      JSON.stringify({ 
        error: 'Unable to process request',
        requestId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})