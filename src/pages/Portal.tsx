import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, Upload, FileText, X, CheckCircle2,
  Clock, Eye, Lock, Loader2, Trash2, Download, Mail,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { COMPANY, formatPence, PRICING_TABLE, STRIPE_PRICE_IDS } from '@/lib/config';
import { toast } from 'sonner';

// ─── Google Ads conversion ───
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const ADS_CONVERSION_ID = 'AW-18526524079/cTGwCOiEzasdEK-lkYJF';

function fireConversion(transactionId: string) {
  if (typeof window === 'undefined' || !window.gtag) return;
  try {
    window.gtag('event', 'conversion', {
      send_to: ADS_CONVERSION_ID,
      transaction_id: transactionId,
    });
  } catch {
    /* never block the UX on tracking */
  }
}

// ─── Types ───
type JobStatus = 'pending' | 'in_review' | 'ready';

const STATUS_LABEL: Record<JobStatus, string> = {
  pending: 'Awaiting review',
  in_review: 'In review',
  ready: 'Pack ready',
};

const STATUS_TONE: Record<JobStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_review: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
};

interface Job {
  id: string;
  reference: string;
  email: string;
  service_type: string;
  description: string;
  status: JobStatus;
  file_count: number;
  price_pence: number;
  access_token?: string;
  created_at: string;
}

interface JobFile {
  id: string;
  job_id: string;
  file_name: string;
  storage_path: string;
  file_size: number | null;
  uploaded_at: string;
}

interface JobPack {
  id: string;
  job_id: string;
  file_name: string;
  storage_path: string;
  file_size: number | null;
  uploaded_at: string;
  download_count: number;
}

// ─── Helpers ───
const TOKEN_KEY = 'rd_access_tokens';

function saveToken(jobId: string, token: string) {
  try {
    const existing = JSON.parse(localStorage.getItem(TOKEN_KEY) ?? '{}');
    existing[jobId] = token;
    localStorage.setItem(TOKEN_KEY, JSON.stringify(existing));
  } catch { /* localStorage unavailable */ }
}

function getTokens(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) ?? '{}');
  } catch {
    return {};
  }
}

