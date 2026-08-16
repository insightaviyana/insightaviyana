import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  PenTool, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Video, 
  Image as ImageIcon, 
  Play, 
  Plus, 
  Eye, 
  Upload, 
  Download, 
  Share2, 
  Check, 
  Sparkles, 
  Megaphone, 
  ShieldCheck, 
  X,
  Send,
  MessageSquare,
  Paperclip,
  Trash2,
  Pencil,
  Printer
} from 'lucide-react';
import { ArticleItem, User as UserType } from '../types';
import { SmartVideoPlayer, isYouTubeUrl } from './SmartVideoPlayer';
import { ArticleContentRenderer } from './ArticleContentRenderer';
import { uploadContentImage } from '../lib/contentImageUpload';
import { determineNewArticleStatus, determineEditedArticleStatus } from '../lib/statusTransitions';

/** Lets another tab (e.g. the Investment page) ask this view to open its
 * composer already in "new" or "edit" mode, instead of duplicating a
 * second article-writing UI elsewhere. */
export type ArticleComposerIntent =
  | { mode: 'new'; category?: ArticleItem['category'] }
  | { mode: 'edit'; articleId: string };

interface AnnouncementsViewProps {
  articles: ArticleItem[];
  currentUser: UserType;
  isStaffAuthenticated: boolean;
  isAdmin: boolean;
  isDbConnected: boolean;
  onAddArticle: (article: ArticleItem) => void;
  onEditArticle?: (article: ArticleItem) => void;
  onDeleteArticle?: (articleId: string) => void;
  onOpenQuestionModal: () => void;
  onOpenAuthModal?: () => void;
  externalIntent?: ArticleComposerIntent | null;
  onExternalIntentHandled?: () => void;
  /** Opens the top-level Unified Content Editor pre-set to 'article' (and to
   * a specific article's id when editing) -- replaces this page's own
   * composer as the primary entry point. See UnifiedContentEditor.tsx. */
  onOpenContentEditor?: (id?: string) => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  articles,
  currentUser,
  isStaffAuthenticated,
  isAdmin,
  isDbConnected,
  onAddArticle,
  onEditArticle,
  onDeleteArticle,
  onOpenQuestionModal,
  onOpenAuthModal,
  externalIntent,
  onExternalIntentHandled,
  onOpenContentEditor
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(articles[0] || null);
  const [writerModalOpen, setWriterModalOpen] = useState<boolean>(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  // Any signed-in staff member can publish/edit/delete announcements (small trusted ORM team).
  // Public visitors can read everything here but can't post or manage content.
  const canManagePosts = isStaffAuthenticated;

  // Video Lounge state
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>(
    articles[0]?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  );
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>(
    articles[0]?.videoCaption || 'Aviyana Ceylon Resort Drone Teaser & Presidential Suites Overview'
  );

  // Article Writer Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState<ArticleItem['category']>('Press Release');
  const [newContent, setNewContent] = useState('');
  const [newCoverImage, setNewCoverImage] = useState('https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoCaption, setNewVideoCaption] = useState('');
  const [newTags, setNewTags] = useState('Grand Opening, CEA Approval, Luxury');
  const [localVideoFileName, setLocalVideoFileName] = useState<string>('');
  const [localImageFileName, setLocalImageFileName] = useState<string>('');

  const categories = ['All', 'Investor Update', 'Hotel School', 'Career & Hiring', 'Press Release', 'Grand Opening', 'Sustainability & CEA', 'Community & CSR', 'Resort Milestone'];

  const filteredArticles = articles.filter(art => {
    const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          art.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Local File Upload Handlers for Image and Video.
  // Image uploads go to real Supabase Storage (persists across reloads and
  // for every visitor). Video intentionally stays local-preview-only --
  // see the warning text near the video field below -- since hosting large
  // video files isn't a good fit for this storage bucket; YouTube is the
  // recommended path for a video that actually needs to persist.
  const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false);
  const [isUploadingInlineImage, setIsUploadingInlineImage] = useState(false);

  const handleLocalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCoverImage(true);
    const url = await uploadContentImage(file, 'articles');
    setIsUploadingCoverImage(false);
    if (url) {
      setNewCoverImage(url);
      setLocalImageFileName(file.name);
    } else {
      alert('Image upload failed. Check your connection and try again, or paste an image URL instead.');
    }
  };

  const handleLocalVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setNewVideoUrl(localUrl);
      setLocalVideoFileName(file.name);
    }
  };

