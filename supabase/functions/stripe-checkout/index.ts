// Redact Direct — Stripe checkout for one-time per-job payments.
//
// Body: { action: 'create-checkout-session', service_id, email, description }
//   Creates a Stripe Checkout Session for the selected service tier.
//   Returns the checkout URL the client redirects to.
//
// Body: { action: 'status' }
//   Returns whether Stripe is configured and the available price IDs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

// Price IDs for each service tier.
const PRICE_IDS: Record<string, string> = {
  document: "price_1UV90mD8BaLTPam5fzRKrHtE",
  sar: "price_1UV92GD8BaLTPam5A8KfhEG4",
  complex: "price_1UV93LD8BaLTPam5hDeiVlwL",
  managed: "price_1UV94hD8BaLTPam5AicpOhhA",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const action = String(body.action ?? "");

  if (action === "status") {
    return json({
      ok: true,
      stripe_ready: !!STRIPE_SECRET_KEY,
      price_ids: PRICE_IDS,
    });
  }

  if (action === "create-checkout-session") {
    if (!STRIPE_SECRET_KEY) {
      return json({ ok: false, error: "Stripe not configured" }, 503);
    }

    const serviceId = String(body.service_id ?? "");
    const email = String(body.email ?? "").trim();
    const description = String(body.description ?? "").trim();

    const priceId = PRICE_IDS[serviceId];
    if (!priceId) {
      return json({ ok: false, error: `Unknown service: ${serviceId}` }, 400);
    }
    if (!email) {
      return json({ ok: false, error: "Email is required" }, 400);
    }

    // Create the Stripe Checkout Session.
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "customer_email": email,
        "metadata[service_id]": serviceId,
        "metadata[description]": description.slice(0, 500),
        "metadata[email]": email,
        "success_url": `${body.success_url ?? "https://redactdirect.co.uk/portal?status=success"}`,
        "cancel_url": `${body.cancel_url ?? "https://redactdirect.co.uk/portal?status=cancelled"}`,
      }).toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      return json({ ok: false, error: data.error?.message ?? "Checkout failed" }, 500);
    }

    return json({ ok: true, url: data.url, session_id: data.id });
  }

  return json({ error: `Unknown action: ${action}` }, 400);
});
