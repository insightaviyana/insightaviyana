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
  Sparkles,
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
  PlusCircle
} from 'lucide-react';
import { User as UserType, UserRole, AppTheme } from '../types';
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

const NAV_ITEMS: NavItem[] = [
  { id: 'public-hub', label: 'Public Hub', icon: ShieldCheck },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'education', label: 'Aviyana Global Campus', icon: GraduationCap },
  { id: 'careers', label: 'Careers', icon: Briefcase },
  { id: 'investment', label: 'Investment', icon: TrendingUp },
  { id: 'dashboard', label: 'ORM Command Center', icon: LayoutDashboard, roles: ['IT_LEAD', 'SOCIAL_MANAGER', 'GUEST_COORDINATOR'] },
  { id: 'ai-assistant', label: 'Gemini PR AI', icon: Bot, highlight: true, roles: ['IT_LEAD', 'SOCIAL_MANAGER'] },
  { id: 'pipeline', label: 'Content Pipeline', icon: Send, roles: ['IT_LEAD', 'STORY_HUNTER', 'SOCIAL_MANAGER'] },
  { id: 'serp', label: 'SERP & Suppression', icon: Search, roles: ['IT_LEAD', 'SOCIAL_MANAGER'] },
  { id: 'inquiry-desk', label: 'Inquiry Desk', icon: Inbox, roles: ['IT_LEAD', 'SOCIAL_MANAGER', 'GUEST_COORDINATOR'] },
  { id: 'faq', label: 'Fact-Check & FAQ', icon: HelpCircle, roles: ['IT_LEAD', 'SOCIAL_MANAGER', 'GUEST_COORDINATOR'] },
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
  onOpenNotifications: () => void;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  onOpenQuestionModal?: () => void;
  onOpenThemeModal?: () => void;
  currentTheme?: AppTheme;
  /** Opens the Unified Content Editor's kind-selector step (Priority 0,
   * NEXT_SESSION_PLAN.md) — the single "+ Add Content" entry point. */
  onOpenContentEditor?: () => void;
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
  onOpenNotifications,
  audioEnabled,
  setAudioEnabled,
  onOpenQuestionModal,
  onOpenThemeModal,
  onOpenContentEditor
}) => {
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

  // Mobile fixed bottom bar shows up to 5 items only (space-limited).
  //
  // BUG FIX: this used to just take visibleNavItems.slice(0, 5) -- the first
  // 5 items in NAV_ITEMS' fixed order. For any signed-in staff/admin, that
  // order is Public Hub, Announcements, Education, Investment, Dashboard --
  // meaning the bottom bar was always dominated by public-facing content
  // tabs, and EVERY staff-specific tool (Content Pipeline, SERP, Inquiry
  // Desk, Fact-Check & FAQ, User Management, Activity Log) never appeared in
  // quick-access at all, staff had to open the full hamburger menu every
  // single time to reach their actual daily-use tools. For a signed-in
  // staff/admin, prioritize their role-specific tools first; the public
  // content tabs are just as reachable via the hamburger menu for them,
  // same as everything else that doesn't fit in 5 slots.
  const staffToolItems = visibleNavItems.filter(item => item.roles || item.adminOnly);
  const publicContentItems = visibleNavItems.filter(item => !item.roles && !item.adminOnly);
  const bottomBarItems = isStaffAuthenticated
    ? [...staffToolItems, ...publicContentItems].slice(0, 5)
    : visibleNavItems.slice(0, 5);

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-amber-500/20 text-slate-100 shadow-xl">
      {/* Top Banner for Subdomain Announcement */}
      <div className="bg-slate-950 px-3 sm:px-4 py-1.5 text-xs border-b border-amber-500/20 text-slate-300 flex justify-between items-center font-sans gap-2">
        <div className="flex items-center space-x-2 sm:space-x-2.5 overflow-hidden whitespace-nowrap min-w-0 flex-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider shadow-sm shrink-0">
            Ceylon Resort
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
                <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-white">AVIYANA</span>
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

            {/* Design Theme Selector Button (staff only) */}
            {isStaffAuthenticated && onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 hover:text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
                title="Switch Visual Design Theme"
              >
                <Palette size={15} className="text-amber-400" />
                <span className="hidden md:inline font-mono text-[10px] uppercase tracking-wider">Theme</span>
              </button>
            )}

            {/* Realtime Notifications Bell (staff only) */}
            {isStaffAuthenticated && (
              <button
                id="notifications-bell-btn"
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-300 hover:border-amber-500/40 transition-all cursor-pointer"
                title="Realtime Alerts & Notifications"
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
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Row 2: Desktop Navigation - full-width strip, own line, no crowding */}
        <nav className="hidden lg:flex items-center flex-wrap gap-1 pb-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-md shadow-amber-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/90 border border-transparent'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
          {!isStaffAuthenticated && (
            <span className="ml-2 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
              <Sparkles size={11} className="text-amber-500/60" />
              Staff sign in to see management tools
            </span>
          )}
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

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-amber-400' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Quick Actions (mirrors desktop-only buttons) */}
          <div className="pt-2 mt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
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
            {isStaffAuthenticated && onOpenThemeModal && (
              <button
                onClick={() => { onOpenThemeModal(); setMobileMenuOpen(false); }}
                className="flex items-center justify-center space-x-1.5 px-2.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all"
              >
                <Palette size={14} className="text-amber-400" />
                <span>Theme</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Fixed Bottom Bar for fast tab switching - reflects same visible/role-filtered items */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-amber-500/20 px-1 pt-1.5 flex justify-around items-center"
        style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
      >
        {bottomBarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center p-1.5 rounded-lg text-[10px] font-medium ${isActive ? 'text-amber-400' : 'text-slate-400'}`}
            >
              <Icon size={18} />
              <span className="max-w-[60px] truncate">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