  const resetWriterForm = () => {
    setNewTitle('');
    setNewSubtitle('');
    setNewContent('');
    setNewCoverImage('https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80');
    setNewVideoUrl('');
    setNewVideoCaption('');
    setNewTags('Grand Opening, CEA Approval, Luxury');
    setNewCategory('Press Release');
    setLocalVideoFileName('');
    setLocalImageFileName('');
    setEditingArticleId(null);
  };

  const handleStartEdit = (article: ArticleItem) => {
    setEditingArticleId(article.id);
    setNewTitle(article.title);
    setNewSubtitle(article.subtitle);
    setNewCategory(article.category);
    setNewContent(article.content);
    setNewCoverImage(article.coverImageUrl);
    setNewVideoUrl(article.videoUrl || '');
    setNewVideoCaption(article.videoCaption || '');
    setNewTags(article.tags.join(', '));
    setLocalVideoFileName('');
    setLocalImageFileName('');
    setWriterModalOpen(true);
  };

  // Lets another tab (currently: the Investment page's "+ Publish Investment
  // Update" and per-article Edit buttons) open this composer directly,
  // instead of that page needing its own separate article-writing UI.
  useEffect(() => {
    if (!externalIntent) return;
    if (externalIntent.mode === 'new') {
      resetWriterForm();
      if (externalIntent.category) setNewCategory(externalIntent.category);
      setWriterModalOpen(true);
    } else if (externalIntent.mode === 'edit') {
      const article = articles.find(a => a.id === externalIntent.articleId);
      if (article) handleStartEdit(article);
    }
    onExternalIntentHandled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalIntent]);

  const handlePublishArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const tagArray = newTags.split(',').map(t => t.trim()).filter(Boolean);

    // Editing an existing post: preserve its identity/metadata, update only the editable fields.
    if (editingArticleId) {
      const original = articles.find(a => a.id === editingArticleId);
      if (original && onEditArticle) {
        const updated: ArticleItem = {
          ...original,
          title: newTitle.trim(),
          subtitle: newSubtitle.trim() || original.subtitle,
          category: newCategory,
          content: newContent.trim(),
          coverImageUrl: newCoverImage,
          videoUrl: newVideoUrl || undefined,
          videoCaption: newVideoCaption || original.videoCaption,
          mediaType: newVideoUrl ? 'both' : 'image',
          tags: tagArray.length > 0 ? tagArray : original.tags,
          // Admin edits keep the current status as-is (admin can already publish
          // directly). A staff edit to any post sends it back for approval, so a
          // "quick tweak" can't be used to slip changes past review.
          status: determineEditedArticleStatus(isAdmin, original.status)
        };
        onEditArticle(updated);
        setSelectedArticle(updated);
        if (newVideoUrl) {
          setActiveVideoUrl(newVideoUrl);
          setActiveVideoTitle(newTitle);
        }
      }
      resetWriterForm();
      setWriterModalOpen(false);
      return;
    }

    const created: ArticleItem = {
      id: `art-${Date.now()}`,
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Official Press Release from insight.aviyana.lk',
      category: newCategory,
      author: currentUser.name,
      authorRole: currentUser.title,
      authorAvatarUrl: currentUser.avatar,
      date: new Date().toISOString().split('T')[0],
      content: newContent.trim(),
      coverImageUrl: newCoverImage,
      videoUrl: newVideoUrl || undefined,
      videoCaption: newVideoCaption || 'Official Video Preview',
      mediaType: newVideoUrl ? 'both' : 'image',
      // Admins publish straight to the public site. Everyone else's post goes
      // to "In Review" -- it's saved and visible to the staff team here, but
      // PublicHubView only ever shows status === 'Published', so it stays off
      // the public site until an admin approves it below.
      status: determineNewArticleStatus(isAdmin),
      viewsCount: 1,
      featured: true,
      tags: tagArray.length > 0 ? tagArray : ['Official']
    };

