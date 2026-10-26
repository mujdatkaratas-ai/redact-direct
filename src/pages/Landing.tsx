import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, FileText, Eye, Lock, CheckCircle2, ArrowRight,
  Building2, Scale, Clock, Server, Mail, Upload, Download,
} from 'lucide-react';
import { COMPANY, PRICING_TABLE, formatPence } from '@/lib/config';

const SERVICES = [
  {
    icon: FileText,
    title: 'Document redaction',
    desc: 'Emails, records, personnel files, safeguarding records — any document that needs personal data removed before disclosure.',
    price: 'from £75 per job',
  },
  {
    icon: ShieldCheck,
    title: 'Full SAR redaction',
    desc: 'Complete subject access request packs: third parties removed, staff in their work role kept, exemptions applied and explained.',
    price: 'from £250 per job',
  },
  {
    icon: Lock,
    title: 'Complex safeguarding SAR',
    desc: 'Multi-party, sensitive material, legal correspondence. Human review on every page, with a documented audit trail.',
    price: 'from £500 per job',
  },
  {
    icon: Eye,
    title: 'CCTV & video redaction',
    desc: 'Blur identifiable individuals, remove protected information, and prepare disclosure-ready footage.',
    price: 'from £10 per minute',
  },
  {
    icon: Scale,
    title: 'Managed disclosure',
    desc: 'We handle the entire request: review records, advise on exemptions, prepare redaction schedules and support your response.',
    price: 'from £750 per job',
  },
  {
    icon: Building2,
    title: 'Bulk & annual contracts',
    desc: 'Annual agreements for academy trusts, local authorities, housing associations and organisations with regular SAR volume.',
    price: 'individually quoted',
  },
];

const STEPS = [
  {
    icon: Upload,
    title: 'Upload your documents',
    desc: 'Create a job in the secure portal and upload the files that need redacting. No zipping, no passwords — just drop them in.',
  },
  {
    icon: ShieldCheck,
    title: 'We redact them',
    desc: 'Personal data is removed: third parties, identifiers, sensitive material. Every page is reviewed by a human, not just a machine.',
  },
  {
    icon: Download,
    title: 'Download the finished pack',
    desc: 'You get an email when the pack is ready. Sign in, download the redacted version, and use it for your disclosure.',
  },
];

