// Redact Direct — Secure Portal API (v2)
//
// Email-verified, session-based access. No access tokens returned to the client.
// All job/file/pack operations require a valid session token + email ownership.
//
// Actions:
//   { action: 'request-code', email }
//     → Generates a 6-digit code, emails it, rate-limits (3 per 10 min).
//     → Generic response regardless of whether the email exists.
//
//   { action: 'verify-code', email, code }
//     → Verifies the code, creates a session, returns { session_token, expires_at }.
//     → Rate-limits verification attempts (5 per 10 min).
//
//   { action: 'load-jobs', session_token }
//     → Returns jobs for the session's email. No access_tokens in response.
//
//   { action: 'load-job', session_token, job_id }
//     → Returns job + files + packs (verifies email ownership).
//
//   { action: 'upload-file', session_token, job_id, file_name, file_data, content_type }
//     → Verifies ownership, uploads file to storage, records it.
//
//   { action: 'delete-file', session_token, file_id }
//     → Verifies ownership, deletes file.
//
//   { action: 'download-pack', session_token, pack_id }
//     → Verifies ownership, returns short-lived signed download URL.
//
//   { action: 'sign-out', session_token }
//     → Deletes the session.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_ADDRESS = Deno.env.get("RESEND_FROM") ?? "Redact Direct <noreply@redactdirect.co.uk>";
const TEST_FROM = "Redact Direct <onboarding@resend.dev>";
const ADMIN_EMAIL = "admin@redactdirect.co.uk";
const BUCKET = "redact-files";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const CODE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CODE_REQUESTS = 3;
const MAX_VERIFY_ATTEMPTS = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!RESEND_API_KEY) return { ok: false, error: "RESEND_API_KEY not set" };
  for (const from of [FROM_ADDRESS, TEST_FROM]) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({ from, to: [to], reply_to: ADMIN_EMAIL, subject, html, text }),
      });
      if (res.ok) return { ok: true };
      const body = await res.text();
      if (res.status === 403 && /not verified/i.test(body)) continue;
      return { ok: false, error: body.slice(0, 200) };
    } catch (e) {
      return { ok: false, error: String(e).slice(0, 200) };
    }
  }
  return { ok: false, error: "Both senders failed" };
}

/** Verify a session token and return the email, or null if invalid/expired. */
async function verifySession(token: string): Promise<string | null> {
  if (!token) return null;
  const { data, error } = await supabase
    .from("redact_sessions")
    .select("email, session_expires_at, verified")
    .eq("session_token", token)
    .maybeSingle();
  if (error || !data) return null;
  if (!data.verified) return null;
  if (new Date(data.session_expires_at) < new Date()) return null;
  return data.email as string;
}

