import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { PublicHubView } from './components/PublicHubView';
import { QuestionSubmitModal } from './components/QuestionSubmitModal';
import { DocumentModal } from './components/DocumentModal';
import { PublicHubSkeleton, SkeletonCardGrid } from './components/Skeleton';

// These modals are staff/admin-only (never opened by a public/press
// visitor -- the buttons that open them are themselves gated on
// isStaffAuthenticated), so statically importing them put staff-only code
// into the bundle every visitor downloads. Bundle-size audit,
// ENGINEERING_ASSESSMENT.md medium-term item: "Public bundle size (638 KB /
// 173 KB gzipped)... still worth trimming since press visitors are often
// on the clock and on mobile data." UnifiedContentEditor alone is ~550
// lines and was the single largest component still in the eager bundle.
// ProfileEditModal is the one exception worth noting: a signed-in *guest*
// (not staff) can also open it, but it's still infrequent enough relative
// to its size to be worth lazy-loading like the others.
const UnifiedContentEditor = lazy(() => import('./components/UnifiedContentEditor').then(m => ({ default: m.UnifiedContentEditor })));
const ProfileEditModal = lazy(() => import('./components/ProfileEditModal').then(m => ({ default: m.ProfileEditModal })));
const NotificationCenter = lazy(() => import('./components/NotificationCenter').then(m => ({ default: m.NotificationCenter })));
const ThemeSelectorModal = lazy(() => import('./components/ThemeSelectorModal').then(m => ({ default: m.ThemeSelectorModal })));
const SocialLinksManagerModal = lazy(() => import('./components/SocialLinksManagerModal').then(m => ({ default: m.SocialLinksManagerModal })));
// Type-only import -- erased at compile time, doesn't pull the component's
// code into this chunk (see the lazy() import above for the actual module).
import type { UnifiedContentEditorRequest, UnifiedContentKind } from './components/UnifiedContentEditor';

// Code-split everything except the public landing tab (PublicHubView, above)
// and the small modals. These are sizeable, mostly-internal-staff views that
// most visitors -- especially a public visitor who never logs in -- never
// open in a given session, so there's no reason to ship their code in the
// initial bundle. This was the single biggest contributor to the ~1.1MB
// bundle Vite was warning about at build time.
const DashboardView = lazy(() => import('./components/DashboardView').then(m => ({ default: m.DashboardView })));
const GeminiAiAssistant = lazy(() => import('./components/GeminiAiAssistant').then(m => ({ default: m.GeminiAiAssistant })));
const ContentPipelineView = lazy(() => import('./components/ContentPipelineView').then(m => ({ default: m.ContentPipelineView })));
const SerpMonitoringView = lazy(() => import('./components/SerpMonitoringView').then(m => ({ default: m.SerpMonitoringView })));
const FaqManagerView = lazy(() => import('./components/FaqManagerView').then(m => ({ default: m.FaqManagerView })));
const AnnouncementsView = lazy(() => import('./components/AnnouncementsView').then(m => ({ default: m.AnnouncementsView })));
const EducationView = lazy(() => import('./components/EducationView').then(m => ({ default: m.EducationView })));
const UserManagementView = lazy(() => import('./components/UserManagementView').then(m => ({ default: m.UserManagementView })));
const InvestmentView = lazy(() => import('./components/InvestmentView').then(m => ({ default: m.InvestmentView })));
const CareersView = lazy(() => import('./components/CareersView').then(m => ({ default: m.CareersView })));
const InquiryDeskView = lazy(() => import('./components/InquiryDeskView').then(m => ({ default: m.InquiryDeskView })));
const ActivityLogView = lazy(() => import('./components/ActivityLogView').then(m => ({ default: m.ActivityLogView })));
const PressKitView = lazy(() => import('./components/PressKitView').then(m => ({ default: m.PressKitView })));

// Content-shaped placeholder shown briefly while a lazy tab's code
// downloads (usually well under a second on a normal connection) --
// reads as "this page is already here" rather than a bare spinner.
const TabLoadingFallback = () => (
  <div className="pt-2">
    <SkeletonCardGrid count={6} />
  </div>
);

