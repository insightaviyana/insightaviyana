import React, { useMemo, useState } from 'react';
import { History, Search, Plus, Pencil, Trash2, CheckCircle2, RefreshCw, UserCog, Send, Calendar, X } from 'lucide-react';
import { ActivityLogEntry } from '../types';

interface ActivityLogViewProps {
  entries: ActivityLogEntry[];
}

const actionIcon = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes('delete')) return <Trash2 size={13} className="text-red-400" />;
  if (a.includes('approve') || a.includes('publish')) return <CheckCircle2 size={13} className="text-emerald-400" />;
  if (a.includes('edit') || a.includes('status') || a.includes('update')) return <RefreshCw size={13} className="text-amber-400" />;
  if (a.includes('create') || a.includes('add')) return <Plus size={13} className="text-amber-400" />;
  if (a.includes('account') || a.includes('user')) return <UserCog size={13} className="text-amber-400" />;
  return <Send size={13} className="text-amber-400" />;
};

/** Entries created in this session before the DB confirms them carry
 * createdAt: 'Just now' rather than a real timestamp -- treat those as
 * happening right now (today) for day-grouping/filtering purposes. */
const entryDate = (createdAt: string): Date => {
  if (createdAt === 'Just now') return new Date();
  const parsed = new Date(createdAt);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

const dayKey = (d: Date) => d.toISOString().split('T')[0];

const dayLabel = (dateKey: string): string => {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';
  return new Date(dateKey).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ entries }) => {
  const [search, setSearch] = useState('');
  const [dayFilter, setDayFilter] = useState(''); // '' = all days, else 'YYYY-MM-DD'

  const filtered = useMemo(() => {
    let result = entries;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.actorName.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.targetType.toLowerCase().includes(q) ||
        e.targetTitle.toLowerCase().includes(q) ||
        (e.detail || '').toLowerCase().includes(q)
      );
    }
    if (dayFilter) {
      result = result.filter(e => dayKey(entryDate(e.createdAt)) === dayFilter);
    }
    return result;
  }, [entries, search, dayFilter]);

  // Group the filtered results by day so browsing "All Days" still reads
  // clearly with day headers, instead of one long undifferentiated list.
  const groupedByDay = useMemo(() => {
    const groups = new Map<string, ActivityLogEntry[]>();
    for (const entry of filtered) {
      const key = dayKey(entryDate(entry.createdAt));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }
    return Array.from(groups.entries()).sort((a, b) => (b[0] as string).localeCompare(a[0] as string));
  }, [filtered]);

  // Available days for the dropdown, newest first.
  const availableDays = useMemo(() => {
    const days = new Set<string>(entries.map(e => dayKey(entryDate(e.createdAt))));
    return Array.from(days).sort((a, b) => b.localeCompare(a));
  }, [entries]);

  return (
    <div id="activity-log-root" className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 pb-20">
      <div>
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <History size={16} />
          <span>Activity Log</span>
        </div>
        <h1 className="text-2xl font-serif font-bold text-white mt-1">Who Did What, and When</h1>
        <p className="text-xs text-slate-400 mt-1">
          A running record of staff/admin actions across the portal — publishing, edits, approvals, deletions, and account changes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by person, action, or item..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600"
          />
        </div>

        <div className="relative sm:w-56 shrink-0">
          <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            value={dayFilter}
            onChange={e => setDayFilter(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white appearance-none cursor-pointer"
          >
            <option value="">All Days</option>
            {availableDays.map(d => (
              <option key={d} value={d}>{dayLabel(d)}</option>
            ))}
          </select>
          {dayFilter && (
            <button
              onClick={() => setDayFilter('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              title="Clear day filter"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-xs text-slate-500 text-center py-16">
          {entries.length === 0 ? 'No activity recorded yet — actions will start appearing here as staff use the portal.' : 'No activity matches this filter.'}
        </p>
      )}

      <div className="space-y-6">
        {groupedByDay.map(([day, dayEntries]) => (
          <div key={day} className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-amber-300 uppercase tracking-wide sticky top-0 bg-slate-950 py-1">
              <Calendar size={12} />
              <span>{dayLabel(day)}</span>
              <span className="text-slate-600 font-normal normal-case">({dayEntries.length})</span>
            </div>
            {dayEntries.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-xl px-4 py-3 transition-all">
                <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
                  {actionIcon(entry.action)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-200 leading-relaxed">
                    <span className="font-bold text-white">{entry.actorName}</span>
                    <span className="text-slate-500"> ({entry.actorRole.replace(/_/g, ' ')}) </span>
                    <span className="text-amber-300">{entry.action}</span>
                    <span className="text-slate-400"> {entry.targetType.toLowerCase()}: </span>
                    <span className="font-semibold text-slate-100">"{entry.targetTitle}"</span>
                    {entry.detail && <span className="text-slate-500"> — {entry.detail}</span>}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">{entry.createdAt}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
