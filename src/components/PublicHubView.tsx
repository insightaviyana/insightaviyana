import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  Search, 
  HelpCircle, 
  Users, 
  Droplet, 
  Trees, 
  Play, 
  Send, 
  ChevronRight,
  ExternalLink,
  Award,
  Calendar,
  Building2,
  Filter,
  Mail,
  UserPlus,
  Video,
  X,
  Share2,
  Newspaper,
  Car,
  Heart,
  Printer,
  Volume2,
  Megaphone,
  Clock,
  Loader2,
  TrendingUp,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { Milestone, FactCheckItem, CSRImpact, VoiceCut, SocialLink, ArticleItem } from '../types';
import { TranslationDict } from '../lib/i18n';
import { SiteSettingsMap, getSetting } from '../lib/siteSettingsApi';
import { NewsletterSubscribe } from './NewsletterSubscribe';
import { SocialLinksBar } from './SocialLinksBar';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { ArticleContentRenderer } from './ArticleContentRenderer';
import { Pencil, Plus } from 'lucide-react';
import aviyanaLogoMark from '../assets/aviyana-logo-mark.png';

interface ArticleModalData {
  title: string;
  category: string;
  date: string;
  status?: string;
  imageUrl?: string;
  videoUrl?: string;
  description: string;
  fullBody?: string;
  documentName?: string;
  verifiedBy?: string;
  location?: string;
  quote?: string;
  speakerName?: string;
  speakerRole?: string;
  metricValue?: string;
  metricLabel?: string;
}

interface PublicHubViewProps {
  milestones: Milestone[];
  articles: ArticleItem[];
  factChecks: FactCheckItem[];
  csrImpacts: CSRImpact[];
  voiceCuts: VoiceCut[];
  socialLinks?: SocialLink[];
  isStaffAuthenticated?: boolean;
  onManageSocialLinks?: () => void;
  onOpenDocument: (docName: string, title: string) => void;
  onSubmitPublicInquiry: (query: string) => void;
  onOpenQuestionModal?: () => void;
  /** VIP/Press registration -- generates a "digital VIP pass" and records
   * interests for Grand Opening / press briefing updates. See
   * UserRegistrationModal.tsx. */
  onOpenRegistrationModal?: () => void;
  /** Opens the top-level Unified Content Editor pre-set to a kind (and to a
   * specific item's id when editing). Replaces the page's own local
   * add/edit modal -- see UnifiedContentEditor.tsx. */
  onOpenContentEditor?: (kind: 'milestone' | 'csr' | 'voicecut', id?: string) => void;
  /** i18n (src/lib/i18n.tsx) -- optional, falls back to built-in English
   * copy if not passed. */
  t?: TranslationDict;
  /** Switches the app's active tab -- used by the Fact-Check preview's
   * "View All Fact-Checks" button to jump to the dedicated Fact-Check
   * Portal tab (FactCheckPortalView.tsx). */
  onNavigateTab?: (tab: string) => void;
  /** Editable contact-details copy (email, address, portal note) -- see
   * src/lib/siteSettingsApi.ts. Optional; falls back to
   * SITE_SETTING_DEFAULTS if not passed. */
  siteSettings?: SiteSettingsMap;
  onSaveSiteSetting?: (key: string, value: string) => void;
}

