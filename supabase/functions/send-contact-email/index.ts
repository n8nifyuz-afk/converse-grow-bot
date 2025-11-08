import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received contact form submission");
    
    const { name, email, subject, message }: ContactEmailRequest = await req.json();

    console.log(`Processing contact form from: ${email}`);

    // Send email to support team
    const supportEmailResponse = await resend.emails.send({
      from: "ChatL Contact Form <no-reply@chatl.ai>",
      reply_to: email, // Allow direct reply to the user
      to: ["support@chatl.ai"],
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">New Contact Form Submission</h2>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
            <p style="margin: 5px 0;"><strong>From:</strong> ${name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6; color: #555;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888;">
            <p>To reply to this message, simply reply to this email. Your response will be sent directly to ${email}</p>
          </div>
        </div>
      `,
    });

    console.log("Support email sent successfully:", supportEmailResponse);

    // Send confirmation email to user
    const userConfirmationResponse = await resend.emails.send({
      from: "ChatL Support <no-reply@chatl.ai>",
      to: [email],
      subject: "We received your message!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Thank you for contacting us, ${name}!</h2>
          
          <p style="line-height: 1.6; color: #555;">We have received your message and our team will get back to you as soon as possible, usually within 24 hours.</p>
          
          <div style="margin: 20px 0; padding: 15px; background-color: #f0f0f0; border-left: 4px solid #4F46E5; border-radius: 4px;">
            <p style="margin: 5px 0; color: #666;"><strong>Your message:</strong></p>
            <p style="white-space: pre-wrap; line-height: 1.6; color: #555; margin-top: 10px;">${message}</p>
          </div>
          
          <p style="line-height: 1.6; color: #555;">Best regards,<br><strong>The ChatL Team</strong></p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888;">
            <p>This is an automated confirmation. Please do not reply to this email. If you need immediate assistance, contact us at support@chatl.ai</p>
          </div>
        </div>
      `,
    });

    console.log("User confirmation email sent successfully:", userConfirmationResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully" 
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
    console.error("Error in send-contact-email function:", error);
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
