import React, { useState } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Bot,
  Send,
  Search,
  HelpCircle,
  Inbox,
  History,
  Bell,
  Menu,
  X,
  Lock,
  LogOut,
  ExternalLink,
  Volume2,
  VolumeX,
  Megaphone,
  GraduationCap,
  Briefcase,
  UserPlus,
  Mail,
  Palette,
  Users,
  TrendingUp,
  PlusCircle,
  Newspaper,
  Rss,
  Globe,
  BadgeCheck,
  Handshake
} from 'lucide-react';
import { User as UserType, UserRole, AppTheme } from '../types';
import { Language, LANGUAGE_LABELS, TranslationDict } from '../lib/i18n';
import aviyanaLogoMark from '../assets/aviyana-logo-mark.png';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  highlight?: boolean;
  /** If omitted, item is public and always visible. If present, only visible to signed-in staff whose role is included (admins always see it regardless of roles list). */
  roles?: UserRole[];
  /** If true, only accountType === 'admin' can see this item, regardless of roles. */
  adminOnly?: boolean;
}

// Requested public-facing order: Public Hub / Announcements / Global Campus /
// Investment / Careers / Fact-Check Portal / Press Kit. Staff-only tools keep
// their own fixed order further down (they get a visual divider + are
// re-sorted to the front of the mobile bottom bar regardless -- see
// staffToolItems below).
const NAV_ITEMS: NavItem[] = [
  { id: 'public-hub', label: 'Public Hub', icon: ShieldCheck },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'education', label: 'Aviyana Global Campus', icon: GraduationCap },
  { id: 'investment', label: 'Investment', icon: TrendingUp },
  { id: 'sponsored-events', label: 'Sponsored Events', icon: Handshake },
  { id: 'careers', label: 'Careers', icon: Briefcase },
  { id: 'fact-check-portal', label: 'Fact-Check Portal', icon: BadgeCheck },
  { id: 'press-kit', label: 'Press Kit', icon: Newspaper },
  { id: 'dashboard', label: 'ORM Command Center', icon: LayoutDashboard, roles: ['IT_LEAD', 'SOCIAL_MANAGER', 'GUEST_COORDINATOR'] },
  { id: 'ai-assistant', label: 'Gemini PR AI', icon: Bot, highlight: true, roles: ['IT_LEAD', 'SOCIAL_MANAGER'] },
  { id: 'pipeline', label: 'Content Pipeline', icon: Send, roles: ['IT_LEAD', 'STORY_HUNTER', 'SOCIAL_MANAGER', 'STAFF_MEMBER'] },
  { id: 'serp', label: 'SERP & Suppression', icon: Search, roles: ['IT_LEAD', 'SOCIAL_MANAGER'] },
  { id: 'inquiry-desk', label: 'Inquiry Desk', icon: Inbox, roles: ['IT_LEAD', 'SOCIAL_MANAGER', 'GUEST_COORDINATOR', 'STAFF_MEMBER'] },
  { id: 'newsletter-subscribers', label: 'Newsletter Subscribers', icon: Mail, roles: ['IT_LEAD', 'SOCIAL_MANAGER', 'GUEST_COORDINATOR', 'STAFF_MEMBER'] },
  { id: 'faq', label: 'Fact-Check & FAQ', icon: HelpCircle, roles: ['IT_LEAD', 'SOCIAL_MANAGER', 'GUEST_COORDINATOR', 'STAFF_MEMBER'] },
  { id: 'user-management', label: 'User Management', icon: Users, adminOnly: true },
  { id: 'activity-log', label: 'Activity Log', icon: History, adminOnly: true }
];

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserType;
  isStaffAuthenticated: boolean;
  /** True for staff/admin AND for a real signed-in guest (false only for the
   * logged-out PUBLIC_USER). Guests and logged-out visitors both have
   * accountType === 'guest', so this is the only reliable "are they signed
   * in at all" check -- see the comment on this value in App.tsx. */
  isAnySignedIn?: boolean;
  onOpenAuthModal: () => void;
  /** Opens the Edit Profile modal -- used for a signed-in guest's own name/avatar badge. */
  onOpenProfileModal?: () => void;
  onLogout: () => void;
  unreadCount: number;
  /** Pending Fact-Check approvals -- shown as a small badge on the
   * "Fact-Check & FAQ" nav item so staff/admins notice there's something
   * waiting without having to open the tab first (mirrors the
   * notification bell's unreadCount badge). Optional -- 0/undefined
   * renders no badge. */
  pendingFaqCount?: number;
  onOpenNotifications: () => void;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  onOpenQuestionModal?: () => void;
  onOpenThemeModal?: () => void;
  currentTheme?: AppTheme;
  /** Opens the Unified Content Editor's kind-selector step (Priority 0,
   * NEXT_SESSION_PLAN.md) — the single "+ Add Content" entry point. */
  onOpenContentEditor?: () => void;
  /** Opens the sitewide GlobalSearchModal. Optional so this component still
   * works if a caller doesn't pass it (no search button renders). */
  onOpenSearch?: () => void;
  /** i18n (src/lib/i18n.tsx) -- all optional so this component still works
   * if a caller doesn't pass them (falls back to the built-in English
   * labels in NAV_ITEMS below). */
  t?: TranslationDict;
  language?: Language;
  setLanguage?: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  isStaffAuthenticated,
  isAnySignedIn,
  onOpenAuthModal,
  onOpenProfileModal,
  onLogout,
  unreadCount,
  pendingFaqCount = 0,
  onOpenNotifications,
  audioEnabled,
  setAudioEnabled,
  onOpenQuestionModal,
  onOpenThemeModal,
  onOpenContentEditor,
  onOpenSearch,
  t,
  language,
  setLanguage
}) => {
  // Translated label overrides for the nav items that have a translation
  // key -- staff-only tools (Dashboard, Content Pipeline, etc.) intentionally
  // aren't translated (see i18n.tsx: the translation surface covers
  // public-facing UI, not internal staff tooling).
  const navLabelOverrides: Record<string, string> = t ? {
    'public-hub': t.nav.publicHub,
    'fact-check-portal': t.nav.factCheckPortal,
    'announcements': t.nav.announcements,
    'education': t.nav.education,
    'careers': t.nav.careers,
    'investment': t.nav.investment,
    'press-kit': t.nav.pressKit,
  } : {};
  // A signed-in guest reader: real account, but not staff/admin. Falls back
  // to the id check directly if the caller didn't pass isAnySignedIn, so
  // this component still degrades sensibly if that prop is ever omitted.
  const isGuestSignedIn = !isStaffAuthenticated && (isAnySignedIn ?? currentUser.id !== 'public-visitor');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = currentUser.accountType === 'admin';

  // Nav items visible to the current viewer: public items always show;
  // admin-only items require accountType === 'admin'; other staff-only items
  // require sign-in AND (being an admin OR having a matching staff role).
  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly) return isAdmin;
    if (!item.roles) return true;
    return isStaffAuthenticated && (isAdmin || item.roles.includes(currentUser.role));
  });

  // Mobile fixed bottom bar -- previously hard-capped at 5 items (space-
  // limited real estate), which meant every new public tab silently pushed
  // an existing one out of quick-access with no way to reach it except the
  // hamburger menu (see QA_AUDIT_REPORT.md: adding Sponsored Events as an
  // 8th public tab pushed Careers/Fact-Check Portal/Press Kit out for a
  // logged-out visitor). Fixed properly instead of re-capping at a new
  // magic number that will just repeat the same problem the next time a
  // tab is added: the bar now shows the FULL list and scrolls horizontally
  // (see the `overflow-x-auto` + `no-scrollbar` on the container below) --
  // every visible tab stays exactly one tap away, nothing is ever silently
  // dropped from quick-access again.
  //
  // Ordering: for a signed-in staff/admin, role-specific tools come first
  // (their daily-use tools shouldn't require scrolling past every public
  // content tab to reach); the public content tabs are just as reachable
  // by scrolling right, same as everything else in the bar now.
  const staffToolItems = visibleNavItems.filter(item => item.roles || item.adminOnly);
  const publicContentItems = visibleNavItems.filter(item => !item.roles && !item.adminOnly);
  const bottomBarItems = isStaffAuthenticated
    ? [...staffToolItems, ...publicContentItems]
    : visibleNavItems;

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-amber-500/20 text-slate-100 shadow-xl">
      {/* Top Banner for Subdomain Announcement */}
      <div className="bg-slate-950 px-3 sm:px-4 py-1.5 text-xs border-b border-amber-500/20 text-slate-300 flex justify-between items-center font-sans gap-2">
        <div className="flex items-center space-x-2 sm:space-x-2.5 overflow-hidden whitespace-nowrap min-w-0 flex-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider shadow-sm shrink-0">
            Aviyana Ceylon Resort
          </span>
          <span className="hidden md:inline font-semibold text-amber-200 shrink-0">
            Strategic Grand Opening: <strong className="text-white">August 2027</strong>
          </span>
          <span className="hidden lg:inline text-slate-600 shrink-0">•</span>
          <span className="truncate text-slate-300 min-w-0">
            <span className="hidden sm:inline">Official Source of Truth: </span>
            <strong className="text-amber-400 font-mono">insight.aviyana.lk</strong>
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Row 1: Logo + Action Icons (never competes with nav for space) */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
          
          {/* Logo & Subdomain branding */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer shrink-0" onClick={() => setActiveTab('public-hub')}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-slate-950 border border-amber-500/30 shadow-lg shadow-amber-500/10 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={aviyanaLogoMark}
                alt="Aviyana Ceylon Resort"
                className="w-7 h-7 sm:w-9 sm:h-9 object-contain drop-shadow-[0_0_6px_rgba(245,158,11,0.35)]"
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-signature text-base sm:text-lg font-bold tracking-tight text-white">AVIYANA</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">CEYLON</span>
              </div>
              <div className="hidden sm:flex text-[11px] text-amber-300/70 font-mono items-center space-x-1">
                <span>insight.aviyana.lk</span>
                <ExternalLink size={10} className="inline opacity-60" />
              </div>
            </div>
          </div>

          {/* Right Action Icons & User Switcher */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Direct Inquiry & Registration Quick Group */}
            <div className="hidden xl:flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
              {/* Press Contact -- separate, one-click path for journalists,
                  distinct from the general "Ask Question" inquiry desk (see
                  ENGINEERING_ASSESSMENT.md, "No visible media contact"). */}
              <a
                href="mailto:insight@aviyana.lk?subject=Press%20Inquiry"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all"
                title="Press Contact: insight@aviyana.lk"
              >
                <Newspaper size={13} className="text-amber-400" />
                <span>Press Contact</span>
              </a>
              <a
                href="/rss.xml"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Subscribe via RSS"
                className="flex items-center px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition-all"
                title="Subscribe via RSS"
              >
                <Rss size={13} />
              </a>
              {/* Language switcher (src/lib/i18n.tsx) -- only two languages
                  today, so a single toggle button is simpler than a
                  dropdown; switches to a <select> if/when a third language
                  (e.g. Tamil) is added. */}
              {language && setLanguage && (
                <button
                  onClick={() => setLanguage(language === 'en' ? 'si' : 'en')}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 transition-all text-[11px] font-semibold"
                  title="Switch language"
                  aria-label={`Switch to ${language === 'en' ? LANGUAGE_LABELS.si : LANGUAGE_LABELS.en}`}
                >
                  <Globe size={13} />
                  <span>{language === 'en' ? 'සිං' : 'EN'}</span>
                </button>
              )}
              {onOpenQuestionModal && (
                <button
                  onClick={onOpenQuestionModal}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold transition-all"
                  title="Direct Question to insight@aviyana.lk"
                >
                  <Mail size={13} className="text-amber-400" />
                  <span>Ask Question</span>
                </button>
              )}
            </div>

            {/* Unified "+ Add Content" entry point (staff only) — see
                UnifiedContentEditor.tsx / Priority 0, NEXT_SESSION_PLAN.md */}
            {isStaffAuthenticated && onOpenContentEditor && (
              <button
                id="add-content-btn"
                onClick={onOpenContentEditor}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
                title="Add Content"
              >
                <PlusCircle size={15} />
                <span className="hidden md:inline">Add Content</span>
              </button>
            )}

            {/* Design Theme Selector Button -- available to every visitor
                (public, staff, admin alike), not staff-only. Public/guest
                visitors -- press, investors, prospective guests -- are
                exactly who'd want the light "Aman/Rosewood"-style theme,
                not just internal staff. */}
            {onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
                title="Switch Visual Design Theme"
              >
                <Palette size={15} className="text-amber-400" />
                <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider">Theme</span>
              </button>
            )}

            {/* Sitewide Search -- searches articles, milestones,
                fact-checks, and courses at once (see GlobalSearchModal.tsx).
                Always visible (not staff-only, not hidden behind the xl
                Quick Group) since this is exactly the kind of thing a
                first-time visitor or journalist needs immediately. */}
            {onOpenSearch && (
              <button
                onClick={onOpenSearch}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-all cursor-pointer"
                title="Search the site"
                aria-label="Search the site"
              >
                <Search size={16} />
              </button>
            )}

            {/* Realtime Notifications Bell (staff only) */}
            {isStaffAuthenticated && (
              <button
                id="notifications-bell-btn"
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-all cursor-pointer"
                title="Realtime Alerts & Notifications"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-md">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile / Staff Sign In */}
            {isStaffAuthenticated || isGuestSignedIn ? (
              <div className="flex items-center space-x-1.5">
                <button
                  id="user-auth-btn"
                  onClick={onOpenProfileModal || onOpenAuthModal}
                  className="flex items-center space-x-2 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-400/60 transition-all text-left cursor-pointer"
                  title="View / Edit Your Profile"
                >
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-6 h-6 rounded-full object-cover border border-amber-400/60"
                      onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
                  </div>
                  
                  <div className="hidden sm:block text-xs leading-tight">
                    <div className="font-semibold text-slate-200 truncate max-w-[100px]">
                      {currentUser.name.split(' ')[0]}
                    </div>
                    <div className="text-[9px] font-mono text-amber-300">
                      {isStaffAuthenticated ? currentUser.role.replace(/_/g, ' ') : 'Guest Account'}
                    </div>
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-300 hover:border-red-500/40 transition-all cursor-pointer"
                  title="Log Out to Public View"
                  aria-label="Log out to public view"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                id="user-auth-btn"
                onClick={onOpenAuthModal}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                title="Sign In"
              >
                <Lock size={13} className="text-amber-400" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Row 2: Desktop Navigation - full-width strip, own line, no crowding */}
        <nav className="hidden lg:flex items-center flex-wrap gap-1 pb-2">
          {visibleNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            // Balance/group fix: NAV_ITEMS is already ordered public-facing
            // items first, then staff tools, then admin-only tools -- but
            // with nothing marking that boundary, the row simply wrapped
            // wherever the browser width happened to break, sometimes
            // splitting mid-group (e.g. 2 staff tools stranded on the
            // public-items row, the rest wrapping to the next row) rather
            // than at the actual public/staff boundary. A vertical divider
            // right at that boundary makes the grouping visually clear
            // regardless of exactly where the wrap falls.
            const isFirstStaffItem = (item.roles || item.adminOnly) &&
              !(visibleNavItems[idx - 1]?.roles || visibleNavItems[idx - 1]?.adminOnly);
            return (
              <React.Fragment key={item.id}>
                {isFirstStaffItem && (
                  <div className="w-px self-stretch my-1 bg-slate-700 mx-1.5" aria-hidden="true" />
                )}
                <button
                  id={`nav-btn-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-500/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/90 border border-transparent'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                  <span>{navLabelOverrides[item.id] || item.label}</span>
                  {item.id === 'faq' && pendingFaqCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-950 shadow-md">
                      {pendingFaqCount}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-amber-500/20 px-4 pt-2 pb-4 space-y-1 max-h-[75vh] overflow-y-auto">
          {isStaffAuthenticated || isGuestSignedIn ? (
            <div
              className="p-2 mb-2 bg-slate-900 rounded-lg border border-amber-500/20 flex items-center space-x-3 cursor-pointer"
              onClick={() => {
                if (onOpenProfileModal) onOpenProfileModal();
                setMobileMenuOpen(false);
              }}
            >
              <img src={currentUser.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-amber-400" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{currentUser.name}</div>
                <div className="text-xs text-amber-300 truncate">{isStaffAuthenticated ? `${currentUser.title} — tap to edit` : 'Guest Account — tap to edit'}</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onLogout(); setMobileMenuOpen(false); }}
                className="ml-auto shrink-0 text-xs px-2.5 py-1 rounded bg-red-950/60 text-red-300 border border-red-500/40 flex items-center gap-1"
                aria-label="Log out"
              >
                <LogOut size={12} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => { onOpenAuthModal(); setMobileMenuOpen(false); }}
              className="w-full p-2.5 mb-2 bg-amber-500/20 border border-amber-500/40 rounded-lg flex items-center justify-center gap-2 text-amber-300 text-sm font-semibold"
            >
              <Lock size={15} />
              <span>Sign In</span>
            </button>
          )}

          {visibleNavItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isFirstStaffItem = (item.roles || item.adminOnly) &&
              !(visibleNavItems[idx - 1]?.roles || visibleNavItems[idx - 1]?.adminOnly);
            return (
              <React.Fragment key={item.id}>
                {isFirstStaffItem && (
                  <div className="pt-2 mt-1 border-t border-slate-800 px-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Staff Tools
                  </div>
                )}
                <button
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                  <span>{navLabelOverrides[item.id] || item.label}</span>
                  {item.id === 'faq' && pendingFaqCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 px-1.5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-slate-950">
                      {pendingFaqCount}
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}

          {/* Quick Actions (mirrors desktop-only buttons) */}
          <div className="pt-2 mt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
            {onOpenSearch && (
              <button
                onClick={() => { onOpenSearch(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all col-span-2"
              >
                <Search size={14} className="text-amber-400" />
                <span>Search the Site</span>
              </button>
            )}
            {isStaffAuthenticated && onOpenContentEditor && (
              <button
                onClick={() => { onOpenContentEditor(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-bold transition-all col-span-2"
              >
                <PlusCircle size={14} />
                <span>Add Content</span>
              </button>
            )}
            {onOpenQuestionModal && (
              <button
                onClick={() => { onOpenQuestionModal(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition-all"
              >
                <Mail size={14} className="text-amber-400" />
                <span>Ask Question</span>
              </button>
            )}
            <a
              href="mailto:insight@aviyana.lk?subject=Press%20Inquiry"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all col-span-2"
            >
              <Newspaper size={14} className="text-amber-400" />
              <span>Press Contact</span>
            </a>
            {onOpenThemeModal && (
              <button
                onClick={() => { onOpenThemeModal(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all"
              >
                <Palette size={14} className="text-amber-400" />
                <span>Theme</span>
              </button>
            )}
            {language && setLanguage && (
              <button
                onClick={() => setLanguage(language === 'en' ? 'si' : 'en')}
                className="flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all col-span-2"
                aria-label={`Switch to ${language === 'en' ? LANGUAGE_LABELS.si : LANGUAGE_LABELS.en}`}
              >
                <Globe size={14} className="text-amber-400" />
                <span>{language === 'en' ? LANGUAGE_LABELS.si : LANGUAGE_LABELS.en}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Bar for fast tab switching - reflects same
          visible/role-filtered items. Horizontally scrollable (see
          bottomBarItems above) rather than capped/truncated -- every
          visible tab is reachable by a tap plus, if needed, a swipe, never
          silently hidden. `snap-x` gives each icon a resting position so a
          swipe doesn't leave one awkwardly half-cut-off at the edge. */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-amber-500/20 px-1 pt-1.5 flex items-center gap-0.5 overflow-x-auto no-scrollbar snap-x snap-mandatory"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        {bottomBarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`shrink-0 snap-center flex flex-col items-center min-w-[58px] px-1.5 p-1.5 rounded-lg text-[10px] font-medium ${isActive ? 'text-amber-400' : 'text-slate-400'}`}
            >
              <Icon size={18} />
              <span className="max-w-[60px] truncate">{(navLabelOverrides[item.id] || item.label).split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
