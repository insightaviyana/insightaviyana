import React from 'react';
import { Download, Mail, Copy, Check, ShieldCheck, FileText, Image as ImageIcon, Rss, Plus, Pencil, Trash2 } from 'lucide-react';
import { Milestone, CSRImpact, Executive } from '../types';
import { TranslationDict } from '../lib/i18n';
import { QuickCrudModal, QuickFieldConfig } from './QuickCrudModal';
import aviyanaLogoFull from '../assets/aviyana-logo-full.png';
import aviyanaLogoMark from '../assets/aviyana-logo-mark.png';

interface PressKitViewProps {
  milestones: Milestone[];
  csrImpacts: CSRImpact[];
  onOpenQuestionModal?: () => void;
  t?: TranslationDict;
  executives?: Executive[];
  isStaffAuthenticated?: boolean;
  onSaveExecutive?: (exec: Executive) => void;
  onDeleteExecutive?: (id: string) => void;
}

const BOILERPLATE = `Aviyana Ceylon Resort is Sri Lanka's premier 7-Star luxury resort experience, opening August 2027. Every construction milestone, environmental clearance, and executive statement is published in real time on insight.aviyana.lk — the resort's official digital source of truth and reputation-management hub. The property will feature a bespoke chauffeur fleet, an on-site helipad, and a fact-check archive that directly addresses public questions and rumors with document-backed evidence.`;

const EXECUTIVE_FIELDS: QuickFieldConfig[] = [
  { key: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'e.g. Dr. Thisara Hewawasam' },
  { key: 'title', label: 'Title / Role', type: 'text', required: true, placeholder: 'e.g. Chairman & Founder' },
  { key: 'avatarUrl', label: 'Headshot Photo', type: 'image', required: true }
];

const LOGO_ASSETS = [
  { name: 'Full Logo (Wordmark + Mark)', file: 'aviyana-logo-full.png', src: aviyanaLogoFull, note: 'Transparent PNG, use on dark backgrounds' },
  { name: 'Logo Mark Only', file: 'aviyana-logo-mark.png', src: aviyanaLogoMark, note: 'Transparent PNG, square crop, use for avatars/favicons' },
];

function useCopied() {
  const [copied, setCopied] = React.useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable — silently ignore, the text is still selectable
    }
  };
  return { copied, copy };
}

