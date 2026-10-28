-- Redact Direct — Migration 003: Secure session-based authentication.
--
-- Replaces the insecure access_token-in-localStorage model with:
--   - Email verification codes (short-lived, single-use, rate-limited)
--   - Session tokens (server-verified, time-limited)
--   - Server-side Stripe payment verification
--   - Idempotent job creation (no duplicates on refresh)
--
-- Also invalidates all previously-issued access_tokens so old values
-- in any browser's localStorage are useless.

-- ─── Session table ───
CREATE TABLE IF NOT EXISTS public.redact_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text NOT NULL,
  session_token     text NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  code_hash         text,
  code_expires_at   timestamptz,
  code_used         boolean NOT NULL DEFAULT false,
  code_attempts     integer NOT NULL DEFAULT 0,
  code_requests     integer NOT NULL DEFAULT 0,
  first_request_at  timestamptz,
  verified          boolean NOT NULL DEFAULT false,
  session_expires_at timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.redact_sessions ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; the edge function uses it.
-- No direct client access to this table.
CREATE POLICY "No direct client access" ON public.redact_sessions FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.redact_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_email ON public.redact_sessions(email);

-- ─── Add stripe_session_id to redact_jobs for idempotent creation ───
ALTER TABLE public.redact_jobs
  ADD COLUMN IF NOT EXISTS stripe_session_id text UNIQUE;

-- ─── Invalidate all previously-issued access_tokens ───
-- This ensures any tokens stored in a browser's localStorage are useless.
-- Legitimate customers regain access by verifying their email with a code.
UPDATE public.redact_jobs SET access_token = gen_random_uuid();
