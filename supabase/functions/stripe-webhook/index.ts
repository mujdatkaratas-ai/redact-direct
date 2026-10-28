// Redact Direct — Stripe webhook for server-side payment verification.
//
// Receives Stripe webhook events, verifies the signature, and on
// `checkout.session.completed` creates a redaction job idempotently
// using the Stripe session ID as the dedup key.
//
// The Stripe session metadata contains: email, service_id, description.
// The webhook creates the job with those details — never trusting
// browser URL parameters.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_ADDRESS = Deno.env.get("RESEND_FROM") ?? "Redact Direct <noreply@redactdirect.co.uk>";
const TEST_FROM = "Redact Direct <onboarding@resend.dev>";
const ADMIN_EMAIL = "admin@redactdirect.co.uk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const PRICES: Record<string, number> = {
  document: 7500, sar: 25000, complex: 50000, cctv: 1000, managed: 75000,
};
const SERVICE_LABELS: Record<string, string> = {
  document: "Document redaction", sar: "Full SAR redaction",
  complex: "Complex safeguarding SAR", cctv: "CCTV redaction", managed: "Fully managed SAR",
};

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!RESEND_API_KEY) return;
  for (const from of [FROM_ADDRESS, TEST_FROM]) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({ from, to: [to], reply_to: ADMIN_EMAIL, subject, html, text }),
      });
      if (res.ok) return;
      const body = await res.text();
      if (res.status === 403 && /not verified/i.test(body)) continue;
    } catch { /* best-effort */ }
  }
}

/** Verify the Stripe webhook signature. */
async function verifyStripeSignature(payload: string, signature: string): Promise<unknown | null> {
  if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY) return null;

  // Use Stripe API to verify the event by constructing it from the payload.
  // We'll use a simpler approach: fetch the event from Stripe using the event ID.
  // Actually, Stripe webhook verification requires the Stripe SDK or manual HMAC.
  // Let's do manual HMAC verification.

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(STRIPE_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

  const parts = signature.split(",");
  let timestamp = "";
  let v1Signature = "";
  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k === "t") timestamp = v;
    if (k === "v1") v1Signature = v;
  }

  if (!timestamp || !v1Signature) return null;

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSig = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedSigHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expectedSigHex !== v1Signature) return null;

  // Parse and return the event.
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const event = await verifyStripeSignature(payload, signature);
  if (!event) {
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const eventType = (event as Record<string, unknown>)?.type;
  const eventData = (event as Record<string, unknown>)?.data?.object as Record<string, unknown> ?? {};

  // ── checkout.session.completed ──
  if (eventType === "checkout.session.completed") {
    const sessionId = String(eventData.id ?? "");
    const paymentStatus = String(eventData.payment_status ?? "");
    const metadata = (eventData.metadata ?? {}) as Record<string, string>;
    const email = (metadata.email ?? "").trim().toLowerCase();
    const serviceId = metadata.service_id ?? "document";
    const description = metadata.description ?? "Payment confirmed via Stripe.";

    if (paymentStatus !== "paid") {
      return new Response(JSON.stringify({ received: true, skipped: "not paid" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!email || !sessionId) {
      return new Response(JSON.stringify({ error: "Missing email or session ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const pricePence = PRICES[serviceId] ?? 7500;
    const serviceLabel = SERVICE_LABELS[serviceId] ?? "Document redaction";
    const reference = `RD-${Date.now().toString().slice(-8)}`;

    // Idempotent insert: if a job with this stripe_session_id already exists, skip.
    const { data: existing } = await supabase
      .from("redact_jobs")
      .select("id")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (existing) {
      // Job already created — this is a duplicate webhook delivery.
      return new Response(JSON.stringify({ received: true, dedup: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data, error } = await supabase
      .from("redact_jobs")
      .insert({
        reference,
        email,
        service_type: serviceLabel,
        description,
        status: "pending",
        file_count: 0,
        price_pence: pricePence,
        paid: true,
        stripe_session_id: sessionId,
      })
      .select("*")
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: "Could not create job" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Notify admin.
    const subject = `New redaction enquiry: ${reference} (${email})`;
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:620px;margin:0 auto;padding:24px">
  <div style="border-left:4px solid #0f172a;padding:8px 16px;margin-bottom:20px">
    <div style="font-size:11px;color:#0f172a;font-weight:700;letter-spacing:1px;text-transform:uppercase">Redact Direct</div>
    <h2 style="margin:6px 0 0">${esc(subject)}</h2>
  </div>
  <table style="border-collapse:collapse;font-size:14px;margin:16px 0">
    <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Reference</td><td style="font-weight:600">${esc(reference)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Email</td><td style="font-weight:600">${esc(email)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Service</td><td style="font-weight:600">${esc(serviceLabel)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Price</td><td style="font-weight:600">£${(pricePence / 100).toFixed(2)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Payment</td><td style="font-weight:600">Stripe (session ${esc(sessionId)})</td></tr>
  </table>
  <p style="margin-top:20px">A new paid enquiry has been submitted. The customer will upload files through the portal.</p>
  <p style="color:#6b7280;font-size:13px;margin-top:28px">Redact Direct · ${esc(ADMIN_EMAIL)}</p>
  </body></html>`;
    const text = `${subject}\n\nReference: ${reference}\nEmail: ${email}\nService: ${serviceLabel}\nPrice: £${(pricePence / 100).toFixed(2)}\nPayment: Stripe (session ${sessionId})`;

    sendEmail(ADMIN_EMAIL, subject, html, text).catch(() => {});

    return new Response(JSON.stringify({ received: true, job_id: data.id }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ received: true, event_type: eventType }), {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
});
