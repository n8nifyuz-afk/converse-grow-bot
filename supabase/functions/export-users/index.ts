import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get user from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: adminRole, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !adminRole) {
      throw new Error("Access denied: Admin privileges required");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" }) : null;

    // Fetch all profiles (represents all users)
    const { data: profiles, error: profilesError } = await supabaseClient
      .from("profiles")
      .select("user_id, email, display_name, signup_method, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    // Fetch all subscriptions
    const { data: subscriptions, error: subsError } = await supabaseClient
      .from("user_subscriptions")
      .select("user_id, plan, plan_name, stripe_customer_id, status");

    if (subsError) console.error("Error fetching subscriptions:", subsError);

    // Create a map of user subscriptions
    const subscriptionMap = new Map(
      subscriptions?.map(sub => [sub.user_id, sub]) || []
    );

    // Fetch Stripe customer data for spending information
    const userDataWithSpending = await Promise.all(
      profiles.map(async (profile) => {
        const subscription = subscriptionMap.get(profile.user_id);
        let totalSpent = 0;

        // Get total spending from Stripe if customer exists
        if (stripe && subscription?.stripe_customer_id) {
          try {
            const charges = await stripe.charges.list({
              customer: subscription.stripe_customer_id,
              limit: 100,
            });
            totalSpent = charges.data.reduce((sum: number, charge: any) => {
              if (charge.status === "succeeded") {
                return sum + (charge.amount / 100); // Convert cents to dollars
              }
              return sum;
            }, 0);
          } catch (error) {
            console.error(`Error fetching charges for ${subscription.stripe_customer_id}:`, error);
          }
        }

        return {
          username: profile.display_name || "N/A",
          email: profile.email || "N/A",
          login_method: profile.signup_method || "email",
          plan: subscription?.status === "active" ? (subscription.plan_name || subscription.plan || "Free") : "Free",
          total_spent: totalSpent.toFixed(2),
          created_at: new Date(profile.created_at).toISOString().split('T')[0], // YYYY-MM-DD format
        };
      })
    );

    // Create Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(
      userDataWithSpending.map(user => ({
        "Username": user.username,
        "Email": user.email,
        "Login Method": user.login_method,
        "Plan": user.plan,
        "Total Spent (EUR)": user.total_spent,
        "Account Created": user.created_at
      }))
    );

    // Set column widths for better readability
    worksheet["!cols"] = [
      { wch: 25 }, // Username
      { wch: 35 }, // Email
      { wch: 15 }, // Login Method
      { wch: 15 }, // Plan
      { wch: 18 }, // Total Spent
      { wch: 18 }  // Account Created
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    // Generate XLSX file
    const xlsxBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new Response(xlsxBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="users_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });

  } catch (error) {
    console.error("Error exporting users:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