const WHY = [
  { icon: Lock, title: 'No cloud AI', desc: 'Your documents are processed in a controlled environment. No external AI provider sees your data.' },
  { icon: Eye, title: 'Human review on every page', desc: 'AI assists with identification, but every page is checked by a person before it leaves us.' },
  { icon: Clock, title: 'Fast turnaround', desc: 'Standard jobs within 48 hours. Complex safeguarding material within 5 working days.' },
  { icon: Scale, title: 'UK GDPR compliant', desc: 'Article 28 processor agreements, documented audit trail, secure UK-based storage.' },
];

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Redact Direct" className="h-10 w-auto" />
          </Link>
          <nav className="flex items-center gap-6">
            <a href="#services" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:inline">Services</a>
            <a href="#how" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:inline">How it works</a>
            <a href="#security" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:inline">Security</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:inline">Pricing</a>
            <Link
              to="/portal"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded transition-colors"
            >
              Client portal <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-widest rounded mb-6">
            <Lock className="w-3.5 h-3.5" /> UK GDPR compliant
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">
            Secure redaction.<br />Confident disclosure.
          </h1>
          <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Upload your documents. We remove the personal data. You download the redacted pack.
            SAR, FOI and EIR redaction done by people who understand disclosure law — with AI to speed
            it up, not to cut corners.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/portal"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors"
            >
              Start a redaction job <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#services"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-slate-300 hover:border-slate-900 text-slate-900 font-bold rounded-lg transition-colors"
            >
              See what we redact
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-400">
            <span className="inline-flex items-center gap-1.5"><Lock className="w-4 h-4" /> No cloud AI</span>
            <span className="inline-flex items-center gap-1.5"><Eye className="w-4 h-4" /> Human review</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" /> 48-hour turnaround</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">What we redact</h2>
            <p className="mt-4 text-lg text-slate-600">
              Any document that contains personal data that needs removing before it's disclosed.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => {
              const I = s.icon;
              return (
                <div key={s.title} className="p-7 bg-white border border-slate-200 rounded-xl hover:border-slate-400 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-5">
                    <I className="w-6 h-6 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                  <div className="mt-4 text-sm font-bold text-slate-900">{s.price}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Air gap section */}
      <section id="security" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded mb-4">
              <Server className="w-3.5 h-3.5" /> Why we're different
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              Your documents never touch the cloud
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Most redaction services upload your files to a cloud server, send them to a third-party
              AI provider, and process them in a data centre you've never heard of. We don't.
            </p>
          </div>

          {/* Air gap explained */}
          <div className="grid md:grid-cols-2 gap-8 mb-10">
            {/* What others do */}
            <div className="bg-white rounded-xl border border-slate-200 p-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-red-50 rounded flex items-center justify-center">
                  <Lock className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="font-bold text-slate-900">Other redaction services</h3>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  Your files are uploaded to a cloud server
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  Documents are sent to a third-party AI provider (OpenAI, Google, AWS)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  Your data is processed in a data centre you can't audit
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  You have no way to verify your files were deleted after processing
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">✗</span>
                  A breach at the AI provider means your data is exposed
                </li>
              </ul>
            </div>

            {/* What we do */}
            <div className="bg-slate-900 text-white rounded-xl p-7">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="font-bold">Redact Direct</h3>
              </div>
              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  Files are uploaded through an encrypted portal to a controlled environment
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  Redaction runs on our own infrastructure — no third-party AI provider
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  No cloud model ever sees your documents
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  Files are deleted after the redacted pack is delivered — verified, not promised
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  Every page is reviewed by a person before it leaves us
                </li>
              </ul>
            </div>
          </div>

          {/* The air gap explained */}
          <div className="bg-white rounded-xl border-2 border-slate-900 p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shrink-0">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-2">What "air-gapped" means</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  An air gap is a physical separation between the system that processes your documents
                  and any external network. Your files move through the secure upload portal, are processed
                  in a controlled environment that has no connection to external AI services, and the
                  finished pack is delivered back through the same encrypted channel. At no point does
                  your data leave our control or pass through a third party. That's the difference between
                  <strong> "we use AI"</strong> and <strong>"we use AI, but your data never leaves our control."</strong>
                </p>
              </div>
            </div>

            {/* Flow diagram */}
            <div className="mt-8 grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-50 rounded-lg p-4">
                <Upload className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Step 1</div>
                <div className="text-sm font-semibold text-slate-900">Encrypted upload</div>
                <div className="text-xs text-slate-500 mt-1">TLS 1.3 in transit, encrypted at rest</div>
              </div>
              <div className="bg-slate-900 text-white rounded-lg p-4">
                <ShieldCheck className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-xs font-bold uppercase tracking-wider text-white/40 mb-1">Step 2</div>
                <div className="text-sm font-semibold">Air-gapped processing</div>
                <div className="text-xs text-white/50 mt-1">No external AI, no cloud, human review</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <Download className="w-6 h-6 text-slate-700 mx-auto mb-2" />
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Step 3</div>
                <div className="text-sm font-semibold text-slate-900">Secure download</div>
                <div className="text-xs text-slate-500 mt-1">Signed URL, 30-day retention, then deleted</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 lg:py-28 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-black">How it works</h2>
            <p className="mt-4 text-lg text-white/60">Three steps. No software to install, no contracts to sign for a single job.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => {
              const I = s.icon;
              return (
                <div key={s.title} className="text-center">
                  <div className="w-16 h-16 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center mb-5">
                    <I className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-5xl font-black text-white/10 mb-2">{i + 1}</div>
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Why Redact Direct</h2>
            <p className="mt-4 text-lg text-slate-600">The difference between redaction that's fast and redaction that's defensible.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY.map((w) => {
              const I = w.icon;
              return (
                <div key={w.title} className="p-6 bg-slate-50 rounded-xl">
                  <I className="w-8 h-8 text-slate-900 mb-4" />
                  <h3 className="font-bold text-slate-900 mb-2">{w.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{w.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Pricing</h2>
            <p className="mt-4 text-lg text-slate-600">Per job, not per hour. You know the price before we start.</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="text-left px-6 py-4 font-bold">Service</th>
                  <th className="text-left px-6 py-4 font-bold hidden sm:table-cell">Description</th>
                  <th className="text-right px-6 py-4 font-bold">Price</th>
                </tr>
              </thead>
              <tbody>
                {PRICING_TABLE.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-6 py-4 font-semibold text-slate-900">{row.label}</td>
                    <td className="px-6 py-4 text-slate-600 hidden sm:table-cell">{row.desc}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold text-slate-900">{formatPence(row.price)}</div>
                      <div className="text-xs text-slate-400">{row.unit}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-8 text-center">
            <Link
              to="/portal"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors"
            >
              Start a job <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            All prices exclude VAT. Per-job pricing means you know the cost before we start. Complex jobs may
            carry a higher fee if the volume or sensitivity requires it — we'll confirm before any work begins.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black">Ready to start?</h2>
          <p className="mt-4 text-lg text-white/60">
            Upload your documents through the secure portal. We'll confirm the price and start work the same day.
          </p>
          <div className="mt-8">
            <Link
              to="/portal"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-colors"
            >
              Open the client portal <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-slate-950 text-white/40 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <img src="/logo.png" alt="Redact Direct" className="h-8 w-auto" />
            <div className="text-sm">
              <Link to="/privacy" className="hover:text-white/80 mr-4">Privacy</Link>
              <Link to="/terms" className="hover:text-white/80">Terms</Link>
              <span className="ml-4">A trading name of {COMPANY.parentCompany}</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-white/30 text-center">
            {COMPANY.email} · {COMPANY.domain} · © {new Date().getFullYear()} {COMPANY.parentCompany}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
