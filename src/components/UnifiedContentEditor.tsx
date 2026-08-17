import React, { useState, useEffect } from 'react';
import { X, Award, Heart, Volume2, HelpCircle, ChevronLeft, Newspaper, GraduationCap, Video as VideoIcon } from 'lucide-react';
import { Milestone, CSRImpact, VoiceCut, FactCheckItem, ArticleItem, EducationCourse, EducationMedia, User } from '../types';
import { QuickCrudModal, QuickFieldConfig } from './QuickCrudModal';
import { determineFactCheckApprovalStatus } from '../lib/factCheckStatus';
import { determineNewArticleStatus, determineEditedArticleStatus } from '../lib/statusTransitions';
import { filterNameInput } from '../lib/validation';

/**
 * The single "what kind of content is this" entry point requested by the
 * project owner -- see NEXT_SESSION_PLAN.md, Priority 0.
 *
 * SCOPE: covers Milestone, CSR/Guest Voice, Voice Cut, Fact-Check, Article,
 * Course, and Education Media (Student Voice / Event video). Education
 * Photos are deliberately NOT included here -- EducationView's own "Add
 * Photo" flow supports queuing and uploading a whole album of photos in one
 * batch, which doesn't map onto this single-item add/edit schema without
 * losing that (materially better) capability. That page keeps its own
 * specialized photo-album modal; see EducationView.tsx.
 *
 * Content Pipeline drafts are deliberately NOT a kind here -- that stays its
 * own "capture now, get approved later" workflow (see ContentPipelineView.tsx)
 * per the open question in the plan.
 */
export type UnifiedContentKind = 'milestone' | 'csr' | 'voicecut' | 'faq' | 'article' | 'course' | 'education-media';

export interface UnifiedContentEditorRequest {
  /** null = show the kind-selector step first. A specific kind = skip straight
   * to that kind's fields (still changeable via "Change type"), matching the
   * "pre-select but allow changing" decision from the plan's open questions. */
  kind: UnifiedContentKind | null;
  isEditing: boolean;
  id: string | null;
  /** Optional field defaults to merge in for a NEW item (e.g. the Investment
   * page opening a new article pre-set to category: 'Investor Update').
   * Ignored when editing an existing item. */
  presetValues?: Record<string, string>;
}

interface UnifiedContentEditorProps {
  request: UnifiedContentEditorRequest | null;
  onClose: () => void;
  currentUser: User;
  isAdmin: boolean;
  milestones: Milestone[];
  csrImpacts: CSRImpact[];
  voiceCuts: VoiceCut[];
  factChecks: FactCheckItem[];
  articles: ArticleItem[];
  courses: EducationCourse[];
  educationMedia: EducationMedia[];
  onAddMilestone: (item: Milestone) => void;
  onEditMilestone: (item: Milestone) => void;
  onDeleteMilestone: (id: string) => void;
  onAddCsrImpact: (item: CSRImpact) => void;
  onEditCsrImpact: (item: CSRImpact) => void;
  onDeleteCsrImpact: (id: string) => void;
  onAddVoiceCut: (item: VoiceCut) => void;
  onEditVoiceCut: (item: VoiceCut) => void;
  onDeleteVoiceCut: (id: string) => void;
  onAddFactCheck: (item: FactCheckItem) => void;
  onEditFactCheck: (item: FactCheckItem) => void;
  onDeleteFactCheck: (id: string) => void;
  onAddArticle: (item: ArticleItem) => void;
  onEditArticle: (item: ArticleItem) => void;
  onDeleteArticle: (id: string) => void;
  onAddCourse: (item: EducationCourse) => void;
  onEditCourse: (item: EducationCourse) => void;
  onDeleteCourse: (id: string) => void;
  onAddEducationMedia: (item: EducationMedia) => void;
  onDeleteEducationMedia: (id: string) => void;
}

