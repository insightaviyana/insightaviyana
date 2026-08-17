import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { subscribeToNewsletter } from '../lib/newsletterApi';

interface NewsletterSubscribeProps {
  /** Compact renders as a single inline row (email + button); default
   * renders as a small card with a heading -- use compact when embedding
   * inside an already-titled section (e.g. next to Social Links). */
  compact?: boolean;
}

export const NewsletterSubscribe: React.FC<NewsletterSubscribeProps> = ({ compact = false }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('submitting');
    const err = await subscribeToNewsletter(email);
    if (err) {
      setStatus('error');
      setErrorMsg(err);
    } else {
      setStatus('done');
      setEmail('');
    }
  };

  if (status === 'done') {
    return (
      <div className={`flex items-center gap-2 text-emerald-400 text-xs font-semibold ${compact ? '' : 'p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl'}`}>
        <CheckCircle2 size={16} />
        <span>Subscribed — you'll get an email whenever we publish something new.</span>
      </div>
    );
  }

  const form = (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <div className="relative flex-1 sm:w-64">
        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@domain.com"
          aria-label="Email address"
          className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-amber-500/30 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
      >
        {status === 'submitting' ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        <span>Subscribe</span>
      </button>
    </form>
  );

  if (compact) {
    return (
      <div>
        {form}
        {status === 'error' && <p className="text-[10px] text-red-400 mt-1.5">{errorMsg}</p>}
      </div>
    );
  }

  return (
    <div className="p-5 bg-slate-950 border border-amber-500/20 rounded-2xl">
      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
        <Mail size={14} />
        <span>Subscribe for Updates</span>
      </div>
      <p className="text-xs text-slate-400 mb-3">Get an email whenever a new press release, milestone, or fact-check is published — no spam, unsubscribe anytime.</p>
      {form}
      {status === 'error' && <p className="text-[10px] text-red-400 mt-1.5">{errorMsg}</p>}
    </div>
  );
};
