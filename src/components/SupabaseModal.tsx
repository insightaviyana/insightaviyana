import React, { useState } from 'react';
import { Database, CheckCircle2, Copy, X, Server, Code, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `-- The full, up-to-date schema (profiles/accounts, announcements,
-- milestones, csr_impacts, voice_cuts, fact_checks, content_pipeline,
-- avatars storage bucket, and all RLS policies) lives in the project's
-- supabase-setup.sql file, not here -- this avoids two copies drifting
-- out of sync with each other.
--
-- Run it in: Supabase Dashboard -> SQL Editor -> New Query.
-- It's idempotent (safe to re-run any time, e.g. after pulling updates).`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-left">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-500/40">
              <Database size={22} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                <span>Supabase Database Integration</span>
                {isSupabaseConfigured ? (
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 size={10} /> Connected
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                    Client Mode Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">PostgreSQL cloud persistence for Aviyana Ceylon Resort ORM Hub</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Box */}
        <div className={`p-4 rounded-2xl border ${isSupabaseConfigured ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' : 'bg-slate-950 border-amber-500/30 text-slate-300'} text-xs leading-relaxed space-y-2`}>
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5 text-amber-300">
              <Server size={14} /> Environment Configuration Status
            </span>
            <span className="font-mono text-[11px]">
              {isSupabaseConfigured ? '🟢 Environment Variables Detected' : '🟡 Keys Pending in .env.example'}
            </span>
          </div>
          <p>
            {isSupabaseConfigured
              ? 'Your application is connected to your Supabase project URL and Anon key!'
              : 'To connect your live Supabase database instance, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your project environment settings.'}
          </p>
        </div>

        {/* SQL Copy Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Code size={14} /> Where the schema lives
            </span>
            <button
              onClick={handleCopySql}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Copy size={12} />
              <span>{copied ? '✓ Copied!' : 'Copy Note'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48 leading-relaxed">
            {sqlSchema}
          </pre>
        </div>

        {/* Action Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Official Supabase PostgreSQL Client</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
          >
            Close & Continue
          </button>
        </div>

      </div>
    </div>
  );
};