// ─── Portal component ───
const Portal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'auth' | 'jobs'>('auth');
  const [email, setEmail] = useState('');
  const [authing, setAuthing] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<JobFile[]>([]);
  const [selectedPacks, setSelectedPacks] = useState<JobPack[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [form, setForm] = useState({ serviceType: 'sar', description: '' });
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [jobAfterPayment, setJobAfterPayment] = useState(false);

  // ── Handle Stripe redirect back (success) ──
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      const serviceType = searchParams.get('service') ?? 'sar';
      const emailFromUrl = searchParams.get('email') ?? '';
      if (emailFromUrl) {
        setEmail(emailFromUrl);
        // Create the job now that payment is confirmed.
        const createJobAfterPayment = async () => {
          try {
            const { data, error } = await supabase.functions.invoke('redact-portal', {
              body: {
                action: 'create-job',
                email: emailFromUrl,
                service_type: serviceType,
                description: 'Payment confirmed via Stripe.',
              },
            });
            if (error || !data?.ok) {
              toast.error('Payment received but could not create the job — please contact us.');
              return;
            }
            const job: Job = data.job;
            if (job.access_token) saveToken(job.id, job.access_token);
            setJobs((arr) => [{ ...job, access_token: undefined }, ...arr]);
            setSelectedJobId(job.id);
            setSelectedFiles([]);
            setSelectedPacks([]);
            setView('jobs');
            setShowForm(false);
            setPaymentSuccess(true);
            setJobAfterPayment(true);
            // ── Fire Google Ads conversion ONLY after backend confirms save ──
            fireConversion(job.id);
            toast.success('Payment received', { description: `${job.reference} — upload your files below.` });
          } catch {
            toast.error('Payment received but could not create the job — please contact us.');
          }
        };
        createJobAfterPayment();
      }
    } else if (status === 'cancelled') {
      toast('Payment cancelled', { description: 'You were not charged. Try again when you\'re ready.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Auth: load jobs by email ──
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }
    setAuthing(true);
    try {
      const { data, error } = await supabase.functions.invoke('redact-portal', {
        body: { action: 'load-jobs', email: email.trim().toLowerCase() },
      });
      if (error || !data?.ok) {
        toast.error('Could not load your jobs', { description: error?.message ?? 'Please try again.' });
        setAuthing(false);
        return;
      }
      // Save access tokens for all jobs returned
      const jobs = data.jobs ?? [];
      for (const j of jobs) {
        if (j.access_token) saveToken(j.id, j.access_token);
      }
      setJobs(jobs.map((j: Job) => ({ ...j, access_token: undefined })));
      setView('jobs');
    } catch {
      toast.error('Something went wrong — please try again.');
    }
    setAuthing(false);
  };

  // ── Create job (redirect to Stripe checkout) ──
  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Enter your email address first');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Add a short description of what needs redacting');
      return;
    }
    const priceId = STRIPE_PRICE_IDS[form.serviceType];
    if (!priceId) {
      toast.error('This service requires a custom quote — please contact us.');
      return;
    }
    setCreating(true);
    try {
      // Create a Stripe Checkout Session via the edge function.
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          action: 'create-checkout-session',
          service_id: form.serviceType,
          email: email.trim().toLowerCase(),
          description: form.description.trim(),
          success_url: `${window.location.origin}/portal?status=success&service=${form.serviceType}&email=${encodeURIComponent(email.trim().toLowerCase())}`,
          cancel_url: `${window.location.origin}/portal?status=cancelled`,
        },
      });
      if (error || !data?.ok || !data?.url) {
        toast.error('Could not start payment', { description: data?.error ?? error?.message ?? 'Please try again.' });
        setCreating(false);
        return;
      }
      // Redirect to Stripe Checkout.
      window.location.href = data.url;
    } catch {
      toast.error('Something went wrong — please try again.');
    }
    setCreating(false);
  };

  // ── Load job detail (files + packs) ──
  const loadJobDetail = useCallback(async (jobId: string) => {
    const tokens = getTokens();
    const token = tokens[jobId];
    if (!token) {
      setSelectedFiles([]);
      setSelectedPacks([]);
      return;
    }
    setLoadingDetail(true);
    try {
      const { data, error } = await supabase.functions.invoke('redact-portal', {
        body: { action: 'load-job', job_id: jobId, access_token: token },
      });
      if (error || !data?.ok) {
        setSelectedFiles([]);
        setSelectedPacks([]);
        return;
      }
      setSelectedFiles(data.files ?? []);
      setSelectedPacks(data.packs ?? []);
    } catch {
      setSelectedFiles([]);
      setSelectedPacks([]);
    }
    setLoadingDetail(false);
  }, []);

  // ── Upload file ──
  const handleUpload = async (jobId: string, files: FileList) => {
    const tokens = getTokens();
    const token = tokens[jobId];
    if (!token) {
      toast.error('Access expired — please reload your jobs with your email.');
      return;
    }
    setUploading(true);
    let success = 0;
    let failed = 0;
    for (const file of Array.from(files)) {
      try {
        // Read file as base64 and send to the edge function for server-side upload.
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        const { data: upData, error: upErr } = await supabase.functions.invoke('redact-portal', {
          body: {
            action: 'upload-file',
            job_id: jobId,
            access_token: token,
            file_name: file.name,
            file_data: base64,
            content_type: file.type || 'application/octet-stream',
          },
        });
        if (upErr || !upData?.ok) { failed++; continue; }
        success++;
      } catch {
        failed++;
      }
    }
    await loadJobDetail(jobId);
    setJobs((arr) => arr.map((j) => j.id === jobId ? { ...j, file_count: (j.file_count ?? 0) + success } : j));
    setUploading(false);
    if (success > 0) toast.success(`${success} file${success === 1 ? '' : 's'} uploaded`);
    if (failed > 0) toast.error(`${failed} file${failed === 1 ? '' : 's'} failed to upload`);
  };

  // ── Delete file ──
  const deleteFile = async (file: JobFile) => {
    const tokens = getTokens();
    const token = tokens[file.job_id];
    if (!token) { toast.error('Access expired'); return; }
    if (!confirm(`Delete ${file.file_name}?`)) return;
    try {
      await supabase.functions.invoke('redact-portal', {
        body: { action: 'delete-file', file_id: file.id, access_token: token },
      });
      setSelectedFiles((arr) => arr.filter((f) => f.id !== file.id));
      toast('File removed');
    } catch {
      toast.error('Could not delete the file');
    }
  };

  // ── Download pack ──
  const downloadPack = async (pack: JobPack) => {
    const tokens = getTokens();
    const token = tokens[pack.job_id];
    if (!token) { toast.error('Access expired — please reload your jobs with your email.'); return; }
    try {
      const { data, error } = await supabase.functions.invoke('redact-portal', {
        body: { action: 'download-pack', pack_id: pack.id, access_token: token },
      });
      if (error || !data?.ok) { toast.error('Could not generate the download link'); return; }
      window.open(data.url, '_blank');
    } catch {
      toast.error('Could not generate the download link');
    }
  };

  const selectJob = (job: Job) => {
    setSelectedJobId(job.id);
    loadJobDetail(job.id);
  };

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  // ─── Render: auth view ───
  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="Redact Direct" className="h-8 w-auto" />
            </Link>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" /> Back to home
            </Link>
          </div>
        </header>
        <div className="max-w-md mx-auto px-4 py-20">
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-6">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Client portal</h1>
            <p className="text-sm text-slate-500 mb-6">
              Enter your email to view your redaction jobs, upload documents, and download finished packs.
            </p>
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  placeholder="you@organisation.gov.uk" required />
              </div>
              <button type="submit" disabled={authing}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors">
                {authing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowLeft className="w-4 h-4 rotate-180" />}
                {authing ? 'Loading…' : 'View my jobs'}
              </button>
            </form>
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">
            New here? <button onClick={() => { setView('jobs'); setShowForm(true); }} className="text-slate-600 underline">Create a job</button> — enter your email in the form.
          </p>
        </div>
      </div>
    );
  }

  // ─── Render: jobs view ───
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Redact Direct" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:inline">{email}</span>
            <button onClick={() => setView('auth')} className="text-sm text-slate-500 hover:text-slate-900">Sign out</button>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
              <ArrowLeft className="w-4 h-4" /> Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Your redaction jobs</h1>
            <p className="text-sm text-slate-500 mt-1">Upload documents, track progress, download redacted packs.</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors">
            <Upload className="w-4 h-4" /> New job
          </button>
        </div>

        {/* New job form */}
        {showForm && (
          <form onSubmit={createJob} className="bg-white rounded-xl border border-slate-200 p-6 mb-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create a new redaction job</h2>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Your email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                placeholder="you@organisation.gov.uk" required />
              <p className="text-xs text-slate-400 mt-1.5">We'll use this to contact you about your job.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Service type</label>
              <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 bg-white">
                {PRICING_TABLE.map((p) => (
                  <option key={p.id} value={p.id}>{p.label} — {formatPence(p.price)} {p.unit}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 resize-y"
                placeholder="Briefly describe what needs redacting — e.g. 'SAR response — emails, attendance records, and a safeguarding log'"
                required />
              <p className="text-xs text-slate-400 mt-1.5">
                Include the type of request (SAR, FOI, EIR), the volume, and anything sensitive we should know about.
              </p>
            </div>
            <button type="submit" disabled={creating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {creating ? 'Redirecting to payment…' : 'Continue to payment'}
            </button>
          </form>
        )}

        {/* Job list */}
        {jobs.length === 0 && !showForm ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No redaction jobs yet</p>
            <p className="text-sm text-slate-500 mt-1">Click "New job" to upload documents for redaction.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id}
                className={`bg-white rounded-xl border p-5 cursor-pointer transition-all ${
                  selectedJobId === job.id ? 'border-slate-900 shadow-md' : 'border-slate-200 hover:border-slate-400'
                }`}
                onClick={() => selectJob(job)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{job.reference}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_TONE[job.status]}`}>
                        {STATUS_LABEL[job.status]}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900">{job.service_type}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{job.description}</p>
                    <div className="text-xs text-slate-400 mt-2">
                      {job.file_count} file{job.file_count === 1 ? '' : 's'} · {formatPence(job.price_pence)} · {new Date(job.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>

                {/* Expanded view */}
                {selectedJobId === job.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    {loadingDetail ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading files…
                      </div>
                    ) : (
                      <>
                        {selectedFiles.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Uploaded files</h4>
                            <ul className="space-y-1.5">
                              {selectedFiles.map((f) => (
                                <li key={f.id} className="flex items-center gap-2 text-sm bg-slate-50 rounded px-3 py-2">
                                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span className="flex-1 truncate text-slate-700">{f.file_name}</span>
                                  {f.file_size != null && (
                                    <span className="text-xs text-slate-400">
                                      {f.file_size < 1024 * 1024
                                        ? `${(f.file_size / 1024).toFixed(0)} KB`
                                        : `${(f.file_size / (1024 * 1024)).toFixed(1)} MB`}
                                    </span>
                                  )}
                                  {job.status === 'pending' && (
                                    <button onClick={() => deleteFile(f)} className="text-slate-300 hover:text-red-600">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {job.status === 'pending' && (
                          <div className="mb-4">
                            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors">
                              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                              {uploading ? 'Uploading…' : 'Upload files'}
                              <input type="file" multiple className="hidden"
                                onChange={(e) => { if (e.target.files?.length) handleUpload(job.id, e.target.files); e.target.value = ''; }}
                                disabled={uploading} />
                            </label>
                            <p className="text-xs text-slate-400 mt-2">
                              Drop in the documents that need redacting. Files are encrypted in transit and at rest.
                            </p>
                          </div>
                        )}

                        {job.status === 'in_review' && (
                          <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-4 py-3 mb-3">
                            <Eye className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Your documents are being reviewed and redacted. You'll get an email when the pack is ready.</span>
                          </div>
                        )}

                        {selectedPacks.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Redacted packs</h4>
                            <div className="space-y-2">
                              {selectedPacks.map((p) => (
                                <div key={p.id} className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-slate-900">{p.file_name}</div>
                                    {p.download_count > 0 && (
                                      <div className="text-xs text-slate-400 mt-0.5">Downloaded {p.download_count} time{p.download_count === 1 ? '' : 's'}</div>
                                    )}
                                  </div>
                                  <button onClick={() => downloadPack(p)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded shrink-0">
                                    <Download className="w-3.5 h-3.5" /> Download
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Security note */}
        <div className="mt-10 bg-slate-900 text-white rounded-xl p-6 flex items-start gap-3">
          <Lock className="w-5 h-5 text-white/70 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm">Your documents are secure</h3>
            <p className="text-xs text-white/60 mt-1">
              Files are encrypted in transit and at rest. No cloud AI processes your data. Every page is reviewed by a person.
              {COMPANY.parentCompany} is the data processor — see our <Link to="/privacy" className="underline">privacy policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portal;
