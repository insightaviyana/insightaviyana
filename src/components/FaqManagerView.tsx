import React, { useState } from 'react';
import { 
  HelpCircle, 
  Plus, 
  CheckCircle2, 
  FileText, 
  Search, 
  Pencil,
  Trash2,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { FactCheckItem, User } from '../types';
import { determineFactCheckApprovalStatus } from '../lib/factCheckStatus';

interface FaqManagerViewProps {
  factChecks: FactCheckItem[];
  currentUser: User;
  isAdmin: boolean;
  onAddFactCheck: (item: FactCheckItem) => void;
  onEditFactCheck?: (item: FactCheckItem) => void;
  onDeleteFactCheck?: (id: string) => void;
  onApproveFactCheck?: (item: FactCheckItem) => void;
  onOpenDocument: (docName: string, title: string) => void;
}

type CategoryType = FactCheckItem['category'];
const CATEGORIES: CategoryType[] = ['Environment', 'Land & Permits', 'Construction', 'Community', 'Service', 'Investment & Financial'];

const emptyForm = {
  rumor: '', fact: '', officialSource: '', category: 'Environment' as CategoryType,
  status: 'Verified Fact' as FactCheckItem['status'], documentProof: ''
};

export const FaqManagerView: React.FC<FaqManagerViewProps> = ({
  factChecks,
  currentUser,
  isAdmin,
  onAddFactCheck,
  onEditFactCheck,
  onDeleteFactCheck,
  onApproveFactCheck,
  onOpenDocument
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'published' | 'pending'>('published');
  const [form, setForm] = useState(emptyForm);

  const pending = factChecks.filter(f => f.approvalStatus === 'Pending Approval');
  const published = factChecks.filter(f => f.approvalStatus === 'Published');
  const list = tab === 'pending' ? pending : published;

  const filtered = list.filter(f =>
    f.rumor.toLowerCase().includes(search.toLowerCase()) ||
    f.fact.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowAddModal(true);
  };

  const openEdit = (item: FactCheckItem) => {
    setForm({
      rumor: item.rumor, fact: item.fact, officialSource: item.officialSource,
      category: item.category, status: item.status, documentProof: item.documentProof || ''
    });
    setEditingId(item.id);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.rumor.trim() || !form.fact.trim()) return;

    if (editingId) {
      const existing = factChecks.find(f => f.id === editingId);
      if (!existing || !onEditFactCheck) return;
      onEditFactCheck({
        ...existing,
        rumor: form.rumor,
        fact: form.fact,
        officialSource: form.officialSource || existing.officialSource,
        category: form.category,
        status: form.status,
        documentProof: form.documentProof || undefined
      });
    } else {
      // Admins publish immediately; other staff go into the pending-approval
      // queue and only appear on the public Public Hub once an admin
      // approves them via the "Pending Approval" tab below.
      const newItem: FactCheckItem = {
        id: `fc-${Date.now()}`,
        rumor: form.rumor,
        fact: form.fact,
        officialSource: form.officialSource || 'Central Environmental Authority / SE Lead Verification',
        category: form.category,
        verifiedDate: new Date().toISOString().split('T')[0],
        status: form.status,
        documentProof: form.documentProof || undefined,
        approvalStatus: determineFactCheckApprovalStatus(isAdmin),
        createdBy: currentUser.name
      };
      onAddFactCheck(newItem);
    }

    setForm(emptyForm);
    setEditingId(null);
    setShowAddModal(false);
  };

  return (
    <div id="faq-manager-root" className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 pb-20">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <HelpCircle size={16} />
            <span>Official Fact-Check Database</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">
            Fact-Check & FAQ Management
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {isAdmin
              ? 'You publish immediately. Entries from other staff need your approval first.'
              : 'Your entries go to the Pending Approval queue until an admin approves them.'}
          </p>
        </div>

        <button
          onClick={openAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center space-x-2 self-start md:self-auto"
        >
          <Plus size={16} />
          <span>Add Fact Entry</span>
        </button>
      </div>

      {/* Tabs -- overflow-x-auto so these scroll horizontally on narrow
          phones instead of squeezing/wrapping badly. */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setTab('published')}
          className={`shrink-0 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all ${tab === 'published' ? 'bg-slate-900 text-amber-300 border-t border-x border-amber-500/30' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Published ({published.length})
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`shrink-0 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 ${tab === 'pending' ? 'bg-slate-900 text-amber-300 border-t border-x border-amber-500/30' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Clock size={12} /> Pending Approval ({pending.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
        <input
          type="text"
          placeholder="Search rumors or facts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-amber-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Add/Edit Form */}
      {showAddModal && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 space-y-4">
          <h3 className="font-serif font-bold text-base text-white">{editingId ? 'Edit Fact Entry' : 'Add New Myth Debunking / Fact Entry'}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Unverified Rumor / Claim:</label>
              <input
                type="text"
                required
                placeholder="e.g. Construction delayed due to permit issues."
                value={form.rumor}
                onChange={(e) => setForm({ ...form, rumor: e.target.value })}
                className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Category:</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as CategoryType })}
                className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Verified Official Fact:</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Full clearance obtained in Jan 2025 under Certificate #CEA/7S..."
              value={form.fact}
              onChange={(e) => setForm({ ...form, fact: e.target.value })}
              className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Official Document Source / Reference:</label>
            <input
              type="text"
              placeholder="e.g. Central Environmental Authority Approval Document #CEA/7S"
              value={form.officialSource}
              onChange={(e) => setForm({ ...form, officialSource: e.target.value })}
              className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md"
            >
              {editingId ? 'Save Changes' : isAdmin ? 'Publish Fact to Subdomain' : 'Submit for Approval'}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddModal(false); setEditingId(null); }}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Fact-Check List */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-10">
            {tab === 'pending' ? 'Nothing pending approval.' : 'No published fact-checks match this search.'}
          </p>
        )}
        {filtered.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                {item.category}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} />
                  <span>{item.status}</span>
                </span>
                {item.approvalStatus === 'Pending Approval' && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Clock size={10} /> Pending
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-red-300 line-through opacity-80 font-medium">
              {item.rumor}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs text-slate-100 leading-relaxed font-sans">
              <strong className="text-emerald-400 block mb-1">Official Verified Fact:</strong>
              {item.fact}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex-wrap gap-2">
              <span>Source: <strong className="text-slate-300">{item.officialSource}</strong>{item.createdBy && <span className="text-slate-600"> · added by {item.createdBy}</span>}</span>

              <div className="flex items-center gap-2">
                {item.documentProof && (
                  <button
                    onClick={() => onOpenDocument(item.documentProof!, item.rumor)}
                    className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500 hover:text-slate-950 font-semibold text-xs transition-all flex items-center gap-1"
                  >
                    <FileText size={12} />
                    <span>View Proof</span>
                  </button>
                )}
                {item.approvalStatus === 'Pending Approval' && isAdmin && onApproveFactCheck && (
                  <button
                    onClick={() => onApproveFactCheck({ ...item, approvalStatus: 'Published' })}
                    className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-slate-950 font-semibold text-xs transition-all flex items-center gap-1"
                  >
                    <ShieldCheck size={12} />
                    <span>Approve & Publish</span>
                  </button>
                )}
                {onEditFactCheck && (
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-all"
                    title="Edit"
                  >
                    <Pencil size={12} />
                  </button>
                )}
                {onDeleteFactCheck && (
                  <button
                    onClick={() => { if (window.confirm('Delete this fact-check entry?')) onDeleteFactCheck(item.id); }}
                    className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