export const PressKitView: React.FC<PressKitViewProps> = ({
  milestones,
  csrImpacts,
  onOpenQuestionModal,
  t,
  executives = [],
  isStaffAuthenticated,
  onSaveExecutive,
  onDeleteExecutive
}) => {
  const boilerplateCopy = useCopied();
  const [execModalOpen, setExecModalOpen] = React.useState(false);
  const [editingExec, setEditingExec] = React.useState<Executive | null>(null);

  const openAddExecutive = () => { setEditingExec(null); setExecModalOpen(true); };
  const openEditExecutive = (exec: Executive) => { setEditingExec(exec); setExecModalOpen(true); };

  const handleSaveExecutiveForm = (values: Record<string, string>) => {
    if (!onSaveExecutive) return;
    onSaveExecutive({
      id: editingExec?.id || `exec-${Date.now()}`,
      name: values.name,
      title: values.title,
      avatarUrl: values.avatarUrl,
      displayOrder: editingExec?.displayOrder ?? executives.length + 1
    });
    setExecModalOpen(false);
  };

  // Curated photo library: pull real, already-verified images from the
  // milestones and CSR/guest-voice content already in the CMS, rather than
  // maintaining a separate duplicate media set. Only items with a real
  // imageUrl are shown.
  const photoLibrary = [
    ...milestones.filter(m => m.imageUrl).map(m => ({ id: m.id, title: m.title, imageUrl: m.imageUrl, tag: m.category })),
    ...csrImpacts.filter(c => c.imageUrl).map(c => ({ id: c.id, title: c.title, imageUrl: c.imageUrl, tag: 'CSR / Guest Voice' })),
  ].slice(0, 12);

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="hero-band bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider mb-2">
          <ShieldCheck size={14} />
          <span>{t ? t.pressKit.badge : 'Official Press Kit'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">{t ? t.pressKit.title : 'Aviyana Insight — Press Kit'}</h1>
        <p className="text-sm text-slate-300 mt-2 max-w-2xl">
          {t ? t.pressKit.subtitle : (
            <>Everything a journalist needs in one place: logos, executive headshots, boilerplate copy, and a
            curated photo library. For anything not covered here, reach the press desk directly.</>
          )}
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <a
            href="mailto:insight@aviyana.lk?subject=Press%20Inquiry"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
          >
            <Mail size={13} />
            <span>insight@aviyana.lk</span>
          </a>
          {onOpenQuestionModal && (
            <button
              onClick={onOpenQuestionModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-amber-500/30 hover:border-amber-400/60 text-amber-300 text-xs font-semibold transition-colors"
            >
              <span>Submit a Press Question</span>
            </button>
          )}
          <a
            href="/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400/60 text-slate-200 text-xs font-semibold transition-colors"
            title="Subscribe via RSS"
          >
            <Rss size={13} className="text-amber-400" />
            <span>RSS Feed</span>
          </a>
        </div>
      </div>

      {/* Logos */}
      <section>
        <h2 className="text-lg font-serif font-bold text-white mb-1 flex items-center gap-2">
          <ImageIcon size={18} className="text-amber-400" />
          Logos
        </h2>
        <p className="text-xs text-slate-400 mb-4">High-resolution, transparent PNGs. Please don't stretch, recolor, or add effects.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LOGO_ASSETS.map(logo => (
            <div key={logo.file} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-slate-950 border border-amber-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={logo.src} alt={logo.name} loading="lazy" decoding="async" className="w-14 h-14 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white truncate">{logo.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{logo.note}</div>
                <a
                  href={logo.src}
                  download={logo.file}
                  className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold transition-colors"
                >
                  <Download size={12} />
                  <span>Download PNG</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Boilerplate */}
      <section>
        <h2 className="text-lg font-serif font-bold text-white mb-1 flex items-center gap-2">
          <FileText size={18} className="text-amber-400" />
          Boilerplate — About Aviyana
        </h2>
        <p className="text-xs text-slate-400 mb-4">Standard "About" paragraph for use in articles, press releases, or investor materials.</p>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-sm text-slate-200 leading-relaxed">{BOILERPLATE}</p>
          <button
            onClick={() => boilerplateCopy.copy(BOILERPLATE)}
            className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-colors"
          >
            {boilerplateCopy.copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{boilerplateCopy.copied ? 'Copied' : 'Copy text'}</span>
          </button>
        </div>
      </section>

      {/* Executive headshots -- editable by staff/admin (previously
          hardcoded stock photos with no way to update them). Empty state
          only ever shown to staff (a public visitor seeing an empty
          section with no way to fill it is a dead end); public visitors
          just see nothing here if no executives have been added yet. */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-serif font-bold text-white">Executive Headshots</h2>
          {isStaffAuthenticated && onSaveExecutive && (
            <button
              onClick={openAddExecutive}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all"
            >
              <Plus size={12} />
              <span>Add Executive</span>
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-4">For attribution in stories quoting or referencing these executives.</p>
        {executives.length === 0 ? (
          isStaffAuthenticated ? (
            <p className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl p-4">
              No executives added yet — click "Add Executive" above to add a photo, name, and title.
            </p>
          ) : null
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...executives].sort((a, b) => a.displayOrder - b.displayOrder).map(exec => (
              <div key={exec.id} className="relative group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {isStaffAuthenticated && onSaveExecutive && (
                  <div className="absolute top-2 right-2 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditExecutive(exec)}
                      className="p-1.5 rounded-lg bg-slate-950/90 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-all"
                      title="Edit"
                    >
                      <Pencil size={12} />
                    </button>
                    {onDeleteExecutive && (
                      <button
                        onClick={() => { if (window.confirm(`Remove ${exec.name} from the Press Kit?`)) onDeleteExecutive(exec.id); }}
                        className="p-1.5 rounded-lg bg-slate-950/90 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
                <div className="aspect-square overflow-hidden bg-slate-950">
                  <img src={exec.avatarUrl} alt={`${exec.name}, ${exec.title}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                </div>
                <div className="p-3.5">
                  <div className="text-sm font-bold text-white">{exec.name}</div>
                  <div className="text-[11px] text-amber-300 mt-0.5">{exec.title}</div>
                  <a
                    href={exec.avatarUrl}
                    download={`${exec.name.replace(/\s+/g, '-').toLowerCase()}-headshot.jpg`}
                    className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold transition-colors"
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add/Edit Executive Modal */}
      <QuickCrudModal
        isOpen={execModalOpen}
        title={editingExec ? 'Edit Executive' : 'Add Executive'}
        fields={EXECUTIVE_FIELDS}
        initialValues={editingExec ? { name: editingExec.name, title: editingExec.title, avatarUrl: editingExec.avatarUrl } : { name: '', title: '', avatarUrl: '' }}
        isEditing={!!editingExec}
        onClose={() => setExecModalOpen(false)}
        onSave={handleSaveExecutiveForm}
        onDelete={editingExec && onDeleteExecutive ? () => { onDeleteExecutive(editingExec.id); setExecModalOpen(false); } : undefined}
        imageFolder="executives"
      />

      {/* Curated photo library */}
      <section>
        <h2 className="text-lg font-serif font-bold text-white mb-1">Photo Library</h2>
        <p className="text-xs text-slate-400 mb-4">Verified construction, hospitality, and CSR imagery from the newsroom archive.</p>
        {photoLibrary.length === 0 ? (
          <p className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-xl p-4">
            No photo assets published yet — check back as milestones and CSR features go live.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photoLibrary.map(photo => (
              <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-slate-800 aspect-square bg-slate-950">
                <img src={photo.imageUrl} alt={photo.title} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 to-transparent p-2.5">
                  <div className="text-[10px] font-mono text-amber-300 uppercase tracking-wide">{photo.tag}</div>
                  <div className="text-xs text-white font-semibold truncate">{photo.title}</div>
                </div>
                <a
                  href={photo.imageUrl}
                  download
                  aria-label={`Download photo: ${photo.title}`}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/90 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Download size={13} />
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