const KIND_META: Record<UnifiedContentKind, { label: string; sublabel: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  milestone: { label: 'Milestone / News', sublabel: 'Construction progress, clearances, launch events', icon: Award },
  csr: { label: 'Guest Voice / CSR', sublabel: 'Guest wishes, CSR & fleet impact stories', icon: Heart },
  voicecut: { label: 'Press Statement', sublabel: 'Executive voice cuts & recorded statements', icon: Volume2 },
  faq: { label: 'Fact-Check', sublabel: 'Rumor vs. verified fact entries', icon: HelpCircle },
  article: { label: 'Article', sublabel: 'Press releases, announcements, full articles', icon: Newspaper },
  course: { label: 'Academy Course', sublabel: 'Aviyana Global Campus training programs', icon: GraduationCap },
  'education-media': { label: 'Student Voice / Event Video', sublabel: 'Testimonial or school event video clip', icon: VideoIcon }
};

const MODAL_TITLES: Record<UnifiedContentKind, { add: string; edit: string }> = {
  milestone: { add: 'Add News / Milestone Item', edit: 'Edit News / Milestone Item' },
  csr: { add: 'Add Guest Voice / Opening Wish', edit: 'Edit Guest Voice / Opening Wish' },
  voicecut: { add: 'Add Press Statement', edit: 'Edit Press Statement' },
  faq: { add: 'Add Fact-Check Entry', edit: 'Edit Fact-Check Entry' },
  article: { add: 'Write New Article', edit: 'Edit Article' },
  course: { add: 'Create New Course', edit: 'Edit Course' },
  'education-media': { add: 'Add Student Voice / Event Video', edit: 'Edit Video' }
};

const IMAGE_FOLDERS: Record<UnifiedContentKind, string> = {
  milestone: 'milestones',
  csr: 'csr',
  voicecut: 'voice-cuts',
  faq: 'general',
  article: 'articles',
  course: 'general',
  'education-media': 'education-media'
};

const DEFAULT_ARTICLE_COVER = 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80';

// --- Scheduled publish date helpers -------------------------------------
// The "Schedule For Later" field is a plain free-text input (see
// QuickFieldConfig -- there's no dedicated datetime-local field type),
// matching the same "YYYY-MM-DD" free-text convention already used for
// verifiedDate/date fields elsewhere in this file. These two helpers
// convert between that human-typed text and the ISO string actually stored
// on ArticleItem.scheduledPublishAt.

/** Human-typed text -> ISO string, or undefined if blank/unparseable.
 * Deliberately permissive (relies on `new Date()`'s own parsing) rather
 * than enforcing one exact format -- "2026-08-20 09:00", "2026-08-20",
 * and "Aug 20 2026 9am" all parse fine, and an unparseable value just
 * means "no schedule" rather than a hard validation error blocking save. */
