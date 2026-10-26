import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { COMPANY } from '@/lib/config';

const Terms: React.FC = () => (
  <div className="min-h-screen bg-white">
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Redact Direct" className="h-8 w-auto" />
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
      </div>
    </header>
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 prose prose-slate">
      <h1 className="text-3xl font-black text-slate-900">Terms of Service</h1>
      <p className="text-slate-500 mt-2">Last updated: {new Date().toLocaleDateString('en-GB')}</p>
      <div className="space-y-6 mt-8 text-sm text-slate-700 leading-relaxed">
        <p>{COMPANY.name} is a trading name of {COMPANY.parentCompany}. By using our services, you agree to these terms.</p>
        <h2 className="text-xl font-bold text-slate-900">Our role</h2>
        <p>We act as a data processor on your instructions. You retain responsibility for the lawful basis of disclosure and for determining what exemptions apply. We provide redaction services and advice on exemptions, but the final decision on what to disclose is yours.</p>
        <h2 className="text-xl font-bold text-slate-900">Pricing</h2>
        <p>Per-job pricing is confirmed before work begins. If a job is more complex than it first appears, we will confirm any additional cost before proceeding.</p>
        <h2 className="text-xl font-bold text-slate-900">Liability</h2>
        <p>We take reasonable care to redact personal data accurately. Every page is reviewed by a human. However, we are not liable for personal data that we were not instructed to redact, or for decisions made by you on what to disclose. Our liability is limited to the fee paid for the job.</p>
        <h2 className="text-xl font-bold text-slate-900">Data processing</h2>
        <p>Files are encrypted in transit and at rest. No cloud AI processes your data. An Article 28 processor agreement is available on request.</p>
        <h2 className="text-xl font-bold text-slate-900">Contact</h2>
        <p>{COMPANY.name}, a trading name of {COMPANY.parentCompany}. Email: {COMPANY.email}. Web: {COMPANY.domain}.</p>
      </div>
    </div>
  </div>
);

export default Terms;
