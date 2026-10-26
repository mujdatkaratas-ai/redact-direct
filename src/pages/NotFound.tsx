import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const NotFound: React.FC = () => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center">
    <img src="/logo.png" alt="Redact Direct" className="h-16 w-auto mb-6" />
    <h1 className="text-4xl font-black text-slate-900">Page not found</h1>
    <p className="text-slate-500 mt-2">The page you're looking for doesn't exist.</p>
    <Link to="/" className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg">
      <ArrowLeft className="w-4 h-4" /> Back to home
    </Link>
  </div>
);

export default NotFound;