/** Verify that the session email owns the job. */
async function verifyJobOwnership(jobId: string, email: string): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("redact_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("email", email)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

const PRICES: Record<string, number> = {
  document: 7500, sar: 25000, complex: 50000, cctv: 1000, managed: 75000,
};
const SERVICE_LABELS: Record<string, string> = {
  document: "Document redaction", sar: "Full SAR redaction",
  complex: "Complex safeguarding SAR", cctv: "CCTV redaction", managed: "Fully managed SAR",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const action = String(body.action ?? "");

  // ── request-code ──
  if (action === "request-code") {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return json({ ok: false, error: "A valid email is required" }, 400);
    }

    // Rate limit: count requests in the last 10 minutes.
    const tenMinAgo = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const { count } = await supabase
      .from("redact_sessions")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", tenMinAgo);

    if ((count ?? 0) >= MAX_CODE_REQUESTS) {
      return json({ ok: false, error: "Too many requests. Please try again later." }, 429);
    }

    const code = generateCode();
    const codeExpiresAt = new Date(Date.now() + CODE_DURATION_MS).toISOString();
    const sessionToken = generateToken();
    const sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    // Create a new session row (unverified until code is entered).
    const { error: insertErr } = await supabase.from("redact_sessions").insert({
      email,
      session_token: sessionToken,
      code_hash: code, // Store the code directly (service role only; RLS blocks client access).
      code_expires_at: codeExpiresAt,
      code_used: false,
      code_attempts: 0,
      code_requests: (count ?? 0) + 1,
      first_request_at: new Date().toISOString(),
      verified: false,
      session_expires_at: sessionExpiresAt,
    });

    if (insertErr) {
      return json({ ok: false, error: "Could not send verification code" }, 500);
    }

    // Email the code. Best-effort — never reveal whether the email has an account.
    const subject = "Your Redact Direct verification code";
    const emailHtml = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:480px;margin:0 auto;padding:24px">
  <div style="border-left:4px solid #0f172a;padding:8px 16px;margin-bottom:20px">
    <div style="font-size:11px;color:#0f172a;font-weight:700;letter-spacing:1px;text-transform:uppercase">Redact Direct</div>
    <h2 style="margin:6px 0 0">Verification code</h2>
  </div>
  <p style="font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;margin:24px 0">${esc(code)}</p>
  <p style="text-align:center;color:#6b7280;font-size:14px">This code expires in 10 minutes.</p>
  <p style="text-align:center;color:#6b7280;font-size:14px;margin-top:8px">If you did not request this code, you can safely ignore this email.</p>
  </body></html>`;
    const emailText = `Redact Direct — Your verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`;

    sendEmail(email, subject, emailHtml, emailText).catch(() => {});

    // Generic response — never reveal whether the email has an account.
    return json({ ok: true, message: "If an account exists for that email, a verification code has been sent." });
  }

  // ── verify-code ──
  if (action === "verify-code") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const code = String(body.code ?? "").trim();
    if (!email || !code) {
      return json({ ok: false, error: "Email and code are required" }, 400);
    }

    // Find the most recent unverified session for this email with an unexpired code.
    const { data: session, error: sessionErr } = await supabase
      .from("redact_sessions")
      .select("*")
      .eq("email", email)
      .eq("verified", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionErr || !session) {
      return json({ ok: false, error: "Invalid or expired code" }, 400);
    }

    // Rate limit verification attempts.
    if ((session.code_attempts ?? 0) >= MAX_VERIFY_ATTEMPTS) {
      return json({ ok: false, error: "Too many attempts. Please request a new code." }, 429);
    }

    // Check if the code has expired.
    if (new Date(session.code_expires_at) < new Date()) {
      return json({ ok: false, error: "Code expired. Please request a new one." }, 400);
    }

    // Increment attempts.
    await supabase
      .from("redact_sessions")
      .update({ code_attempts: (session.code_attempts ?? 0) + 1 })
      .eq("id", session.id);

    // Verify the code.
    if (session.code_hash !== code) {
      return json({ ok: false, error: "Invalid code" }, 400);
    }

    // Mark as verified and set session expiry.
    const sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
    await supabase
      .from("redact_sessions")
      .update({
        verified: true,
        code_used: true,
        code_hash: null, // Don't keep the code after verification.
        session_expires_at: sessionExpiresAt,
      })
      .eq("id", session.id);

    return json({
      ok: true,
      session_token: session.session_token,
      expires_at: sessionExpiresAt,
      email,
    });
  }

  // ── sign-out ──
  if (action === "sign-out") {
    const token = String(body.session_token ?? "");
    if (token) {
      await supabase.from("redact_sessions").delete().eq("session_token", token);
    }
    return json({ ok: true });
  }

  // ── All remaining actions require a valid session ──
  const sessionToken = String(body.session_token ?? "");
  const sessionEmail = await verifySession(sessionToken);
  if (!sessionEmail) {
    return json({ ok: false, error: "Session expired or invalid. Please sign in again." }, 401);
  }

  // ── load-jobs ──
  if (action === "load-jobs") {
    const { data, error } = await supabase
      .from("redact_jobs")
      .select("id, reference, email, service_type, description, status, file_count, price_pence, paid, stripe_session_id, created_at")
      .eq("email", sessionEmail)
      .order("created_at", { ascending: false });

    if (error) return json({ ok: false, error: error.message }, 500);

    return json({ ok: true, jobs: data ?? [], email: sessionEmail });
  }

  // ── load-job ──
  if (action === "load-job") {
    const jobId = String(body.job_id ?? "").trim();
    if (!jobId) return json({ ok: false, error: "Job ID required" }, 400);

    const job = await verifyJobOwnership(jobId, sessionEmail);
    if (!job) return json({ ok: false, error: "Job not found" }, 404);

    const [filesRes, packsRes] = await Promise.all([
      supabase.from("redact_files").select("*").eq("job_id", jobId).order("uploaded_at", { ascending: false }),
      supabase.from("redact_packs").select("*").eq("job_id", jobId).order("uploaded_at", { ascending: false }),
    ]);

    return json({
      ok: true,
      job: {
        id: job.id, reference: job.reference, email: job.email,
        service_type: job.service_type, description: job.description,
        status: job.status, file_count: job.file_count,
        price_pence: job.price_pence, paid: job.paid,
        created_at: job.created_at,
      },
      files: filesRes.data ?? [],
      packs: packsRes.data ?? [],
    });
  }

  // ── upload-file ──
  if (action === "upload-file") {
    const jobId = String(body.job_id ?? "").trim();
    const fileName = String(body.file_name ?? "").trim();
    const fileData = String(body.file_data ?? "");
    const contentType = String(body.content_type ?? "application/octet-stream");

    if (!jobId || !fileName || !fileData) {
      return json({ ok: false, error: "Job ID, file name, and file data required" }, 400);
    }

    const job = await verifyJobOwnership(jobId, sessionEmail);
    if (!job) return json({ ok: false, error: "Access denied" }, 403);

    const storagePath = `${jobId}/${Date.now()}-${fileName}`;

    let fileBytes: Uint8Array;
    try {
      const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, "");
      fileBytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));
    } catch {
      return json({ ok: false, error: "Invalid file data" }, 400);
    }

    const { error: upErr } = await supabase
      .storage.from(BUCKET).upload(storagePath, fileBytes, { contentType, upsert: false });

    if (upErr) return json({ ok: false, error: "Could not upload the file" }, 500);

    const { error: fileErr } = await supabase
      .from("redact_files")
      .insert({ job_id: jobId, file_name: fileName, storage_path: storagePath, file_size: fileBytes.byteLength });

    if (fileErr) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return json({ ok: false, error: "Could not record the file" }, 500);
    }

    await supabase
      .from("redact_jobs")
      .update({ file_count: (job.file_count ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    return json({ ok: true, file_name: fileName, file_size: fileBytes.byteLength });
  }

  // ── delete-file ──
  if (action === "delete-file") {
    const fileId = String(body.file_id ?? "").trim();
    if (!fileId) return json({ ok: false, error: "File ID required" }, 400);

    const { data: file } = await supabase
      .from("redact_files").select("*").eq("id", fileId).maybeSingle();
    if (!file) return json({ ok: false, error: "File not found" }, 404);

    const job = await verifyJobOwnership(file.job_id, sessionEmail);
    if (!job) return json({ ok: false, error: "Access denied" }, 403);

    await supabase.storage.from(BUCKET).remove([file.storage_path]);
    await supabase.from("redact_files").delete().eq("id", fileId);
    await supabase
      .from("redact_jobs")
      .update({ file_count: Math.max(0, (job.file_count ?? 0) - 1), updated_at: new Date().toISOString() })
      .eq("id", job.id);

    return json({ ok: true });
  }

  // ── download-pack ──
  if (action === "download-pack") {
    const packId = String(body.pack_id ?? "").trim();
    if (!packId) return json({ ok: false, error: "Pack ID required" }, 400);

    const { data: pack } = await supabase
      .from("redact_packs").select("*").eq("id", packId).maybeSingle();
    if (!pack) return json({ ok: false, error: "Pack not found" }, 404);

    const job = await verifyJobOwnership(pack.job_id, sessionEmail);
    if (!job) return json({ ok: false, error: "Access denied" }, 403);

    const { data: urlData, error: urlErr } = await supabase
      .storage.from(BUCKET).createSignedUrl(pack.storage_path, 60);

    if (urlErr || !urlData?.signedUrl) {
      return json({ ok: false, error: "Could not create download link" }, 500);
    }

    await supabase
      .from("redact_packs")
      .update({ download_count: (pack.download_count ?? 0) + 1, last_downloaded_at: new Date().toISOString() })
      .eq("id", packId);

    return json({ ok: true, url: urlData.signedUrl });
  }

  return json({ ok: false, error: `Unknown action: ${action}` }, 400);
});
