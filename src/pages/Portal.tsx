import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowLeft, Upload, FileText, X, CheckCircle2,
  Clock, Eye, Lock, Loader2, Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { COMPANY, formatPence, PRICING_TABLE } from '@/lib/config';
import { toast } from 'sonner';

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
  service_type: string;
  description: string;
  status: JobStatus;
  file_count: number;
  price_pence: number;
  created_at: string;
}

const Portal: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [form, setForm] = useState({
    serviceType: PRICING_TABLE[1].id,
    description: '',
  });

  const loadJobs = async () => {
    setLoading(true);
    // TODO: once Supabase is set up, load from redact_jobs table
    setLoading(false);
  };

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error('Add a short description of what needs redacting');
      return;
    }
    setCreating(true);
    // TODO: once Supabase is set up, insert into redact_jobs
    const pricing = PRICING_TABLE.find((p) => p.id === form.serviceType);
    const ref = `RD-${Date.now().toString().slice(-6)}`;
    const job: Job = {
      id: crypto.randomUUID(),
      reference: ref,
      service_type: pricing?.label ?? 'Document redaction',
      description: form.description.trim(),
      status: 'pending',
      file_count: 0,
      price_pence: pricing?.price ?? 7500,
      created_at: new Date().toISOString(),
    };
    setJobs((arr) => [job, ...arr]);
    setCreating(false);
    setShowForm(false);
    setForm({ serviceType: PRICING_TABLE[1].id, description: '' });
    setSelectedJob(job);
    toast.success('Job created', { description: `${ref} — upload your files below` });
  };

  const handleUpload = async (jobId: string, files: FileList) => {
    setUploading(true);
    // TODO: once Supabase is set up, upload to redact-files bucket
    setJobs((arr) =>
      arr.map((j) => j.id === jobId ? { ...j, file_count: j.file_count + files.length } : j)
    );
    if (selectedJob?.id === jobId) {
      setSelectedJob((j) => j ? { ...j, file_count: j.file_count + files.length } : null);
    }
    setUploading(false);
    toast.success(`${files.length} file${files.length === 1 ? '' : 's'} uploaded`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Your redaction jobs</h1>
            <p className="text-sm text-slate-500 mt-1">Upload documents, track progress, download redacted packs.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" /> New job
          </button>
        </div>

        {/* New job form */}
        {showForm && (
          <form onSubmit={createJob} className="bg-white rounded-xl border border-slate-200 p-6 mb-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create a new redaction job</h2>
              <button type="button" onClick={() => setShowForm(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Service type</label>
              <select
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 bg-white"
              >
                {PRICING_TABLE.map((p) => (
                  <option key={p.id} value={p.id}>{p.label} — {formatPence(p.price)} {p.unit}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 resize-y"
                placeholder="Briefly describe what needs redacting — e.g. 'SAR response for parent of Year 5 pupil — emails, attendance records, and a safeguarding log'"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Include the type of request (SAR, FOI, EIR), the volume, and anything sensitive we should know about.
              </p>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {creating ? 'Creating…' : 'Create job'}
            </button>
          </form>
        )}

        {/* Job list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : jobs.length === 0 && !showForm ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No redaction jobs yet</p>
            <p className="text-sm text-slate-500 mt-1">Click "New job" to upload documents for redaction.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`bg-white rounded-xl border p-5 cursor-pointer transition-all ${
                  selectedJob?.id === job.id ? 'border-slate-900 shadow-md' : 'border-slate-200 hover:border-slate-400'
                }`}
                onClick={() => setSelectedJob(job)}
              >
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
                {selectedJob?.id === job.id && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {job.status === 'pending' && (
                      <div className="mb-4">
                        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors">
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {uploading ? 'Uploading…' : 'Upload files'}
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.length) handleUpload(job.id, e.target.files);
                              e.target.value = '';
                            }}
                            disabled={uploading}
                          />
                        </label>
                        <p className="text-xs text-slate-400 mt-2">
                          Drop in the documents that need redacting. Files are encrypted in transit and at rest.
                        </p>
                      </div>
                    )}
                    {job.status === 'in_review' && (
                      <div className="flex items-start gap-2 text-sm text-blue-700 bg-blue-50 rounded-lg px-4 py-3">
                        <Eye className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Your documents are being reviewed and redacted. You'll get an email when the pack is ready.</span>
                      </div>
                    )}
                    {job.status === 'ready' && (
                      <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Your redacted pack is ready. Download it below.</span>
                        <button className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded">
                          <FileText className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
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
