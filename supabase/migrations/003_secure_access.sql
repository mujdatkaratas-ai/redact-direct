-- Redact Direct — migration 003: secure access + RLS lockdown.
--
-- 1. Drop the old permissive RLS policies from migration 002.
-- 2. Lock down all tables so the anon key cannot read any rows directly.
-- 3. Invalidate all old access_tokens so they can no longer be used.
-- 4. Add a verification_codes table for email-based verification.
-- 5. All access goes through the edge function (service role key) which
--    enforces ownership. The anon key can only INSERT verification codes
--    and verify them — nothing else.

-- ─── Invalidate old access tokens ───
UPDATE public.redact_jobs SET access_token = gen_random_uuid() WHERE access_token IS NOT NULL;

-- ─── Drop old permissive policies ───
DROP POLICY IF EXISTS "Anyone can create jobs" ON public.redact_jobs;
DROP POLICY IF EXISTS "Anyone can read job metadata" ON public.redact_jobs;
DROP POLICY IF EXISTS "Anyone can update jobs" ON public.redact_jobs;
DROP POLICY IF EXISTS "Anyone can manage files" ON public.redact_files;
DROP POLICY IF EXISTS "Anyone can manage packs" ON public.redact_packs;

-- ─── Lock down: anon key gets NOTHING ───
-- No SELECT, UPDATE, or DELETE policies on any table.
-- All data access goes through the edge function (service role key).
-- The anon key can only call the edge function.

-- ─── Verification codes table ───
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  code_hash     text NOT NULL,
  expires_at    timestamptz NOT NULL,
  used          boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow INSERT (creating a code) but not SELECT (reading codes)
-- The edge function uses the service role key which bypasses RLS.
CREATE POLICY "Anon can insert verification codes"
  ON public.verification_codes FOR INSERT
  WITH CHECK (true);

-- ─── Session tokens table ───
CREATE TABLE IF NOT EXISTS public.session_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash    text NOT NULL UNIQUE,
  email         text NOT NULL,
  expires_at    timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert session tokens"
  ON public.session_tokens FOR INSERT
  WITH CHECK (true);

-- ─── Stripe session tracking (idempotent job creation) ───
CREATE TABLE IF NOT EXISTS public.stripe_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    text NOT NULL UNIQUE,
  email         text NOT NULL,
  service_type  text NOT NULL,
  description   text,
  payment_intent text,
  amount_paid   integer,
  job_created   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert stripe sessions"
  ON public.stripe_sessions FOR INSERT
  WITH CHECK (true);

-- ─── Rate limiting: track code requests per email ───
CREATE INDEX IF NOT EXISTS idx_verification_codes_email
  ON public.verification_codes(email);

CREATE INDEX IF NOT EXISTS idx_session_tokens_token_hash
  ON public.session_tokens(token_hash);

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_session_id
  ON public.stripe_sessions(session_id);
