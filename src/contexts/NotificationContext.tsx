import React, { createContext, useContext, useState, ReactNode } from 'react';
import { NotificationItem } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { createNotificationInDb, updateNotificationReadInDb, markAllNotificationsReadInDb } from '../lib/notificationsApi';

/**
 * Notification feed (bell icon), the app-wide "surface a save/email failure
 * to a visible notification instead of only console.error" helpers, and the
 * alert chime. Extracted from App.tsx as part of Priority 1
 * (NEXT_SESSION_PLAN.md) -- this was one of the lowest-risk, most
 * self-contained pieces, so it's a good second extraction after Auth.
 *
 * Deliberately has NO dependency on any other context: everything else
 * (Content, Inquiry, Education, Admin) depends on this one for
 * pushNotification/pushDbErrorNotification/pushEmailFailureNotification/
 * playAlertChime, not the other way around.
 */
interface NotificationContextValue {
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  unreadCount: number;
  audioEnabled: boolean;
  setAudioEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  pushNotification: (notif: NotificationItem) => void;
  pushDbErrorNotification: (action: string, errorMessage: string) => void;
  pushEmailFailureNotification: (recipientLabel: string, recipientEmail: string, errorMessage: string) => void;
  playAlertChime: () => void;
  handleMarkRead: (id: string) => void;
  handleMarkAllRead: () => void;
  handleSimulateAlert: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children, initialNotifications = [] }: { children: ReactNode; initialNotifications?: NotificationItem[] }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Adds a notification to local state AND persists it to Supabase, so the
  // bell icon's history survives a page reload / a different staff member
  // logging in, instead of vanishing at the end of the browser tab's session.
  const pushNotification = (notif: NotificationItem) => {
    setNotifications(prev => [notif, ...prev]);
    if (isSupabaseConfigured) createNotificationInDb(notif);
  };

  // Surfaces a Supabase write failure as a visible high-severity notification
  // (bell icon badge) instead of only logging to the browser console, since a
  // silent console.warn meant admins had no way to know a "published" post
  // never actually made it to the database.
  const pushDbErrorNotification = (action: string, errorMessage: string) => {
    if (errorMessage === 'Supabase not configured') return; // expected in demo mode, not an error
    const notif: NotificationItem = {
      id: `notif-db-err-${Date.now()}`,
      title: `⚠ Database Save Failed: ${action}`,
      message: `Saved locally in this browser tab only — it will disappear on reload and other visitors won't see it. Supabase error: ${errorMessage}`,
      timestamp: 'Just now',
      severity: 'high',
      type: 'warning',
      read: false
    };
    pushNotification(notif);
  };

  // A confirmation email to a member of the public (visitor/applicant/
  // registrant) failed to send -- most commonly because the Resend sending
  // domain isn't verified yet, so the address they typed in can't actually
  // be reached. Surfaces it as a staff notification so someone follows up
  // manually with that person, instead of it failing silently.
  const pushEmailFailureNotification = (recipientLabel: string, recipientEmail: string, errorMessage: string) => {
    const notif: NotificationItem = {
      id: `notif-email-err-${Date.now()}`,
      title: `⚠ Confirmation Email Not Delivered: ${recipientLabel}`,
      message: `${recipientEmail} likely never received their confirmation email. Please follow up manually. Error: ${errorMessage}`,
      timestamp: 'Just now',
      severity: 'medium',
      type: 'warning',
      read: false
    };
    pushNotification(notif);
  };

  const playAlertChime = () => {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.08);
      osc1.stop(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio Context fallback silent
    }
  };

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    if (isSupabaseConfigured) updateNotificationReadInDb(id, true);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (isSupabaseConfigured) markAllNotificationsReadInDb();
  };

  // Simulate a live incoming alert (demo/dashboard button)
  const handleSimulateAlert = () => {
    const alertTypes = [
      {
        title: 'New Social Mention Monitored',
        message: 'Facebook comment detected on Aviyana page: "Are the infinity pool environmental permits verified?"',
        severity: 'high' as const,
        type: 'mention' as const,
        actionRequired: 'Generate Gemini Response'
      },
      {
        title: 'New Story Draft Uploaded',
        message: 'Dilshan uploaded 4K Drone Footage of Villa Construction. Awaiting SE Lead review.',
        severity: 'medium' as const,
        type: 'approval' as const,
        actionRequired: 'Review & Publish'
      },
      {
        title: 'New Google 5-Star Soft Opening Review',
        message: 'Soft-launch guest posted: "Spectacular Ceylon luxury service and butler hospitality!"',
        severity: 'low' as const,
        type: 'review' as const,
        actionRequired: 'Send Polite Thanks'
      }
    ];

    const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: randomAlert.title,
      message: randomAlert.message,
      timestamp: 'Just now',
      severity: randomAlert.severity,
      type: randomAlert.type,
      read: false,
      actionRequired: randomAlert.actionRequired
    };

    pushNotification(newNotif);
    playAlertChime();
  };

  const value: NotificationContextValue = {
    notifications, setNotifications, unreadCount, audioEnabled, setAudioEnabled,
    pushNotification, pushDbErrorNotification, pushEmailFailureNotification, playAlertChime,
    handleMarkRead, handleMarkAllRead, handleSimulateAlert
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
}
