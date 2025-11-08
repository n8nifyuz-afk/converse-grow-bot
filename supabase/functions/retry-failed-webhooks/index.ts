import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBHOOK-RETRY] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });

  try {
    logStep("Starting webhook retry process");

    const now = new Date().toISOString();

    // Find failed webhooks that are ready for retry
    const { data: failedWebhooks, error: fetchError } = await supabaseClient
      .from('webhook_attempts')
      .select('*')
      .eq('status', 'failed')
      .lte('next_retry_at', now)
      .lt('attempt_number', 5) // Max 5 attempts
      .order('next_retry_at', { ascending: true })
      .limit(50); // Process max 50 at a time

    if (fetchError) {
      logStep("ERROR: Failed to fetch webhooks", { error: fetchError.message });
      throw fetchError;
    }

    if (!failedWebhooks || failedWebhooks.length === 0) {
      logStep("No failed webhooks ready for retry");
      return new Response(
        JSON.stringify({ success: true, retriedCount: 0, message: "No webhooks to retry" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep(`Found ${failedWebhooks.length} webhooks to retry`);

    let successCount = 0;
    let failedCount = 0;
    const results = [];

    for (const webhook of failedWebhooks) {
      try {
        logStep(`Retrying webhook`, {
          eventId: webhook.stripe_event_id,
          eventType: webhook.event_type,
          attemptNumber: webhook.attempt_number + 1
        });

        // Mark as retrying
        await supabaseClient
          .from('webhook_attempts')
          .update({
            status: 'retrying',
            last_retry_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', webhook.id);

        // Call the stripe-webhook function with the original payload
        const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/stripe-webhook`;
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            'X-Retry-Attempt': 'true',
            'X-Original-Event-Id': webhook.stripe_event_id
          },
          body: JSON.stringify(webhook.request_payload)
        });

        if (response.ok) {
          // Success - update status
          await supabaseClient
            .from('webhook_attempts')
            .update({
              status: 'success',
              attempt_number: webhook.attempt_number + 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', webhook.id);

          successCount++;
          results.push({
            eventId: webhook.stripe_event_id,
            status: 'success',
            attempt: webhook.attempt_number + 1
          });

          logStep(`✅ Webhook retry successful`, {
            eventId: webhook.stripe_event_id,
            attemptNumber: webhook.attempt_number + 1
          });
        } else {
          // Failed again - update with new retry time
          const errorText = await response.text();
          const nextAttempt = webhook.attempt_number + 1;
          const maxReached = nextAttempt >= 5;

          await supabaseClient
            .from('webhook_attempts')
            .update({
              status: maxReached ? 'failed' : 'failed',
              attempt_number: nextAttempt,
              error_message: `Retry failed: ${errorText}`,
              next_retry_at: maxReached ? null : await calculateNextRetry(supabaseClient, nextAttempt),
              updated_at: new Date().toISOString()
            })
            .eq('id', webhook.id);

          failedCount++;
          results.push({
            eventId: webhook.stripe_event_id,
            status: 'failed',
            attempt: nextAttempt,
            maxReached
          });

          logStep(`❌ Webhook retry failed`, {
            eventId: webhook.stripe_event_id,
            attemptNumber: nextAttempt,
            maxReached,
            error: errorText
          });
        }
      } catch (retryError) {
        const errorMessage = retryError instanceof Error ? retryError.message : String(retryError);
        logStep(`ERROR: Exception during retry`, {
          eventId: webhook.stripe_event_id,
          error: errorMessage
        });

        // Update with error
        const nextAttempt = webhook.attempt_number + 1;
        await supabaseClient
          .from('webhook_attempts')
          .update({
            status: 'failed',
            attempt_number: nextAttempt,
            error_message: `Exception: ${errorMessage}`,
            next_retry_at: nextAttempt >= 5 ? null : await calculateNextRetry(supabaseClient, nextAttempt),
            updated_at: new Date().toISOString()
          })
          .eq('id', webhook.id);

        failedCount++;
        results.push({
          eventId: webhook.stripe_event_id,
          status: 'error',
          attempt: nextAttempt,
          error: errorMessage
        });
      }
    }

    logStep("Webhook retry process completed", {
      total: failedWebhooks.length,
      successful: successCount,
      failed: failedCount
    });

    return new Response(
      JSON.stringify({
        success: true,
        retriedCount: failedWebhooks.length,
        successCount,
        failedCount,
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function calculateNextRetry(supabaseClient: any, attemptNumber: number): Promise<string> {
  const { data, error } = await supabaseClient.rpc('calculate_next_retry', {
    p_attempt_number: attemptNumber
  });
  
  if (error || !data) {
    // Fallback calculation if RPC fails
    const minutes = Math.pow(3, attemptNumber - 1) * 5;
    return new Date(Date.now() + minutes * 60 * 1000).toISOString();
  }
  
  return data;
}
