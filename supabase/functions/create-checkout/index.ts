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

    const { priceId, isTrial } = await req.json();
    if (!priceId) throw new Error("Price ID is required");
    logStep("Price ID received", { priceId, isTrial });

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

    // Price IDs for Pro and Ultra Pro plans
    const proPriceId = 'price_1SKKdNL8Zm4LqDn4gBXwrsAq'; // €19.99/month
    const ultraPriceId = 'price_1SKJAxL8Zm4LqDn43kl9BRd8'; // €39.99/month
    
    const targetPlan = priceId === proPriceId ? 'pro' : 'ultra_pro';
    
    logStep("Price details", { 
      isTrial, 
      targetPlan, 
      requestedPriceId: priceId
    });

    // Check if user has already used a trial
    if (isTrial) {
      // Check trial_conversions table for any trial usage
      const { data: existingTrial, error: trialCheckError } = await supabaseClient
        .from('trial_conversions')
        .select('id, created_at')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (existingTrial) {
        logStep("User already used trial - blocking access", { 
          userId: user.id,
          existingTrialDate: existingTrial.created_at 
        });
        throw new Error("You have already used your free trial. Please select a paid plan.");
      }

      // Also check user_subscriptions for any past subscriptions (trial or paid)
      const { data: pastSubs, error: subCheckError } = await supabaseClient
        .from('user_subscriptions')
        .select('id, stripe_subscription_id')
        .eq('user_id', user.id)
        .not('stripe_subscription_id', 'is', null)
        .limit(1);

      if (pastSubs && pastSubs.length > 0) {
        logStep("User already has/had subscription - blocking trial access", { 
          userId: user.id,
          subscriptionCount: pastSubs.length 
        });
        throw new Error("You have already used your free trial. Please select a paid plan.");
      }

      logStep("Trial eligibility verified - user can proceed", { userId: user.id });
    }

    // Redirect to main site after payment
    const mainSite = "https://www.chatl.ai";
    
    // Always use subscription mode
    const sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId, // Always use the monthly subscription price
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${mainSite}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${mainSite}`,
      payment_method_types: ['card'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'any',
        },
      },
      automatic_tax: {
        enabled: true,
      },
      subscription_data: {
        metadata: {
          plan: targetPlan,
          user_id: user.id,
        }
      }
    };
    
    // For trials: add 3-day trial period + €0.99 upfront charge
    if (isTrial) {
      // Calculate renewal date (3 days from now)
      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + 3);
      const renewalDateStr = renewalDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      
      sessionConfig.subscription_data.trial_period_days = 3;
      sessionConfig.subscription_data.trial_settings = {
        end_behavior: {
          missing_payment_method: 'create_invoice', // Create invoice and attempt payment when trial ends
        }
      };
      
      // CRITICAL: Ensure payment method is saved for future billing
      sessionConfig.payment_method_collection = 'always';
      sessionConfig.subscription_data.payment_behavior = 'allow_incomplete'; // Allow incomplete payment for trial subscriptions
      
      // Add trial fee as a separate one-time line item charged immediately (EUR only)
      const trialAmount = 99; // €0.99 in cents
      
      sessionConfig.line_items.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: '3-Day Trial Access',
            description: `Trial access to ${targetPlan === 'pro' ? 'Pro' : 'Ultra Pro'} plan`
          },
          unit_amount: trialAmount,
        },
        quantity: 1,
      });
      
      // Get product ID from the price
      const priceDetails = await stripe.prices.retrieve(priceId);
      const trialProductId = typeof priceDetails.product === 'string' 
        ? priceDetails.product 
        : priceDetails.product.id;
      
      sessionConfig.subscription_data.metadata.is_trial = 'true';
      sessionConfig.subscription_data.metadata.target_plan = targetPlan;
      sessionConfig.subscription_data.metadata.trial_product_id = trialProductId;
      sessionConfig.subscription_data.metadata.trial_end_date = renewalDateStr;
      
      logStep("Creating subscription with 3-day trial", { 
        targetPlan, 
        trialCharge: '€0.99',
        monthlyPrice: priceId,
        renewalDate: renewalDateStr
      });
    } else {
      logStep("Creating regular subscription (no trial)", { 
        targetPlan, 
        monthlyPrice: priceId
      });
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, isTrial });

    // CRITICAL: Track trial immediately to prevent re-use
    if (isTrial) {
      try {
        const priceDetails = await stripe.prices.retrieve(priceId);
        const trialProductId = typeof priceDetails.product === 'string' 
          ? priceDetails.product 
          : priceDetails.product.id;
        
        const { error: trialError } = await supabaseClient
          .from('trial_conversions')
          .insert({
            user_id: user.id,
            trial_subscription_id: '', // Will be updated by webhook
            trial_product_id: trialProductId,
            target_plan: targetPlan,
            converted_at: null // Not converted yet
          });
        
        if (trialError) {
          logStep("WARNING: Failed to track trial immediately", { error: trialError.message });
        } else {
          logStep("Trial tracked immediately to prevent re-use", { userId: user.id });
        }
      } catch (trackError) {
        logStep("ERROR: Trial tracking failed", { error: trackError instanceof Error ? trackError.message : String(trackError) });
      }
    }

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
