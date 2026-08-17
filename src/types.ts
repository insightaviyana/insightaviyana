/**
 * Aviyana Ceylon Resort ORM & Digital Hub Types
 */

export type AppTheme = 'dark' | 'light';

export type UserRole = 
  | 'IT_LEAD'           // SE / IT Graduate (Technical Lead & Web Architect)
  | 'STORY_HUNTER'      // Hotel School Crew (Story Hunters & Media Crew)
  | 'SOCIAL_MANAGER'    // Hotel School Crew (Social & Review Managers)
  | 'GUEST_COORDINATOR' // Hotel School Crew (Guest & Influencer Coordinator)
  | 'HOTEL_SCHOOL_CREW' // Hotel School Trainees & Crew
  | 'STAFF_MEMBER'      // General-purpose role for staff who don't fit the
                         // narrower departments above -- covers the shared
                         // tools most day-to-day roles need (Content
                         // Pipeline, Inquiry Desk, Fact-Check & FAQ) without
                         // requiring a new named role + code change for
                         // every new job title. A fully admin-configurable
                         // custom-role system (create a named role, choose
                         // exactly which tabs it sees) is a legitimate
                         // larger feature for later -- this is the pragmatic
                         // stopgap for "we need one more assignable role
                         // today."
  | 'PUBLIC_VISITOR';   // Public Guest / Investor View

// Top-level account tier, separate from the department-style UserRole above.
// admin: full access to every tab + user management. staff: signed-in team
// member whose UserRole above decides which staff tabs they see. guest: a
// self-registered reader account (Google or email/password), read-only.
export type AccountType = 'admin' | 'staff' | 'guest';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  accountType: AccountType;
  title: string;
  avatar: string;
  email: string;
  password?: string;
  responsibilities: string[];
}

export interface Milestone {
  id: string;
  title: string;
  category: 'Clearance' | 'Construction' | 'CSR' | 'Hospitality' | 'Environmental' | 'Grand Opening' | 'Safety & Security';
  date: string;
  status: 'Verified' | 'In Progress' | 'Upcoming' | 'Completed';
  description: string;
  /** Optional extra background/context paragraph staff can write for the full-article reader view.
   * Free text, written per-post -- NOT auto-generated boilerplate. Shown after the description if present. */
  context?: string;
  documentUrl?: string;
  documentName?: string;
  imageUrl: string;
  verifiedBy: string;
  /** Set automatically when a milestone is edited after first being added
   * -- see ContentContext.tsx's handleEditMilestone. Same "last updated"
   * transparency as ArticleItem.lastEditedAt. */
  lastEditedAt?: string;
}

export interface FactCheckItem {
  id: string;
  rumor: string;
  fact: string;
  officialSource: string;
  documentProof?: string;
  category: 'Environment' | 'Land & Permits' | 'Construction' | 'Community' | 'Service' | 'Investment & Financial';
  verifiedDate: string;
  status: 'Verified Fact' | 'Myth Debunked';
  /** Workflow state, separate from the `status` factual classification above.
   * New entries from non-admin staff start 'Pending Approval' and are only
   * shown on the public Public Hub once an admin approves & publishes them. */
  approvalStatus: 'Pending Approval' | 'Published';
  createdBy?: string;
  /** Set automatically when a fact-check is edited/re-approved after first
   * being published -- see ContentContext.tsx's handleEditFactCheck. Same
   * "last updated" transparency as ArticleItem.lastEditedAt -- especially
   * important here, since a visible correction trail on the Fact-Check
   * Portal is core to the "verified source of truth" positioning. */
  lastEditedAt?: string;
}

export interface CSRImpact {
  id: string;
  title: string;
  metricValue: string;
  metricLabel: string;
  description: string;
  /** Optional extra background/context paragraph staff can write for the full-article reader view.
   * Free text, written per-post -- NOT auto-generated boilerplate. Shown after the description if present. */
  context?: string;
  location: string;
  iconName: 'users' | 'droplet' | 'tree' | 'building' | 'heart';
  imageUrl: string;
  /** Optional YouTube (or other) video link -- used for the Guest Voices & Opening Wishes
   * section so staff can upload real guest video clips instead of stock/placeholder imagery. */
  videoUrl?: string;
}