// Milestone status -> badge styling. Previously every status (Verified,
// In Progress, Upcoming) rendered as the same green checkmark badge,
// which didn't actually communicate anything -- an "Upcoming" milestone
// showing a green checkmark reads as already done. Differentiated here,
// and extended to cover "Completed" (added alongside new milestone
// categories).
const MILESTONE_STATUS_STYLE: Record<Milestone['status'], { icon: React.ComponentType<{ size?: number; className?: string }>; className: string }> = {
  'Verified': { icon: CheckCircle2, className: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' },
  'Completed': { icon: CheckCircle2, className: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' },
  'In Progress': { icon: Loader2, className: 'bg-amber-950/90 text-amber-300 border-amber-500/40' },
  'Upcoming': { icon: Clock, className: 'bg-slate-800/90 text-slate-300 border-slate-600/40' },
};

// Article category -> badge styling. Previously every published article,
// regardless of its actual category, showed the same generic "Announcement"
// badge on its card -- a Career listing, an Investor Update, and a Press
// Release all looked identical at a glance on the unified feed. Each
// category now gets its own icon/label so the badge actually communicates
// what kind of post it is.
const ARTICLE_CATEGORY_STYLE: Record<ArticleItem['category'], { icon: React.ComponentType<{ size?: number; className?: string }>; label: string }> = {
  'Investor Update': { icon: TrendingUp, label: 'Investor Update' },
  'Hotel School': { icon: GraduationCap, label: 'Hotel School' },
  'Career & Hiring': { icon: Briefcase, label: 'Careers' },
  'Press Release': { icon: Megaphone, label: 'Press Release' },
  'Sustainability & CEA': { icon: ShieldCheck, label: 'Sustainability' },
  'Grand Opening': { icon: Award, label: 'Grand Opening' },
  'Community & CSR': { icon: Heart, label: 'Community & CSR' },
  'Resort Milestone': { icon: Building2, label: 'Resort Milestone' },
};

export const PublicHubView: React.FC<PublicHubViewProps> = ({
  milestones,
  articles,
  factChecks,
  csrImpacts,
  voiceCuts,
  socialLinks = [],
  isStaffAuthenticated = false,
  onManageSocialLinks,
  onOpenDocument,
  onSubmitPublicInquiry,
  onOpenQuestionModal,
  onOpenRegistrationModal,
  onOpenContentEditor,
  t,
  onNavigateTab,
  siteSettings = {},
  onSaveSiteSetting
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  // Pagination for the unified news feed below -- previously every
  // published article + milestone rendered in one single, ever-growing
  // grid with no limit at all, so the Public Hub's height (and initial
  // load weight) scaled directly with total post count. Capped at a fixed
  // page size with real Prev/Next paging instead.
  const FEED_PAGE_SIZE = 20;
  const [feedPage, setFeedPage] = useState(1);
  const [contactEditOpen, setContactEditOpen] = useState(false);
  const [contactEditValues, setContactEditValues] = useState({ contact_email: '', contact_email_note: '', hq_name: '', hq_address: '', portal_note: '' });
  const [inquiryText, setInquiryText] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [activeVoiceCut, setActiveVoiceCut] = useState<VoiceCut | null>(voiceCuts[0] || null);
  // Whether the main box is currently playing activeVoiceCut's video, vs
  // showing its thumbnail. This was the missing piece behind a real bug:
  // every click in this section (thumbnail, title, "Read Full Statement")
  // opened the article reader -- there was no code path that actually
  // played a pasted YouTube link at all.
  const [isPlayingVoiceCutVideo, setIsPlayingVoiceCutVideo] = useState(false);
  const [selectedArticleModal, setSelectedArticleModal] = useState<ArticleModalData | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Fixed, curated display order for the category filter bar. Previously
  // this was `[...new Set(articles.map(a => a.category))]` -- deriving the
  // order from whatever order articles happened to be in, which meant the
  // buttons visibly reshuffled as articles were added/edited, with no
  // predictable order at all. Only categories that actually have content
  // are shown, but their order is always this same sequence.
  const CATEGORY_DISPLAY_ORDER = [
    'Clearance',
    'Construction',
    'Environmental',
    'Safety & Security',
    'Press Release',
    'Grand Opening',
    'Resort Milestone',
    'CSR',
    'Community & CSR',
    'Sustainability & CEA',
    'Hospitality',
    'Hotel School',
    'Investor Update',
    'Career & Hiring'
  ];
  const categoriesInUse = new Set([
    ...milestones.map(m => m.category),
    ...articles.map(a => a.category)
  ]);
  const categories = ['All', ...CATEGORY_DISPLAY_ORDER.filter(c => categoriesInUse.has(c))];

  // Unified feed: published Announcements + verified Milestones, newest first.
  // This is what actually makes a newly-published article show up on the public page --
  // previously this section only ever read from `milestones`.
  type NewsFeedItem =
    | { source: 'milestone'; sortDate: string; data: Milestone }
    | { source: 'article'; sortDate: string; data: ArticleItem };

  const publishedArticles = articles.filter(a => a.status === 'Published');

  const combinedFeed: NewsFeedItem[] = [
    ...milestones.map((m): NewsFeedItem => ({ source: 'milestone', sortDate: m.date, data: m })),
    ...publishedArticles.map((a): NewsFeedItem => ({ source: 'article', sortDate: a.date, data: a }))
  ].sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

  const filteredFeed = combinedFeed.filter(item => {
    if (activeCategory === 'All') return true;
    return item.data.category === activeCategory;
  });

  const feedTotalPages = Math.max(1, Math.ceil(filteredFeed.length / FEED_PAGE_SIZE));
  // Clamp defensively (e.g. switching to a category with fewer pages than
  // the page currently selected) rather than showing a blank page.
  const currentFeedPage = Math.min(feedPage, feedTotalPages);
  const paginatedFeed = filteredFeed.slice((currentFeedPage - 1) * FEED_PAGE_SIZE, currentFeedPage * FEED_PAGE_SIZE);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setFeedPage(1);
  };

  const openArticleModal = (article: ArticleItem) => {
    setSelectedArticleModal({
      title: article.title,
      category: article.category,
      date: article.date,
      status: article.status,
      imageUrl: article.coverImageUrl,
      videoUrl: article.videoUrl,
      description: article.subtitle,
      fullBody: `${article.content}\n\nPublished by: ${article.author} (${article.authorRole})\n\nThis announcement is an official statement from Aviyana Ceylon Resort, published via the insight.aviyana.lk source-of-truth portal.`
    });
  };

  const openMilestoneModal = (ms: Milestone) => {
    setSelectedArticleModal({
      title: ms.title,
      category: ms.category,
      date: ms.date,
      status: ms.status,
      imageUrl: ms.imageUrl,
      description: ms.description,
      documentName: ms.documentName,
      verifiedBy: ms.verifiedBy,
      fullBody: ms.context ? `${ms.description}\n\n${ms.context}` : ms.description
    });
  };

  // Public Hub only ever shows a short PREVIEW of published fact-checks --
  // the full searchable archive lives on its own tab now (see
  // FactCheckPortalView.tsx) precisely so this page's height doesn't keep
  // growing every time a new fact-check gets published. Pending ones are
  // only visible internally, on the staff Fact-Check & FAQ tab, until an
  // admin approves them.
  const FACT_CHECK_PREVIEW_COUNT = 3;
  const previewFaqs = factChecks.filter(f => f.approvalStatus === 'Published').slice(0, FACT_CHECK_PREVIEW_COUNT);
  const publishedFaqCount = factChecks.filter(f => f.approvalStatus === 'Published').length;

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;
    onSubmitPublicInquiry(inquiryText);
    setInquirySubmitted(true);
    setInquiryText('');
    setTimeout(() => setInquirySubmitted(false), 5000);
  };

  const handleCopyLink = () => {
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div id="public-hub-root" className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      
      {/* Compact Hero Section */}
      <section className="hero-band relative pt-8 pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-amber-500/30 overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Ambient Gold Radial Glow Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">

          {/* Subdomain Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400/40 text-amber-300 text-[11px] font-semibold mb-3 shadow-md shadow-amber-500/5 backdrop-blur-md">
            <ShieldCheck size={13} className="text-amber-400" />
            <span className="tracking-wide">OFFICIAL DIGITAL HUB: <strong className="text-white font-mono">insight.aviyana.lk</strong></span>
          </div>

          {/* Compact Title Header with Logo Mark */}
          <div className="flex items-center justify-center gap-3">
            <img loading="lazy"
              src={aviyanaLogoMark}
              alt="Aviyana Ceylon Resort logo"
              className="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] shrink-0"
            />
            <h1 className="text-2xl sm:text-4xl font-serif font-extrabold tracking-tight text-white leading-none">
              <span className="bg-gradient-to-r from-amber-100 via-amber-300 to-amber-100 bg-clip-text text-transparent">
                AVIYANA CEYLON RESORT
              </span>
            </h1>
          </div>
          <p className="mt-2 text-sm sm:text-base font-serif text-amber-200/90 font-medium tracking-wide">
            {t ? t.hero.tagline : 'Online Reputation Management & Verified Source of Truth'}
          </p>

          <p className="mt-3 max-w-2xl mx-auto text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {t ? t.hero.subtitle : (
              <>
                Authentic news, luxury fleet updates, and milestone progress towards our{' '}
                <strong className="text-amber-300 font-semibold">August 2027 Strategic Grand Opening</strong>.
              </>
            )}
          </p>

          {/* Core Principle — compact single-line strip instead of a large card */}
          <div className="mt-4 max-w-2xl mx-auto flex items-center gap-3 p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-lg backdrop-blur-md text-left">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
              <Award size={18} />
            </div>
            <p className="text-xs sm:text-[13px] font-serif italic text-white leading-snug">
              "Unwavering Excellence, Total Transparency & Authentic Hospitality — Elevating Sri Lanka's Ceylon Benchmark to the World"
            </p>
          </div>

          {/* Quick Action Buttons for Inquiry & VIP Registration */}
          <div className="mt-5 flex flex-col sm:flex-row justify-center items-center gap-3">
            {onOpenQuestionModal && (
              <button
                onClick={onOpenQuestionModal}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] flex items-center justify-center space-x-2 group cursor-pointer"
              >
                <Mail size={15} className="text-slate-950 group-hover:rotate-12 transition-transform" />
                <span className="font-semibold tracking-wide">{t ? t.hero.askQuestion : 'Submit Direct Question'}</span>
              </button>
            )}
            {/* Direct hero-level link to the Fact-Check Portal -- jumps
                straight to the dedicated tab (see FactCheckPortalView.tsx)
                now that the full archive no longer lives inline on this
                page, so a visitor who never scrolls past the hero can
                still reach the site's strongest differentiator in one
                click. Falls back to the in-page anchor if onNavigateTab
                wasn't passed in (defensive only). */}
            {onNavigateTab ? (
              <button
                type="button"
                onClick={() => onNavigateTab('fact-check-portal')}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 border border-amber-500/40 hover:border-amber-400/70 text-amber-300 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 group cursor-pointer"
              >
                <HelpCircle size={15} className="text-amber-400" />
                <span className="font-semibold tracking-wide">{t ? t.hero.verifyClaim : 'Verify a Claim — Fact-Check Portal'}</span>
              </button>
            ) : (
              <a
                href="#fact-checks"
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 border border-amber-500/40 hover:border-amber-400/70 text-amber-300 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 group cursor-pointer"
              >
                <HelpCircle size={15} className="text-amber-400" />
                <span className="font-semibold tracking-wide">{t ? t.hero.verifyClaim : 'Verify a Claim — Fact-Check Portal'}</span>
              </a>
            )}
            {onOpenRegistrationModal && (
              <button
                type="button"
                onClick={onOpenRegistrationModal}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 border border-amber-500/40 hover:border-amber-400/70 text-amber-300 hover:text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-2 group cursor-pointer"
              >
                <UserPlus size={15} className="text-amber-400" />
                <span className="font-semibold tracking-wide">Register for VIP Pass</span>
              </button>
            )}
          </div>

        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">

        {/* Section 1: Resort News & Verified Updates */}
        <section id="journey-timeline" className="scroll-mt-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Newspaper size={16} />
                <span>RESORT NEWS & VERIFIED UPDATES</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-white mt-1">
                Latest News, Launch Events & Construction Progress
              </h2>
              <p className="text-xs text-slate-400">
                Verified press releases, soft opening news, architectural milestones, and luxury announcements.
              </p>
              {isStaffAuthenticated && onOpenContentEditor && (
                <button
                  onClick={() => onOpenContentEditor && onOpenContentEditor('milestone')}
                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all"
                >
                  <Plus size={12} /> Add Milestone / News Item
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline / News Cards Grid - now includes published Announcements, not just milestones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeed.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400 text-sm">
                No news items in this category yet.
              </div>
            )}

            {paginatedFeed.map((item) => {
              if (item.source === 'article') {
                const art = item.data;
                return (
                  <div
                    key={`article-${art.id}`}
                    onClick={() => openArticleModal(art)}
                    className="bg-slate-900/90 border border-amber-500/20 rounded-2xl overflow-hidden hover:border-amber-500/60 transition-all shadow-lg flex flex-col justify-between group cursor-pointer hover:-translate-y-1"
                  >
                    <div>
                      <div className="relative h-48 overflow-hidden">
                        <img loading="lazy"
                          src={art.coverImageUrl}
                          alt={art.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-sm text-amber-300 border border-amber-500/30 font-mono text-[11px] font-bold">
                          {art.date}
                        </div>
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/90 text-slate-950 border border-amber-400/60 flex items-center gap-1">
                          {(() => { const Icon = ARTICLE_CATEGORY_STYLE[art.category]?.icon || Megaphone; return <Icon size={12} />; })()}
                          <span>{ARTICLE_CATEGORY_STYLE[art.category]?.label || art.category}</span>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider mb-1 flex items-center justify-between">
                          <span>{art.category}</span>
                          <span className="text-amber-300/80 group-hover:underline">Click to read full article &rarr;</span>
                        </div>
                        <h3 className="text-base font-serif font-bold text-white group-hover:text-amber-300 transition-colors">
                          {art.title}
                        </h3>
                        <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-3">
                          {art.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center justify-between gap-2">
                        <span>Published by:</span>
                        <span className="flex items-center gap-1.5 text-slate-300 font-medium min-w-0">
                          <img src={art.authorAvatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(art.author)}`} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <span className="truncate">{art.author}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              const ms = item.data;
              return (
                <div
                  key={`milestone-${ms.id}`}
                  onClick={() => openMilestoneModal(ms)}
                  className="relative bg-slate-900/90 border border-amber-500/20 rounded-2xl overflow-hidden hover:border-amber-500/60 transition-all shadow-lg flex flex-col justify-between group cursor-pointer hover:-translate-y-1"
                >
                  {isStaffAuthenticated && onOpenContentEditor && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onOpenContentEditor && onOpenContentEditor('milestone', ms.id); }}
                      className="absolute top-11 right-3 z-10 p-1.5 rounded-lg bg-slate-950/90 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-all"
                      title="Edit this item"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  <div>
                    <div className="relative h-48 overflow-hidden">
                      <img loading="lazy" 
                        src={ms.imageUrl} 
                        alt={ms.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-sm text-amber-300 border border-amber-500/30 font-mono text-[11px] font-bold">
                        {ms.date}
                      </div>
                      <div className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${MILESTONE_STATUS_STYLE[ms.status]?.className || 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'}`}>
                        {(() => { const Icon = MILESTONE_STATUS_STYLE[ms.status]?.icon || CheckCircle2; return <Icon size={12} />; })()}
                        <span>{ms.status}</span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider mb-1 flex items-center justify-between">
                        <span>{ms.category}</span>
                        <span className="text-amber-300/80 group-hover:underline">Click to read full article &rarr;</span>
                      </div>
                      <h3 className="text-base font-serif font-bold text-white group-hover:text-amber-300 transition-colors">
                        {ms.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-3">
                        {ms.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    {ms.documentName && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDocument(ms.documentName!, ms.title);
                        }}
                        className="w-full mt-3 py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
                      >
                        <FileText size={14} />
                        <span>View Official Certificate Proof</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                    <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center justify-between">
                      <span>Verified by:</span>
                      <span className="text-slate-300 font-medium">{ms.verifiedBy}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination -- see FEED_PAGE_SIZE above. Only shown when there's
              more than one page, so it doesn't clutter the page for a small
              site early on. */}
          {feedTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setFeedPage(p => Math.max(1, p - 1))}
                disabled={currentFeedPage === 1}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-amber-500/40 hover:enabled:text-amber-300 transition-all"
              >
                &larr; Previous
              </button>
              <span className="px-3 text-xs text-slate-400 font-mono">
                Page {currentFeedPage} of {feedTotalPages}
              </span>
              <button
                onClick={() => setFeedPage(p => Math.min(feedTotalPages, p + 1))}
                disabled={currentFeedPage === feedTotalPages}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-amber-500/40 hover:enabled:text-amber-300 transition-all"
              >
                Next &rarr;
              </button>
            </div>
          )}
        </section>

        {/* Section 2: Fact-Check Portal preview (Myth vs. Reality) --
            promoted right after the news timeline per
            ENGINEERING_ASSESSMENT.md: "the fact-check/myth-vs-reality
            section is a genuine differentiator... should be actively
            promoted, not hidden as one section among several." Shows only
            the most recent few here (see FACT_CHECK_PREVIEW_COUNT above)
            with a link to the full archive on its own tab
            (FactCheckPortalView.tsx) -- keeps this page's height
            predictable regardless of how many fact-checks exist, while
            the archive itself keeps unrestricted room to grow. */}
        <section id="fact-checks" className="scroll-mt-20 relative rounded-3xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-950/20 via-slate-900/60 to-slate-900/60 p-6 sm:p-8 shadow-2xl shadow-amber-500/5 animate-fade-in-up">
          <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider shadow-lg animate-pulse">
            {t ? t.factCheck.signatureBadge : 'Signature Feature'}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-4 border-b border-amber-500/20">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <HelpCircle size={14} />
                <span>{t ? t.factCheck.badge : 'Fact-Check Portal'}</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-white mt-1">
                {t ? t.factCheck.title : 'Fact-Check & Myth vs. Reality FAQ'}
              </h2>
              <p className="text-xs text-slate-400 max-w-lg">
                {t ? t.factCheck.description : "Every rumor addressed with a document-backed official answer — this is the standing, publicly-verifiable rebuttal archive most resort newsrooms don't offer."}
              </p>
              {isStaffAuthenticated && (
                <p className="mt-2 text-[11px] text-slate-400 italic">
                  Add, edit, or approve fact-checks from the <span className="text-amber-300 font-semibold not-italic">Fact-Check & FAQ</span> staff tab.
                </p>
              )}
            </div>

            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('fact-check-portal')}
                className="mt-4 sm:mt-0 shrink-0 px-4 py-2 bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>View All Fact-Checks{publishedFaqCount > 0 ? ` (${publishedFaqCount})` : ''}</span>
                <ChevronRight size={14} />
              </button>
            )}
          </div>

          {previewFaqs.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No fact-checks published yet.</p>
          ) : (
            <div className="space-y-4">
              {previewFaqs.map((faq) => (
                <div 
                  key={faq.id} 
                  onClick={() => setSelectedArticleModal({
                    title: faq.rumor,
                    category: `Fact-Check: ${faq.category}`,
                    date: faq.verifiedDate,
                    status: faq.status,
                    description: faq.fact,
                    documentName: faq.documentProof,
                    verifiedBy: faq.officialSource,
                    fullBody: `Claim / Allegation:\n"${faq.rumor}"\n\nOfficial Verified Fact:\n${faq.fact}\n\nOfficial Document Source: ${faq.officialSource}`
                  })}
                  className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/30">
                      Unverified Claim
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-amber-300">Verified: {faq.verifiedDate} • Click to read details &rarr;</span>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-red-200 line-through opacity-80">
                    {faq.rumor}
                  </h4>

                  <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/30">
                    <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                      <CheckCircle2 size={16} />
                      <span>Verified Official Fact</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                      {faq.fact}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                      <div>
                        <strong className="text-slate-300">Official Source:</strong> {faq.officialSource}
                      </div>

                      {faq.documentProof && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDocument(faq.documentProof!, faq.rumor);
                          }}
                          className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
                        >
                          <FileText size={12} />
                          <span>View Document Evidence</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 3: Guest Voices & Opening Wishes (real guest video clips) */}
        <section id="csr-community" className="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 sm:p-8">
          <div className="max-w-3xl mb-8">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Heart size={16} />
              <span>GUEST VOICES & OPENING WISHES</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mt-1">
              Real Guest Video Messages Ahead of Our Grand Opening
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Heartfelt video clips and opening wishes recorded by our guests, shared exactly as they sent them.
            </p>
            {isStaffAuthenticated && onOpenContentEditor && (
              <button
                onClick={() => onOpenContentEditor && onOpenContentEditor('csr')}
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all"
              >
                <Plus size={12} /> Add Guest Voice / Opening Wish Video
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {csrImpacts.map((csr) => (
              <div 
                key={csr.id} 
                onClick={() => setSelectedArticleModal({
                  title: csr.title,
                  category: 'Guest Voices',
                  date: 'Guest Opening Wish',
                  status: 'Shared by Guest',
                  imageUrl: csr.imageUrl,
                  videoUrl: csr.videoUrl,
                  description: csr.description,
                  metricValue: csr.metricValue,
                  metricLabel: csr.metricLabel,
                  location: csr.location,
                  fullBody: csr.context ? `${csr.description}\n\n${csr.context}` : csr.description
                })}
                className="relative bg-slate-950/80 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/50 transition-all cursor-pointer group hover:-translate-y-1"
              >
                {isStaffAuthenticated && onOpenContentEditor && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpenContentEditor && onOpenContentEditor('csr', csr.id); }}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-slate-950/90 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-all"
                    title="Edit this item"
                  >
                    <Pencil size={13} />
                  </button>
                )}
                <div className="relative h-40 rounded-xl overflow-hidden mb-4">
                  <img loading="lazy" src={csr.imageUrl} alt={csr.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  {csr.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-black/60 border-2 border-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play size={18} className="text-amber-300 ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 text-2xl font-serif font-bold text-amber-300">
                    {csr.metricValue}
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/30">
                    {csr.videoUrl ? 'Click to watch' : 'Click to view full feature'}
                  </div>
                </div>

                <h4 className="font-serif font-bold text-white text-base group-hover:text-amber-300 transition-colors">{csr.title}</h4>
                <div className="text-xs text-amber-400 font-semibold mb-2">{csr.metricLabel}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{csr.description}</p>
                <div className="text-[10px] text-slate-400 mt-3 font-mono">
                  📍 {csr.location}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Press Events, Unveilings & Executive Media */}
        <section id="voice-cuts">
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Play size={16} />
              <span>PRESS EVENTS, UNVEILINGS & EXECUTIVE MEDIA</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mt-1">
              Grand Press Conferences, Fleet Unveilings & Leadership Speeches
            </h2>
            <p className="text-xs text-slate-400">
              Watch video recordings and executive statements from Chairman Dr. Thisara Hewawasam and resort leadership.
            </p>
            {isStaffAuthenticated && onOpenContentEditor && (
              <button
                onClick={() => onOpenContentEditor && onOpenContentEditor('voicecut')}
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all"
              >
                <Plus size={12} /> Add Press Statement
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Video Player Box */}
            <div className="lg:col-span-2 bg-slate-900 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl">
              <div
                onClick={() => {
                  if (activeVoiceCut?.videoUrl) {
                    setIsPlayingVoiceCutVideo(true);
                  } else if (activeVoiceCut) {
                    // No video attached to this statement -- fall back to the
                    // article reader, since there's nothing to actually play.
                    setSelectedArticleModal({
                      title: activeVoiceCut.title,
                      category: 'Press Event & Video Statement',
                      date: activeVoiceCut.date,
                      status: 'Verified Video Statement',
                      imageUrl: activeVoiceCut.videoThumbnail,
                      description: activeVoiceCut.quote,
                      speakerName: activeVoiceCut.speakerName,
                      speakerRole: activeVoiceCut.speakerRole,
                      fullBody: `Press Release & Keynote Summary:\n"${activeVoiceCut.quote}"\n\nSpeaker: ${activeVoiceCut.speakerName} (${activeVoiceCut.speakerRole})\nOfficial Broadcast Date: ${activeVoiceCut.date}\nDuration: ${activeVoiceCut.duration}\n\nThis media briefing represents the official stance of Aviyana Ceylon Resort regarding our upcoming August 2027 grand launch, environmental clearance compliance, and luxury fleet operations.`
                    });
                  }
                }}
                className="relative aspect-video bg-slate-950 flex items-center justify-center group cursor-pointer"
              >
                {isPlayingVoiceCutVideo && activeVoiceCut?.videoUrl ? (
                  <SmartVideoPlayer
                    url={activeVoiceCut.videoUrl}
                    className="w-full h-full"
                    poster={activeVoiceCut.videoThumbnail}
                    title={activeVoiceCut.title}
                  />
                ) : (
                  <>
                    <img loading="lazy" 
                      src={activeVoiceCut?.videoThumbnail} 
                      alt={activeVoiceCut?.title || 'Press statement thumbnail'} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                        <Play size={28} className="ml-1 fill-slate-950" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-slate-950/80 px-2.5 py-1 rounded text-amber-300 text-xs font-mono">
                      ⏱️ {activeVoiceCut?.duration} • {activeVoiceCut?.videoUrl ? 'Click to play video' : 'Click to read full article'}
                    </div>
                  </>
                )}
              </div>

              <div className="p-6">
                <div className="text-xs text-amber-400 font-semibold font-mono">{activeVoiceCut?.date}</div>
                <h3 
                  onClick={() => activeVoiceCut && setSelectedArticleModal({
                    title: activeVoiceCut.title,
                    category: 'Press Event & Video Statement',
                    date: activeVoiceCut.date,
                    status: 'Verified Video Statement',
                    imageUrl: activeVoiceCut.videoThumbnail,
                    description: activeVoiceCut.quote,
                    speakerName: activeVoiceCut.speakerName,
                    speakerRole: activeVoiceCut.speakerRole,
                    fullBody: `Press Release & Keynote Summary:\n"${activeVoiceCut.quote}"\n\nSpeaker: ${activeVoiceCut.speakerName} (${activeVoiceCut.speakerRole})\nOfficial Broadcast Date: ${activeVoiceCut.date}\nDuration: ${activeVoiceCut.duration}\n\nThis media briefing represents the official stance of Aviyana Ceylon Resort regarding our upcoming August 2027 grand launch, environmental clearance compliance, and luxury fleet operations.`
                  })}
                  className="text-xl font-serif font-bold text-white mt-1 hover:text-amber-300 cursor-pointer transition-colors"
                >
                  {activeVoiceCut?.title}
                </h3>
                <blockquote className="mt-3 p-3 rounded-lg bg-slate-950 border-l-2 border-amber-400 text-xs italic text-slate-200">
                  "{activeVoiceCut?.quote}"
                </blockquote>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center font-serif">
                      {activeVoiceCut?.speakerName[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{activeVoiceCut?.speakerName}</div>
                      <div className="text-xs text-amber-300/80">{activeVoiceCut?.speakerRole}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => activeVoiceCut && setSelectedArticleModal({
                      title: activeVoiceCut.title,
                      category: 'Press Event & Video Statement',
                      date: activeVoiceCut.date,
                      status: 'Verified Video Statement',
                      imageUrl: activeVoiceCut.videoThumbnail,
                      description: activeVoiceCut.quote,
                      speakerName: activeVoiceCut.speakerName,
                      speakerRole: activeVoiceCut.speakerRole,
                      fullBody: `Press Release & Keynote Summary:\n"${activeVoiceCut.quote}"\n\nSpeaker: ${activeVoiceCut.speakerName} (${activeVoiceCut.speakerRole})\nOfficial Broadcast Date: ${activeVoiceCut.date}\nDuration: ${activeVoiceCut.duration}\n\nThis media briefing represents the official stance of Aviyana Ceylon Resort regarding our upcoming August 2027 grand launch, environmental clearance compliance, and luxury fleet operations.`
                    })}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-bold transition-all"
                  >
                    Read Full Statement &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Side Voice Cuts List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">More Press Statements:</h4>
              {voiceCuts.map((vc) => (
                <div
                  key={vc.id}
                  onClick={() => {
                    setActiveVoiceCut(vc);
                    setIsPlayingVoiceCutVideo(false);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 ${
                    activeVoiceCut?.id === vc.id
                      ? 'bg-amber-950/40 border-amber-500'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0">
                    <img loading="lazy" src={vc.videoThumbnail} alt={vc.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play size={14} className="text-white fill-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-white truncate">{vc.title}</h5>
                    <div className="text-[11px] text-amber-300">{vc.speakerName}</div>
                    <div className="text-[10px] text-slate-400">{vc.speakerRole}</div>
                  </div>
                  {isStaffAuthenticated && onOpenContentEditor && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onOpenContentEditor && onOpenContentEditor('voicecut', vc.id); }}
                      className="shrink-0 p-1.5 rounded-lg bg-slate-950 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-all"
                      title="Edit this statement"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: Official Contact Details & Star Social Media Channels */}
        <section id="contact-details" className="scroll-mt-20 space-y-8 bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="border-b border-amber-500/20 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider font-mono">
                <Mail size={16} />
                <span>Official Contact Details & Star Social Media Hub</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-white mt-1">
                Reach Aviyana Ceylon Resort & Verified Social Channels
              </h2>
              <p className="text-xs text-slate-300">
                Direct communications, official email inquiry desk, and 100% authentic social media channels.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                Primary Desk: {getSetting(siteSettings, 'contact_email')}
              </span>
              {isStaffAuthenticated && onSaveSiteSetting && (
                <button
                  type="button"
                  onClick={() => {
                    setContactEditValues({
                      contact_email: getSetting(siteSettings, 'contact_email'),
                      contact_email_note: getSetting(siteSettings, 'contact_email_note'),
                      hq_name: getSetting(siteSettings, 'hq_name'),
                      hq_address: getSetting(siteSettings, 'hq_address'),
                      portal_note: getSetting(siteSettings, 'portal_note'),
                    });
                    setContactEditOpen(true);
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 shrink-0"
                  title="Edit contact details"
                >
                  <Pencil size={11} />
                  <span>Edit</span>
                </button>
              )}
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                <Mail size={16} />
                <span>Official Email Inquiry</span>
              </div>
              <p className="text-sm font-bold text-white font-mono">{getSetting(siteSettings, 'contact_email')}</p>
              <p className="text-[11px] text-slate-400">{getSetting(siteSettings, 'contact_email_note')}</p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                <Building2 size={16} />
                <span>Resort Headquarters & Estate</span>
              </div>
              <p className="text-sm font-bold text-white">{getSetting(siteSettings, 'hq_name')}</p>
              <p className="text-[11px] text-slate-400">{getSetting(siteSettings, 'hq_address')}</p>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                <Award size={16} />
                <span>Source of Truth Portal</span>
              </div>
              <p className="text-sm font-bold text-white font-mono">insight.aviyana.lk</p>
              <p className="text-[11px] text-slate-400">{getSetting(siteSettings, 'portal_note')}</p>
            </div>
          </div>

          {/* Email Subscribe -- separate from the RSS feed (that's for
              readers who want updates pulled into an RSS reader; this is
              for the more common case of just wanting updates emailed
              directly). */}
          <NewsletterSubscribe />

          {/* Star Social Media Channels Bar */}
          {(socialLinks.length > 0 || isStaffAuthenticated) && (
            <div className="pt-2 flex items-center gap-2">
              {socialLinks.length > 0 && <SocialLinksBar socialLinks={socialLinks} />}
              {isStaffAuthenticated && onManageSocialLinks && (
                <button
                  type="button"
                  onClick={onManageSocialLinks}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 shrink-0"
                  title="Manage social links"
                >
                  <Pencil size={11} />
                  <span>{socialLinks.length === 0 ? 'Add Social Links' : 'Manage'}</span>
                </button>
              )}
            </div>
          )}

          {/* Direct Public Inquiry / Rumor Fact Request Form */}
          <div className="hero-band p-6 bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-950 border border-amber-500/30 rounded-2xl">
            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-lg font-serif font-bold text-white">Have a Direct Question or Request Official Fact Verification?</h3>
              <p className="text-xs text-slate-300 mt-1">
                Submit your query directly to <strong className="text-amber-300 font-mono">insight@aviyana.lk</strong> for rapid response with document proof.
              </p>

              <form onSubmit={handleInquirySubmit} className="mt-5 space-y-3">
                <textarea
                  rows={5}
                  aria-label="Your question or fact-verification request"
                  placeholder="Type your question or statement request here..."
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/30 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center space-x-2"
                  >
                    <Send size={14} />
                    <span>Send Query to insight@aviyana.lk</span>
                  </button>

                  {onOpenQuestionModal && (
                    <button
                      type="button"
                      onClick={onOpenQuestionModal}
                      className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5"
                    >
                      <Mail size={14} />
                      <span>Open Full Inquiry Form</span>
                    </button>
                  )}
                </div>

                {inquirySubmitted && (
                  <div className="p-3 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center gap-2 mt-3">
                    <CheckCircle2 size={16} />
                    <span>Inquiry submitted! Our SE IT Lead will review and reply via insight@aviyana.lk within 10 minutes.</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>

      </div>

      {/* Edit Contact Details modal (staff/admin only) */}
      {contactEditOpen && onSaveSiteSetting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md" onClick={() => setContactEditOpen(false)}>
          <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="font-serif font-bold text-lg text-white">Edit Contact Details</h3>
              <button onClick={() => setContactEditOpen(false)} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                Object.entries(contactEditValues).forEach(([key, value]) => onSaveSiteSetting(key, value));
                setContactEditOpen(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label htmlFor="cd-email" className="block text-[11px] font-semibold text-slate-300 mb-1">Official Email</label>
                <input id="cd-email" required type="email" value={contactEditValues.contact_email} onChange={e => setContactEditValues(v => ({ ...v, contact_email: e.target.value }))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label htmlFor="cd-email-note" className="block text-[11px] font-semibold text-slate-300 mb-1">Email Description</label>
                <input id="cd-email-note" value={contactEditValues.contact_email_note} onChange={e => setContactEditValues(v => ({ ...v, contact_email_note: e.target.value }))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label htmlFor="cd-hq-name" className="block text-[11px] font-semibold text-slate-300 mb-1">Headquarters / Estate Name</label>
                <input id="cd-hq-name" value={contactEditValues.hq_name} onChange={e => setContactEditValues(v => ({ ...v, hq_name: e.target.value }))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label htmlFor="cd-hq-address" className="block text-[11px] font-semibold text-slate-300 mb-1">Address</label>
                <input id="cd-hq-address" value={contactEditValues.hq_address} onChange={e => setContactEditValues(v => ({ ...v, hq_address: e.target.value }))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label htmlFor="cd-portal-note" className="block text-[11px] font-semibold text-slate-300 mb-1">Source of Truth Portal Note</label>
                <input id="cd-portal-note" value={contactEditValues.portal_note} onChange={e => setContactEditValues(v => ({ ...v, portal_note: e.target.value }))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button type="button" onClick={() => setContactEditOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL ARTICLE MODAL OVERLAY */}
      {selectedArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div id="printable-article" className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative text-left">
            
            {/* Modal Top Navigation Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono">
                  {selectedArticleModal.category}
                </span>
                {selectedArticleModal.status && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    <span>{selectedArticleModal.status}</span>
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedArticleModal(null)}
                className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Title & Metadata */}
            <div>
              <div className="text-xs text-amber-400/90 font-mono mb-1">
                📅 Published Date: {selectedArticleModal.date}
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
                {selectedArticleModal.title}
              </h2>
            </div>

            {/* Media Image or Video */}
            {selectedArticleModal.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-amber-500/30 max-h-96 bg-black shadow-xl">
                <img loading="lazy"
                  src={selectedArticleModal.imageUrl}
                  alt={selectedArticleModal.title}
                  className="w-full max-h-96 object-contain mx-auto"
                  onError={(e) => { (e.target as HTMLImageElement).closest('div')!.style.display = 'none'; }}
                />
              </div>
            )}

            {selectedArticleModal.videoUrl && (
              <div className="rounded-2xl overflow-hidden border border-amber-500/30 aspect-video bg-black shadow-xl">
                <SmartVideoPlayer url={selectedArticleModal.videoUrl} className="w-full h-full" title={selectedArticleModal.title} />
              </div>
            )}

            {/* Speaker Quote Box if Present */}
            {selectedArticleModal.speakerName && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border-l-4 border-amber-400 space-y-2">
                <p className="text-sm italic font-serif text-amber-100">
                  "{selectedArticleModal.description}"
                </p>
                <div className="text-xs font-bold text-amber-300">
                  — {selectedArticleModal.speakerName} ({selectedArticleModal.speakerRole})
                </div>
              </div>
            )}

            {/* Full Body Paragraphs */}
            <ArticleContentRenderer
              content={selectedArticleModal.fullBody || selectedArticleModal.description}
              className="space-y-4 text-sm text-slate-200 leading-relaxed font-sans"
            />

            {/* Verification Footer & Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Verified Source: <strong className="text-slate-200 font-mono">{selectedArticleModal.verifiedBy || 'insight.aviyana.lk Official Hub'}</strong>
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                {selectedArticleModal.documentName && (
                  <button
                    onClick={() => onOpenDocument(selectedArticleModal.documentName!, selectedArticleModal.title)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <FileText size={14} />
                    <span>View Official Certificate</span>
                  </button>
                )}

                <button
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                >
                  <Share2 size={14} />
                  <span>{copiedLink ? '✓ Copied Link!' : 'Share Article'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  title="Print or save this as PDF"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add/Edit for Milestones, CSR/Fleet, and Voice Cuts now goes through
          the top-level Unified Content Editor (see onOpenContentEditor) —
          App.tsx owns that modal so it can be opened from anywhere, not just
          this page. See UnifiedContentEditor.tsx. */}

    </div>
  );
};
