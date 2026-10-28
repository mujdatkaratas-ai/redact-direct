-- Migration 003: Email verification + session tokens
-- 
-- Replaces the insecure access_token system with:
-- 1. A verification_codes table for email OTP
-- 2. A session_tokens table for authenticated sessions
-- 3. Invalidates all existing access_tokens

-- Verification codes table
CREATE TABLE IF NOT EXISTS public.rd_verification_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  code        text NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  expires_at  timestamptz NOT NULL,
  attempts    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rd_verification_codes ENABLE ROW LEVEL SECURITY;
-- No direct client access to verification codes — edge function uses service role.

-- Session tokens table
CREATE TABLE IF NOT EXISTS public.rd_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  token       text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rd_sessions ENABLE ROW LEVEL SECURITY;
-- No direct client access — edge function manages sessions.

CREATE INDEX IF NOT EXISTS idx_rd_sessions_token ON public.rd_sessions(token);
CREATE INDEX IF NOT EXISTS idx_rd_sessions_email ON public.rd_sessions(email);

-- Invalidate all existing access_tokens (set to random values so they can't be guessed).
-- This forces all clients to re-authenticate via email verification.
UPDATE public.redact_jobs SET access_token = gen_random_uuid() WHERE access_token IS NOT NULL;

-- Add a field to track whether payment has been verified via Stripe webhook
ALTER TABLE public.redact_jobs ADD COLUMN IF NOT EXISTS payment_verified boolean NOT NULL DEFAULT false;

-- Add a unique constraint on (email, reference) to prevent duplicate job creation
-- from Stripe redirect retries/refreshes
CREATE UNIQUE INDEX IF NOT EXISTS idx_redact_jobs_email_reference 
  ON public.redact_jobs(email, reference);