function parseScheduleInput(value?: string): string | undefined {
  const trimmed = (value || '').trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

/** ISO string -> human-readable text for re-populating the field when
 * editing an article that already has a schedule set. */
function formatForScheduleInput(iso: string): string {
  const parsed = new Date(iso);
  if (isNaN(parsed.getTime())) return '';
  return parsed.toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');
}

const DEFAULT_MEDIA_THUMBNAIL = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80';

const FIELD_SCHEMAS: Record<UnifiedContentKind, QuickFieldConfig[]> = {
  milestone: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', options: ['Clearance', 'Construction', 'CSR', 'Hospitality', 'Environmental', 'Grand Opening', 'Safety & Security'], required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Verified', 'In Progress', 'Upcoming', 'Completed'], required: true },
    { key: 'date', label: 'Date (YYYY-MM-DD)', type: 'text', placeholder: '2026-01-15', required: true },
    { key: 'description', label: 'Description', type: 'textarea', rows: 5, required: true },
    { key: 'context', label: 'Additional Context (optional, shown in the full article view)', type: 'textarea', rows: 5, placeholder: 'Write any background, verification details, or extra context for this specific post — this is NOT auto-generated.' },
    { key: 'imageUrl', label: 'Cover Image', type: 'image', required: true },
    { key: 'verifiedBy', label: 'Verified By', type: 'text', required: true, filter: filterNameInput },
    { key: 'documentName', label: 'Document Name (optional)', type: 'text' }
  ],
  csr: [
    { key: 'title', label: 'Guest Name / Title', type: 'text', required: true },
    { key: 'metricValue', label: 'Short Highlight (e.g. "❤" or a number)', type: 'text', required: true },
    { key: 'metricLabel', label: 'Subtitle (e.g. "Honeymoon Guests, UK")', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea', rows: 5, required: true },
    { key: 'context', label: 'Additional Context (optional, shown in the full article view)', type: 'textarea', rows: 5, placeholder: 'Write any background or extra context for this specific post — this is NOT auto-generated.' },
    { key: 'location', label: 'Location / Occasion', type: 'text', required: true },
    { key: 'iconName', label: 'Icon', type: 'select', options: ['users', 'droplet', 'tree', 'building', 'heart'], required: true },
    { key: 'imageUrl', label: 'Cover Image', type: 'image', required: true },
    { key: 'videoUrl', label: 'Video URL (YouTube link — the guest video clip)', type: 'text' }
  ],
  voicecut: [
    { key: 'speakerName', label: 'Speaker Name', type: 'text', required: true, filter: filterNameInput },
    { key: 'speakerRole', label: 'Speaker Role', type: 'text', required: true },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'duration', label: 'Duration (e.g. "3:45")', type: 'text', required: true },
    { key: 'date', label: 'Date (YYYY-MM-DD)', type: 'text', placeholder: '2026-01-15', required: true },
    { key: 'quote', label: 'Quote', type: 'textarea', rows: 5, required: true },
    { key: 'videoThumbnail', label: 'Thumbnail Image', type: 'image', required: true },
    { key: 'videoUrl', label: 'Video URL (YouTube link recommended)', type: 'text' }
  ],
  faq: [
    { key: 'rumor', label: 'Rumor / Claim', type: 'textarea', rows: 5, required: true },
    { key: 'category', label: 'Category', type: 'select', options: ['Environment', 'Land & Permits', 'Construction', 'Community', 'Service', 'Investment & Financial'], required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Verified Fact', 'Myth Debunked'], required: true },
    { key: 'fact', label: 'Verified Fact / Response', type: 'textarea', rows: 5, required: true },
    { key: 'officialSource', label: 'Official Source', type: 'text', required: true },
    { key: 'documentProof', label: 'Document Proof (optional)', type: 'text' },
    { key: 'verifiedDate', label: 'Verified Date (YYYY-MM-DD)', type: 'text', placeholder: '2026-01-15', required: true }
  ],
  article: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'subtitle', label: 'Subtitle (optional)', type: 'text', placeholder: 'Official Press Release from insight.aviyana.lk' },
    { key: 'category', label: 'Category', type: 'select', required: true, options: ['Investor Update', 'Hotel School', 'Career & Hiring', 'Press Release', 'Sustainability & CEA', 'Grand Opening', 'Community & CSR', 'Resort Milestone'] },
    { key: 'coverImageUrl', label: 'Cover Image', type: 'image', required: true },
    { key: 'videoUrl', label: 'Video — YouTube Link (optional, recommended over local upload)', type: 'text', placeholder: 'https://youtu.be/xxxxxxxxxxx' },
    { key: 'videoCaption', label: 'Video Caption (optional)', type: 'text', placeholder: 'e.g. 4K Drone Footage of Villa Suite construction' },
    {
      key: 'content', label: 'Article Body / Press Text', type: 'richtext', required: true, mediaInsertFolder: 'articles',
      placeholder: 'Write full article text here. Use the buttons above to attach photos or videos directly inside the article body text...',
      helperText: 'Photos uploaded here are saved permanently. Videos are preview-only in this tab — use a YouTube link for a video that survives a page reload.'
    },
    { key: 'tags', label: 'Tags (comma separated)', type: 'text', placeholder: 'Grand Opening, CEA Clearance, Hospitality Academy' },
    {
      key: 'scheduledPublishAt', label: 'Schedule For Later (optional)', type: 'text',
      placeholder: 'e.g. 2026-08-20 09:00 — leave blank to publish immediately',
      helperText: 'Only applies once this post is Published (admin posts, or a staff post after admin approval) -- it stays hidden from the public site until this exact date/time, even though staff can still see and review it right away.'
    }
  ],
  course: [
    { key: 'title', label: 'Course Title', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: ['Hospitality Academy', 'Sustainability & CEA', 'Youth Career', 'Language & Etiquette'] },
    { key: 'duration', label: 'Duration', type: 'text', required: true, placeholder: '3 Months (Full-Time)' },
    { key: 'instructor', label: 'Instructor', type: 'text', required: true, placeholder: 'Aviyana Senior Academy Faculty' },
    { key: 'description', label: 'Description', type: 'textarea', rows: 5, required: true },
    { key: 'badge', label: 'Badge (e.g. scholarship note)', type: 'text', placeholder: '100% Sponsored Scholarship' },
    { key: 'schedule', label: 'Schedule', type: 'text', placeholder: 'Batch Starts: October 2026' },
    { key: 'highlights', label: 'Highlights (one per line)', type: 'textarea', rows: 5, required: true, placeholder: 'Guaranteed employment at Aviyana Ceylon Resort\nFull monthly training stipend provided\nInternationally accredited certification' }
  ],
  'education-media': [
    { key: 'type', label: 'Type', type: 'select', required: true, options: ['Student Voice', 'Event'] },
    { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. From Trainee to Sous Chef' },
    { key: 'personName', label: 'Student Name / Event Name', type: 'text', required: true, placeholder: 'e.g. Nimali Perera, or Graduation Ceremony 2026' },
    { key: 'personDetail', label: 'Batch / Program, or Event Detail', type: 'text', required: true, placeholder: 'e.g. Batch of 2025, F&B Management' },
    { key: 'videoUrl', label: 'Video URL (YouTube link)', type: 'text', required: true, placeholder: 'https://youtube.com/watch?v=...' },
    { key: 'thumbnailUrl', label: 'Thumbnail Image (optional)', type: 'image' }
  ]
};

