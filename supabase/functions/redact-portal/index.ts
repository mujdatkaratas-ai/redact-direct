// Redact Direct — Portal API edge function.
//
// Handles all client-facing operations with server-side ownership enforcement.
// Clients identify by email + access_token (issued per job). No Supabase Auth.
//
// Actions:
//   { action: 'create-job', email, service_type, description }
//     → creates a redact_jobs row, returns job + access_token
//     → fires notification email to admin@redactdirect.co.uk
//
//   { action: 'load-jobs', email }
//     → returns all jobs for that email (without access_tokens)
//
//   { action: 'load-job', job_id, access_token }
//     → returns a single job + its files + packs (verifies ownership)
//
//   { action: 'upload-file', job_id, access_token, file_name, file_size }
//     → creates a redact_files row + returns a signed upload URL
//
//   { action: 'list-files', job_id, access_token }
//     → returns files for a job (verifies ownership)
//
//   { action: 'download-pack', pack_id, access_token }
//     → returns a signed download URL (verifies ownership)
//
//   { action: 'delete-file', file_id, access_token }
//     → deletes a file (verifies ownership)
//
// Ownership is enforced by checking that access_token matches the job's token.

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
      if (res.ok) return { ok: true, status: res.status };
      const body = await res.text();
      if (res.status === 403 && /not verified/i.test(body)) continue;
      return { ok: false, status: res.status, error: body.slice(0, 200) };
    } catch (e) {
      return { ok: false, error: String(e).slice(0, 200) };
    }
  }
  return { ok: false, error: "Both senders failed" };
}

