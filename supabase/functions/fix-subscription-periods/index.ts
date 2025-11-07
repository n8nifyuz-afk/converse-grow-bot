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

    // Get all active subscriptions with expired or near-expired periods
    const { data: expiredSubs, error: fetchError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .lt('current_period_end', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredSubs?.length || 0} subscriptions with expired/near-expired periods`);

    const fixed = [];
    for (const sub of expiredSubs || []) {
      console.log(`Processing subscription:`, JSON.stringify(sub, null, 2));
      
      // Calculate new period_end as 1 month from created_at
      const createdAt = new Date(sub.created_at);
      const newPeriodEnd = new Date(createdAt);
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

      console.log(`Updating subscription ${sub.id} period_end from ${sub.current_period_end} to ${newPeriodEnd.toISOString()}`);

      // Update subscription
      const { data: updatedSub, error: updateSubError } = await supabaseClient
        .from('user_subscriptions')
        .update({ 
          current_period_end: newPeriodEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.id)
        .select()
        .single();

      if (updateSubError) {
        console.error(`Error updating subscription ${sub.id}:`, updateSubError);
        continue;
      }

      console.log(`Successfully updated subscription:`, JSON.stringify(updatedSub, null, 2));

      // Update usage_limits
      const { error: updateLimitError } = await supabaseClient
        .from('usage_limits')
        .update({ 
          period_end: newPeriodEnd.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', sub.user_id);

      if (updateLimitError) {
        console.error(`Error updating usage_limits for user ${sub.user_id}:`, updateLimitError);
      }

      fixed.push({
        user_id: sub.user_id,
        old_period_end: sub.current_period_end,
        new_period_end: newPeriodEnd.toISOString()
      });

      console.log(`Fixed subscription for user ${sub.user_id}: ${sub.current_period_end} -> ${newPeriodEnd.toISOString()}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        fixed_count: fixed.length,
        fixed_subscriptions: fixed
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fix-subscription-periods:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