// --- Priority 1 (NEXT_SESSION_PLAN.md): domain contexts -----------------
// App.tsx used to hold ~30 useState hooks and ~40 handler functions
// directly. That state/logic now lives in these seven domain contexts
// (see src/contexts/*.tsx for the extraction rationale and dependency
// notes on each one); this file's job is now just: wrap the tree in the
// providers (in dependency order), own the activeTab routing switch, and
// own the handful of app-level modals (Auth, Profile, Question Submit,
// Theme, Social Links, Unified Content Editor, Document) that genuinely
// need to live at the top level.
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { ActivityLogProvider, useActivityLog } from './contexts/ActivityLogContext';
import { ContentProvider, useContent } from './contexts/ContentContext';
import { InquiryProvider, useInquiry } from './contexts/InquiryContext';
import { EducationProvider, useEducation } from './contexts/EducationContext';
import { AdminProvider, useAdmin } from './contexts/AdminContext';

// Initial-load fetches only (create/update/delete calls live inside each
// context now, next to the state they mutate).
import { fetchArticlesFromDb } from './lib/articlesApi';
import {
  fetchMilestonesFromDb, fetchCsrImpactsFromDb, fetchVoiceCutsFromDb, fetchFactChecksFromDb
} from './lib/publicHubApi';
import { fetchContentPipelineFromDb } from './lib/contentPipelineApi';
import { fetchCoursesFromDb } from './lib/coursesApi';
import { fetchEducationMediaFromDb, fetchEducationPhotosFromDb } from './lib/educationMediaApi';
import { fetchInquiriesFromDb } from './lib/inquiriesApi';
import { fetchRegistrationsFromDb } from './lib/registrationsApi';
import { fetchSocialLinksFromDb } from './lib/socialLinksApi';
import { fetchNotificationsFromDb } from './lib/notificationsApi';
import { fetchActivityLogFromDb } from './lib/activityLogApi';
import { isSupabaseConfigured } from './lib/supabase';
import { trackPageview } from './lib/analytics';
import { LanguageProvider, useLanguage } from './lib/i18n';
import { AppTheme } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('public-hub');

  // Provider nesting order follows each context's dependencies (see the
  // "Depends on" note at the top of each context file): Notification and
  // Auth have no dependency on each other or on anything below; everything
  // else needs one or both of them. LanguageProvider has no dependency on
  // anything else and nothing below depends on nesting order relative to
  // it, so it wraps everything at the top level.
  return (
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider onAuthNavigateHome={() => setActiveTab('public-hub')}>
          <ActivityLogProvider>
            <ContentProvider>
              <InquiryProvider>
                <EducationProvider>
                  <AdminProvider>
                    <AppShell activeTab={activeTab} setActiveTab={setActiveTab} />
                  </AdminProvider>
                </EducationProvider>
              </InquiryProvider>
            </ContentProvider>
          </ActivityLogProvider>
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
  );
}

/**
 * Everything that used to be App()'s body. Split out as its own component
 * (rather than inlined in App() above) purely so it can sit *inside* all
 * the providers and call their hooks -- a component can't call a context
 * hook for a provider that wraps itself.
 */