    onAddArticle(created);
    setSelectedArticle(created);
    if (newVideoUrl) {
      setActiveVideoUrl(newVideoUrl);
      setActiveVideoTitle(newTitle);
    }

    resetWriterForm();
    setWriterModalOpen(false);
  };

  // Admin-only: approve a staff-submitted post and publish it live.
  const handleApproveArticle = (art: ArticleItem) => {
    if (!onEditArticle) return;
    onEditArticle({ ...art, status: 'Published' });
    if (selectedArticle?.id === art.id) {
      setSelectedArticle({ ...art, status: 'Published' });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Banner & Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/80 border border-amber-500/30 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
              <Megaphone size={14} className="text-amber-400" />
              <span>Official Press & Announcement Hub</span>
              <span className="text-amber-500">•</span>
              <span className="font-bold">insight.aviyana.lk</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
              Announcements, Press Statements & <br className="hidden sm:inline"/>
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                Grand Opening Article Studio
              </span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              Publishing verified resort milestones, 4K architectural video footage, Central Environmental Authority (CEA) clearance reports, and hospitality academy updates directly to the world.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {canManagePosts ? (
                <button
                  onClick={() => { if (onOpenContentEditor) onOpenContentEditor(); else { resetWriterForm(); setWriterModalOpen(true); } }}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
                >
                  <PenTool size={16} />
                  <span>Write New Article / Press Release</span>
                </button>
              ) : (
                onOpenAuthModal && (
                  <button
                    onClick={onOpenAuthModal}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-bold rounded-xl text-xs transition-all flex items-center space-x-2"
                    title="Only signed-in staff can publish official announcements"
                  >
                    <PenTool size={16} />
                    <span>Staff Sign In to Publish</span>
                  </button>
                )
              )}

              <button
                onClick={onOpenQuestionModal}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
              >
                <MessageSquare size={16} />
                <span>Ask Question (insight@aviyana.lk)</span>
              </button>
            </div>
          </div>

          {/* Quick Counter Box */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 shrink-0 space-y-3 lg:w-64">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">Published Statements</div>
            <div className="text-3xl font-serif font-bold text-amber-300">{articles.length} Press Releases</div>
            <div className="text-[11px] text-emerald-400 flex items-center space-x-1 font-mono">
              <Check size={12} />
              <span>100% CEA Fact-Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED VIDEO CINEMA PLAYER LOUNGE */}
      <div className="bg-slate-950 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Video size={20} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg text-white">4K Media Cinema & Local Video Player</h2>
              <p className="text-xs text-slate-400">
                Play local uploaded video media or official 4K drone progress previews
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            {activeVideoTitle}
          </span>
        </div>

        {/* Video Screen Box */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video max-h-[480px] shadow-2xl flex items-center justify-center group">
          {activeVideoUrl ? (
            <SmartVideoPlayer
              url={activeVideoUrl}
              className="w-full h-full object-contain"
              poster={selectedArticle?.coverImageUrl}
              title={activeVideoTitle}
            />
          ) : (
            <div className="text-center p-8 space-y-3">
              <Video size={48} className="text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No Video Selected. Click on an article with video preview or upload a local file.</p>
            </div>
          )}
        </div>
      </div>

      {/* CATEGORY FILTERS & SEARCH BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            aria-label="Search articles and press statements"
            placeholder="Search articles & press statements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* ARTICLES GRID & READER SPLIT VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Article Cards Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
            Statements & Press Releases ({filteredArticles.length})
          </h3>

          <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
            {filteredArticles.map((art) => {
              const isSelected = selectedArticle?.id === art.id;
              return (
                <div
                  key={art.id}
                  onClick={() => {
                    setSelectedArticle(art);
                    if (art.videoUrl) {
                      setActiveVideoUrl(art.videoUrl);
                      setActiveVideoTitle(art.title);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-950/60 to-slate-900 border-amber-400/80 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {art.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar size={11} />
                      {art.date}
                    </span>
                  </div>

                  {art.status !== 'Published' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-500/40 mb-1.5">
                      ⏳ {art.status === 'In Review' ? 'Pending Admin Approval' : art.status}
                    </span>
                  )}

                  <h4 className="text-sm font-serif font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                    {art.title}
                  </h4>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {art.subtitle}
                  </p>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px]">
                    <span className="flex items-center gap-1.5 text-slate-300 font-medium min-w-0">
                      <img src={art.authorAvatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(art.author)}`} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <span className="truncate">By {art.author}</span>
                    </span>
                    <div className="flex items-center space-x-2">
                      {art.videoUrl && (
                        <span className="text-amber-400 font-mono text-[10px] flex items-center gap-0.5">
                          <Play size={10} className="fill-amber-400" /> Video
                        </span>
                      )}
                      <span className="text-slate-400 font-mono flex items-center gap-1">
                        <Eye size={12} /> {art.viewsCount}
                      </span>
                      {isAdmin && art.status === 'In Review' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveArticle(art);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 transition-colors"
                          title="Approve & Publish"
                        >
                          <Check size={13} />
                        </button>
                      )}
                      {canManagePosts && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenContentEditor) onOpenContentEditor(art.id); else handleStartEdit(art);
                            }}
                            className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/30 transition-colors"
                            title="Edit Article"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Super Admin Delete: Are you sure you want to delete "${art.title}"?`)) {
                                if (onDeleteArticle) {
                                  onDeleteArticle(art.id);
                                  if (selectedArticle?.id === art.id) {
                                    setSelectedArticle(null);
                                  }
                                }
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-400 hover:text-red-200 border border-red-500/40 transition-colors"
                            title="Delete Article (Super Admin Only)"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Article Full View (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedArticle ? (
            <div id="printable-article" className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-6">
              
              {/* Cover Image & Header */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 border border-slate-800">
                <img loading="lazy"
                  src={selectedArticle.coverImageUrl}
                  alt={selectedArticle.title}
                  className="w-full h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono uppercase font-bold px-2.5 py-0.5 rounded bg-amber-500 text-slate-950">
                      {selectedArticle.category}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">{selectedArticle.date}</span>
                    {selectedArticle.status !== 'Published' && (
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-500/50">
                        ⏳ {selectedArticle.status === 'In Review' ? 'Pending Admin Approval' : selectedArticle.status}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white">{selectedArticle.title}</h2>
                </div>
              </div>

              {/* Author & Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <img
                    src={selectedArticle.authorAvatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedArticle.author)}`}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover border border-amber-500/40 shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                  />
                  <div>
                    <div className="text-xs text-slate-400">Author & Source</div>
                    <div className="text-sm font-bold text-white">{selectedArticle.author}</div>
                    <div className="text-xs text-amber-300">{selectedArticle.authorRole}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isAdmin && selectedArticle.status === 'In Review' && (
                    <button
                      onClick={() => handleApproveArticle(selectedArticle)}
                      className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 border border-emerald-500/40"
                    >
                      <Check size={14} />
                      <span>Approve & Publish</span>
                    </button>
                  )}

                  <button
                    onClick={onOpenQuestionModal}
                    className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
                  >
                    <MessageSquare size={14} />
                    <span>Inquire / Questions</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
                    title="Print or save this post as PDF"
                  >
                    <Printer size={14} />
                    <span>Print</span>
                  </button>

                  {canManagePosts && (
                    <>
                      <button
                        type="button"
                        onClick={() => { if (onOpenContentEditor) onOpenContentEditor(selectedArticle.id); else handleStartEdit(selectedArticle); }}
                        className="px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
                        title="Edit Article"
                      >
                        <Pencil size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Super Admin Delete: Are you sure you want to delete "${selectedArticle.title}"?`)) {
                            if (onDeleteArticle) {
                              onDeleteArticle(selectedArticle.id);
                              setSelectedArticle(null);
                            }
                          }
                        }}
                        className="px-3.5 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/40 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
                        title="Delete Article (Super Admin Only)"
                      >
                        <Trash2 size={14} />
                        <span>Delete Article</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Article Content Body with Embedded Photos & Videos */}
              <ArticleContentRenderer
                content={selectedArticle.content}
                className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4"
              />

              {/* Video Attachment Banner */}
              {selectedArticle.videoUrl && (
                <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
                      <Video size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{selectedArticle.videoCaption || 'Official Video Attachment'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Available in top Cinema Player</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveVideoUrl(selectedArticle.videoUrl!);
                      setActiveVideoTitle(selectedArticle.title);
                      window.scrollTo({ top: 120, behavior: 'smooth' });
                    }}
                    className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center space-x-1"
                  >
                    <Play size={13} className="fill-slate-950" />
                    <span>Play Video</span>
                  </button>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-xs text-slate-400 font-mono mr-1">Tags:</span>
                {selectedArticle.tags.map((tag) => (
                  <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-amber-300/90 border border-slate-800">
                    #{tag}
                  </span>
                ))}
              </div>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              Select an article from the list to view full details.
            </div>
          )}
        </div>

      </div>

      {/* ARTICLE WRITER STUDIO MODAL */}
      {writerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Writer Header */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/20">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
                  <PenTool size={22} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-white">
                    {editingArticleId ? 'Edit Article' : 'Press Release & Article Studio'}
                  </h3>
                  <p className="text-xs text-amber-300/80">
                    {editingArticleId
                      ? <>Editing existing post on <strong className="font-mono">insight.aviyana.lk</strong></>
                      : <>Publishing to <strong className="font-mono">insight.aviyana.lk</strong> • Author: {currentUser.name}</>}
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setWriterModalOpen(false); resetWriterForm(); }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Writer Form Body */}
            <form onSubmit={handlePublishArticle} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Category & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label htmlFor="ann-category" className="block text-xs font-semibold text-slate-300 mb-1">Article Category</label>
                  <select
                    id="ann-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Investor Update">Investor Update / Investor Post</option>
                    <option value="Hotel School">Hotel School Post</option>
                    <option value="Career & Hiring">Career & Hiring Post</option>
                    <option value="Press Release">Press Release</option>
                    <option value="Grand Opening">Grand Opening</option>
                    <option value="Sustainability & CEA">Sustainability & CEA</option>
                    <option value="Resort Milestone">Resort Milestone</option>
                    <option value="Community & CSR">Community & CSR</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="ann-title" className="block text-xs font-semibold text-slate-300 mb-1">Headline / Article Title *</label>
                  <input
                    id="ann-title"
                    type="text"
                    required
                    placeholder="e.g. Aviyana Ceylon Resort Unveils Presidential Villa Suites"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-serif font-bold"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label htmlFor="ann-subtitle" className="block text-xs font-semibold text-slate-300 mb-1">Subtitle / Summary</label>
                <input
                  id="ann-subtitle"
                  type="text"
                  placeholder="e.g. Official declaration regarding environmental clearance and Grand Opening launch..."
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* LOCAL MEDIA ATTACHMENTS (IMAGE & VIDEO) */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-400">
                  <Upload size={16} />
                  <span>Media Upload & Video Attachments (Local Files Supported)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Local Image Upload */}
                  <div>
                    <label htmlFor="ann-cover-image" className="block text-[11px] text-slate-400 mb-1">
                      Cover Image (URL or Local File)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="ann-cover-image"
                        type="text"
                        placeholder="https://..."
                        value={newCoverImage}
                        onChange={(e) => setNewCoverImage(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                      />
                      <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs cursor-pointer font-bold shrink-0 flex items-center space-x-1">
                        <ImageIcon size={14} />
                        <span>{isUploadingCoverImage ? 'Uploading...' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLocalImageUpload}
                          disabled={isUploadingCoverImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {localImageFileName && !isUploadingCoverImage && (
                      <p className="text-[10px] text-emerald-400 mt-1 font-mono">
                        ✓ Uploaded: {localImageFileName}
                      </p>
                    )}
                  </div>

                  {/* Video: YouTube link (recommended) or local preview */}
                  <div>
                    <label htmlFor="ann-video-url" className="block text-[11px] text-slate-400 mb-1">
                      Video — YouTube Link (Recommended)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        id="ann-video-url"
                        type="text"
                        placeholder="https://youtu.be/xxxxxxxxxxx or https://www.youtube.com/watch?v=xxxxxxxxxxx"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                      />
                      <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs cursor-pointer font-bold shrink-0 flex items-center space-x-1" title="Local upload is preview-only in this browser tab — it won't be saved to the database. Use a YouTube link for a video that actually persists.">
                        <Video size={14} />
                        <span>Local Preview</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleLocalVideoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Paste a YouTube link — <strong className="text-amber-300/80">Unlisted</strong> works great here: anyone with the article link can watch it, but it won't show up in YouTube search or on your channel. This keeps large video files off this app's own storage/database entirely.
                    </p>
                    {newVideoUrl && isYouTubeUrl(newVideoUrl) && (
                      <p className="text-[10px] text-emerald-400 mt-1 font-mono flex items-center gap-1">
                        <Check size={11} /> YouTube video detected — will embed correctly
                      </p>
                    )}
                    {localVideoFileName && (
                      <p className="text-[10px] text-amber-300 mt-1 font-mono">
                        ⚠ Local preview only (not saved): {localVideoFileName} — replace with a YouTube link before publishing so this video survives a page reload.
                      </p>
                    )}
                  </div>

                </div>

                {/* Video Caption */}
                {newVideoUrl && (
                  <div>
                    <input
                      type="text"
                      aria-label="Video caption"
                      placeholder="Video Caption (e.g. 4K Drone Footage of Villa Suite construction)"
                      value={newVideoCaption}
                      onChange={(e) => setNewVideoCaption(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                    />
                  </div>
                )}
              </div>

              {/* Rich Content Editor Textarea with Inline Media Insertion */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                  <label htmlFor="ann-body" className="block text-xs font-semibold text-slate-300">Article Body / Press Text *</label>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <label className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded-lg cursor-pointer font-bold transition-all flex items-center space-x-1 border border-amber-500/30">
                      <ImageIcon size={13} />
                      <span>{isUploadingInlineImage ? 'Uploading...' : '+ Insert Photo in Article'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingInlineImage}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingInlineImage(true);
                          const url = await uploadContentImage(file, 'articles');
                          setIsUploadingInlineImage(false);
                          if (url) {
                            setNewContent(prev => prev + `\n\n[IMAGE: ${url}]\n*(Photo: ${file.name})*\n\n`);
                          } else {
                            alert('Image upload failed. Check your connection and try again.');
                          }
                        }}
                        className="hidden"
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
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setNewContent(prev => prev + `\n\n[VIDEO: ${url}]\n*(Video Footage: ${file.name} -- ⚠ preview only, replace with a YouTube link before publishing)*\n\n`);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 -mt-1">
                  Photos uploaded here are saved permanently. Videos are preview-only in this tab -- use a YouTube link for a video that survives a page reload.
                </p>

                <textarea
                  id="ann-body"
                  required
                  rows={9}
                  placeholder="Write full article text here. Use buttons above to attach local photos or videos directly inside the article body text..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="ann-tags" className="block text-xs font-semibold text-slate-300 mb-1">Tags (Comma Separated)</label>
                <input
                  id="ann-tags"
                  type="text"
                  placeholder="Grand Opening, CEA Clearance, Hospitality Academy"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Controls */}
              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setWriterModalOpen(false); resetWriterForm(); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center space-x-2"
                >
                  {editingArticleId ? <Pencil size={15} /> : <Send size={15} />}
                  <span>{editingArticleId ? 'Save Changes' : 'Publish Article Live to insight.aviyana.lk'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
