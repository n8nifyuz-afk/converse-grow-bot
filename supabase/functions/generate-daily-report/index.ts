import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Optional API key check for security
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = Deno.env.get('DAILY_REPORT_API_KEY');
    
    if (expectedKey && apiKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get date range for "today"
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get date range for "yesterday"
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 1. User Statistics
    const { count: totalUsers } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: newUsersToday } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    const { count: newUsersYesterday } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    // 2. Subscription Statistics
    const { data: subscriptions } = await supabaseClient
      .from('user_subscriptions')
      .select('status, stripe_price_id, current_period_start, current_period_end');

    const activeSubscriptions = subscriptions?.filter(s => s.status === 'active') || [];
    const canceledSubscriptions = subscriptions?.filter(s => s.status === 'canceled') || [];
    const unpaidSubscriptions = subscriptions?.filter(s => s.status === 'unpaid') || [];

    // 3. Usage Statistics
    const { data: usageLimits } = await supabaseClient
      .from('usage_limits')
      .select('*');

    const totalImageGenerations = usageLimits?.reduce((sum, limit) => sum + (limit.current_usage || 0), 0) || 0;

    // 4. Message Statistics (token usage)
    const { data: tokenUsageToday } = await supabaseClient
      .from('token_usage')
      .select('tokens_used, model')
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    const totalTokensToday = tokenUsageToday?.reduce((sum, usage) => sum + (usage.tokens_used || 0), 0) || 0;

    const { data: tokenUsageYesterday } = await supabaseClient
      .from('token_usage')
      .select('tokens_used')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    const totalTokensYesterday = tokenUsageYesterday?.reduce((sum, usage) => sum + (usage.tokens_used || 0), 0) || 0;

    // 5. Image Generation Statistics
    const { count: imagesGeneratedToday } = await supabaseClient
      .from('generated_images')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    const { count: imagesGeneratedYesterday } = await supabaseClient
      .from('generated_images')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    // Generate report
    const report = {
      date: today.toISOString().split('T')[0],
      users: {
        total: totalUsers || 0,
        newToday: newUsersToday || 0,
        newYesterday: newUsersYesterday || 0,
        change: newUsersToday && newUsersYesterday 
          ? `${newUsersToday > newUsersYesterday ? '+' : ''}${newUsersToday - newUsersYesterday}`
          : 'N/A'
      },
      subscriptions: {
        active: activeSubscriptions.length,
        canceled: canceledSubscriptions.length,
        unpaid: unpaidSubscriptions.length,
        total: subscriptions?.length || 0,
        conversionRate: totalUsers 
          ? `${((activeSubscriptions.length / (totalUsers || 1)) * 100).toFixed(2)}%`
          : '0%'
      },
      usage: {
        totalImageGenerations,
        imagesGeneratedToday: imagesGeneratedToday || 0,
        imagesGeneratedYesterday: imagesGeneratedYesterday || 0,
        imageChange: imagesGeneratedToday && imagesGeneratedYesterday
          ? `${imagesGeneratedToday > imagesGeneratedYesterday ? '+' : ''}${imagesGeneratedToday - imagesGeneratedYesterday}`
          : 'N/A',
        totalTokensToday,
        totalTokensYesterday,
        tokenChange: totalTokensToday && totalTokensYesterday
          ? `${totalTokensToday > totalTokensYesterday ? '+' : ''}${totalTokensToday - totalTokensYesterday}`
          : 'N/A'
      },
      summary: `📊 Daily Report for ${today.toISOString().split('T')[0]}
      
👥 Users: ${totalUsers} total (${newUsersToday} new today)
💳 Subscriptions: ${activeSubscriptions.length} active, ${canceledSubscriptions.length} canceled
🖼️ Images: ${imagesGeneratedToday} generated today
💬 Tokens: ${totalTokensToday.toLocaleString()} used today
📈 Conversion Rate: ${totalUsers ? ((activeSubscriptions.length / totalUsers) * 100).toFixed(2) : 0}%`
    };

    return new Response(
      JSON.stringify(report),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating daily report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
