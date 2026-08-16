import React, { useState } from 'react';
import { 
  Send, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Image as ImageIcon, 
  Share2, 
  Bot, 
  Sparkles, 
  User as UserIcon,
  Video,
  FileCheck,
  X,
  Trash2,
  Pencil,
  MessageSquareWarning
} from 'lucide-react';
import { ContentPipelineItem, User } from '../types';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { determineContentPipelineCaptureStatus, determineContentPipelineResubmitStatus } from '../lib/statusTransitions';
import { uploadContentImage } from '../lib/contentImageUpload';

interface MediaAttachment {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
}

interface ContentPipelineViewProps {
  currentUser: User;
  contentPipeline: ContentPipelineItem[];
  onAddContent: (item: ContentPipelineItem) => void;
  onApproveDraft: (id: string) => void;
  onEditContent?: (item: ContentPipelineItem) => void;
  onRequestChanges?: (item: ContentPipelineItem, note: string) => void;
  onDeleteContent?: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const ContentPipelineView: React.FC<ContentPipelineViewProps> = ({
  currentUser,
  contentPipeline,
  onAddContent,
  onApproveDraft,
  onEditContent,
  onRequestChanges,
  onDeleteContent,
  onNavigateTab
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentPipelineItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [requestChangesItem, setRequestChangesItem] = useState<ContentPipelineItem | null>(null);
  const [requestChangesNote, setRequestChangesNote] = useState('');

  const openEditModal = (item: ContentPipelineItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditNotes(item.notes);
  };

  const saveEdit = () => {
    if (!editingItem || !onEditContent) return;
    // If the original submitter is fixing a "Needs Revision" draft, saving
    // their edit automatically resubmits it for approval and clears the
    // admin's feedback note (it's been addressed). If an admin is the one
    // editing, leave the status as-is -- they're just tidying up, not resubmitting.
    const isSelfResubmit = editingItem.status === 'Needs Revision' && currentUser.accountType !== 'admin';
    onEditContent({
      ...editingItem,
      title: editTitle,
      notes: editNotes,
      status: determineContentPipelineResubmitStatus(editingItem.status, currentUser.accountType),
      revisionNote: isSelfResubmit ? undefined : editingItem.revisionNote
    });
    setEditingItem(null);
  };

  const openRequestChangesModal = (item: ContentPipelineItem) => {
    setRequestChangesItem(item);
    setRequestChangesNote('');
  };

  const submitRequestChanges = () => {
    if (!requestChangesItem || !onRequestChanges || !requestChangesNote.trim()) return;
    onRequestChanges(requestChangesItem, requestChangesNote.trim());
    setRequestChangesItem(null);
    setRequestChangesNote('');
  };

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [mediaAttachments, setMediaAttachments] = useState<MediaAttachment[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Facebook', 'Instagram', 'LinkedIn']);

  const platformsList = ['Facebook', 'Instagram', 'LinkedIn', 'YouTube', 'WhatsApp'];

  const sampleImages = [
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop&q=80'
  ];

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Content Pipeline drafts are meant to be handed off between different
  // staff sessions (a Story Hunter captures now, an IT Lead approves days
  // later, likely in a different browser entirely) -- a blob: URL that only
  // works in the tab that created it breaks this workflow immediately, so
  // both images and video attachments here go to real Supabase Storage
  // (unlike AnnouncementsView, where video intentionally stays
  // preview-only since that publish flow is same-session).
  const handleMultipleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);
    const uploaded = await Promise.all(
      Array.from(files).map(async (file: File, idx: number) => {
        const url = await uploadContentImage(file, 'content-pipeline');
        return {
          id: `media-${Date.now()}-${idx}`,
          url: url || '',
          type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video',
          name: file.name
        };
      })
    );
    const succeeded = uploaded.filter(m => m.url);
    const failedCount = uploaded.length - succeeded.length;
    setMediaAttachments(prev => [...prev, ...succeeded]);
    setIsUploadingMedia(false);
    if (failedCount > 0) {
      alert(`${failedCount} file(s) failed to upload. Check your connection and try again.`);
    }
  };

  const handleAddUrlMedia = () => {
    if (!urlInput.trim()) return;
    const isVid = urlInput.endsWith('.mp4') || urlInput.includes('video') || urlInput.includes('youtube');
    setMediaAttachments(prev => [
      ...prev,
      {
        id: `media-url-${Date.now()}`,
        url: urlInput,
        type: isVid ? 'video' : 'image',
        name: isVid ? 'External Video Asset' : 'External Image Asset'
      }
    ]);
    setUrlInput('');
  };

  const handleRemoveMedia = (id: string) => {
    setMediaAttachments(prev => prev.filter(m => m.id !== id));
  };

  const handlePlatformToggle = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(selectedPlatforms.filter(item => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleSubmitNewContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const primaryPreview = mediaAttachments.length > 0 
      ? mediaAttachments[0].url 
      : sampleImages[Math.floor(Math.random() * sampleImages.length)];

    const newItem: ContentPipelineItem = {
      id: `cp-${Date.now()}`,
      title,
      capturedBy: `${currentUser.name} (${currentUser.title})`,
      role: currentUser.role,
      date: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      // BUG FIX: this used to auto-publish immediately for anyone with the
      // IT_LEAD staff *role* -- but role is not the same as account type,
      // and staff (non-admin) should NEVER be able to publish without an
      // admin approving first, regardless of which role they hold. Only a
      // true admin account bypasses the approval queue.
      status: determineContentPipelineCaptureStatus(currentUser.accountType),
      platform: selectedPlatforms as any,
      mediaPreviewUrl: primaryPreview,
      notes: notes || '4K progress footage captured for official subdomain update.',
      publishTimeMinutes: 5
    };

    onAddContent(newItem);
    setTitle('');
    setNotes('');
    setMediaAttachments([]);
    setUrlInput('');
    setShowAddForm(false);
  };

  return (
    <div id="content-pipeline-root" className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 pb-20">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Send size={16} />
            <span>Operational SLA Pipeline</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-white">
            Daily Operational Workflow (No-Code Friendly)
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Step 1 (Content Capture) &rarr; Step 2 (SE Lead Review &lt;10 min) &rarr; Step 3 (Multi-Channel Blast)
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center space-x-2 self-start md:self-auto"
        >
          <Plus size={16} />
          <span>Upload New Story / Asset Draft</span>
        </button>
      </div>

      {/* 3-Step Workflow Guidance Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center font-mono shrink-0">
            1
          </div>
          <div>
            <div className="font-bold text-white">Step 1: Content Capture</div>
            <div className="text-[11px] text-slate-400">Hotel School Crew captures 4K site progress, photos, CSR clips.</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center font-mono shrink-0">
            2
          </div>
          <div>
            <div className="font-bold text-amber-300">Step 2: Technical Publishing</div>
            <div className="text-[11px] text-slate-400">SE IT Lead reviews into template & publishes under 10 mins.</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center font-mono shrink-0">
            3
          </div>
          <div>
            <div className="font-bold text-white">Step 3: Multi-Channel Blast</div>
            <div className="text-[11px] text-slate-400">Syndicate URL across Facebook, LinkedIn, YouTube, WhatsApp.</div>
          </div>
        </div>
      </div>

      {/* New Draft Upload Form */}
      {showAddForm && (
        <form onSubmit={handleSubmitNewContent} className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 space-y-6 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
              <ImageIcon className="text-amber-400" size={18} />
              Upload New Media Asset / Story Draft
            </h3>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              Multi-File Support: Photos & Videos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cp-title" className="text-xs font-semibold text-slate-300 block mb-1">Story Title / Headline *</label>
              <input
                id="cp-title"
                type="text"
                required
                placeholder="e.g. 4K Drone View & Rolls-Royce Guest Fleet Unveiling"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/30 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Multiple File Upload Trigger Button */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Attach Photos & Videos (Multiple Files Allowed):
              </label>
              <label className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 hover:from-amber-500 hover:to-amber-400 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-md">
                <Video size={16} />
                <ImageIcon size={16} />
                <span>{isUploadingMedia ? 'Uploading...' : '+ Select Multiple Photos / Videos from Local Storage'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleMultipleFileUpload}
                  disabled={isUploadingMedia}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Add direct URL option */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center gap-2">
            <label htmlFor="cp-media-url" className="text-xs text-slate-400 font-medium shrink-0">Or Add External Media URL:</label>
            <input
              id="cp-media-url"
              type="text"
              placeholder="Paste direct Image or Video URL (e.g. https://...)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddUrlMedia}
              className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-lg text-xs font-bold transition-all shrink-0"
            >
              + Add URL
            </button>
          </div>

          {/* ATTACHED MEDIA GRID PREVIEW */}
          {mediaAttachments.length > 0 && (
            <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  Attached Media Items ({mediaAttachments.length})
                </span>
                <button
                  type="button"
                  onClick={() => setMediaAttachments([])}
                  className="text-[11px] text-red-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Clear All</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {mediaAttachments.map((item) => (
                  <div key={item.id} className="relative group rounded-xl overflow-hidden border border-amber-500/30 bg-black aspect-video flex items-center justify-center">
                    {item.type === 'video' ? (
                      <SmartVideoPlayer url={item.url} className="w-full h-full object-cover pointer-events-none" />
                    ) : (
                      <img src={item.url} alt="Attached media preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    )}

                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-amber-300 border border-amber-500/40">
                      {item.type === 'video' ? '📹 VIDEO' : '🖼️ PHOTO'}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(item.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-90 hover:opacity-100 hover:scale-110 transition-all shadow-md"
                      title="Remove Attachment"
                    >
                      <X size={12} />
                    </button>

                    <div className="absolute bottom-0 inset-x-0 p-1 bg-slate-950/90 text-[10px] text-slate-300 truncate font-mono text-center">
                      {item.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LARGE CAPTION / NOTES AREA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cp-notes" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                <span>Rich Caption & Technical Story Notes (Large Area) *</span>
              </label>
              <span className="text-[10px] text-amber-300 font-mono">
                {notes.length} characters
              </span>
            </div>
            <textarea
              id="cp-notes"
              required
              rows={9}
              placeholder="Type comprehensive caption & story details here... Include 4K drone details, luxury fleet arrivals, VIP quotes, press release statements, and official facts for insight.aviyana.lk..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-amber-500/40 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans leading-relaxed shadow-inner"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">Target Broadcast Channels:</label>
            <div className="flex flex-wrap gap-2">
              {platformsList.map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => handlePlatformToggle(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    selectedPlatforms.includes(p)
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {selectedPlatforms.includes(p) ? '✓ ' : '+ '}{p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md"
            >
              Submit Draft for SE Lead Review
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Content Pipeline Items List */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-lg text-white">Active Content Stream ({contentPipeline.length})</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contentPipeline.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="relative h-44 rounded-xl overflow-hidden mb-4 bg-slate-950">
                  <img src={item.mediaPreviewUrl} alt="Content pipeline media preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur-sm text-[10px] font-mono text-amber-300">
                    ⏱️ Processed in {item.publishTimeMinutes || 6} min
                  </div>
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.status === 'Published' 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                      : item.status === 'Needs Revision'
                      ? 'bg-red-950 text-red-300 border border-red-500/40'
                      : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                  }`}>
                    {item.status}
                  </div>
                </div>

                <h4 className="font-serif font-bold text-base text-white">{item.title}</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{item.notes}</p>

                {item.revisionNote && item.status === 'Needs Revision' && (
                  <div className="mt-3 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30">
                    <p className="text-[10px] font-bold text-red-300 uppercase tracking-wide mb-0.5">Changes Requested</p>
                    <p className="text-xs text-red-200">{item.revisionNote}</p>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.platform.map((pf, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                      {pf}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="text-[10px] text-slate-400 font-mono">
                  Captured by: <strong className="text-slate-200">{item.capturedBy}</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.status !== 'Published' && (currentUser.accountType === 'admin' || item.capturedBy.split(' (')[0] === currentUser.name) && (
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-all"
                      title="Edit this draft"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  {item.status === 'Pending SE Approval' && currentUser.accountType === 'admin' && (
                    <button
                      onClick={() => openRequestChangesModal(item)}
                      className="px-2.5 py-1.5 bg-slate-950 hover:bg-red-900/60 text-red-300 border border-red-500/40 font-semibold rounded-lg text-xs transition-all flex items-center space-x-1"
                      title="Send back to the submitter with a note on what to fix"
                    >
                      <MessageSquareWarning size={13} />
                      <span>Request Changes</span>
                    </button>
                  )}
                  {item.status === 'Pending SE Approval' && currentUser.accountType === 'admin' && (
                    <button
                      onClick={() => onApproveDraft(item.id)}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-md flex items-center space-x-1"
                    >
                      <CheckCircle2 size={13} />
                      <span>Approve & Publish</span>
                    </button>
                  )}
                  {onDeleteContent && (currentUser.role === 'IT_LEAD' || currentUser.accountType === 'admin') && (
                    <button
                      onClick={() => {
                        if (window.confirm('Remove this draft? This cannot be undone.')) onDeleteContent(item.id);
                      }}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-red-900 text-red-400 border border-red-500/40 transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT DRAFT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/20">
              <h3 className="font-serif font-bold text-lg text-white">Edit Draft</h3>
              <button onClick={() => setEditingItem(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="cp-edit-title" className="block text-[11px] font-semibold text-slate-300 mb-1">Title</label>
                <input id="cp-edit-title" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
              </div>
              <div>
                <label htmlFor="cp-edit-notes" className="block text-[11px] font-semibold text-slate-300 mb-1">Notes / Caption</label>
                <textarea id="cp-edit-notes" rows={4} value={editNotes} onChange={e => setEditNotes(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
              </div>
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs">Cancel</button>
                <button type="button" onClick={saveEdit} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST CHANGES MODAL -- admin sends the draft back to the person
          who submitted it, with a note on what needs fixing, instead of
          either approving it as-is or editing it themselves. */}
      {requestChangesItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-red-950/60 via-slate-900 to-red-950/60 border-b border-red-500/20">
              <h3 className="font-serif font-bold text-lg text-white">Request Changes</h3>
              <button onClick={() => setRequestChangesItem(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400">
                This sends <strong className="text-slate-200">"{requestChangesItem.title}"</strong> back to <strong className="text-slate-200">{requestChangesItem.capturedBy}</strong> to edit and resubmit. Explain what needs to change:
              </p>
              <textarea
                aria-label="Explain what needs to change"
                rows={4}
                autoFocus
                required
                value={requestChangesNote}
                onChange={e => setRequestChangesNote(e.target.value)}
                placeholder="e.g. Please re-check the date mentioned and add a source document before resubmitting."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
              />
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button type="button" onClick={() => setRequestChangesItem(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs">Cancel</button>
                <button type="button" onClick={submitRequestChanges} disabled={!requestChangesNote.trim()} className="px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs">Send Back for Edits</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
