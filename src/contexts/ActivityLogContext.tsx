import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ActivityLogEntry } from '../types';
import { logActivity } from '../lib/activityLogApi';
import { useAuth } from './AuthContext';

/**
 * The staff activity/audit log. Extracted from App.tsx as part of Priority 1
 * (NEXT_SESSION_PLAN.md) -- small and self-contained, and serves as the
 * template for the "domain context with a fetch-on-mount +
 * local-optimistic-update pattern" that ContentContext/EducationContext/
 * InquiryContext all reuse. Depends on AuthContext (needs to know who's
 * acting, and whether they're staff -- guest actions aren't audited).
 */
interface ActivityLogContextValue {
  activityLog: ActivityLogEntry[];
  setActivityLog: React.Dispatch<React.SetStateAction<ActivityLogEntry[]>>;
  logAction: (action: string, targetType: string, targetTitle: string, detail?: string) => void;
}

const ActivityLogContext = createContext<ActivityLogContextValue | undefined>(undefined);

export function ActivityLogProvider({ children }: { children: ReactNode }) {
  const { currentUser, isStaffAuthenticated } = useAuth();
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

  // Records one entry in the staff activity log, attributed to whoever is
  // currently signed in. Fire-and-forget -- never blocks or fails the
  // action it's describing (see logActivity's own comment in activityLogApi.ts).
  const logAction = (action: string, targetType: string, targetTitle: string, detail?: string) => {
    if (!isStaffAuthenticated) return; // only staff/admin actions are worth auditing
    logActivity({
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      targetType,
      targetTitle,
      detail
    });
    // Also reflect it immediately in local state so the Activity Log tab
    // shows it without waiting on a refetch.
    setActivityLog(prev => [{
      id: `local-${Date.now()}`,
      actorId: currentUser.id,
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      targetType,
      targetTitle,
      detail,
      createdAt: 'Just now'
    }, ...prev]);
  };

  const value: ActivityLogContextValue = { activityLog, setActivityLog, logAction };
  return <ActivityLogContext.Provider value={value}>{children}</ActivityLogContext.Provider>;
}

export function useActivityLog(): ActivityLogContextValue {
  const ctx = useContext(ActivityLogContext);
  if (!ctx) throw new Error('useActivityLog must be used within an ActivityLogProvider');
  return ctx;
}
