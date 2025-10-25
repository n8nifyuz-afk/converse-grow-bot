import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { Resend } from "https://esm.sh/resend@2.0.0"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

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

    // Get IP address from request headers
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown'

    // Fetch country from IP
    let country = null
    try {
      const ipResponse = await fetch(`https://ipapi.co/${ipAddress.split(',')[0]}/json/`)
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
        
        // Send welcome email on first login
        if (currentLoginCount + 1 === 1) {
          try {
            // Get user email
            const { data: authUser } = await supabase.auth.admin.getUserById(userId)
            const userEmail = authUser?.user?.email
            
            if (userEmail) {
              console.log('Sending welcome email to:', userEmail)
              
              await resend.emails.send({
                from: "ChatL <onboarding@resend.dev>",
                to: [userEmail],
                subject: "Welcome to ChatL - Your Account is Ready! 🎉",
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 40px 20px;">
                            <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                              <!-- Header -->
                              <tr>
                                <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to ChatL! 🎉</h1>
                                </td>
                              </tr>
                              
                              <!-- Content -->
                              <tr>
                                <td style="padding: 40px;">
                                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                                    Hi there,
                                  </p>
                                  
                                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                                    Thank you for joining <strong>ChatL</strong>! Your account has been successfully created and verified. 
                                  </p>
                                  
                                  <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                                    You can now access all our features:
                                  </p>
                                  
                                  <ul style="margin: 0 0 30px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: #333333;">
                                    <li>Chat with multiple AI models (ChatGPT, Claude, Gemini, and more)</li>
                                    <li>Generate and edit images with AI</li>
                                    <li>Voice conversations with AI</li>
                                    <li>Organize your chats with projects</li>
                                    <li>And much more!</li>
                                  </ul>
                                  
                                  <div style="text-align: center; margin: 30px 0;">
                                    <a href="https://www.chatl.ai" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                      Start Chatting Now
                                    </a>
                                  </div>
                                  
                                  <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                                    If you have any questions or need assistance, feel free to reach out to our support team.
                                  </p>
                                </td>
                              </tr>
                              
                              <!-- Footer -->
                              <tr>
                                <td style="padding: 30px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                                  <p style="margin: 0; font-size: 14px; color: #666666;">
                                    Best regards,<br>
                                    <strong>The ChatL Team</strong>
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </body>
                  </html>
                `,
              })
              
              console.log('Welcome email sent successfully')
            }
          } catch (emailError) {
            // Log but don't fail the request if email fails
            console.error('Failed to send welcome email:', emailError)
          }
        }
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
