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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Manual sync for user: ${user.id}`);

    // Get user's subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      console.error('No active subscription found:', subError);
      return new Response(
        JSON.stringify({ error: 'No active subscription found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Current subscription:', JSON.stringify(subscription, null, 2));

    // Calculate correct period_end as 1 month from creation
    const createdAt = new Date(subscription.created_at);
    const correctPeriodEnd = new Date(createdAt);
    correctPeriodEnd.setMonth(correctPeriodEnd.getMonth() + 1);

    console.log(`Correcting period_end from ${subscription.current_period_end} to ${correctPeriodEnd.toISOString()}`);

    // Update subscription with correct period_end
    const { error: updateSubError } = await supabaseClient
      .from('user_subscriptions')
      .update({
        current_period_end: correctPeriodEnd.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateSubError) {
      console.error('Failed to update subscription:', updateSubError);
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine image limit based on plan
    const imageLimit = subscription.plan === 'ultra_pro' ? 2000 : subscription.plan === 'pro' ? 500 : 0;

    // Update or create usage_limits
    const { error: limitsError } = await supabaseClient
      .from('usage_limits')
      .upsert({
        user_id: user.id,
        period_start: createdAt.toISOString(),
        period_end: correctPeriodEnd.toISOString(),
        image_generations_limit: imageLimit,
        image_generations_used: 0, // Reset on sync
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (limitsError) {
      console.error('Failed to update usage limits:', limitsError);
      return new Response(
        JSON.stringify({ error: 'Failed to update usage limits' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully synced subscription and usage limits');

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          plan: subscription.plan,
          period_end: correctPeriodEnd.toISOString()
        },
        limits: {
          used: 0,
          limit: imageLimit,
          remaining: imageLimit
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manual-sync-subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