export interface VoiceCut {
  id: string;
  speakerName: string;
  speakerRole: string;
  title: string;
  duration: string;
  videoThumbnail: string;
  quote: string;
  videoUrl?: string;
  date: string;
}

export interface SERPItem {
  id: string;
  query: string;
  rank: number;
  title: string;
  url: string;
  domain: string;
  type: 'Official Subdomain' | 'High Authority Asset' | 'Forum/Reddit';
  status: 'Dominant' | 'Pushed Down' | 'Monitored';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export interface ContentPipelineItem {
  id: string;
  title: string;
  capturedBy: string;
  role: string;
  date: string;
  status: 'Draft Captured' | 'Pending SE Approval' | 'Needs Revision' | 'Published';
  platform: ('Facebook' | 'Instagram' | 'LinkedIn' | 'YouTube' | 'WhatsApp')[];
  mediaPreviewUrl: string;
  notes: string;
  publishTimeMinutes?: number;
  /** Feedback left by whoever requested changes (usually an admin), shown to
   * the original submitter so they know exactly what to fix before resubmitting. */
  revisionNote?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
  type: 'mention' | 'approval' | 'review' | 'serp' | 'warning';
  read: boolean;
  actionRequired?: string;
  sourceUrl?: string;
}

/** One entry in the staff-facing activity/audit log -- who did what, to what, and when. */
export interface ActivityLogEntry {
  id: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  /** e.g. 'created', 'edited', 'deleted', 'approved', 'published', 'status changed' */
  action: string;
  /** e.g. 'Article', 'Milestone', 'Content Draft', 'User Account', 'Inquiry' */
  targetType: string;
  targetTitle: string;
  detail?: string;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  platform: 'Google My Business' | 'TripAdvisor' | 'Social Media';
  rating: number;
  date: string;
  comment: string;
  status: 'Published' | 'Pending Response' | 'Flagged';
  response?: string;
  isSoftLaunchGuest?: boolean;
}

export interface ArticleItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Investor Update' | 'Hotel School' | 'Career & Hiring' | 'Press Release' | 'Sustainability & CEA' | 'Grand Opening' | 'Community & CSR' | 'Resort Milestone';
  author: string;
  authorRole: string;
  /** The publishing staff member's profile photo, shown next to their name
   * on the article. Captured automatically at publish time from whoever is
   * signed in -- not a separate upload step. */
  authorAvatarUrl?: string;
  date: string;
  content: string;
  coverImageUrl?: string;
  mediaType?: 'image' | 'video' | 'both';
  videoUrl?: string; // Supports local object URL or MP4/WebM URL
  videoCaption?: string;
  attachments?: { name: string; url: string; size: string; type: string }[];
  status: 'Published' | 'Draft' | 'In Review';
  viewsCount: number;
  featured?: boolean;
  tags: string[];
  /** Set automatically whenever a Published (or previously Published)
   * article is edited -- see ContentContext.tsx's handleEditArticle. Lets
   * the public reader show "Updated on <date>" for genuine corrections,
   * distinct from the original publish date. Undefined = never edited
   * since it was created. */
  lastEditedAt?: string;
  /** Optional embargo/scheduled-publish time (ISO string). A staff member
   * can mark an article 'Published' ahead of time with this set to a
   * future moment -- see src/lib/contentVisibility.ts's isPubliclyVisible(),
   * which every PUBLIC-facing article list filters through. Staff/admin
   * views still show it immediately (so it can be reviewed before the
   * embargo lifts). Undefined/past = publishes immediately, i.e. today's
   * existing behavior for every article that doesn't set this. */
  scheduledPublishAt?: string;
}

export interface EducationCourse {
  id: string;
  title: string;
  category: 'Hospitality Academy' | 'Sustainability & CEA' | 'Youth Career' | 'Language & Etiquette';
  duration: string;
  instructor: string;
  description: string;
  highlights: string[];
  enrolledCount: number;
  badge: string;
  status: 'Open for Registration' | 'Ongoing' | 'Upcoming';
  schedule: string;
  syllabusDocName?: string;
}

