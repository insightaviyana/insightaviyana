import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SocialLink } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { upsertSocialLinkInDb, deleteSocialLinkFromDb } from '../lib/socialLinksApi';
import { useNotifications } from './NotificationContext';
import { INITIAL_SOCIAL_LINKS } from '../data/initialData';

/**
 * Admin-only settings: the social links bar shown across the public site.
 * Extracted from App.tsx as part of Priority 1 (NEXT_SESSION_PLAN.md).
 *
 * Note on scope: the plan's suggested boundary for this context also
 * included the staff/admin user roster (`users`). That state lives in
 * AuthContext instead -- see the scope note at the top of AuthContext.tsx
 * for why keeping the roster next to the session/profile-loading logic
 * that fetches it was the better call in practice.
 */
interface AdminContextValue {
  socialLinks: SocialLink[]; setSocialLinks: React.Dispatch<React.SetStateAction<SocialLink[]>>;
  handleSaveSocialLink: (link: SocialLink) => void;
  handleDeleteSocialLink: (platform: string) => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { pushDbErrorNotification } = useNotifications();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(INITIAL_SOCIAL_LINKS);

  const handleSaveSocialLink = (link: SocialLink) => {
    setSocialLinks(prev => {
      const exists = prev.some(l => l.platform === link.platform);
      return exists ? prev.map(l => l.platform === link.platform ? link : l) : [...prev, link];
    });
    if (isSupabaseConfigured) {
      upsertSocialLinkInDb(link).then(err => { if (err) pushDbErrorNotification(`Social link "${link.platform}"`, err); });
    }
  };

  const handleDeleteSocialLink = (platform: string) => {
    setSocialLinks(prev => prev.filter(l => l.platform !== platform));
    if (isSupabaseConfigured) {
      deleteSocialLinkFromDb(platform).then(err => { if (err) pushDbErrorNotification(`Deleting social link "${platform}"`, err); });
    }
  };

  const value: AdminContextValue = { socialLinks, setSocialLinks, handleSaveSocialLink, handleDeleteSocialLink };
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within an AdminProvider');
  return ctx;
}
