import React, { useState, useMemo } from 'react';
import {
  Inbox,
  Mail,
  Phone,
  Search,
  Filter,
  BadgeCheck,
  Clock,
  CheckCircle2,
  UserCheck,
  Ticket,
  FileDown,
  Linkedin
} from 'lucide-react';
import { PublicInquiry, UserRegistration } from '../types';

interface InquiryDeskViewProps {
  inquiries: PublicInquiry[];
  registrations: UserRegistration[];
  onUpdateInquiryStatus: (inquiry: PublicInquiry, status: PublicInquiry['status']) => void;
}

type SubTab = 'inquiries' | 'registrations';

const CATEGORY_ORDER: PublicInquiry['category'][] = [
  'General Question',
  'Employment & Academy',
  'Press & Media',
  'Investment & Financial',
  'Environmental Clearance (CEA)',
  'Community Water Project'
];

const STATUS_STYLES: Record<PublicInquiry['status'], string> = {
  'Delivered to insight@aviyana.lk': 'bg-slate-800 text-slate-300 border-slate-700',
  'In Review': 'bg-amber-950/50 text-amber-300 border-amber-500/40',
  'Answered': 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40'
};

export const InquiryDeskView: React.FC<InquiryDeskViewProps> = ({
  inquiries,
  registrations,
  onUpdateInquiryStatus
}) => {
  const [subTab, setSubTab] = useState<SubTab>('inquiries');
  const [categoryFilter, setCategoryFilter] = useState<PublicInquiry['category'] | 'All'>('All');
  const [search, setSearch] = useState('');

  const filteredInquiries = useMemo(() => {
    return inquiries
      .filter(i => categoryFilter === 'All' || i.category === categoryFilter)
      .filter(i =>
        !search.trim() ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.email.toLowerCase().includes(search.toLowerCase()) ||
        i.question.toLowerCase().includes(search.toLowerCase()) ||
        i.ticketNumber.toLowerCase().includes(search.toLowerCase())
      );
  }, [inquiries, categoryFilter, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORY_ORDER) counts[cat] = 0;
    for (const i of inquiries) counts[i.category] = (counts[i.category] || 0) + 1;
    return counts;
  }, [inquiries]);

  const filteredRegistrations = useMemo(() => {
    return registrations.filter(r =>
      !search.trim() ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.vipPassCode.toLowerCase().includes(search.toLowerCase())
    );
  }, [registrations, search]);

  const pendingCount = inquiries.filter(i => i.status !== 'Answered').length;

  return (
    <div id="inquiry-desk-root" className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Inbox size={16} />
            <span>Inquiry Desk</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white mt-1">
            Every Question, Application & Registration in One Place
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Public questions, course/scholarship-related inquiries, press &amp; investment questions, and VIP/press registrations — all in one categorized inbox.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono shrink-0">
            {pendingCount} awaiting a response
          </div>
        )}
      </div>

      {/* Sub-tabs -- overflow-x-auto + whitespace-nowrap so these scroll
          horizontally on narrow phones instead of squeezing/wrapping badly
          or forcing the whole page to scroll sideways. */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setSubTab('inquiries')}
          className={`shrink-0 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${subTab === 'inquiries' ? 'bg-slate-900 text-amber-300 border-t border-x border-amber-500/30' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Inquiries & Questions ({inquiries.length})
        </button>
        <button
          onClick={() => setSubTab('registrations')}
          className={`shrink-0 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${subTab === 'registrations' ? 'bg-slate-900 text-amber-300 border-t border-x border-amber-500/30' : 'text-slate-500 hover:text-slate-300'}`}
        >
          VIP / Press Registrations ({registrations.length})
        </button>
      </div>

      {/* Search bar (shared) */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={subTab === 'inquiries' ? 'Search by name, email, ticket number, or question...' : 'Search by name, email, or VIP pass code...'}
          className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600"
        />
      </div>

      {subTab === 'inquiries' && (
        <>
          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 ${categoryFilter === 'All' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-amber-500/40'}`}
            >
              <Filter size={11} />
              All ({inquiries.length})
            </button>
            {CATEGORY_ORDER.filter(cat => categoryCounts[cat] > 0).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${categoryFilter === cat ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-amber-500/40'}`}
              >
                {cat} ({categoryCounts[cat]})
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredInquiries.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-10">No inquiries match this filter.</p>
            )}
            {filteredInquiries.map(inq => (
              <div key={inq.id} className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                      {inq.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Ticket size={11} />
                      {inq.ticketNumber}
                    </span>
                  </div>
                  <select
                    value={inq.status}
                    onChange={e => onUpdateInquiryStatus(inq, e.target.value as PublicInquiry['status'])}
                    className={`text-[11px] font-bold px-2 py-1 rounded-lg border font-mono cursor-pointer ${STATUS_STYLES[inq.status]}`}
                  >
                    <option value="Delivered to insight@aviyana.lk">Delivered — Unreviewed</option>
                    <option value="In Review">In Review</option>
                    <option value="Answered">Answered</option>
                  </select>
                </div>

                <p className="text-sm text-slate-100 leading-relaxed">{inq.question}</p>

                {(inq.cvUrl || inq.linkedinUrl) && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {inq.cvUrl && (
                      <a
                        href={inq.cvUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all"
                      >
                        <FileDown size={12} /> {inq.cvFileName || 'Download CV'}
                      </a>
                    )}
                    {inq.linkedinUrl && (
                      <a
                        href={inq.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0A66C2]/15 hover:bg-[#0A66C2]/30 text-[#4d9fef] border border-[#0A66C2]/40 text-[11px] font-semibold transition-all"
                      >
                        <Linkedin size={12} /> LinkedIn Profile
                      </a>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  <span className="font-semibold text-slate-300">{inq.name}</span>
                  <span className="flex items-center gap-1"><Mail size={11} />{inq.email}</span>
                  {inq.contact && inq.contact !== 'N/A' && <span className="flex items-center gap-1"><Phone size={11} />{inq.contact}</span>}
                  <span className="flex items-center gap-1 ml-auto"><Clock size={11} />{inq.submittedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {subTab === 'registrations' && (
        <div className="space-y-3">
          {filteredRegistrations.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-10">No registrations match this search.</p>
          )}
          {filteredRegistrations.map(reg => (
            <div key={reg.id} className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-emerald-400" />
                  <span className="font-semibold text-white text-sm">{reg.name}</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                    {reg.organizationRole}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1">
                  <BadgeCheck size={13} />
                  {reg.vipPassCode}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><Mail size={11} />{reg.email}</span>
                {reg.contact && <span className="flex items-center gap-1"><Phone size={11} />{reg.contact}</span>}
                <span className="flex items-center gap-1 ml-auto"><Clock size={11} />{reg.registeredAt}</span>
              </div>

              {reg.interests && reg.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                  {reg.interests.map((interest, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