/** A student testimonial video or a school event clip shown in the Education page's video gallery. */
export interface EducationMedia {
  id: string;
  type: 'Student Voice' | 'Event';
  title: string;
  personName: string;
  personDetail: string; // e.g. "Batch of 2025, F&B Management" or "Graduation Ceremony, July 2026"
  thumbnailUrl: string;
  videoUrl: string; // YouTube link recommended
  date: string;
}

/** A single photo in the Education page's photo gallery (campus, students, events, etc). */
export interface EducationPhoto {
  id: string;
  imageUrl: string;
  caption: string;
  date: string;
  /** Groups photos uploaded in the same "Add Photos" batch into one
   * browsable album. Optional so existing pre-album rows keep working --
   * a photo with no albumId is treated as its own single-photo album (see
   * groupPhotosIntoAlbums() in EducationView.tsx). */
  albumId?: string;
  albumName?: string;
  /** True if this photo is the album's chosen cover (shown on the album
   * card). At most one photo per album should have this set -- see
   * setAlbumCover() in EducationView.tsx, which clears it on siblings
   * before setting it on the new choice. Falls back to the first photo in
   * the album if none is explicitly marked. */
  isCover?: boolean;
}

/** A sponsorship the resort has backed -- shown on the public "Sponsored
 * Events" page as its own card with a title, sponsor name, description, and
 * cover image. Each event then has its own video + photo-album galleries
 * (SponsoredEventMedia / SponsoredEventPhoto below), mirroring the Global
 * Campus page's gallery pattern (EducationMedia / EducationPhoto above). */
export interface SponsoredEvent {
  id: string;
  title: string;
  sponsorName: string;
  description: string;
  eventDate: string;
  coverImageUrl: string;
  location?: string;
}

/** A video clip belonging to a Sponsored Event's video gallery. Same shape
 * as EducationMedia's video fields, scoped to one event via eventId. */
export interface SponsoredEventMedia {
  id: string;
  eventId: string;
  title: string;
  videoUrl: string; // YouTube link recommended
  thumbnailUrl: string;
  date: string;
}

/** A single photo in a Sponsored Event's photo gallery, grouped into
 * browsable albums exactly like EducationPhoto (see EducationView.tsx's
 * groupPhotosIntoAlbums() for the album-grouping logic this mirrors). */
export interface SponsoredEventPhoto {
  id: string;
  eventId: string;
  imageUrl: string;
  caption: string;
  date: string;
  albumId?: string;
  albumName?: string;
  isCover?: boolean;
}

export interface PublicInquiry {
  id: string;
  name: string;
  email: string;
  contact: string;
  category: 'Press & Media' | 'Environmental Clearance (CEA)' | 'Community Water Project' | 'Employment & Academy' | 'Investment & Financial' | 'General Question';
  question: string;
  submittedAt: string;
  status: 'Delivered to insight@aviyana.lk' | 'In Review' | 'Answered';
  ticketNumber: string;
  /** Signed URL to an uploaded CV/resume (30-day expiry, staff/admin only --
   * see uploadCv() in cvUpload.ts). Only present for job/career-related inquiries. */
  cvUrl?: string;
  cvFileName?: string;
  linkedinUrl?: string;
}

export interface UserRegistration {
  id: string;
  name: string;
  email: string;
  contact: string;
  organizationRole: 'Press & Journalist' | 'Local Resident / Community' | 'Investor / Partner' | 'Hospitality Trainee' | 'Future Resort Guest';
  registeredAt: string;
  interests: string[];
  vipPassCode: string;
}

export interface SocialLink {
  platform: string;
  handle: string;
  url: string;
  iconName: 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp' | 'globe' | 'twitter';
  description: string;
}

/** Press Kit "Executive Headshots" -- editable by staff/admin (previously
 * hardcoded). See executivesApi.ts / AdminContext.tsx. */
export interface Executive {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  displayOrder: number;
}

