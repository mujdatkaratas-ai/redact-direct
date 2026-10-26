-- Redact Direct — database schema for the secure redaction portal.
--
-- Standalone project under ELF Gate Limited. No connection to Satswana.
--
-- Tables:
--   redact_jobs     — one per redaction request (SAR, FOI, EIR, document, etc.)
--   redact_files    — raw files uploaded by the client
--   redact_packs    — finished redacted packs uploaded by the redaction team

CREATE TABLE IF NOT EXISTS public.redact_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference     text NOT NULL UNIQUE,
  email         text NOT NULL,
  service_type  text NOT NULL,
  description   text,
  status        text NOT NULL DEFAULT 'pending',
  file_count    integer NOT NULL DEFAULT 0,
  price_pence   integer NOT NULL,
  paid          boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.redact_jobs ENABLE ROW LEVEL SECURITY;

-- Clients can read and update their own jobs (by email).
CREATE POLICY "Clients can read their own jobs"
  ON public.redact_jobs FOR SELECT
  USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Clients can create jobs"
  ON public.redact_jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Clients can update their own jobs"
  ON public.redact_jobs FOR UPDATE
  USING (email = auth.jwt() ->> 'email');

CREATE INDEX IF NOT EXISTS idx_redact_jobs_email
  ON public.redact_jobs(email);

CREATE INDEX IF NOT EXISTS idx_redact_jobs_status
  ON public.redact_jobs(status);


CREATE TABLE IF NOT EXISTS public.redact_files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid NOT NULL REFERENCES public.redact_jobs(id) ON DELETE CASCADE,
  file_name     text NOT NULL,
  storage_path  text NOT NULL,
  file_size     bigint,
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.redact_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage their own job files"
  ON public.redact_files FOR ALL
  USING (
    job_id IN (
      SELECT id FROM public.redact_jobs
      WHERE email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    job_id IN (
      SELECT id FROM public.redact_jobs
      WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE INDEX IF NOT EXISTS idx_redact_files_job
  ON public.redact_files(job_id);


CREATE TABLE IF NOT EXISTS public.redact_packs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        uuid NOT NULL REFERENCES public.redact_jobs(id) ON DELETE CASCADE,
  file_name     text NOT NULL,
  storage_path  text NOT NULL,
  file_size     bigint,
  uploaded_at   timestamptz NOT NULL DEFAULT now(),
  download_count integer NOT NULL DEFAULT 0,
  last_downloaded_at timestamptz
);

ALTER TABLE public.redact_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can download their own job packs"
  ON public.redact_packs FOR SELECT
  USING (
    job_id IN (
      SELECT id FROM public.redact_jobs
      WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Clients can update download count"
  ON public.redact_packs FOR UPDATE
  USING (
    job_id IN (
      SELECT id FROM public.redact_jobs
      WHERE email = auth.jwt() ->> 'email'
    )
  );

CREATE INDEX IF NOT EXISTS idx_redact_packs_job
  ON public.redact_packs(job_id);
