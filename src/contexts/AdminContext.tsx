import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SocialLink, Executive } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { upsertSocialLinkInDb, deleteSocialLinkFromDb } from '../lib/socialLinksApi';
import { upsertExecutiveInDb, deleteExecutiveFromDb } from '../lib/executivesApi';
import { SiteSettingsMap, saveSiteSettingInDb } from '../lib/siteSettingsApi';
import { useNotifications } from './NotificationContext';
import { INITIAL_SOCIAL_LINKS } from '../data/initialData';

/**
 * Admin-only settings: the social links bar shown across the public site,
 * and the Press Kit's Executive Headshots (added alongside social links --
 * same "small, admin-editable, publicly-read dataset" shape, so it lives
 * here rather than in its own context).
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
  executives: Executive[]; setExecutives: React.Dispatch<React.SetStateAction<Executive[]>>;
  handleSaveExecutive: (exec: Executive) => void;
  handleDeleteExecutive: (id: string) => void;
  siteSettings: SiteSettingsMap; setSiteSettings: React.Dispatch<React.SetStateAction<SiteSettingsMap>>;
  handleSaveSiteSetting: (key: string, value: string) => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { pushDbErrorNotification } = useNotifications();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(INITIAL_SOCIAL_LINKS);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettingsMap>({});

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

  const handleSaveExecutive = (exec: Executive) => {
    setExecutives(prev => {
      const exists = prev.some(e => e.id === exec.id);
      return exists ? prev.map(e => e.id === exec.id ? exec : e) : [...prev, exec];
    });
    if (isSupabaseConfigured) {
      upsertExecutiveInDb(exec).then(err => { if (err) pushDbErrorNotification(`Executive "${exec.name}"`, err); });
    }
  };

  const handleDeleteExecutive = (id: string) => {
    setExecutives(prev => prev.filter(e => e.id !== id));
    if (isSupabaseConfigured) {
      deleteExecutiveFromDb(id).then(err => { if (err) pushDbErrorNotification('Deleting executive', err); });
    }
  };

  const handleSaveSiteSetting = (key: string, value: string) => {
    setSiteSettings(prev => ({ ...prev, [key]: value }));
    if (isSupabaseConfigured) {
      saveSiteSettingInDb(key, value).then(err => { if (err) pushDbErrorNotification(`Site setting "${key}"`, err); });
    }
  };

  const value: AdminContextValue = {
    socialLinks, setSocialLinks, handleSaveSocialLink, handleDeleteSocialLink,
    executives, setExecutives, handleSaveExecutive, handleDeleteExecutive,
    siteSettings, setSiteSettings, handleSaveSiteSetting
  };
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within an AdminProvider');
  return ctx;
}