function AppShell({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const { language, setLanguage, t } = useLanguage();
  const { users, currentUser, isStaffAuthenticated, isAdmin, isAnySignedIn, authLoading, handleUpdateUser, handleLogout } = useAuth();
  const {
    notifications, setNotifications, unreadCount, audioEnabled, setAudioEnabled,
    pushDbErrorNotification, pushEmailFailureNotification,
    handleMarkRead, handleMarkAllRead, handleSimulateAlert
  } = useNotifications();
  const { activityLog, setActivityLog } = useActivityLog();
  const {
    articles, milestones, csrImpacts, voiceCuts, factChecks, contentPipeline,
    setArticles, setMilestones, setCsrImpacts, setVoiceCuts, setFactChecks, setContentPipeline,
    handleAddArticle, handleEditArticle, handleDeleteArticle,
    handleAddMilestone, handleEditMilestone, handleDeleteMilestone,
    handleAddCsrImpact, handleEditCsrImpact, handleDeleteCsrImpact,
    handleAddVoiceCut, handleEditVoiceCut, handleDeleteVoiceCut,
    handleAddFactCheck, handleEditFactCheck, handleDeleteFactCheck,
    handleAddContent, handleEditContent, handleDeleteContent, handleRequestChanges, handleApproveDraft
  } = useContent();
  const {
    inquiries, registrations, setInquiries, setRegistrations,
    handleAddInquiry, handleUpdateInquiryStatus, handleRegisterUser, handleSubmitPublicInquiry
  } = useInquiry();
  const {
    courses, educationMedia, educationPhotos, setCourses, setEducationMedia, setEducationPhotos,
    handleAddCourse, handleEditCourse, handleDeleteCourse,
    handleAddEducationMedia, handleDeleteEducationMedia,
    handleAddEducationPhoto, handleDeleteEducationPhoto, handleUpdateEducationPhoto, handleApplyCourse
  } = useEducation();
  const { socialLinks, setSocialLinks, handleSaveSocialLink, handleDeleteSocialLink } = useAdmin();

  // Persisted via localStorage (same pattern as the language preference in
  // src/lib/i18n.tsx) -- now that the theme switcher is available to every
  // visitor, not just staff, a public/guest visitor's choice should survive
  // a reload instead of silently reverting to dark every time.
  const [currentTheme, setCurrentThemeState] = useState<AppTheme>(() => {
    try {
      const stored = window.localStorage.getItem('aviyana-insight-theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      // localStorage unavailable -- fall through to the default.
    }
    return 'dark';
  });
  const setCurrentTheme = (theme: AppTheme) => {
    setCurrentThemeState(theme);
    try {
      window.localStorage.setItem('aviyana-insight-theme', theme);
    } catch {
      // Best-effort persistence only -- the theme still applies for this session either way.
    }
  };
  const [themeModalOpen, setThemeModalOpen] = useState<boolean>(false);
  // Separate from authLoading: tracks the initial public-content fetch
  // (articles, milestones, etc). Without this, the app rendered immediately
  // using the built-in mock/demo arrays as initial state, so every visitor
  // saw a brief flash of fake placeholder content before the real data
  // swapped in a moment later. Gating the first render on this instead
  // means nothing renders until we know what's actually real.
  const [contentLoading, setContentLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [questionModalOpen, setQuestionModalOpen] = useState<boolean>(false);
  const [socialLinksModalOpen, setSocialLinksModalOpen] = useState(false);
  const [documentModal, setDocumentModal] = useState<{ open: boolean; docName: string; title: string }>({
    open: false,
    docName: '',
    title: ''
  });

  // Unified Content Editor (Priority 0, NEXT_SESSION_PLAN.md) — one modal,
  // owned here so it can be opened from the navbar's global "+ Add Content"
  // button OR from a contextual "Add X" button on a specific content page,
  // pre-set to that kind. null kind = show the kind-selector step first.
  const [contentEditorRequest, setContentEditorRequest] = useState<UnifiedContentEditorRequest | null>(null);
  const openContentEditor = (kind: UnifiedContentKind | null, id?: string, presetValues?: Record<string, string>) => {
    setContentEditorRequest({ kind, isEditing: !!id, id: id || null, presetValues });
  };
  const closeContentEditor = () => setContentEditorRequest(null);
  // Used by the Investment page's "+ Publish Investment Update" and
  // per-article Edit buttons: opens the same Unified Content Editor used
  // everywhere else, pre-set to 'article' -- no tab switch needed since the
  // editor is a top-level modal.
  const openArticleComposer = (articleId?: string, presetValues?: Record<string, string>) => openContentEditor('article', articleId, presetValues);

  const handleOpenDocument = (docName: string, title: string) => {
    setDocumentModal({ open: true, docName, title });
  };

  const handleActionClick = (notif: { type: string; actionRequired?: string }) => {
    if (notif.type === 'mention' || notif.actionRequired?.includes('Gemini')) {
      setActiveTab('ai-assistant');
    } else if (notif.type === 'approval') {
      setActiveTab('pipeline');
    } else if (notif.type === 'serp') {
      setActiveTab('serp');
    } else {
      setActiveTab('dashboard');
    }
  };

  // On first load, pull real data from Supabase (if it's configured) for everything
  // that's admin-editable on the Public Hub page. Without this, every visitor --
  // and every page refresh -- only ever sees the built-in mock data, since nothing
  // would otherwise be persisted anywhere.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [dbArticles, dbMilestones, dbCsrImpacts, dbVoiceCuts, dbFactChecks, dbContentPipeline, dbCourses, dbSocialLinks, dbEducationMedia, dbEducationPhotos] = await Promise.all([
        fetchArticlesFromDb(),
        fetchMilestonesFromDb(),
        fetchCsrImpactsFromDb(),
        fetchVoiceCutsFromDb(),
        fetchFactChecksFromDb(),
        fetchContentPipelineFromDb(),
        fetchCoursesFromDb(),
        fetchSocialLinksFromDb(),
        fetchEducationMediaFromDb(),
        fetchEducationPhotosFromDb()
      ]);
      if (cancelled) return;
      // IMPORTANT: this checks `!== null`, not `.length > 0`. A successful
      // fetch that legitimately returns zero rows (e.g. every FAQ entry was
      // deleted, or nothing has been added yet) must still replace the
      // built-in demo/mock content -- otherwise the app silently keeps
      // showing fake hardcoded FAQ/milestone/etc. items forever with no way
      // to tell they aren't real. Only an actual fetch FAILURE (null) should
      // fall back to the mock data, since that's a "can't reach Supabase"
      // case where showing the demo content is the better failure mode.
      if (dbArticles !== null) setArticles(dbArticles);
      if (dbMilestones !== null) setMilestones(dbMilestones);
      if (dbCsrImpacts !== null) setCsrImpacts(dbCsrImpacts);
      if (dbVoiceCuts !== null) setVoiceCuts(dbVoiceCuts);
      if (dbFactChecks !== null) setFactChecks(dbFactChecks);
      if (dbContentPipeline !== null) setContentPipeline(dbContentPipeline);
      if (dbCourses !== null) setCourses(dbCourses);
      if (dbSocialLinks !== null) setSocialLinks(dbSocialLinks);
      if (dbEducationMedia !== null) setEducationMedia(dbEducationMedia);
      if (dbEducationPhotos !== null) setEducationPhotos(dbEducationPhotos);
      setContentLoading(false);
      // `null` here (as opposed to an empty array) specifically means the
      // fetch itself failed -- the article/content list silently fell back
      // to the built-in demo content instead. That's a very confusing state
      // ("where did my published article go?") with no visible error, so
      // surface it as a real notification instead of only a console.error.
      if (isSupabaseConfigured) {
        if (dbArticles === null) pushDbErrorNotification('Loading live articles', 'Could not reach Supabase — showing built-in demo content instead of your real published articles.');
        if (dbContentPipeline === null) pushDbErrorNotification('Loading content pipeline', 'Could not reach Supabase — showing built-in demo content instead of real drafts.');
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inquiries/registrations/notifications/activity-log are staff/admin-only
  // readable per RLS, so there's no point fetching them until someone with
  // that access has actually signed in (a logged-out/guest fetch would just
  // come back empty). This used to run inline as part of AuthContext's own
  // session-loading effect; it's a separate effect here instead, keyed off
  // `isStaffAuthenticated` becoming true, because AuthContext (which loads
  // the session/profile) sits *outside* the Content/Inquiry/Notification/
  // ActivityLog providers in the tree and has no way to reach their setters
  // directly -- see the scope note in AuthContext.tsx.
  useEffect(() => {
    if (!isStaffAuthenticated) return;
    (async () => {
      const [dbInquiries, dbRegistrations, dbNotifications, dbActivityLog] = await Promise.all([
        fetchInquiriesFromDb(),
        fetchRegistrationsFromDb(),
        fetchNotificationsFromDb(),
        fetchActivityLogFromDb()
      ]);
      if (dbInquiries !== null) setInquiries(dbInquiries);
      if (dbRegistrations !== null) setRegistrations(dbRegistrations);
      if (dbNotifications !== null) setNotifications(dbNotifications);
      if (dbActivityLog !== null) setActivityLog(dbActivityLog);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaffAuthenticated]);

  // Analytics: fire a pageview-equivalent event on every tab change (see
  // src/lib/analytics.ts -- this is a total no-op unless VITE_GA_MEASUREMENT_ID
  // is configured, so nothing is sent in local dev by default).
  useEffect(() => {
    trackPageview(activeTab);
  }, [activeTab]);

  // Nothing renders until the initial content fetch resolves -- this is
  // what actually stops the old flash of mock/demo data: previously the app
  // rendered immediately using the built-in placeholder arrays as initial
  // state, so every visitor briefly saw fake content before the real data
  // swapped in a beat later. A brief, deliberate loading screen is a much
  // better experience than a flash of content that then visibly changes.
  if (contentLoading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <PublicHubSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen theme-${currentTheme} text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300`}>

      {/* Skip to main content — WCAG 2.4.1 (Bypass Blocks). Visually hidden
          until focused (keyboard Tab from page load), so a keyboard or
          screen-reader user isn't forced through the full nav (12+ items,
          plus the top banner) on every single page load just to reach the
          actual content. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-amber-500 focus:text-slate-950 focus:font-bold focus:text-sm"
      >
        Skip to main content
      </a>

      {/* Top Luxury Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        isStaffAuthenticated={isStaffAuthenticated}
        isAnySignedIn={isAnySignedIn}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenProfileModal={() => setProfileModalOpen(true)}
        onLogout={handleLogout}
        unreadCount={unreadCount}
        pendingFaqCount={factChecks.filter(f => f.approvalStatus === 'Pending Approval').length}
        onOpenNotifications={() => setNotificationsOpen(true)}
        audioEnabled={audioEnabled}
        setAudioEnabled={setAudioEnabled}
        onOpenQuestionModal={() => setQuestionModalOpen(true)}
        onOpenThemeModal={() => setThemeModalOpen(true)}
        currentTheme={currentTheme}
        onOpenContentEditor={() => openContentEditor(null)}
        t={t}
        language={language}
        setLanguage={setLanguage}
      />

      {/* Main Tab View Renderer */}
      <main id="main-content" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 2xl:pb-6">
        {activeTab === 'public-hub' && (
          <PublicHubView
            milestones={milestones}
            articles={articles}
            factChecks={factChecks}
            csrImpacts={csrImpacts}
            voiceCuts={voiceCuts}
            socialLinks={socialLinks}
            onManageSocialLinks={() => setSocialLinksModalOpen(true)}
            isStaffAuthenticated={isStaffAuthenticated}
            onOpenDocument={handleOpenDocument}
            onSubmitPublicInquiry={handleSubmitPublicInquiry}
            onOpenQuestionModal={() => setQuestionModalOpen(true)}
            onOpenContentEditor={(kind, id) => openContentEditor(kind, id)}
            t={t}
          />
        )}

        <Suspense fallback={<TabLoadingFallback />}>
        {activeTab === 'investment' && (
          <InvestmentView
            articles={articles}
            factChecks={factChecks}
            onOpenQuestionModal={() => setQuestionModalOpen(true)}
            isStaffAuthenticated={isStaffAuthenticated}
            onRequestNewArticle={() => openArticleComposer(undefined, { category: 'Investor Update' })}
            onRequestEditArticle={(articleId) => openArticleComposer(articleId)}
            onDeleteArticle={handleDeleteArticle}
          />
        )}

        {activeTab === 'press-kit' && (
          <PressKitView
            milestones={milestones}
            csrImpacts={csrImpacts}
            onOpenQuestionModal={() => setQuestionModalOpen(true)}
            t={t}
          />
        )}

        {activeTab === 'careers' && (
          <CareersView
            socialLinks={socialLinks}
            onSubmitInquiry={handleAddInquiry}
            onConfirmationEmailFailed={(email, errorMsg) => pushEmailFailureNotification('Careers applicant', email, errorMsg)}
          />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementsView
            articles={articles}
            currentUser={currentUser}
            isStaffAuthenticated={isStaffAuthenticated}
            isAdmin={isAdmin}
            isDbConnected={isSupabaseConfigured}
            onAddArticle={handleAddArticle}
            onEditArticle={handleEditArticle}
            onDeleteArticle={handleDeleteArticle}
            onOpenQuestionModal={() => setQuestionModalOpen(true)}
            onOpenAuthModal={() => setAuthModalOpen(true)}
            onOpenContentEditor={(id) => openContentEditor('article', id)}
          />
        )}

        {activeTab === 'education' && (
          <EducationView
            courses={courses}
            currentUser={currentUser}
            onOpenQuestionModal={() => setQuestionModalOpen(true)}
            onAddCourse={handleAddCourse}
            onEditCourse={handleEditCourse}
            onDeleteCourse={handleDeleteCourse}
            onApplyCourse={handleApplyCourse}
            educationMedia={educationMedia}
            onAddEducationMedia={handleAddEducationMedia}
            onDeleteEducationMedia={handleDeleteEducationMedia}
            educationPhotos={educationPhotos}
            onAddEducationPhoto={handleAddEducationPhoto}
            onDeleteEducationPhoto={handleDeleteEducationPhoto}
            onUpdateEducationPhoto={handleUpdateEducationPhoto}
            onOpenContentEditor={(kind, id) => openContentEditor(kind, id)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            isAdmin={isAdmin}
            users={users}
            onNavigateTab={setActiveTab}
            onOpenProfileModal={() => setProfileModalOpen(true)}
            contentPipeline={contentPipeline}
            articles={articles}
            factChecks={factChecks}
            inquiries={inquiries}
            notifications={notifications}
            onApproveDraft={handleApproveDraft}
            onApproveFactCheck={handleEditFactCheck}
          />
        )}

        {activeTab === 'ai-assistant' && (
          <GeminiAiAssistant />
        )}

        {activeTab === 'pipeline' && (
          <ContentPipelineView
            currentUser={currentUser}
            contentPipeline={contentPipeline}
            onAddContent={handleAddContent}
            onEditContent={handleEditContent}
            onRequestChanges={handleRequestChanges}
            onDeleteContent={handleDeleteContent}
            onApproveDraft={handleApproveDraft}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'serp' && (
          <SerpMonitoringView />
        )}

        {activeTab === 'faq' && (
          <FaqManagerView
            factChecks={factChecks}
            currentUser={currentUser}
            isAdmin={isAdmin}
            onAddFactCheck={handleAddFactCheck}
            onEditFactCheck={handleEditFactCheck}
            onDeleteFactCheck={handleDeleteFactCheck}
            onApproveFactCheck={handleEditFactCheck}
            onOpenDocument={handleOpenDocument}
            onOpenContentEditor={(id) => openContentEditor('faq', id)}
          />
        )}

        {activeTab === 'inquiry-desk' && (
          <InquiryDeskView
            inquiries={inquiries}
            registrations={registrations}
            onUpdateInquiryStatus={handleUpdateInquiryStatus}
          />
        )}

        {activeTab === 'activity-log' && (
          <ActivityLogView entries={activityLog} />
        )}

        {activeTab === 'user-management' && isAdmin && (
          <UserManagementView currentUser={currentUser} />
        )}
        </Suspense>
      </main>

      {/* Direct Question Submit Modal (insight@aviyana.lk) */}
      <QuestionSubmitModal
        isOpen={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        onSubmitInquiry={handleAddInquiry}
        onConfirmationEmailFailed={(email, errorMsg) => pushEmailFailureNotification(`Question submitter`, email, errorMsg)}
      />

      {/* Real Sign In / Sign Up Modal (Supabase Auth) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Profile Management Modal — edit own name/title/avatar. Rendered
          only once opened (see the lazy() imports above) -- code-split so a
          public visitor who never signs in never downloads this chunk. */}
      {profileModalOpen && (
        <Suspense fallback={null}>
          <ProfileEditModal
            isOpen={profileModalOpen}
            onClose={() => setProfileModalOpen(false)}
            currentUser={currentUser}
            onUpdateUser={handleUpdateUser}
            articles={articles}
            contentPipeline={contentPipeline}
          />
        </Suspense>
      )}

      {/* Realtime Notification Center Drawer (staff only) */}
      {notificationsOpen && (
        <Suspense fallback={null}>
          <NotificationCenter
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onSimulateAlert={handleSimulateAlert}
            onActionClick={handleActionClick}
            audioEnabled={audioEnabled}
            setAudioEnabled={setAudioEnabled}
          />
        </Suspense>
      )}

      {/* Design Theme Selector Modal (staff only) */}
      {themeModalOpen && (
        <Suspense fallback={null}>
          <ThemeSelectorModal
            isOpen={themeModalOpen}
            onClose={() => setThemeModalOpen(false)}
            currentTheme={currentTheme}
            onSelectTheme={(theme) => setCurrentTheme(theme)}
          />
        </Suspense>
      )}

      {/* Social Links Manager Modal (staff/admin) */}
      {socialLinksModalOpen && (
        <Suspense fallback={null}>
          <SocialLinksManagerModal
            isOpen={socialLinksModalOpen}
            onClose={() => setSocialLinksModalOpen(false)}
            socialLinks={socialLinks}
            onSave={handleSaveSocialLink}
            onDelete={handleDeleteSocialLink}
          />
        </Suspense>
      )}

      {/* Unified Content Editor — one entry point for Milestone / Guest Voice
          (CSR) / Press Statement / Fact-Check / Article / Course / Education
          media. See Priority 0 in NEXT_SESSION_PLAN.md. Staff-only, so
          code-split and only mounted once a request is actually open. */}
      {contentEditorRequest && (
        <Suspense fallback={null}>
          <UnifiedContentEditor
            request={contentEditorRequest}
            onClose={closeContentEditor}
            currentUser={currentUser}
            isAdmin={isAdmin}
            milestones={milestones}
            csrImpacts={csrImpacts}
            voiceCuts={voiceCuts}
            factChecks={factChecks}
            articles={articles}
            courses={courses}
            educationMedia={educationMedia}
            onAddMilestone={handleAddMilestone}
            onEditMilestone={handleEditMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onAddCsrImpact={handleAddCsrImpact}
            onEditCsrImpact={handleEditCsrImpact}
            onDeleteCsrImpact={handleDeleteCsrImpact}
            onAddVoiceCut={handleAddVoiceCut}
            onEditVoiceCut={handleEditVoiceCut}
            onDeleteVoiceCut={handleDeleteVoiceCut}
            onAddFactCheck={handleAddFactCheck}
            onEditFactCheck={handleEditFactCheck}
            onDeleteFactCheck={handleDeleteFactCheck}
            onAddArticle={handleAddArticle}
            onEditArticle={handleEditArticle}
            onDeleteArticle={handleDeleteArticle}
            onAddCourse={handleAddCourse}
            onEditCourse={handleEditCourse}
            onDeleteCourse={handleDeleteCourse}
            onAddEducationMedia={handleAddEducationMedia}
            onDeleteEducationMedia={handleDeleteEducationMedia}
          />
        </Suspense>
      )}

      {/* Verified Government Clearance Certificate Modal */}
      <DocumentModal
        isOpen={documentModal.open}
        onClose={() => setDocumentModal({ ...documentModal, open: false })}
        documentName={documentModal.docName}
        title={documentModal.title}
      />

    </div>
  );
}
