import React, { useState, useEffect } from 'react';
import { X, Save, Camera, Loader2, Newspaper, Send } from 'lucide-react';
import { User, ArticleItem, ContentPipelineItem } from '../types';
import { updateProfileFields, uploadAvatar } from '../lib/supabaseAuth';
import { isSupabaseConfigured } from '../lib/supabase';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
  /** All published/authored articles -- used to show this person's own posts below the edit form. */
  articles?: ArticleItem[];
  /** All content pipeline drafts -- used to show this person's own captured content below the edit form. */
  contentPipeline?: ContentPipelineItem[];
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  articles = [],
  contentPipeline = []
}) => {
  const [name, setName] = useState(currentUser.name);
  const [title, setTitle] = useState(currentUser.title);
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatar);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BUG FIX: this modal is always mounted in App.tsx (isOpen only controls
  // visibility, not whether it exists), so the useState(currentUser.name)
  // initializers above only ever ran ONCE -- at app startup, before anyone
  // had signed in. That's why the form kept showing "Public Visitor / Not
  // Signed In" and a placeholder avatar no matter who was actually logged
  // in: the local form state was frozen at that first render forever.
  // Re-syncing here, every time the modal is opened (and whenever the
  // signed-in user changes while it's open), fixes that.
  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setTitle(currentUser.title);
      setAvatarPreview(currentUser.avatar);
      setError(null);
    }
  }, [isOpen, currentUser.id, currentUser.name, currentUser.title, currentUser.avatar]);

  if (!isOpen) return null;

  const isGuestOrUnauth = currentUser.id === 'public-visitor';

  // This person's own authored content, so they (or an admin looking at
  // their profile) can see what they've actually published/captured without
  // hunting through the Announcements or Content Pipeline tabs separately.
  const myArticles = articles.filter(a => a.author === currentUser.name);
  const myContent = contentPipeline.filter(c => c.capturedBy === currentUser.name);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview while the real upload happens in the background.
    const localPreviewUrl = URL.createObjectURL(file);
    setAvatarPreview(localPreviewUrl);

    if (!isSupabaseConfigured) {
      setError('Avatar uploads need Supabase Storage connected — this preview is local only and will reset on reload.');
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    const publicUrl = await uploadAvatar(currentUser.id, file);
    setUploadingAvatar(false);

    if (publicUrl) {
      setAvatarPreview(publicUrl);
      onUpdateUser({ ...currentUser, avatar: publicUrl });
    } else {
      setError('Avatar upload failed. Check that the "avatars" storage bucket exists (see the SQL setup).');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (isSupabaseConfigured && !isGuestOrUnauth) {
      const errMsg = await updateProfileFields(currentUser.id, { name, title });
      if (errMsg) {
        setError(errMsg);
        setSaving(false);
        return;
      }
    }

    onUpdateUser({ ...currentUser, name, title, avatar: avatarPreview });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/20">
          <h3 className="font-serif font-bold text-lg text-white">Edit Profile</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="flex flex-col items-center">
            <div className="relative">
              <img src={avatarPreview} alt="" className="w-24 h-24 rounded-full object-cover border-2 border-amber-400/60 shadow-lg" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
              <label className="absolute bottom-0 right-0 p-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-lg transition-all">
                {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploadingAvatar} />
              </label>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Click the camera icon to change your photo</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isGuestOrUnauth}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={isGuestOrUnauth}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white disabled:opacity-50"
            />
          </div>

          {isGuestOrUnauth && (
            <p className="text-[11px] text-amber-300/80 bg-amber-950/30 border border-amber-500/30 rounded-lg p-2.5">
              Sign in to edit your profile and save a picture permanently.
            </p>
          )}

          {error && (
            <div className="p-2.5 bg-red-950/50 border border-red-500/40 rounded-lg text-xs text-red-300">{error}</div>
          )}

          {!isGuestOrUnauth && (myArticles.length > 0 || myContent.length > 0) && (
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Their Work</h4>

              {myArticles.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-amber-300 flex items-center gap-1"><Newspaper size={11} /> Articles ({myArticles.length})</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {myArticles.slice(0, 10).map(a => (
                      <div key={a.id} className="flex items-center justify-between gap-2 text-[11px] bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                        <span className="text-slate-200 truncate">{a.title}</span>
                        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${a.status === 'Published' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'}`}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {myContent.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-amber-300 flex items-center gap-1"><Send size={11} /> Content Drafts ({myContent.length})</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {myContent.slice(0, 10).map(c => (
                      <div key={c.id} className="flex items-center justify-between gap-2 text-[11px] bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
                        <span className="text-slate-200 truncate">{c.title}</span>
                        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${c.status === 'Published' ? 'bg-emerald-950 text-emerald-300' : c.status === 'Pending SE Approval' ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>{c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isGuestOrUnauth}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
