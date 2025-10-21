import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError) {
      logStep("Auth error", { error: authError.message });
      throw new Error(`Authentication failed: ${authError.message}`);
    }
    
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { priceId } = await req.json();
    if (!priceId) throw new Error("Price ID is required");
    logStep("Price ID received", { priceId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });
    
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    let customerCurrency = "eur"; // Default to EUR
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
      
      // Check if customer has any active subscriptions
      const activeSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 10,
      });
      
      if (activeSubscriptions.data.length > 0) {
        logStep("Active subscription found - blocking checkout", { 
          subscriptionCount: activeSubscriptions.data.length 
        });
        throw new Error("You already have an active subscription. Please cancel your current plan before upgrading. Refunds are calculated on a prorated daily basis.");
      }
      
      // Detect customer's existing currency from past invoices or subscriptions
      try {
        const invoices = await stripe.invoices.list({
          customer: customerId,
          limit: 1,
        });
        
        if (invoices.data.length > 0) {
          customerCurrency = invoices.data[0].currency;
          logStep("Detected customer currency from invoices", { currency: customerCurrency });
        } else {
          // Check from past subscriptions (including canceled ones)
          const pastSubscriptions = await stripe.subscriptions.list({
            customer: customerId,
            limit: 1,
          });
          
          if (pastSubscriptions.data.length > 0) {
            customerCurrency = pastSubscriptions.data[0].currency;
            logStep("Detected customer currency from subscriptions", { currency: customerCurrency });
          }
        }
        
        // Retrieve price details to check currency
        logStep("Retrieving price details", { priceId });
        const priceDetails = await stripe.prices.retrieve(priceId);
        logStep("Price details retrieved", { 
          priceCurrency: priceDetails.currency, 
          priceAmount: priceDetails.unit_amount,
          recurring: priceDetails.recurring 
        });
        
        // If customer has different currency, create a new customer
        if (customerCurrency.toLowerCase() !== priceDetails.currency.toLowerCase()) {
          logStep("Currency mismatch detected, creating new customer", { 
            existingCurrency: customerCurrency, 
            newCurrency: priceDetails.currency 
          });
          
          // Don't use the existing customer - let Stripe create a new one
          customerId = undefined;
        }
      } catch (currencyCheckError) {
        logStep("Error during currency check", { 
          error: currencyCheckError instanceof Error ? currencyCheckError.message : String(currencyCheckError) 
        });
        // If currency check fails, continue without it
        // The checkout will still work, just might have currency issues
      }
    } else {
      logStep("No existing customer, will create during checkout");
    }

    // Redirect to main site after payment
    const mainSite = "https://www.chatl.ai";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${mainSite}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${mainSite}`,
      payment_method_types: ['card', 'apple_pay', 'revolut_pay'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'any',
        },
      },
    });
    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