export const UnifiedContentEditor: React.FC<UnifiedContentEditorProps> = ({
  request,
  onClose,
  currentUser,
  isAdmin,
  milestones,
  csrImpacts,
  voiceCuts,
  factChecks,
  articles,
  courses,
  educationMedia,
  onAddMilestone,
  onEditMilestone,
  onDeleteMilestone,
  onAddCsrImpact,
  onEditCsrImpact,
  onDeleteCsrImpact,
  onAddVoiceCut,
  onEditVoiceCut,
  onDeleteVoiceCut,
  onAddFactCheck,
  onEditFactCheck,
  onDeleteFactCheck,
  onAddArticle,
  onEditArticle,
  onDeleteArticle,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onAddEducationMedia,
  onDeleteEducationMedia
}) => {
  // Locally-selected kind, seeded from the incoming request each time it
  // changes. Editing an existing item always has a fixed kind (you can't
  // reclassify an existing Milestone into a Fact-Check), so "Change type"
  // is only offered when adding new content.
  const [selectedKind, setSelectedKind] = useState<UnifiedContentKind | null>(request?.kind ?? null);

  useEffect(() => {
    setSelectedKind(request?.kind ?? null);
  }, [request]);

  if (!request) return null;

  const { isEditing, id, presetValues } = request;

  const getInitialValues = (kind: UnifiedContentKind): Record<string, string> => {
    if (!id) {
      const today = new Date().toISOString().split('T')[0];
      let defaults: Record<string, string> = {};
      if (kind === 'milestone') defaults = { category: 'Construction', status: 'In Progress', date: today };
      else if (kind === 'csr') defaults = { iconName: 'building' };
      else if (kind === 'voicecut') defaults = { date: today };
      else if (kind === 'faq') defaults = { category: 'Construction', status: 'Verified Fact', verifiedDate: today };
      else if (kind === 'article') defaults = { category: 'Press Release', coverImageUrl: DEFAULT_ARTICLE_COVER, tags: 'Grand Opening, CEA Approval, Luxury' };
      else if (kind === 'course') defaults = { category: 'Hospitality Academy', duration: '3 Months (Full-Time)', instructor: 'Aviyana Senior Academy Faculty', badge: '100% Sponsored Scholarship', schedule: 'Batch Starts: October 2026' };
      else if (kind === 'education-media') defaults = { type: 'Student Voice' };
      // Preset values (e.g. Investment page opening a new article pre-set to
      // category: 'Investor Update') override the kind's own defaults.
      return { ...defaults, ...(presetValues || {}) };
    }
    if (kind === 'milestone') {
      const m = milestones.find(x => x.id === id);
      if (!m) return {};
      return { title: m.title, category: m.category, status: m.status, date: m.date, description: m.description, context: m.context || '', imageUrl: m.imageUrl, verifiedBy: m.verifiedBy, documentName: m.documentName || '' };
    }
    if (kind === 'csr') {
      const c = csrImpacts.find(x => x.id === id);
      if (!c) return {};
      return { title: c.title, metricValue: c.metricValue, metricLabel: c.metricLabel, description: c.description, context: c.context || '', location: c.location, iconName: c.iconName, imageUrl: c.imageUrl, videoUrl: c.videoUrl || '' };
    }
    if (kind === 'voicecut') {
      const v = voiceCuts.find(x => x.id === id);
      if (!v) return {};
      return { speakerName: v.speakerName, speakerRole: v.speakerRole, title: v.title, duration: v.duration, date: v.date, quote: v.quote, videoThumbnail: v.videoThumbnail, videoUrl: v.videoUrl || '' };
    }
    if (kind === 'faq') {
      const f = factChecks.find(x => x.id === id);
      if (!f) return {};
      return { rumor: f.rumor, fact: f.fact, category: f.category, status: f.status, officialSource: f.officialSource, verifiedDate: f.verifiedDate, documentProof: f.documentProof || '' };
    }
    if (kind === 'article') {
      const a = articles.find(x => x.id === id);
      if (!a) return {};
      return { title: a.title, subtitle: a.subtitle, category: a.category, coverImageUrl: a.coverImageUrl || DEFAULT_ARTICLE_COVER, videoUrl: a.videoUrl || '', videoCaption: a.videoCaption || '', content: a.content, tags: a.tags.join(', '), scheduledPublishAt: a.scheduledPublishAt ? formatForScheduleInput(a.scheduledPublishAt) : '' };
    }
    if (kind === 'course') {
      const c = courses.find(x => x.id === id);
      if (!c) return {};
      return { title: c.title, category: c.category, duration: c.duration, instructor: c.instructor, description: c.description, badge: c.badge, schedule: c.schedule, highlights: c.highlights.join('\n') };
    }
    if (kind === 'education-media') {
      const m = educationMedia.find(x => x.id === id);
      if (!m) return {};
      return { type: m.type, title: m.title, personName: m.personName, personDetail: m.personDetail, videoUrl: m.videoUrl, thumbnailUrl: m.thumbnailUrl };
    }
    return {};
  };

  const handleSave = (kind: UnifiedContentKind, values: Record<string, string>) => {
    const genId = (prefix: string) => id || `${prefix}-${Date.now()}`;

    if (kind === 'milestone') {
      const item: Milestone = {
        id: genId('ms'),
        title: values.title,
        category: values.category as Milestone['category'],
        status: values.status as Milestone['status'],
        date: values.date,
        description: values.description,
        context: values.context || undefined,
        imageUrl: values.imageUrl,
        verifiedBy: values.verifiedBy,
        documentName: values.documentName || undefined
      };
      if (isEditing) onEditMilestone(item); else onAddMilestone(item);
    } else if (kind === 'csr') {
      const item: CSRImpact = {
        id: genId('csr'),
        title: values.title,
        metricValue: values.metricValue,
        metricLabel: values.metricLabel,
        description: values.description,
        context: values.context || undefined,
        location: values.location,
        iconName: values.iconName as CSRImpact['iconName'],
        imageUrl: values.imageUrl,
        videoUrl: values.videoUrl || undefined
      };
      if (isEditing) onEditCsrImpact(item); else onAddCsrImpact(item);
    } else if (kind === 'voicecut') {
      const item: VoiceCut = {
        id: genId('vc'),
        speakerName: values.speakerName,
        speakerRole: values.speakerRole,
        title: values.title,
        duration: values.duration,
        date: values.date,
        quote: values.quote,
        videoThumbnail: values.videoThumbnail,
        videoUrl: values.videoUrl || undefined
      };
      if (isEditing) onEditVoiceCut(item); else onAddVoiceCut(item);
    } else if (kind === 'faq') {
      if (isEditing) {
        const existing = factChecks.find(f => f.id === id);
        const item: FactCheckItem = {
          id: genId('fc'),
          rumor: values.rumor,
          fact: values.fact,
          officialSource: values.officialSource,
          category: values.category as FactCheckItem['category'],
          verifiedDate: values.verifiedDate,
          status: values.status as FactCheckItem['status'],
          documentProof: values.documentProof || undefined,
          approvalStatus: existing?.approvalStatus || determineFactCheckApprovalStatus(isAdmin),
          createdBy: existing?.createdBy || currentUser.name
        };
        onEditFactCheck(item);
      } else {
        // Same approval rule FaqManagerView uses -- admins publish
        // immediately, everyone else's entry goes to Pending Approval.
        const item: FactCheckItem = {
          id: genId('fc'),
          rumor: values.rumor,
          fact: values.fact,
          officialSource: values.officialSource,
          category: values.category as FactCheckItem['category'],
          verifiedDate: values.verifiedDate,
          status: values.status as FactCheckItem['status'],
          documentProof: values.documentProof || undefined,
          approvalStatus: determineFactCheckApprovalStatus(isAdmin),
          createdBy: currentUser.name
        };
        onAddFactCheck(item);
      }
    } else if (kind === 'article') {
      const tagArray = values.tags.split(',').map(t => t.trim()).filter(Boolean);
      const scheduledPublishAt = parseScheduleInput(values.scheduledPublishAt);
      if (isEditing) {
        const original = articles.find(a => a.id === id);
        if (!original) return;
        const updated: ArticleItem = {
          ...original,
          title: values.title.trim(),
          subtitle: values.subtitle.trim() || original.subtitle,
          category: values.category as ArticleItem['category'],
          content: values.content.trim(),
          coverImageUrl: values.coverImageUrl,
          videoUrl: values.videoUrl || undefined,
          videoCaption: values.videoCaption || original.videoCaption,
          mediaType: values.videoUrl ? 'both' : 'image',
          tags: tagArray.length > 0 ? tagArray : original.tags,
          // Admin edits keep the current status as-is; a staff edit sends it
          // back for review, matching AnnouncementsView's composer.
          status: determineEditedArticleStatus(isAdmin, original.status),
          scheduledPublishAt
        };
        onEditArticle(updated);
      } else {
        const created: ArticleItem = {
          id: genId('art'),
          title: values.title.trim(),
          subtitle: values.subtitle.trim() || 'Official Press Release from insight.aviyana.lk',
          category: values.category as ArticleItem['category'],
          author: currentUser.name,
          authorRole: currentUser.title,
          authorAvatarUrl: currentUser.avatar,
          date: new Date().toISOString().split('T')[0],
          content: values.content.trim(),
          coverImageUrl: values.coverImageUrl,
          videoUrl: values.videoUrl || undefined,
          videoCaption: values.videoCaption || 'Official Video Preview',
          mediaType: values.videoUrl ? 'both' : 'image',
          // Admins publish straight to the public site; everyone else's post
          // goes to "In Review" until an admin approves it.
          status: determineNewArticleStatus(isAdmin),
          viewsCount: 1,
          featured: true,
          tags: tagArray.length > 0 ? tagArray : ['Official'],
          scheduledPublishAt
        };
        onAddArticle(created);
      }
    } else if (kind === 'course') {
      const highlightArray = values.highlights.split('\n').map(h => h.trim()).filter(Boolean);
      if (isEditing) {
        const original = courses.find(c => c.id === id);
        if (!original) return;
        onEditCourse({
          ...original,
          title: values.title.trim(),
          category: values.category as EducationCourse['category'],
          duration: values.duration.trim(),
          instructor: values.instructor.trim(),
          description: values.description.trim(),
          highlights: highlightArray.length > 0 ? highlightArray : ['Certified Training Program'],
          badge: values.badge.trim() || 'Certificate Program',
          schedule: values.schedule.trim() || 'Upcoming Intake 2026'
        });
      } else {
        const newCourse: EducationCourse = {
          id: genId('edu'),
          title: values.title.trim(),
          category: values.category as EducationCourse['category'],
          duration: values.duration.trim(),
          instructor: values.instructor.trim(),
          description: values.description.trim(),
          highlights: highlightArray.length > 0 ? highlightArray : ['Certified Training Program'],
          enrolledCount: 0,
          badge: values.badge.trim() || 'Certificate Program',
          status: 'Open for Registration',
          schedule: values.schedule.trim() || 'Upcoming Intake 2026'
        };
        onAddCourse(newCourse);
      }
    } else if (kind === 'education-media') {
      // Add-only -- there's no edit affordance for this content type
      // elsewhere in the app either (see EducationView.tsx), so this branch
      // intentionally never runs with isEditing true.
      const item: EducationMedia = {
        id: genId('edu-media'),
        type: values.type as EducationMedia['type'],
        title: values.title,
        personName: values.personName,
        personDetail: values.personDetail,
        thumbnailUrl: values.thumbnailUrl || DEFAULT_MEDIA_THUMBNAIL,
        videoUrl: values.videoUrl,
        date: new Date().toISOString().split('T')[0]
      };
      onAddEducationMedia(item);
    }
    onClose();
  };

  const handleDelete = (kind: UnifiedContentKind) => {
    if (!id) return;
    if (kind === 'milestone') onDeleteMilestone(id);
    else if (kind === 'csr') onDeleteCsrImpact(id);
    else if (kind === 'voicecut') onDeleteVoiceCut(id);
    else if (kind === 'faq') onDeleteFactCheck(id);
    else if (kind === 'article') onDeleteArticle(id);
    else if (kind === 'course') onDeleteCourse(id);
    else if (kind === 'education-media') onDeleteEducationMedia(id);
    onClose();
  };

  // Step 1: kind selector -- shown whenever nothing's been picked yet
  // (navbar's global "+ Add Content" entry point opens with kind=null).
  if (!selectedKind) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/20">
            <h3 className="font-serif font-bold text-lg text-white">What are you adding?</h3>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {(Object.keys(KIND_META) as UnifiedContentKind[]).map(kind => {
              const meta = KIND_META[kind];
              const Icon = meta.icon;
              return (
                <button
                  key={kind}
                  onClick={() => setSelectedKind(kind)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white">{meta.label}</div>
                    <div className="text-[11px] text-slate-400 truncate">{meta.sublabel}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: kind-specific fields, reusing the existing generic form.
  const kind = selectedKind;
  return (
    <QuickCrudModal
      // CRITICAL: without a key tied to the specific item being edited,
      // QuickCrudModal never remounts when you close it and open it again
      // for a DIFFERENT item of the same kind (e.g. edit Article A, close,
      // then edit Article B) -- React just re-renders the same component
      // instance in place, so its internal `values` state (initialized via
      // useState(initialValues) on first mount only) keeps showing/holding
      // Article A's data while silently submitting it under Article B's id
      // on save. This is what made saves look like they "didn't go
      // through" or published the wrong content. The key forces a full
      // remount -- and therefore a fresh useState(initialValues) -- every
      // time the target kind or item id changes.
      key={`${kind}-${id || 'new'}`}
      isOpen={true}
      title={isEditing ? MODAL_TITLES[kind].edit : MODAL_TITLES[kind].add}
      fields={FIELD_SCHEMAS[kind]}
      initialValues={getInitialValues(kind)}
      isEditing={isEditing}
      onClose={onClose}
      onSave={(values) => handleSave(kind, values)}
      onDelete={isEditing ? () => handleDelete(kind) : undefined}
      imageFolder={IMAGE_FOLDERS[kind]}
      // "Change type" back-link is only meaningful when adding new content
      // (pre-select-but-allow-changing, per the plan's open question).
      headerExtra={!isEditing ? (
        <button
          type="button"
          onClick={() => setSelectedKind(null)}
          className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 font-semibold mr-2"
        >
          <ChevronLeft size={13} /> Change type
        </button>
      ) : undefined}
    />
  );
};