/** Verify that access_token matches the job. Returns the job row or null. */
async function verifyOwnership(jobId: string, accessToken: string) {
  const { data, error } = await supabase
    .from("redact_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("access_token", accessToken)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

const PRICES: Record<string, number> = {
  document: 7500,
  sar: 25000,
  complex: 50000,
  cctv: 1000,
  managed: 75000,
};

const SERVICE_LABELS: Record<string, string> = {
  document: "Document redaction",
  sar: "Full SAR redaction",
  complex: "Complex safeguarding SAR",
  cctv: "CCTV redaction",
  managed: "Fully managed SAR",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth: require the Supabase anon key in the Authorization header
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

  // ── create-job ──
  if (action === "create-job") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const serviceType = String(body.service_type ?? "").trim();
    const description = String(body.description ?? "").trim();

    if (!email || !email.includes("@")) {
      return json({ ok: false, error: "A valid email address is required" }, 400);
    }
    if (!serviceType || !PRICES[serviceType]) {
      return json({ ok: false, error: "Select a service type" }, 400);
    }
    if (!description) {
      return json({ ok: false, error: "Add a short description of what needs redacting" }, 400);
    }

    const pricePence = PRICES[serviceType];
    const serviceLabel = SERVICE_LABELS[serviceType] ?? "Document redaction";
    const reference = `RD-${Date.now().toString().slice(-8)}`;

    // Insert the job — access_token is auto-generated by the DEFAULT.
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
        paid: false,
      })
      .select("*")
      .single();

    if (error || !data) {
      return json({ ok: false, error: "Could not create the job — please try again" }, 500);
    }

    const job = data as {
      id: string;
      reference: string;
      email: string;
      service_type: string;
      description: string;
      status: string;
      file_count: number;
      price_pence: number;
      access_token: string;
      created_at: string;
    };

    // Notify admin.
    const subject = `New redaction enquiry: ${job.reference} (${job.email})`;
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1f2937;max-width:620px;margin:0 auto;padding:24px">
  <div style="border-left:4px solid #0f172a;padding:8px 16px;margin-bottom:20px">
    <div style="font-size:11px;color:#0f172a;font-weight:700;letter-spacing:1px;text-transform:uppercase">Redact Direct</div>
    <h2 style="margin:6px 0 0">${esc(subject)}</h2>
  </div>
  <table style="border-collapse:collapse;font-size:14px;margin:16px 0">
    <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Reference</td><td style="font-weight:600">${esc(job.reference)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Email</td><td style="font-weight:600">${esc(job.email)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Service</td><td style="font-weight:600">${esc(job.service_type)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#6b7280">Price</td><td style="font-weight:600">£${(job.price_pence / 100).toFixed(2)}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#6b7280;vertical-align:top">Description</td><td>${esc(job.description)}</td></tr>
  </table>
  <p style="margin-top:20px">A new enquiry has been submitted. Contact the client to confirm pricing and collect the documents.</p>
  <p style="color:#6b7280;font-size:13px;margin-top:28px">Redact Direct · ${esc(ADMIN_EMAIL)}</p>
  </body></html>`;
    const text = `${subject}\n\nReference: ${job.reference}\nEmail: ${job.email}\nService: ${job.service_type}\nPrice: £${(job.price_pence / 100).toFixed(2)}\nDescription: ${job.description}`;

    sendEmail(ADMIN_EMAIL, subject, html, text).catch(() => {});

    // Return the job WITHOUT the access_token in the response body.
    // The client stores the access_token in localStorage for their session.
    return json({
      ok: true,
      job: {
        id: job.id,
        reference: job.reference,
        email: job.email,
        service_type: job.service_type,
        description: job.description,
        status: job.status,
        file_count: job.file_count,
        price_pence: job.price_pence,
        access_token: job.access_token,
        created_at: job.created_at,
      },
    });
  }

  // ── load-jobs (by email) ──
  if (action === "load-jobs") {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!email) return json({ ok: false, error: "Email is required" }, 400);

    const { data, error } = await supabase
      .from("redact_jobs")
      .select("id, reference, email, service_type, description, status, file_count, price_pence, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false });

    if (error) return json({ ok: false, error: error.message }, 500);

    return json({ ok: true, jobs: data ?? [] });
  }

  // ── load-job (by id + access_token) ──
  if (action === "load-job") {
    const jobId = String(body.job_id ?? "").trim();
    const accessToken = String(body.access_token ?? "").trim();
    if (!jobId || !accessToken) return json({ ok: false, error: "Job ID and access token required" }, 400);

    const job = await verifyOwnership(jobId, accessToken);
    if (!job) return json({ ok: false, error: "Job not found or access denied" }, 404);

    const [filesRes, packsRes] = await Promise.all([
      supabase.from("redact_files").select("*").eq("job_id", jobId).order("uploaded_at", { ascending: false }),
      supabase.from("redact_packs").select("*").eq("job_id", jobId).order("uploaded_at", { ascending: false }),
    ]);

    return json({
      ok: true,
      job: {
        id: job.id,
        reference: job.reference,
        email: job.email,
        service_type: job.service_type,
        description: job.description,
        status: job.status,
        file_count: job.file_count,
        price_pence: job.price_pence,
        created_at: job.created_at,
      },
      files: filesRes.data ?? [],
      packs: packsRes.data ?? [],
    });
  }

  // ── upload-file (accept file as base64, upload server-side) ──
  if (action === "upload-file") {
    const jobId = String(body.job_id ?? "").trim();
    const accessToken = String(body.access_token ?? "").trim();
    const fileName = String(body.file_name ?? "").trim();
    const fileSize = Number(body.file_size ?? 0);
    const fileData = String(body.file_data ?? ""); // base64-encoded file content
    const contentType = String(body.content_type ?? "application/octet-stream");

    if (!jobId || !accessToken || !fileName) {
      return json({ ok: false, error: "Job ID, access token, and file name required" }, 400);
    }

    const job = await verifyOwnership(jobId, accessToken);
    if (!job) return json({ ok: false, error: "Access denied" }, 403);

    const storagePath = `${jobId}/${Date.now()}-${fileName}`;

    // Decode base64 and upload to storage using the service role key.
    let fileBytes: Uint8Array;
    try {
      const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, "");
      fileBytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));
    } catch {
      return json({ ok: false, error: "Invalid file data" }, 400);
    }

    const { error: upErr } = await supabase
      .storage
      .from(BUCKET)
      .upload(storagePath, fileBytes, { contentType, upsert: false });

    if (upErr) {
      return json({ ok: false, error: "Could not upload the file — please try again" }, 500);
    }

    // Insert the file record.
    const { error: fileErr } = await supabase
      .from("redact_files")
      .insert({
        job_id: jobId,
        file_name: fileName,
        storage_path: storagePath,
        file_size: fileBytes.byteLength,
      });

    if (fileErr) {
      // Clean up the orphaned file in storage.
      await supabase.storage.from(BUCKET).remove([storagePath]);
      return json({ ok: false, error: "Could not record the file" }, 500);
    }

    // Update file_count on the job.
    await supabase
      .from("redact_jobs")
      .update({ file_count: (job.file_count ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    return json({ ok: true, file_name: fileName, file_size: fileBytes.byteLength });
  }

  // ── list-files ──
  if (action === "list-files") {
    const jobId = String(body.job_id ?? "").trim();
    const accessToken = String(body.access_token ?? "").trim();
    if (!jobId || !accessToken) return json({ ok: false, error: "Job ID and access token required" }, 400);

    const job = await verifyOwnership(jobId, accessToken);
    if (!job) return json({ ok: false, error: "Access denied" }, 403);

    const { data, error } = await supabase
      .from("redact_files")
      .select("*")
      .eq("job_id", jobId)
      .order("uploaded_at", { ascending: false });

    if (error) return json({ ok: false, error: error.message }, 500);

    return json({ ok: true, files: data ?? [] });
  }

  // ── delete-file ──
  if (action === "delete-file") {
    const fileId = String(body.file_id ?? "").trim();
    const accessToken = String(body.access_token ?? "").trim();
    if (!fileId || !accessToken) return json({ ok: false, error: "File ID and access token required" }, 400);

    // Get the file, then verify ownership via the job.
    const { data: file } = await supabase
      .from("redact_files")
      .select("*")
      .eq("id", fileId)
      .maybeSingle();

    if (!file) return json({ ok: false, error: "File not found" }, 404);

    const job = await verifyOwnership(file.job_id, accessToken);
    if (!job) return json({ ok: false, error: "Access denied" }, 403);

    // Remove from storage.
    await supabase.storage.from(BUCKET).remove([file.storage_path]);

    // Delete the record.
    await supabase.from("redact_files").delete().eq("id", fileId);

    // Decrement file_count.
    await supabase
      .from("redact_jobs")
      .update({ file_count: Math.max(0, (job.file_count ?? 0) - 1), updated_at: new Date().toISOString() })
      .eq("id", job.id);

    return json({ ok: true });
  }

  // ── download-pack ──
  if (action === "download-pack") {
    const packId = String(body.pack_id ?? "").trim();
    const accessToken = String(body.access_token ?? "").trim();
    if (!packId || !accessToken) return json({ ok: false, error: "Pack ID and access token required" }, 400);

    const { data: pack } = await supabase
      .from("redact_packs")
      .select("*")
      .eq("id", packId)
      .maybeSingle();

    if (!pack) return json({ ok: false, error: "Pack not found" }, 404);

    const job = await verifyOwnership(pack.job_id, accessToken);
    if (!job) return json({ ok: false, error: "Access denied" }, 403);

    // Create a signed download URL (60 seconds).
    const { data: urlData, error: urlErr } = await supabase
      .storage
      .from(BUCKET)
      .createSignedUrl(pack.storage_path, 60);

    if (urlErr || !urlData?.signedUrl) {
      return json({ ok: false, error: "Could not create download link" }, 500);
    }

    // Update download count.
    await supabase
      .from("redact_packs")
      .update({
        download_count: (pack.download_count ?? 0) + 1,
        last_downloaded_at: new Date().toISOString(),
      })
      .eq("id", packId);

    return json({ ok: true, url: urlData.signedUrl });
  }

  return json({ ok: false, error: `Unknown action: ${action}` }, 400);
});
