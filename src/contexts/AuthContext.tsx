import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { isSupabaseConfigured, getSupabase } from '../lib/supabase';
import { fetchProfile, fetchAllProfiles, signOutUser } from '../lib/supabaseAuth';
import { INITIAL_USERS } from '../data/initialData';

/**
 * Who's signed in, the staff/admin roster, and the real Supabase session
 * listener. Extracted from App.tsx as part of Priority 1
 * (NEXT_SESSION_PLAN.md) -- this is the most foundational piece (almost
 * everything else needs to know "who is signed in"), so it's extracted
 * first and has no dependency on any other context.
 *
 * Note on scope: the plan's suggested domain list put `users` (the staff
 * roster) in a separate AdminContext. In practice the roster is fetched in
 * the exact same auth effect as the signed-in profile (see
 * `loadSessionProfile` below) and reset together on sign-out, so splitting
 * it into a second context would mean two contexts fighting over the same
 * moment of truth. Keeping it here is a deliberate, documented deviation
 * from the plan's suggested boundary, not an oversight -- see the plan's
 * own "if a context boundary starts needing another context's data, that's
 * a signal the boundary is wrong" guidance, which is exactly what applied
 * here. AdminContext (Priority 1, step 7) is limited to social links.
 */

// Default logged-out visitor identity. The public site loads in this state;
// anyone must sign in via the Auth Modal (real Supabase Auth) to unlock more.
export const PUBLIC_USER: User = {
  id: 'public-visitor',
  name: 'Public Visitor',
  role: 'PUBLIC_VISITOR',
  accountType: 'guest',
  title: 'Not Signed In',
  avatar: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=150&auto=format&fit=crop&q=80',
  email: '',
  responsibilities: []
};

interface AuthContextValue {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  authLoading: boolean;
  isStaffAuthenticated: boolean;
  isAdmin: boolean;
  isAnySignedIn: boolean;
  handleUpdateUser: (updatedUser: User) => void;
  handleLogout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children, onAuthNavigateHome }: { children: ReactNode; onAuthNavigateHome: () => void }) {
  // Real accounts (Supabase `profiles`, same table User Management edits) once
  // connected; falls back to the built-in mock roster only in demo mode
  // (Supabase not configured), so the Dashboard's team directory never shows
  // stale/local-only data.
  const [users, setUsers] = useState<User[]>(isSupabaseConfigured ? [] : INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(PUBLIC_USER);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Derived, not stored: true once we have a real signed-in admin or staff account
  // (guests and the logged-out PUBLIC_USER both read as false).
  const isStaffAuthenticated = currentUser.accountType === 'admin' || currentUser.accountType === 'staff';
  const isAdmin = currentUser.accountType === 'admin';
  // A logged-in guest reader and the logged-out PUBLIC_USER both have
  // accountType 'guest' (that field only distinguishes staff/admin from
  // everyone else) -- the ONLY thing that tells them apart is a real DB id
  // vs the hardcoded 'public-visitor' placeholder.
  const isAnySignedIn = isStaffAuthenticated || currentUser.id !== 'public-visitor';

  // Show who's signed in right in the browser tab title, so switching
  // between tabs/windows makes it obvious which account is active without
  // having to click back into the app first.
  useEffect(() => {
    const DEFAULT_TITLE = 'Aviyana Ceylon Resort | Official PR & Source of Truth Hub';
    if (currentUser.id !== 'public-visitor') {
      document.title = `${currentUser.name} | Aviyana Insight`;
    } else {
      document.title = DEFAULT_TITLE;
    }
  }, [currentUser.id, currentUser.name]);

  // Real authentication: watch the Supabase session. On sign-in (including
  // after a Google OAuth redirect back to the site), load that user's profile
  // row and become them. On sign-out, fall back to the logged-out PUBLIC_USER.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    const loadSessionProfile = async (userId: string) => {
      const profile = await fetchProfile(userId);
      setCurrentUser(profile || PUBLIC_USER);
      setAuthLoading(false);
      // Refresh the team directory as this user: RLS returns every profile
      // for admins, or just their own row for staff/guests, so the Dashboard's
      // "Personnel Directory" always reflects real, current DB accounts.
      const profiles = await fetchAllProfiles();
      if (profiles) setUsers(profiles);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        loadSessionProfile(data.session.user.id);
      } else {
        setAuthLoading(false);
      }
    });

    // BUG FIX: Supabase's client automatically re-checks/refreshes the
    // session whenever the browser tab regains focus (switching back from
    // another tab or app). That fires this callback with event
    // 'TOKEN_REFRESHED' -- a normal, silent, same-user event. The previous
    // version of this listener ignored `_event` entirely and treated ANY
    // callback without an immediately-available session as a sign-out: it
    // reset currentUser to the logged-out Public Visitor AND force-navigated
    // activeTab back to 'public-hub'. In practice this meant simply
    // switching tabs while mid-edit on an article (or anything else) could
    // silently kick a signed-in staff member back to the public homepage,
    // wiping out whatever they were in the middle of doing. Now we only
    // treat an explicit 'SIGNED_OUT' event as a real sign-out, and skip the
    // expensive full profile/content refetch for routine token refreshes
    // where the user hasn't actually changed.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(PUBLIC_USER);
        onAuthNavigateHome();
        setUsers([]);
        return;
      }
      if (event === 'TOKEN_REFRESHED') {
        // Same user, new token -- nothing to reload, and definitely nothing
        // that should touch activeTab or any in-progress editing state.
        return;
      }
      if (session?.user) {
        loadSessionProfile(session.user.id);
      }
    });

    return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Profile Edit Handler — updates the signed-in user's own profile locally
  // after a successful Supabase save (see ProfileEditModal). Also keeps the
  // demo "Team Directory" on the Dashboard in sync if this person happens to
  // be one of the seed entries there.
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  // Signs out of the real Supabase session. The onAuthStateChange listener
  // above picks this up and reverts to the logged-out Public Visitor view.
  const handleLogout = () => {
    signOutUser();
    setCurrentUser(PUBLIC_USER);
    onAuthNavigateHome();
  };

  const value: AuthContextValue = {
    users, setUsers, currentUser, setCurrentUser, authLoading,
    isStaffAuthenticated, isAdmin, isAnySignedIn, handleUpdateUser, handleLogout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
