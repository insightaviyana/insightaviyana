import React, { useState, useMemo } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Users, 
  CheckCircle2, 
  Send, 
  FileText, 
  Download, 
  Sparkles, 
  Building, 
  Clock, 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  Check, 
  ShieldCheck,
  User,
  Mail,
  Phone,
  Plus,
  X,
  Pencil,
  Trash2,
  Video,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { EducationCourse, EducationMedia, EducationPhoto, User as UserType } from '../types';
import { SmartVideoPlayer } from './SmartVideoPlayer';
import { uploadContentImage } from '../lib/contentImageUpload';

interface EducationViewProps {
  courses: EducationCourse[];
  currentUser: UserType;
  onOpenQuestionModal: () => void;
  onAddCourse?: (course: EducationCourse) => void;
  onEditCourse?: (course: EducationCourse) => void;
  onDeleteCourse?: (courseId: string) => void;
  onApplyCourse?: (application: {
    applicationCode: string;
    courseTitle: string;
    applicantName: string;
    applicantEmail: string;
    applicantContact: string;
    applicantNote: string;
  }) => Promise<string | null>;
  educationMedia?: EducationMedia[];
  onAddEducationMedia?: (item: EducationMedia) => void;
  onDeleteEducationMedia?: (id: string) => void;
  educationPhotos?: EducationPhoto[];
  onAddEducationPhoto?: (item: EducationPhoto) => void;
  onDeleteEducationPhoto?: (id: string) => void;
  onUpdateEducationPhoto?: (id: string, updates: Partial<Pick<EducationPhoto, 'albumId' | 'albumName' | 'isCover' | 'caption'>>) => void;
  /** Opens the top-level Unified Content Editor pre-set to 'course' or
   * 'education-media' (and to a specific id when editing). Replaces this
   * page's own local Course/Video composers as the primary entry point.
   * Education Photos deliberately keep their own batch-upload modal (see
   * UnifiedContentEditor.tsx for why) so this callback only covers the
   * other two kinds. */
  onOpenContentEditor?: (kind: 'course' | 'education-media', id?: string) => void;
}

