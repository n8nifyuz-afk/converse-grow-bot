import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { userId, activityType, browserInfo, deviceInfo, referrer, metadata } = await req.json()

    // Get IP address from request headers and clean it
    const rawIpAddress = req.headers.get('x-forwarded-for') || 
                         req.headers.get('x-real-ip') || 
                         'unknown'
    
    // Clean IP: take first IP from comma-separated list (real client IP)
    const ipAddress = rawIpAddress.split(',')[0].trim()

    // Fetch country from IP
    let country = null
    try {
      const ipResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`)
      if (ipResponse.ok) {
        const ipData = await ipResponse.json()
        country = ipData.country_code || null
      }
    } catch (error) {
      console.warn('Failed to fetch country from IP:', error)
    }

    // Insert activity log
    const { error: logError } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: userId,
        activity_type: activityType,
        ip_address: ipAddress,
        country: country,
        user_agent: browserInfo?.userAgent || req.headers.get('user-agent'),
        device_type: browserInfo?.device,
        browser: browserInfo?.browser,
        os: browserInfo?.os,
        screen_resolution: deviceInfo?.screenResolution,
        language: deviceInfo?.language,
        referrer: referrer,
        metadata: {
          browserInfo,
          deviceInfo,
          ...metadata
        }
      })

    if (logError) {
      console.error('Error logging activity:', logError)
      throw logError
    }

    // Update profile with browser and device info
    if (userId) {
      // First get current login count
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('login_count')
        .eq('user_id', userId)
        .single()

      const currentLoginCount = currentProfile?.login_count || 0

      // Update profile with incremented login count
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          browser_info: browserInfo,
          device_info: deviceInfo,
          ip_address: ipAddress,
          country: country,
          timezone: deviceInfo?.timezone,
          locale: deviceInfo?.language,
          last_login_at: new Date().toISOString(),
          login_count: currentLoginCount + 1
        })
        .eq('user_id', userId)

      if (profileError) {
        console.warn('Failed to update profile:', profileError)
      } else {
        console.log(`Updated profile for user ${userId} - login count: ${currentLoginCount + 1}`)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in log-user-activity:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
