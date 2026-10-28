import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { COMPANY } from '@/lib/config';

interface LegalPageProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export const LegalPage: React.FC<LegalPageProps> = ({ title, lastUpdated, children }) => (
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl font-black text-slate-900">{title}</h1>
      <p className="text-slate-500 mt-2 text-sm">
        Last updated: {lastUpdated ?? new Date().toLocaleDateString('en-GB')}
      </p>
      <div className="space-y-6 mt-10 text-sm text-slate-700 leading-relaxed">
        {children}
      </div>
      <div className="mt-12 pt-8 border-t border-slate-200 text-xs text-slate-400">
        <p>{COMPANY.name} is a trading name of {COMPANY.parentCompany}.</p>
        <p className="mt-1">Email: {COMPANY.email} · Web: {COMPANY.domain}</p>
      </div>
    </div>
  </div>
);

export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h2 className="text-xl font-bold text-slate-900 mt-8 mb-3">{title}</h2>
    {children}
  </div>
);

export const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-4">
    <h3 className="text-base font-semibold text-slate-800 mb-2">{title}</h3>
    {children}
  </div>
);

export default LegalPage;
