import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { COMPANY } from '@/lib/config';

const Privacy: React.FC = () => (
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
      <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
      <p className="text-slate-500 mt-2">Last updated: {new Date().toLocaleDateString('en-GB')}</p>
      <div className="space-y-6 mt-8 text-sm text-slate-700 leading-relaxed">
        <p>{COMPANY.name} is a trading name of {COMPANY.parentCompany}. We are a data processor acting on behalf of organisations (controllers) that need personal data redacting from documents before disclosure.</p>
        <h2 className="text-xl font-bold text-slate-900">What we process</h2>
        <p>When you upload documents for redaction, we process the personal data they contain for the purpose of removing it. We do not use your data for any other purpose.</p>
        <h2 className="text-xl font-bold text-slate-900">No cloud AI</h2>
        <p>Your documents are processed in a controlled environment. No external AI provider sees your data. AI-assisted identification is subject to human review on every page.</p>
        <h2 className="text-xl font-bold text-slate-900">Data retention</h2>
        <p>Redacted packs are available for download for 30 days after they are marked as ready. After that, the files are permanently deleted. We retain a record of the job (reference, date, status) for audit purposes only.</p>
        <h2 className="text-xl font-bold text-slate-900">Your rights</h2>
        <p>You have the right to access, rectify, erase, and restrict the processing of your personal data. To exercise these rights, contact us at {COMPANY.email}.</p>
        <h2 className="text-xl font-bold text-slate-900">Contact</h2>
        <p>{COMPANY.name}, a trading name of {COMPANY.parentCompany}. Email: {COMPANY.email}. Web: {COMPANY.domain}.</p>
      </div>
    </div>
  </div>
);

export default Privacy;
