import React, { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Upload, FileText, X, CheckCircle2, Eye, Lock, Loader2,
  Download, Mail, KeyRound,
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
  } catch { /* never block the UX on tracking */ }
}

// ─── Types ───
type JobStatus = 'pending' | 'in_review' | 'ready';
type View = 'email' | 'code' | 'jobs';

const STATUS_LABEL: Record<JobStatus, string> = {
  pending: 'Awaiting review', in_review: 'In review', ready: 'Pack ready',
};
const STATUS_TONE: Record<JobStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_review: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
};

interface Job {
  id: string; reference: string; email: string;
  service_type: string; description: string; status: JobStatus;
  file_count: number; price_pence: number; created_at: string;
}
interface JobFile {
  id: string; job_id: string; file_name: string;
  storage_path: string; file_size: number | null; uploaded_at: string;
}
interface JobPack {
  id: string; job_id: string; file_name: string;
  storage_path: string; file_size: number | null;
  uploaded_at: string; download_count: number;
}

// ─── Session storage (NOT access tokens) ───
const SESSION_KEY = 'rd_session';

function saveSession(token: string, email: string) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ token, email })); } catch { /* */ }
}
function getSession(): { token: string; email: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* */ }
}

// ─── Portal component ───
const Portal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
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

  // ── Handle Stripe redirect (no email in URL, no job creation here) ──
  React.useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      setPaymentSuccess(true);
      // If already authenticated, reload jobs to pick up the new one.
      const session = getSession();
      if (session) {
        loadJobs(session.token);
      }
    } else if (status === 'cancelled') {
      toast('Payment cancelled', { description: 'You were not charged. Try again when you\'re ready.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ── Auto-restore session if already signed in ──
  React.useEffect(() => {
    const session = getSession();
    if (session) {
      setView('jobs');
      setEmail(session.email);
      loadJobs(session.token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Request verification code ──
  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('redact-portal', {
        body: { action: 'request-code', email: email.trim().toLowerCase() },
      });
      if (error || !data?.ok) {
        toast.error('Could not send verification code', { description: data?.error ?? 'Please try again.' });
        setBusy(false);
        return;
      }
      setView('code');
      toast.success('Verification code sent', { description: 'Check your email for a 6-digit code.' });
    } catch {
      toast.error('Something went wrong — please try again.');
    }
    setBusy(false);
  };

  // ── Verify code and create session ──
  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Enter the 6-digit code from your email');
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('redact-portal', {
        body: { action: 'verify-code', email: email.trim().toLowerCase(), code: code.trim() },
      });
      if (error || !data?.ok) {
        toast.error('Invalid code', { description: data?.error ?? 'Please try again or request a new code.' });
        setBusy(false);
        return;
      }
      saveSession(data.session_token, data.email);
      setCode('');
      setView('jobs');
      const loadedJobs = await loadJobs(data.session_token);
      if (paymentSuccess && loadedJobs && loadedJobs.length > 0) {
        // Fire conversion only after the server confirms the session is valid
        // and the paid job is visible. Uses the most recent job ID as transaction_id.
        fireConversion(loadedJobs[0].id);
        toast.success('Payment received', { description: 'Your job is ready for file uploads.' });
        setPaymentSuccess(false);
      }
    } catch {
      toast.error('Something went wrong — please try again.');
    }
    setBusy(false);
  };

  // ── Load jobs (requires session) ──
  const loadJobs = async (sessionToken: string): Promise<Job[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('redact-portal', {
        body: { action: 'load-jobs', session_token: sessionToken },
      });
      if (error || !data?.ok) {
        clearSession();
        setView('email');
        toast.error('Session expired', { description: 'Please sign in again.' });
        return [];
      }
      setJobs(data.jobs ?? []);
      return data.jobs ?? [];
    } catch {
      toast.error('Could not load your jobs');
      return [];
    }
  };

  // ── Create job → redirect to Stripe (no job created here) ──
  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          action: 'create-checkout-session',
          service_id: form.serviceType,
          email,
          description: form.description.trim(),
        },
      });
      if (error || !data?.ok || !data?.url) {
        toast.error('Could not start payment', { description: data?.error ?? error?.message ?? 'Please try again.' });
        setCreating(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      toast.error('Something went wrong — please try again.');
    }
    setCreating(false);
  };

  // ── Load job detail ──
  const loadJobDetail = useCallback(async (jobId: string) => {
    const session = getSession();
    if (!session) { setSelectedFiles([]); setSelectedPacks([]); return; }
    setLoadingDetail(true);
    try {
      const { data, error } = await supabase.functions.invoke('redact-portal', {
        body: { action: 'load-job', session_token: session.token, job_id: jobId },
      });
      if (error || !data?.ok) { setSelectedFiles([]); setSelectedPacks([]); return; }
      setSelectedFiles(data.files ?? []);
      setSelectedPacks(data.packs ?? []);
    } catch { setSelectedFiles([]); setSelectedPacks([]); }
    setLoadingDetail(false);
  }, []);

  // ── Upload file ──
  const handleUpload = async (jobId: string, files: FileList) => {
    const session = getSession();
    if (!session) { toast.error('Session expired — please sign in again.'); return; }
    setUploading(true);
    let success = 0, failed = 0;
    for (const file of Array.from(files)) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const base64 = btoa(binary);
        const { data: upData, error: upErr } = await supabase.functions.invoke('redact-portal', {
          body: { action: 'upload-file', session_token: session.token, job_id: jobId,
            file_name: file.name, file_data: base64, content_type: file.type || 'application/octet-stream' },
        });
        if (upErr || !upData?.ok) { failed++; continue; }
        success++;
      } catch { failed++; }
    }
    await loadJobDetail(jobId);
    setJobs((arr) => arr.map((j) => j.id === jobId ? { ...j, file_count: (j.file_count ?? 0) + success } : j));
    setUploading(false);
    if (success > 0) toast.success(`${success} file${success === 1 ? '' : 's'} uploaded`);
    if (failed > 0) toast.error(`${failed} file${failed === 1 ? '' : 's'} failed to upload`);
  };

  // ── Download pack ──
  const downloadPack = async (pack: JobPack) => {
    const session = getSession();
    if (!session) { toast.error('Session expired — please sign in again.'); return; }
    try {
      const { data, error } = await supabase.functions.invoke('redact-portal', {
        body: { action: 'download-pack', session_token: session.token, pack_id: pack.id },
      });
      if (error || !data?.ok) { toast.error('Could not generate the download link'); return; }
      const a = document.createElement('a');
      a.href = data.url;
      a.download = pack.file_name;
      a.target = '_self';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch { toast.error('Could not generate the download link'); }
  };

  const signOut = async () => {
    const session = getSession();
    if (session) {
      try { await supabase.functions.invoke('redact-portal', { body: { action: 'sign-out', session_token: session.token } }); } catch { /* */ }
    }
    clearSession();
    setView('email');
    setEmail('');
    setJobs([]);
    setSelectedJobId(null);
  };

  // ─── Render: email entry ───
  if (view === 'email') {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2"><img src="/logo.png" alt="Redact Direct" className="h-8 w-auto" /></Link>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> Back to home</Link>
          </div>
        </header>
        <div className="max-w-md mx-auto px-4 py-20">
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-6"><Mail className="w-6 h-6 text-white" /></div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Client portal</h1>
            <p className="text-sm text-slate-500 mb-6">Enter your email to sign in. We'll send you a verification code.</p>
            <form onSubmit={requestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                  placeholder="you@organisation.gov.uk" required />
              </div>
              <button type="submit" disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {busy ? 'Sending…' : 'Send verification code'}
              </button>
            </form>
          </div>
          {paymentSuccess && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              <CheckCircle2 className="w-5 h-5 inline mr-2" /> Payment received! Sign in to upload your files.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: code entry ───
  if (view === 'code') {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2"><img src="/logo.png" alt="Redact Direct" className="h-8 w-auto" /></Link>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> Back to home</Link>
          </div>
        </header>
        <div className="max-w-md mx-auto px-4 py-20">
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-6"><KeyRound className="w-6 h-6 text-white" /></div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Enter your code</h1>
            <p className="text-sm text-slate-500 mb-6">We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.</p>
            <form onSubmit={verifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Verification code</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-center text-2xl tracking-widest"
                  placeholder="000000" inputMode="numeric" maxLength={6} required />
              </div>
              <button type="submit" disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {busy ? 'Verifying…' : 'Verify and sign in'}
              </button>
            </form>
            <button onClick={() => setView('email')} className="mt-4 text-sm text-slate-500 hover:text-slate-900">← Use a different email</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: jobs view ───
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><img src="/logo.png" alt="Redact Direct" className="h-8 w-auto" /></Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:inline">{email}</span>
            <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-900">Sign out</button>
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="w-4 h-4" /> Home</Link>
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

        {showForm && (
          <form onSubmit={createJob} className="bg-white rounded-xl border border-slate-200 p-6 mb-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create a new redaction job</h2>
              <button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Service type</label>
              <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 bg-white">
                {PRICING_TABLE.map((p) => (<option key={p.id} value={p.id}>{p.label} — {formatPence(p.price)} {p.unit}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 resize-y"
                placeholder="Briefly describe what needs redacting" required />
            </div>
            <button type="submit" disabled={creating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {creating ? 'Redirecting to payment…' : 'Continue to payment'}
            </button>
          </form>
        )}

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
                className={`bg-white rounded-xl border p-5 cursor-pointer transition-all ${selectedJobId === job.id ? 'border-slate-900 shadow-md' : 'border-slate-200 hover:border-slate-400'}`}
                onClick={() => { setSelectedJobId(job.id); loadJobDetail(job.id); }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{job.reference}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${STATUS_TONE[job.status]}`}>{STATUS_LABEL[job.status]}</span>
                    </div>
                    <h3 className="font-bold text-slate-900">{job.service_type}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{job.description}</p>
                    <div className="text-xs text-slate-400 mt-2">
                      {job.file_count} file{job.file_count === 1 ? '' : 's'} · {formatPence(job.price_pence)} · {new Date(job.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </div>
                </div>
                {selectedJobId === job.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    {loadingDetail ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading files…</div>
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
                                  {f.file_size != null && <span className="text-xs text-slate-400">{f.file_size < 1024 * 1024 ? `${(f.file_size / 1024).toFixed(0)} KB` : `${(f.file_size / (1024 * 1024)).toFixed(1)} MB`}</span>}
                                  {job.status === 'pending' && <button onClick={() => {/* delete */}} className="text-slate-300 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>}
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
                                    {p.download_count > 0 && <div className="text-xs text-slate-400 mt-0.5">Downloaded {p.download_count} time{p.download_count === 1 ? '' : 's'}</div>}
                                  </div>
                                  <button onClick={() => downloadPack(p)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded shrink-0">
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

        <div className="mt-10 bg-slate-900 text-white rounded-xl p-6 flex items-start gap-3">
          <Lock className="w-5 h-5 text-white/70 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm">Your documents are secure</h3>
            <p className="text-xs text-white/60 mt-1">Files are encrypted in transit and at rest. No cloud AI processes your data. Every page is reviewed by a person. {COMPANY.parentCompany} is the data processor — see our <Link to="/privacy" className="underline">privacy policy</Link>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portal;