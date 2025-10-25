import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WELCOME-EMAIL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const payload = await req.json();
    logStep("Received payload", { type: payload.type, record: payload.record?.email });

    // This function is triggered by Supabase Auth webhook
    // Expected payload: { type: "INSERT", record: { id, email, ... } }
    if (payload.type !== "INSERT") {
      logStep("Ignoring non-INSERT event");
      return new Response(JSON.stringify({ message: "Not an INSERT event" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, id } = payload.record;
    
    if (!email) {
      throw new Error("No email found in payload");
    }

    logStep("Sending welcome email", { email, userId: id });

    const emailResponse = await resend.emails.send({
      from: "ChatL <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to ChatL! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">Welcome to ChatL!</h1>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            Thank you for joining ChatL! We're excited to have you on board.
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
            You can now start using ChatL to:
          </p>
          
          <ul style="color: #555; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">
            <li>Chat with multiple AI models</li>
            <li>Generate and edit images</li>
            <li>Manage your conversations in projects</li>
            <li>And much more!</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://www.chatl.ai" 
               style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Get Started
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            If you have any questions or need help, feel free to reach out to our support team.
          </p>
          
          <p style="color: #888; font-size: 14px;">
            Best regards,<br>
            The ChatL Team
          </p>
        </div>
      `,
    });

    logStep("Email sent successfully", { emailId: emailResponse.id });

    return new Response(
      JSON.stringify({ 
        success: true,
        emailId: emailResponse.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