export const EducationView: React.FC<EducationViewProps> = ({
  courses,
  currentUser,
  onOpenQuestionModal,
  onAddCourse,
  onEditCourse,
  onDeleteCourse,
  onApplyCourse,
  educationMedia = [],
  onAddEducationMedia,
  onDeleteEducationMedia,
  educationPhotos = [],
  onAddEducationPhoto,
  onDeleteEducationPhoto,
  onUpdateEducationPhoto,
  onOpenContentEditor
}) => {
  // Only staff/admin should be able to add, edit, or delete Academy
  // courses. The "Add New Course" button used to render for every visitor
  // (a logged-out visitor would see it, click it, and get a confusing
  // "success" that silently never saved, since the DB write would be
  // blocked by RLS while local state briefly showed it as added anyway).
  const isStaffAuthenticated = currentUser.accountType === 'admin' || currentUser.accountType === 'staff';
  const [selectedCourse, setSelectedCourse] = useState<EducationCourse | null>(courses[0] || null);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [mediaType, setMediaType] = useState<'Student Voice' | 'Event'>('Student Voice');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaPersonName, setMediaPersonName] = useState('');
  const [mediaPersonDetail, setMediaPersonDetail] = useState('');
  const [mediaThumbnailUrl, setMediaThumbnailUrl] = useState('');
  const [mediaVideoUrl, setMediaVideoUrl] = useState('');
  const [playingMedia, setPlayingMedia] = useState<EducationMedia | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  // An "album" of photos staged together -- was a single string, which is
  // why only one photo could ever be added per "Add Photo" click. Now holds
  // every photo (uploaded file OR pasted URL) queued for this batch; Submit
  // creates one EducationPhoto per entry, all sharing the same
  // caption/date, in a single click.
  const [photoImageUrls, setPhotoImageUrls] = useState<string[]>([]);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  // Which album's lightbox is currently open (null = gallery shows album
  // covers only). See groupPhotosIntoAlbums() below -- this is what lets
  // the top-level gallery show one card per album (page height stays
  // proportional to album count, not total photo count) while still
  // letting every individual photo be browsed and deleted.
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null);
  const [openAlbumPhotoIndex, setOpenAlbumPhotoIndex] = useState(0);

  // Groups the flat educationPhotos array into albums by albumId. A photo
  // with no albumId (uploaded before this feature existed) becomes its own
  // single-photo album, keyed by its own id -- so old data keeps displaying
  // correctly with no backfill/migration needed. Albums are ordered newest
  // first by their most recent photo's date.
  interface PhotoAlbum {
    albumId: string;
    albumName: string;
    coverUrl: string;
    date: string;
    photos: EducationPhoto[];
  }
  const albums: PhotoAlbum[] = useMemo(() => {
    const groups = new Map<string, EducationPhoto[]>();
    for (const photo of educationPhotos) {
      const key = photo.albumId || photo.id;
      const existing = groups.get(key);
      if (existing) existing.push(photo);
      else groups.set(key, [photo]);
    }
    return Array.from(groups.entries())
      .map(([albumId, photos]) => ({
        albumId,
        albumName: photos[0].albumName || photos[0].caption || 'Untitled Album',
        coverUrl: (photos.find(p => p.isCover) || photos[0]).imageUrl,
        date: photos[0].date,
        photos,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [educationPhotos]);
  const openAlbum = albums.find(a => a.albumId === openAlbumId) || null;
  const [renamingAlbum, setRenamingAlbum] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  // Renames an album by writing the new name (and, for a legacy
  // pre-album single photo whose albumId falls back to its own id, a real
  // albumId) to every photo in it -- see the EducationPhoto.albumId /
  // handleUpdateEducationPhoto comments for why this touches every photo
  // rather than a separate "albums" table.
  const renameAlbum = (album: PhotoAlbum, newName: string) => {
    if (!onUpdateEducationPhoto || !newName.trim()) return;
    album.photos.forEach(photo => {
      onUpdateEducationPhoto(photo.id, { albumId: album.albumId, albumName: newName.trim() });
    });
  };

  // Sets one photo as the album's cover, clearing the flag on any sibling
  // that previously had it -- see EducationPhoto.isCover.
  const setAlbumCover = (album: PhotoAlbum, photoId: string) => {
    if (!onUpdateEducationPhoto) return;
    album.photos.forEach(photo => {
      if (photo.id === photoId && !photo.isCover) onUpdateEducationPhoto(photo.id, { isCover: true });
      else if (photo.id !== photoId && photo.isCover) onUpdateEducationPhoto(photo.id, { isCover: false });
    });
  };
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailUploadError, setThumbnailUploadError] = useState(false);
  const [uploadingPhotoCount, setUploadingPhotoCount] = useState(0);
  const [photoUploadFailCount, setPhotoUploadFailCount] = useState(0);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantContact, setApplicantContact] = useState('');
  const [applicantNote, setApplicantNote] = useState('');
  const [applicationSuccess, setApplicationSuccess] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<'sending' | 'sent' | 'failed' | null>(null);

  // New Course Creation Modal State
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cCategory, setCCategory] = useState<EducationCourse['category']>('Hospitality Academy');
  const [cDuration, setCDuration] = useState('3 Months (Full-Time)');
  const [cInstructor, setCInstructor] = useState('Aviyana Senior Academy Faculty');
  const [cDescription, setCDescription] = useState('');
  const [cBadge, setCBadge] = useState('100% Sponsored Scholarship');
  const [cSchedule, setCSchedule] = useState('Batch Starts: October 2026');
  const [cHighlights, setCHighlights] = useState('Guaranteed employment at Aviyana Ceylon Resort\nFull monthly training stipend provided\nInternationally accredited certification');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  const handleApplyCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantEmail.trim() || !selectedCourse) return;

    const appCode = `EDU-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setApplicationSuccess(appCode);
    setEmailStatus('sending');

    onApplyCourse?.({
      applicationCode: appCode,
      courseTitle: selectedCourse.title,
      applicantName: applicantName.trim(),
      applicantEmail: applicantEmail.trim(),
      applicantContact: applicantContact.trim(),
      applicantNote: applicantNote.trim()
    }).then((errorMsg) => {
      setEmailStatus(errorMsg ? 'failed' : 'sent');
    });
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cTitle.trim() || !cDescription.trim()) return;

    const highlightArray = cHighlights
      .split('\n')
      .map(h => h.trim())
      .filter(Boolean);

    if (editingCourseId) {
      const original = courses.find(c => c.id === editingCourseId);
      if (!original || !onEditCourse) return;
      onEditCourse({
        ...original,
        title: cTitle.trim(),
        category: cCategory,
        duration: cDuration.trim(),
        instructor: cInstructor.trim(),
        description: cDescription.trim(),
        highlights: highlightArray.length > 0 ? highlightArray : ['Certified Training Program'],
        badge: cBadge.trim() || 'Certificate Program',
        schedule: cSchedule.trim() || 'Upcoming Intake 2026'
      });
    } else {
      if (!onAddCourse) return;
      const newCourse: EducationCourse = {
        id: `edu-${Date.now()}`,
        title: cTitle.trim(),
        category: cCategory,
        duration: cDuration.trim(),
        instructor: cInstructor.trim(),
        description: cDescription.trim(),
        highlights: highlightArray.length > 0 ? highlightArray : ['Certified Training Program'],
        enrolledCount: 0,
        badge: cBadge.trim() || 'Certificate Program',
        status: 'Open for Registration',
        schedule: cSchedule.trim() || 'Upcoming Intake 2026'
      };
      onAddCourse(newCourse);
      setSelectedCourse(newCourse);
    }

    // Reset Form
    setCTitle('');
    setCDescription('');
    setEditingCourseId(null);
    setCourseModalOpen(false);
  };

  const openEditCourseModal = (course: EducationCourse) => {
    setEditingCourseId(course.id);
    setCTitle(course.title);
    setCCategory(course.category);
    setCDuration(course.duration);
    setCInstructor(course.instructor);
    setCDescription(course.description);
    setCBadge(course.badge);
    setCSchedule(course.schedule);
    setCHighlights(course.highlights.join('\n'));
    setCourseModalOpen(true);
  };

  const handleDeleteCourse = (courseId: string) => {
    if (!onDeleteCourse) return;
    if (!window.confirm('Remove this course? This cannot be undone.')) return;
    onDeleteCourse(courseId);
    if (selectedCourse?.id === courseId) setSelectedCourse(courses.find(c => c.id !== courseId) || null);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="hero-band relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/80 border border-amber-500/30 p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
              <GraduationCap size={14} className="text-amber-400" />
              <span>Aviyana Global Campus — Hospitality & Eco-Stewardship Academy</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight leading-tight">
              Empowering Local Talent & Hotel School Graduates with <br className="hidden sm:inline"/>
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                International Ceylon Standards
              </span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              In partnership with leading international luxury academies, Aviyana provides fully sponsored butler certifications, eco-hospitality stewardship programs, and local youth employment pathways.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#enrollment-section"
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
              >
                <BookOpen size={16} />
                <span>Apply for Sponsored Scholarship</span>
              </a>

              <button
                onClick={onOpenQuestionModal}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
              >
                <Mail size={16} />
                <span>Academy Inquiry (insight@aviyana.lk)</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-5 shrink-0 space-y-3 lg:w-64">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-mono">Total Trainees Enrolled</div>
            <div className="text-3xl font-serif font-bold text-amber-300">135+ Graduates</div>
            <div className="text-[11px] text-emerald-400 flex items-center space-x-1 font-mono">
              <Check size={12} />
              <span>100% Full Stipend Paid</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Gallery: Past Students' Voices & School Events */}
      <div className="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Video size={16} />
              <span>STUDENT VOICES & SCHOOL EVENTS</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mt-1">Hear From Our Past Students</h2>
            <p className="text-xs text-slate-400 mt-1">Real testimonials from Academy graduates, plus footage from school events and ceremonies.</p>
          </div>
          {isStaffAuthenticated && (
            <button
              onClick={() => { if (onOpenContentEditor) onOpenContentEditor('education-media'); else setMediaModalOpen(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all shrink-0"
            >
              <Plus size={12} /> Add Video
            </button>
          )}
        </div>

        {educationMedia.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No videos added yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {educationMedia.map(media => (
              <div key={media.id} className="relative bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all group">
                {isStaffAuthenticated && onDeleteEducationMedia && (
                  <button
                    type="button"
                    onClick={() => { if (window.confirm(`Delete "${media.title}"?`)) onDeleteEducationMedia(media.id); }}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-slate-950/90 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/40 transition-all"
                    title="Delete this video"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                {/* Plays in-page via the same SmartVideoPlayer used everywhere else on
                    the site -- no more redirecting off to YouTube in a new tab. */}
                <button type="button" onClick={() => setPlayingMedia(media)} className="block relative h-40 overflow-hidden w-full text-left">
                  <img loading="lazy" src={media.thumbnailUrl} alt={media.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-black/60 border-2 border-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ChevronRight size={16} className="text-amber-300 ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute top-2 left-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-black/80 text-amber-300 border border-amber-500/40 font-mono">
                    {media.type}
                  </span>
                </button>
                <div className="p-4">
                  <h4 className="font-serif font-bold text-white text-sm">{media.title}</h4>
                  <p className="text-xs text-amber-300 font-semibold mt-0.5">{media.personName}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{media.personDetail}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-2">{media.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Gallery: campus, students, and events */}
      <div className="bg-slate-900/60 border border-amber-500/20 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <ImageIcon size={16} />
              <span>PHOTO GALLERY</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mt-1">Campus, Students & Events</h2>
          </div>
          {isStaffAuthenticated && (
            <button
              onClick={() => setPhotoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all shrink-0"
            >
              <Plus size={12} /> Add Album
            </button>
          )}
        </div>

        {albums.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No photos added yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {albums.map(album => (
              <button
                type="button"
                key={album.albumId}
                onClick={() => { setOpenAlbumId(album.albumId); setOpenAlbumPhotoIndex(0); setRenamingAlbum(false); }}
                className="relative group rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/50 transition-all aspect-square text-left"
              >
                <img loading="lazy" src={album.coverUrl} alt={album.albumName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
                {album.photos.length > 1 && (
                  <span className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/90 text-amber-300 text-[10px] font-bold font-mono border border-amber-500/30">
                    <ImageIcon size={10} /> {album.photos.length}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 p-2.5">
                  <p className="text-xs font-semibold text-white line-clamp-2">{album.albumName}</p>
                  <p className="text-[10px] text-slate-300 font-mono mt-0.5">{album.date}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ACADEMY HIGHLIGHT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/90 border border-amber-500/30 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Award size={22} />
          </div>
          <h3 className="font-serif font-bold text-base text-white">Full Butler Certification</h3>
          <p className="text-xs text-slate-300">
            6-month intensive training program covering Ceylon protocol, VIP villa concierge service, and fine dining.
          </p>
        </div>

        <div className="p-5 bg-slate-900/90 border border-amber-500/30 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <h3 className="font-serif font-bold text-base text-white">CEA Eco-Stewardship</h3>
          <p className="text-xs text-slate-300">
            Environmental compliance workshops, rainwater harvesting management, and endemic flora guide training.
          </p>
        </div>

        <div className="p-5 bg-slate-900/90 border border-amber-500/30 rounded-2xl space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Users size={22} />
          </div>
          <h3 className="font-serif font-bold text-base text-white">Guaranteed Local Jobs</h3>
          <p className="text-xs text-slate-300">
            85%+ of graduates are hired directly into permanent positions for Aviyana's August 2026 Grand Opening.
          </p>
        </div>
      </div>

      {/* COURSES & ENROLLMENT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="enrollment-section">
        
        {/* Course Selection List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
              Academy Programs & Workshops ({courses.length})
            </h3>
            {isStaffAuthenticated && onAddCourse && (
              <button
                onClick={() => {
                  if (onOpenContentEditor) { onOpenContentEditor('course'); return; }
                  setEditingCourseId(null);
                  setCTitle('');
                  setCDescription('');
                  setCourseModalOpen(true);
                }}
                className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center space-x-1 shadow-md"
              >
                <Plus size={14} />
                <span>Add New Course</span>
              </button>
            )}
          </div>

          {courses.map((course) => {
            const isSelected = selectedCourse?.id === course.id;
            return (
              <div
                key={course.id}
                onClick={() => {
                  setSelectedCourse(course);
                  setApplicationSuccess(null);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-950/60 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {course.category}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    {course.badge}
                  </span>
                </div>

                <h4 className="text-sm font-serif font-bold text-white mt-1">{course.title}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">{course.description}</p>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1"><Clock size={12} className="text-amber-400" /> {course.duration}</span>
                  <span className="font-mono text-amber-300">{course.schedule}</span>
                </div>

                {isStaffAuthenticated && (
                  <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/60">
                    {onEditCourse && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); if (onOpenContentEditor) onOpenContentEditor('course', course.id); else openEditCourseModal(course); }}
                        className="flex-1 py-1.5 rounded-lg bg-slate-950 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <Pencil size={11} />
                        <span>Edit</span>
                      </button>
                    )}
                    {onDeleteCourse && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                        className="flex-1 py-1.5 rounded-lg bg-slate-950 hover:bg-red-900 text-red-400 border border-red-500/40 text-[11px] font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <Trash2 size={11} />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Course Detail & Scholarship Application Form (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedCourse ? (
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-6">
              
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono uppercase font-bold px-2.5 py-0.5 rounded bg-amber-500 text-slate-950">
                    {selectedCourse.category}
                  </span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">{selectedCourse.status}</span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-white mt-2">{selectedCourse.title}</h2>
                <p className="text-xs text-amber-300 font-mono mt-1">Instructor: {selectedCourse.instructor}</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed">
                {selectedCourse.description}
              </div>

              {/* Curriculum Highlights */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                  Program Benefits & Curriculum
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedCourse.highlights.map((h, i) => (
                    <div key={i} className="flex items-start space-x-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200">
                      <CheckCircle2 size={15} className="text-amber-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scholarship Application Form */}
              <div className="p-5 bg-gradient-to-br from-slate-950 to-amber-950/40 border border-amber-500/40 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <div>
                    <h4 className="font-serif font-bold text-base text-white">Apply for Free Scholarship</h4>
                    <p className="text-xs text-slate-300">Submit details for direct intake consideration</p>
                  </div>
                  <Sparkles size={20} className="text-amber-400" />
                </div>

                {applicationSuccess ? (
                  <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-center space-y-2">
                    <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                    <h5 className="font-serif font-bold text-lg text-white">Scholarship Application Submitted!</h5>
                    <p className="text-xs text-emerald-300">
                      Application Code: <strong className="font-mono text-amber-300 text-sm">{applicationSuccess}</strong>
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Our Academy Admissions team will reach out to <strong className="text-white">{applicantEmail}</strong> for interview scheduling.
                    </p>
                    {emailStatus === 'sending' && (
                      <p className="text-[11px] text-amber-300">Notifying the Academy team...</p>
                    )}
                    {emailStatus === 'sent' && (
                      <p className="text-[11px] text-emerald-400">✓ Academy team notified by email.</p>
                    )}
                    {emailStatus === 'failed' && (
                      <p className="text-[11px] text-red-300">
                        ⚠ Automatic notification failed — please also email <strong className="font-mono">insight@aviyana.lk</strong> with your application code to be safe.
                      </p>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleApplyCourse} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="edu-app-name" className="block text-[11px] text-slate-300 mb-1">Full Name *</label>
                        <input
                          id="edu-app-name"
                          type="text"
                          required
                          placeholder="Your Name"
                          value={applicantName}
                          onChange={(e) => setApplicantName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="edu-app-email" className="block text-[11px] text-slate-300 mb-1">Email Address *</label>
                        <input
                          id="edu-app-email"
                          type="email"
                          required
                          placeholder="email@domain.com"
                          value={applicantEmail}
                          onChange={(e) => setApplicantEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="edu-app-contact" className="block text-[11px] text-slate-300 mb-1">Contact Number *</label>
                        <input
                          id="edu-app-contact"
                          type="tel"
                          required
                          placeholder="+94 77 123 4567"
                          value={applicantContact}
                          onChange={(e) => setApplicantContact(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="edu-app-background" className="block text-[11px] text-slate-300 mb-1">Educational Background</label>
                        <input
                          id="edu-app-background"
                          type="text"
                          placeholder="e.g. Hotel School Diploma / O/L / A/L"
                          value={applicantNote}
                          onChange={(e) => setApplicantNote(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center space-x-2 mt-2"
                    >
                      <GraduationCap size={16} />
                      <span>Submit Scholarship Application ({selectedCourse.title})</span>
                    </button>
                  </form>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
              Select a course from the list to view details and apply.
            </div>
          )}
        </div>

      </div>

      {/* ADD VIDEO MODAL */}
      {mediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/20">
              <h3 className="font-serif font-bold text-lg text-white">Add Student Voice / Event Video</h3>
              <button onClick={() => setMediaModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!onAddEducationMedia) return;
                onAddEducationMedia({
                  id: `edu-media-${Date.now()}`,
                  type: mediaType,
                  title: mediaTitle,
                  personName: mediaPersonName,
                  personDetail: mediaPersonDetail,
                  thumbnailUrl: mediaThumbnailUrl || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
                  videoUrl: mediaVideoUrl,
                  date: new Date().toISOString().split('T')[0]
                });
                setMediaModalOpen(false);
                setMediaTitle(''); setMediaPersonName(''); setMediaPersonDetail(''); setMediaThumbnailUrl(''); setMediaVideoUrl('');
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label htmlFor="edu-media-type" className="block text-[11px] font-semibold text-slate-300 mb-1">Type</label>
                <select id="edu-media-type" value={mediaType} onChange={e => setMediaType(e.target.value as 'Student Voice' | 'Event')} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                  <option value="Student Voice">Student Voice / Testimonial</option>
                  <option value="Event">School Event</option>
                </select>
              </div>
              <div>
                <label htmlFor="edu-media-title" className="block text-[11px] font-semibold text-slate-300 mb-1">Title</label>
                <input id="edu-media-title" required value={mediaTitle} onChange={e => setMediaTitle(e.target.value)} placeholder="e.g. From Trainee to Sous Chef" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
              </div>
              <div>
                <label htmlFor="edu-media-person-name" className="block text-[11px] font-semibold text-slate-300 mb-1">{mediaType === 'Event' ? 'Event Name' : 'Student Name'}</label>
                <input id="edu-media-person-name" required value={mediaPersonName} onChange={e => setMediaPersonName(e.target.value)} placeholder={mediaType === 'Event' ? 'e.g. Graduation Ceremony 2026' : 'e.g. Nimali Perera'} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
              </div>
              <div>
                <label htmlFor="edu-media-person-detail" className="block text-[11px] font-semibold text-slate-300 mb-1">{mediaType === 'Event' ? 'Event Detail' : 'Batch / Program'}</label>
                <input id="edu-media-person-detail" required value={mediaPersonDetail} onChange={e => setMediaPersonDetail(e.target.value)} placeholder={mediaType === 'Event' ? 'e.g. July 2026, Main Campus' : 'e.g. Batch of 2025, F&B Management'} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
              </div>
              <div>
                <label htmlFor="edu-media-video-url" className="block text-[11px] font-semibold text-slate-300 mb-1">Video URL (YouTube link)</label>
                <input id="edu-media-video-url" required value={mediaVideoUrl} onChange={e => setMediaVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
              </div>
              <div>
                <label htmlFor="edu-media-thumbnail" className="block text-[11px] font-semibold text-slate-300 mb-1">Thumbnail Image (optional)</label>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <input
                      id="edu-media-thumbnail"
                      type="text"
                      value={mediaThumbnailUrl}
                      onChange={e => setMediaThumbnailUrl(e.target.value)}
                      placeholder="https://... or upload a file"
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                    />
                    <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs cursor-pointer font-bold shrink-0 flex items-center space-x-1.5 border border-slate-700">
                      {uploadingThumbnail ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                      <span>{uploadingThumbnail ? 'Uploading...' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingThumbnail}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingThumbnail(true);
                          setThumbnailUploadError(false);
                          const url = await uploadContentImage(file, 'education-media');
                          if (url) setMediaThumbnailUrl(url);
                          else setThumbnailUploadError(true);
                          setUploadingThumbnail(false);
                        }}
                      />
                    </label>
                  </div>
                  {thumbnailUploadError && (
                    <p className="text-[11px] text-red-400">Upload failed — check your connection and try again, or paste an image URL instead.</p>
                  )}
                  {mediaThumbnailUrl && (
                    <img src={mediaThumbnailUrl} alt="Preview" className="w-full h-24 object-cover rounded-lg border border-slate-800" />
                  )}
                </div>
              </div>
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button type="button" onClick={() => setMediaModalOpen(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs">Add Video</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IN-PAGE VIDEO PLAYER MODAL -- plays the clicked video right here using
          the same SmartVideoPlayer used everywhere else on the site, instead
          of sending the visitor off to YouTube in a new tab. */}
      {playingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md" onClick={() => setPlayingMedia(null)}>
          <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPlayingMedia(null)} className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-slate-950/90 text-slate-300 hover:text-white hover:bg-slate-800">
              <X size={18} />
            </button>
            <div className="aspect-video bg-black">
              <SmartVideoPlayer url={playingMedia.videoUrl} className="w-full h-full" title={playingMedia.title} />
            </div>
            <div className="p-5">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">{playingMedia.type}</span>
              <h3 className="font-serif font-bold text-lg text-white mt-2">{playingMedia.title}</h3>
              <p className="text-xs text-amber-300 font-semibold mt-0.5">{playingMedia.personName}</p>
              <p className="text-[11px] text-slate-400">{playingMedia.personDetail}</p>
            </div>
          </div>
        </div>
      )}

      {/* ALBUM LIGHTBOX -- browsing an album opens this instead of taking
          permanent page space; the gallery above only ever shows one card
          per album regardless of how many photos it holds. */}
      {openAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md" onClick={() => setOpenAlbumId(null)}>
          <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpenAlbumId(null)} aria-label="Close album" className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-slate-950/90 text-slate-300 hover:text-white hover:bg-slate-800">
              <X size={18} />
            </button>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <img
                src={openAlbum.photos[openAlbumPhotoIndex].imageUrl}
                alt={openAlbum.photos[openAlbumPhotoIndex].caption || openAlbum.albumName}
                className="max-w-full max-h-full object-contain"
              />
              {openAlbum.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() => setOpenAlbumPhotoIndex(i => (i - 1 + openAlbum.photos.length) % openAlbum.photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/80 text-white hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() => setOpenAlbumPhotoIndex(i => (i + 1) % openAlbum.photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/80 text-white hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                    {openAlbumPhotoIndex + 1} / {openAlbum.photos.length}
                  </span>
                </>
              )}
              {isStaffAuthenticated && onUpdateEducationPhoto && openAlbum.photos.length > 1 && (
                openAlbum.photos[openAlbumPhotoIndex].id !== (openAlbum.photos.find(p => p.isCover) || openAlbum.photos[0]).id ? (
                  <button
                    type="button"
                    onClick={() => setAlbumCover(openAlbum, openAlbum.photos[openAlbumPhotoIndex].id)}
                    className="absolute top-3 left-12 z-20 p-1.5 rounded-lg bg-slate-950/90 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/40 transition-all"
                    title="Set as album cover"
                  >
                    <Star size={14} />
                  </button>
                ) : (
                  <span className="absolute top-3 left-12 z-20 p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40" title="Album cover">
                    <Star size={14} fill="currentColor" />
                  </span>
                )
              )}
              {isStaffAuthenticated && onDeleteEducationPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    const photo = openAlbum.photos[openAlbumPhotoIndex];
                    if (!window.confirm('Delete this photo?')) return;
                    onDeleteEducationPhoto(photo.id);
                    // Closing and re-picking avoids indexing into a
                    // now-stale photos array after the delete lands.
                    if (openAlbum.photos.length <= 1) setOpenAlbumId(null);
                    else setOpenAlbumPhotoIndex(i => Math.min(i, openAlbum.photos.length - 2));
                  }}
                  className="absolute top-3 left-3 z-20 p-1.5 rounded-lg bg-slate-950/90 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/40 transition-all"
                  title="Delete this photo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="p-5">
              {renamingAlbum ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    renameAlbum(openAlbum, renameValue);
                    setRenamingAlbum(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    autoFocus
                    aria-label="Album name"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-amber-500/40 rounded-lg text-sm font-serif font-bold text-white focus:outline-none focus:border-amber-400"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold">Save</button>
                  <button type="button" onClick={() => setRenamingAlbum(false)} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold">Cancel</button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-white">{openAlbum.albumName}</h3>
                  {isStaffAuthenticated && onUpdateEducationPhoto && (
                    <button
                      type="button"
                      onClick={() => { setRenameValue(openAlbum.albumName); setRenamingAlbum(true); }}
                      aria-label="Rename album"
                      className="p-1 rounded-md text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-all"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                </div>
              )}
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{openAlbum.date} • {openAlbum.photos.length} photo{openAlbum.photos.length !== 1 ? 's' : ''}</p>
            </div>

            {openAlbum.photos.length > 1 && (
              <div className="px-5 pb-5 flex gap-2 overflow-x-auto">
                {openAlbum.photos.map((photo, idx) => (
                  <button
                    type="button"
                    key={photo.id}
                    onClick={() => setOpenAlbumPhotoIndex(idx)}
                    className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${idx === openAlbumPhotoIndex ? 'border-amber-400' : 'border-slate-800 opacity-70 hover:opacity-100'}`}
                  >
                    <img src={photo.imageUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD PHOTO(S) MODAL — supports adding a whole batch/album of photos
          in one go, not just one at a time. */}
      {photoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/20 shrink-0">
              <h3 className="font-serif font-bold text-lg text-white">Add Photo Album</h3>
              <button onClick={() => { setPhotoModalOpen(false); setPhotoImageUrls([]); setPhotoUrlInput(''); setPhotoCaption(''); }} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!onAddEducationPhoto || photoImageUrls.length === 0 || !photoCaption.trim()) return;
                const date = new Date().toISOString().split('T')[0];
                // One EducationPhoto per queued image, all sharing this
                // batch's albumId/albumName -- this is what lets staff
                // upload a whole album (e.g. 20 graduation photos) in a
                // single submit AND have it show as one browsable album
                // afterwards, instead of one flat, ever-growing photo grid.
                const albumId = `edu-album-${Date.now()}`;
                photoImageUrls.forEach((url, idx) => {
                  onAddEducationPhoto({
                    id: `edu-photo-${Date.now()}-${idx}`,
                    imageUrl: url,
                    caption: photoCaption,
                    date,
                    albumId,
                    albumName: photoCaption
                  });
                });
                setPhotoModalOpen(false);
                setPhotoImageUrls([]); setPhotoUrlInput(''); setPhotoCaption('');
              }}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div>
                <label htmlFor="edu-photo-caption" className="block text-[11px] font-semibold text-slate-300 mb-1">Album Name *</label>
                <input id="edu-photo-caption" required value={photoCaption} onChange={e => setPhotoCaption(e.target.value)} placeholder="e.g. Graduation Day, July 2026" className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
                <p className="text-[10px] text-slate-400 mt-1">Shown as the album's cover title -- every photo added below joins this one album.</p>
              </div>
              <div>
                <label htmlFor="edu-photo-url" className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Photos {photoImageUrls.length > 0 && <span className="text-amber-400">({photoImageUrls.length} queued)</span>}
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      id="edu-photo-url"
                      type="text"
                      value={photoUrlInput}
                      onChange={e => setPhotoUrlInput(e.target.value)}
                      placeholder="Paste an image URL, then Add..."
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!photoUrlInput.trim()) return;
                        setPhotoImageUrls(prev => [...prev, photoUrlInput.trim()]);
                        setPhotoUrlInput('');
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold shrink-0 border border-slate-700"
                    >
                      Add
                    </button>
                    <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs cursor-pointer font-bold shrink-0 flex items-center space-x-1.5 border border-slate-700">
                      {uploadingPhotoCount > 0 ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                      <span>{uploadingPhotoCount > 0 ? `Uploading ${uploadingPhotoCount}...` : 'Upload Files'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={uploadingPhotoCount > 0}
                        onChange={async (e) => {
                          const files: File[] = Array.from(e.target.files || []);
                          if (files.length === 0) return;
                          setUploadingPhotoCount(files.length);
                          setPhotoUploadFailCount(0);
                          const uploaded = await Promise.all(
                            files.map((file: File) => uploadContentImage(file, 'education-photos'))
                          );
                          const successfulUrls = uploaded.filter((u): u is string => !!u);
                          const failCount = uploaded.length - successfulUrls.length;
                          // Previously silent -- a batch of 5 with 2 failures
                          // just quietly added 3 and staff had no way to know
                          // 2 didn't make it in.
                          if (failCount > 0) setPhotoUploadFailCount(failCount);
                          setPhotoImageUrls(prev => [...prev, ...successfulUrls]);
                          setUploadingPhotoCount(0);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  {photoUploadFailCount > 0 && (
                    <p className="text-[11px] text-red-400">
                      {photoUploadFailCount} photo{photoUploadFailCount !== 1 ? 's' : ''} failed to upload — check your connection and try adding {photoUploadFailCount !== 1 ? 'them' : 'it'} again.
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">Select multiple files at once, or add pasted URLs one by one — everything queued below is added as one album when you submit.</p>
                  {photoImageUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {photoImageUrls.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-800">
                          <img src={url} alt={`Uploaded photo ${idx + 1} preview`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotoImageUrls(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded bg-slate-950/90 text-red-300 hover:bg-red-500 hover:text-white border border-red-500/40 opacity-0 group-hover:opacity-100 transition-all"
                            title="Remove"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800 shrink-0">
                <button type="button" onClick={() => { setPhotoModalOpen(false); setPhotoImageUrls([]); setPhotoUrlInput(''); setPhotoCaption(''); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs">Cancel</button>
                <button type="submit" disabled={photoImageUrls.length === 0 || !photoCaption.trim()} className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs">
                  Add {photoImageUrls.length > 1 ? `${photoImageUrls.length} Photos` : 'Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW COURSE MODAL */}
      {courseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="text-amber-400" size={24} />
                <div>
                  <h3 className="font-serif font-bold text-lg text-white">{editingCourseId ? 'Edit Academy Course' : 'Create New Academy Course'}</h3>
                  <p className="text-xs text-slate-400">{editingCourseId ? 'Update this hotel school or stewardship training module' : 'Add a new hotel school or stewardship training module'}</p>
                </div>
              </div>

              <button
                onClick={() => setCourseModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edu-course-title" className="block text-xs font-semibold text-slate-300 mb-1">Course Title *</label>
                  <input
                    id="edu-course-title"
                    type="text"
                    required
                    placeholder="e.g. Ceylon Sommelier & Mixology Mastery"
                    value={cTitle}
                    onChange={(e) => setCTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label htmlFor="edu-course-category" className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                  <select
                    id="edu-course-category"
                    value={cCategory}
                    onChange={(e) => setCCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Hospitality Academy">Hospitality Academy</option>
                    <option value="Sustainability & CEA">Sustainability & CEA</option>
                    <option value="Youth Career">Youth Career</option>
                    <option value="Language & Etiquette">Language & Etiquette</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edu-course-duration" className="block text-xs font-semibold text-slate-300 mb-1">Duration</label>
                  <input
                    id="edu-course-duration"
                    type="text"
                    placeholder="e.g. 3 Months (Full-Time)"
                    value={cDuration}
                    onChange={(e) => setCDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label htmlFor="edu-course-instructor" className="block text-xs font-semibold text-slate-300 mb-1">Instructor / Faculty</label>
                  <input
                    id="edu-course-instructor"
                    type="text"
                    placeholder="e.g. Master Sommelier Jean Dupont"
                    value={cInstructor}
                    onChange={(e) => setCInstructor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edu-course-badge" className="block text-xs font-semibold text-slate-300 mb-1">Badge Tag</label>
                  <input
                    id="edu-course-badge"
                    type="text"
                    placeholder="e.g. 100% Sponsored Scholarship"
                    value={cBadge}
                    onChange={(e) => setCBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label htmlFor="edu-course-schedule" className="block text-xs font-semibold text-slate-300 mb-1">Intake Schedule</label>
                  <input
                    id="edu-course-schedule"
                    type="text"
                    placeholder="e.g. Batch 4 Starts: October 2026"
                    value={cSchedule}
                    onChange={(e) => setCSchedule(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edu-course-description" className="block text-xs font-semibold text-slate-300 mb-1">Course Description *</label>
                <textarea
                  id="edu-course-description"
                  rows={5}
                  required
                  placeholder="Detailed course overview and learning objectives..."
                  value={cDescription}
                  onChange={(e) => setCDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label htmlFor="edu-course-benefits" className="block text-xs font-semibold text-slate-300 mb-1">Program Benefits & Curriculum (One per line)</label>
                <textarea
                  id="edu-course-benefits"
                  rows={5}
                  placeholder="Guaranteed job placement&#10;Full monthly stipend&#10;International certification"
                  value={cHighlights}
                  onChange={(e) => setCHighlights(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCourseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5 shadow-lg"
                >
                  <GraduationCap size={16} />
                  <span>{editingCourseId ? 'Save Changes' : 'Publish New Course'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
