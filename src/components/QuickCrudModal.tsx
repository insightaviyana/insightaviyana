import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { uploadContentImage } from '../lib/contentImageUpload';

export interface QuickFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'image' | 'richtext';
  options?: string[];
  placeholder?: string;
  required?: boolean;
  /** For type 'richtext' only: enables the "+ Insert Photo in Article" /
   * "+ Insert Video (Preview Only)" buttons above the textarea, matching
   * AnnouncementsView's article body editor. Value is the Storage subfolder
   * for uploaded inline photos (e.g. "articles"). Omit to render a plain
   * (non-media) rich textarea. */
  mediaInsertFolder?: string;
  /** For type 'textarea' or 'richtext': helper caption shown just above the field. */
  helperText?: string;
  /** For type 'textarea' only: overrides the default 3-row height. Useful
   * for fields like a rumor/claim that often run a full sentence or two. */
  rows?: number;
}

interface QuickCrudModalProps {
  isOpen: boolean;
  title: string;
  fields: QuickFieldConfig[];
  initialValues: Record<string, string>;
  isEditing: boolean;
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
  onDelete?: () => void;
  /** Storage subfolder for any 'image' type fields, e.g. "milestones", "csr", "voice-cuts". */
  imageFolder?: string;
  /** Optional extra control rendered in the header, before the close button
   * (e.g. the Unified Content Editor's "Change type" back-link). */
  headerExtra?: React.ReactNode;
}

/**
 * A single reusable admin add/edit form used across the Public Hub page for
 * Milestones, CSR Impact cards, Voice Cuts, and FAQs -- rather than four
 * near-identical modal components, this one is driven by a field schema
 * passed in by the caller.
 */
export const QuickCrudModal: React.FC<QuickCrudModalProps> = ({
  isOpen,
  title,
  fields,
  initialValues,
  isEditing,
  onClose,
  onSave,
  onDelete,
  imageFolder = 'general',
  headerExtra
}) => {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  // Separate spinner tracking for richtext's inline "Insert Photo" button,
  // so it doesn't fight over the same flag as the plain 'image' field type.
  const [uploadingInlineKey, setUploadingInlineKey] = useState<string | null>(null);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(values);
  };

  const [uploadErrorKey, setUploadErrorKey] = useState<string | null>(null);
  const handleImageFileSelect = async (key: string, file: File) => {
    setUploadingKey(key);
    setUploadErrorKey(null);
    const url = await uploadContentImage(file, imageFolder);
    if (url) {
      setValues(prev => ({ ...prev, [key]: url }));
    } else {
      // Previously silent -- staff would see the spinner vanish with no
      // explanation and no way to tell whether it worked.
      setUploadErrorKey(key);
    }
    setUploadingKey(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/20">
          <h3 className="font-serif font-bold text-lg text-white">{title}</h3>
          <div className="flex items-center">
            {headerExtra}
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3 flex-1">
          {fields.map(field => (
            <div key={field.key}>
              <label htmlFor={field.key} className="block text-[11px] font-semibold text-slate-300 mb-1">{field.label}</label>
              {field.type === 'richtext' ? (
                <div className="space-y-1.5">
                  {field.mediaInsertFolder && (
                    <div className="flex items-center flex-wrap gap-2 text-[11px]">
                      <label className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded-lg cursor-pointer font-bold transition-all flex items-center space-x-1 border border-amber-500/30">
                        <ImageIcon size={13} />
                        <span>{uploadingInlineKey === field.key ? 'Uploading...' : '+ Insert Photo in Article'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingInlineKey === field.key}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadingInlineKey(field.key);
                            const url = await uploadContentImage(file, field.mediaInsertFolder!);
                            setUploadingInlineKey(null);
                            if (url) {
                              setValues(prev => ({ ...prev, [field.key]: `${prev[field.key] || ''}\n\n[IMAGE: ${url}]\n*(Photo: ${file.name})*\n\n` }));
                            } else {
                              alert('Image upload failed. Check your connection and try again.');
                            }
                          }}
                        />
                      </label>
                      <label
                        className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-slate-950 rounded-lg cursor-pointer font-bold transition-all flex items-center space-x-1 border border-blue-500/30"
                        title="Local video is preview-only in this browser tab -- it will NOT be saved and will show broken after a page reload. Paste a YouTube link in the article body instead for a video that actually persists."
                      >
                        <Video size={13} />
                        <span>+ Insert Video (Preview Only)</span>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setValues(prev => ({ ...prev, [field.key]: `${prev[field.key] || ''}\n\n[VIDEO: ${url}]\n*(Video Footage: ${file.name} -- ⚠ preview only, replace with a YouTube link before publishing)*\n\n` }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                  {field.helperText && (
                    <p className="text-[10px] text-slate-400">{field.helperText}</p>
                  )}
                  <textarea
                    id={field.key}
                    required={field.required}
                    rows={9}
                    placeholder={field.placeholder}
                    value={values[field.key] || ''}
                    onChange={(e) => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-sans leading-relaxed"
                  />
                </div>
              ) : field.type === 'textarea' ? (
                <textarea
                  id={field.key}
                  required={field.required}
                  rows={field.rows || 4}
                  placeholder={field.placeholder}
                  value={values[field.key] || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              ) : field.type === 'select' ? (
                <select
                  id={field.key}
                  required={field.required}
                  value={values[field.key] || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {(field.options || []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'image' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <input
                      id={field.key}
                      type="text"
                      required={field.required}
                      placeholder={field.placeholder || 'https://... or upload a file'}
                      value={values[field.key] || ''}
                      onChange={(e) => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs cursor-pointer font-bold shrink-0 flex items-center space-x-1.5 border border-slate-700">
                      {uploadingKey === field.key ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                      <span>{uploadingKey === field.key ? 'Uploading...' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingKey === field.key}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageFileSelect(field.key, file);
                        }}
                      />
                    </label>
                  </div>
                  {uploadErrorKey === field.key && (
                    <p className="text-[11px] text-red-400">Upload failed — check your connection and try again, or paste an image URL instead.</p>
                  )}
                  {values[field.key] && (
                    <img
                      src={values[field.key]}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded-lg border border-slate-800"
                    />
                  )}
                </div>
              ) : (
                <input
                  id={field.key}
                  type="text"
                  required={field.required}
                  placeholder={field.placeholder}
                  value={values[field.key] || ''}
                  onChange={(e) => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              )}
            </div>
          ))}

          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this item? This cannot be undone.')) onDelete();
                  }}
                  className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center space-x-1.5"
              >
                <Save size={14} />
                <span>{isEditing ? 'Save Changes' : 'Add'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
