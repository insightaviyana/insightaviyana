import React, { useState } from 'react';
import { X, Save, Trash2, Plus, Pencil } from 'lucide-react';
import { SocialLink } from '../types';

interface SocialLinksManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  socialLinks: SocialLink[];
  onSave: (link: SocialLink) => void;
  onDelete: (platform: string) => void;
}

const ICON_OPTIONS: SocialLink['iconName'][] = ['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok', 'whatsapp', 'globe', 'twitter'];

const EMPTY_LINK: SocialLink = { platform: '', handle: '', url: '', iconName: 'globe', description: '' };

/**
 * Small standalone admin editor for the footer/navbar social links list.
 * Kept separate from the generic QuickCrudModal (used for Milestones/CSR/
 * Voice Cuts/FAQ) since SocialLink has no numeric/timestamp id -- `platform`
 * itself is the unique key here.
 */
export const SocialLinksManagerModal: React.FC<SocialLinksManagerModalProps> = ({
  isOpen,
  onClose,
  socialLinks,
  onSave,
  onDelete
}) => {
  const [editing, setEditing] = useState<SocialLink | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.platform.trim() || !editing.url.trim()) return;
    onSave(editing);
    setEditing(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/20">
          <h3 className="font-serif font-bold text-lg text-white">Manage Social Links</h3>
          <button onClick={() => { onClose(); setEditing(null); }} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="sl-platform" className="block text-[11px] font-semibold text-slate-300 mb-1">Platform Name *</label>
                <input
                  id="sl-platform"
                  type="text"
                  required
                  placeholder="e.g. Instagram"
                  value={editing.platform}
                  onChange={(e) => setEditing({ ...editing, platform: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label htmlFor="sl-icon" className="block text-[11px] font-semibold text-slate-300 mb-1">Icon</label>
                <select
                  id="sl-icon"
                  value={editing.iconName}
                  onChange={(e) => setEditing({ ...editing, iconName: e.target.value as SocialLink['iconName'] })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {ICON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sl-handle" className="block text-[11px] font-semibold text-slate-300 mb-1">Handle (e.g. @aviyanaceylon)</label>
                <input
                  id="sl-handle"
                  type="text"
                  placeholder="@aviyanaceylon"
                  value={editing.handle}
                  onChange={(e) => setEditing({ ...editing, handle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label htmlFor="sl-url" className="block text-[11px] font-semibold text-slate-300 mb-1">URL *</label>
                <input
                  id="sl-url"
                  type="text"
                  required
                  placeholder="https://instagram.com/aviyanaceylon"
                  value={editing.url}
                  onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label htmlFor="sl-description" className="block text-[11px] font-semibold text-slate-300 mb-1">Description (optional)</label>
                <input
                  id="sl-description"
                  type="text"
                  placeholder="Short caption shown next to the link"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center space-x-1.5"
                >
                  <Save size={14} />
                  <span>Save</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing({ ...EMPTY_LINK })}
                className="w-full px-3 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
              >
                <Plus size={14} />
                <span>Add Social Link</span>
              </button>

              {socialLinks.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No social links added yet.</p>
              )}

              {socialLinks.map(link => (
                <div key={link.platform} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{link.platform}</div>
                    <div className="text-[11px] text-slate-400 truncate">{link.handle || link.url}</div>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...link })}
                      className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remove ${link.platform} from the site?`)) onDelete(link.platform);
                      }}
                      className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-400 border border-red-500/40 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
