import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Search, Trash2, Download, Loader2, Users } from 'lucide-react';
import { NewsletterSubscriber, fetchNewsletterSubscribersFromDb, deleteNewsletterSubscriberFromDb } from '../lib/newsletterApi';

/**
 * Staff-only view of the newsletter subscriber list (see NewsletterSubscribe.tsx
 * for the public capture form, and newsletterApi.ts for the DB layer -- both
 * built in an earlier session, this is the "view/manage" half that wasn't
 * wired into any UI yet).
 *
 * Fetches lazily on mount rather than being part of the app's big initial
 * data fetch in App.tsx -- this table's RLS is staff-only-read, and a
 * public/logged-out visitor never needs this data at all, so there's no
 * reason to fetch it before someone with access actually opens this tab.
 */
export const NewsletterSubscribersView: React.FC = () => {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchNewsletterSubscribersFromDb();
      if (cancelled) return;
      if (result === null) {
        setLoadError('Could not load subscribers — Supabase may not be configured, or you may not have permission to view this list.');
      } else {
        setSubscribers(result);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!subscribers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter(s => s.email.toLowerCase().includes(q));
  }, [subscribers, search]);

  const handleDelete = async (sub: NewsletterSubscriber) => {
    if (!window.confirm(`Remove ${sub.email} from the subscriber list?`)) return;
    setDeletingId(sub.id);
    const err = await deleteNewsletterSubscriberFromDb(sub.id);
    if (err) {
      window.alert(`Could not remove this subscriber: ${err}`);
    } else {
      setSubscribers(prev => (prev ? prev.filter(s => s.id !== sub.id) : prev));
    }
    setDeletingId(null);
  };

  const handleExportCsv = () => {
    if (!subscribers || subscribers.length === 0) return;
    const rows = [['Email', 'Subscribed At'], ...subscribers.map(s => [s.email, s.subscribedAt])];
    const csv = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aviyana-newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Mail size={14} />
            <span>Newsletter Subscribers</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mt-1">
            Email Subscriber List
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Everyone who subscribed via the Public Hub's "Subscribe for Updates" form. Export to CSV to
            send an actual campaign through a mailing tool (Mailchimp, Resend broadcasts, etc.) — there's
            no bulk-send built into this app.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5">
            <Users size={13} className="text-amber-400" />
            {subscribers ? subscribers.length : '—'} subscriber{subscribers?.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={handleExportCsv}
            disabled={!subscribers || subscribers.length === 0}
            className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
        <input
          type="text"
          aria-label="Search subscribers by email"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span>Loading subscribers...</span>
        </div>
      ) : loadError ? (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-500/30 rounded-xl p-4">{loadError}</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-16">
          {search ? 'No subscribers match your search.' : 'No subscribers yet.'}
        </p>
      ) : (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Subscribed</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => (
                <tr key={sub.id} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-mono">{sub.email}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{sub.subscribedAt}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(sub)}
                      disabled={deletingId === sub.id}
                      aria-label={`Remove ${sub.email}`}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-40 transition-all"
                    >
                      {deletingId === sub.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
