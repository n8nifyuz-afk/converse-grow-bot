import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userId: string;
  userEmail: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userEmail, userName }: WelcomeEmailRequest = await req.json();

    console.log(`Sending welcome email to user ${userId} at ${userEmail}`);

    // Render the React email template
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        userEmail,
        userName,
      })
    );

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "ChatL <no-reply@chatl.ai>",
      to: [userEmail],
      subject: "Welcome to ChatL - Your AI Assistant is Ready! 🎉",
      html,
      // Add these headers to improve deliverability
      headers: {
        "X-Entity-Ref-ID": userId,
      },
      // Add tags for tracking
      tags: [
        {
          name: "category",
          value: "welcome",
        },
      ],
    });

    if (emailResponse.error) {
      console.error("Error sending welcome email:", emailResponse.error);
      throw emailResponse.error;
    }

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
