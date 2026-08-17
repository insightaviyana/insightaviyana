import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { ArticleItem, Milestone, CSRImpact, VoiceCut, FactCheckItem, ContentPipelineItem } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { createArticleInDb, updateArticleInDb, deleteArticleFromDb, incrementArticleViews } from '../lib/articlesApi';
import {
  createMilestoneInDb, updateMilestoneInDb, deleteMilestoneFromDb,
  createCsrImpactInDb, updateCsrImpactInDb, deleteCsrImpactFromDb,
  createVoiceCutInDb, updateVoiceCutInDb, deleteVoiceCutFromDb,
  createFactCheckInDb, updateFactCheckInDb, deleteFactCheckFromDb
} from '../lib/publicHubApi';
import { createContentPipelineInDb, updateContentPipelineInDb, deleteContentPipelineFromDb } from '../lib/contentPipelineApi';
import { useNotifications } from './NotificationContext';
import { useActivityLog } from './ActivityLogContext';
import { useAuth } from './AuthContext';
import { buildArticleFromApprovedDraft } from '../lib/statusTransitions';
import {
  INITIAL_MILESTONES, INITIAL_FACT_CHECKS, INITIAL_CSR_IMPACT, INITIAL_VOICE_CUTS,
  INITIAL_CONTENT_PIPELINE, INITIAL_ARTICLES
} from '../data/initialData';

/**
 * The biggest and most important slice (Priority 1, NEXT_SESSION_PLAN.md):
 * articles, milestones, CSR/guest-voice impacts, voice cuts, fact-checks,
 * and content pipeline drafts, plus the approval-workflow logic (this is
 * exactly the code Priority 2's test suite targets -- splitting it out here
 * is what makes it testable in isolation later, without pulling in the rest
 * of the app).
 *
 * Depends on NotificationContext (pushNotification/pushDbErrorNotification/
 * playAlertChime), ActivityLogContext (logAction), and AuthContext
 * (currentUser, users -- needed to resolve a content-pipeline draft's
 * "captured by" name back to a real user for the auto-generated article's
 * author avatar).
 */
interface ContentContextValue {
  articles: ArticleItem[]; setArticles: React.Dispatch<React.SetStateAction<ArticleItem[]>>;
  milestones: Milestone[]; setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  csrImpacts: CSRImpact[]; setCsrImpacts: React.Dispatch<React.SetStateAction<CSRImpact[]>>;
  voiceCuts: VoiceCut[]; setVoiceCuts: React.Dispatch<React.SetStateAction<VoiceCut[]>>;
  factChecks: FactCheckItem[]; setFactChecks: React.Dispatch<React.SetStateAction<FactCheckItem[]>>;
  contentPipeline: ContentPipelineItem[]; setContentPipeline: React.Dispatch<React.SetStateAction<ContentPipelineItem[]>>;

  handleAddArticle: (item: ArticleItem) => void;
  handleEditArticle: (item: ArticleItem) => void;
  handleDeleteArticle: (id: string) => void;
  /** Bumps an article's real view count by 1 -- called once when a reader
   * actually opens it (see incrementArticleViews in articlesApi.ts).
   * Optimistically updates local state immediately, same pattern as every
   * other mutation here, so the number on screen doesn't wait on a refetch. */
  handleIncrementArticleViews: (articleId: string) => void;

  handleAddMilestone: (item: Milestone) => void;
  handleEditMilestone: (item: Milestone) => void;
  handleDeleteMilestone: (id: string) => void;

  handleAddCsrImpact: (item: CSRImpact) => void;
  handleEditCsrImpact: (item: CSRImpact) => void;
  handleDeleteCsrImpact: (id: string) => void;

  handleAddVoiceCut: (item: VoiceCut) => void;
  handleEditVoiceCut: (item: VoiceCut) => void;
  handleDeleteVoiceCut: (id: string) => void;

  handleAddFactCheck: (item: FactCheckItem) => void;
  handleEditFactCheck: (item: FactCheckItem) => void;
  handleDeleteFactCheck: (id: string) => void;

  handleAddContent: (item: ContentPipelineItem) => void;
  handleEditContent: (item: ContentPipelineItem) => void;
  handleDeleteContent: (id: string) => void;
  handleRequestChanges: (item: ContentPipelineItem, note: string) => void;
  handleApproveDraft: (id: string) => void;
}

const ContentContext = createContext<ContentContextValue | undefined>(undefined);

export function ContentProvider({ children }: { children: ReactNode }) {
  const { pushNotification, pushDbErrorNotification, playAlertChime } = useNotifications();
  const { logAction } = useActivityLog();
  const { currentUser, users } = useAuth();

  const [articles, setArticles] = useState<ArticleItem[]>(INITIAL_ARTICLES);
  const [milestones, setMilestones] = useState<Milestone[]>(INITIAL_MILESTONES);
  const [csrImpacts, setCsrImpacts] = useState<CSRImpact[]>(INITIAL_CSR_IMPACT);
  const [voiceCuts, setVoiceCuts] = useState<VoiceCut[]>(INITIAL_VOICE_CUTS);
  const [factChecks, setFactChecks] = useState<FactCheckItem[]>(INITIAL_FACT_CHECKS);
  const [contentPipeline, setContentPipeline] = useState<ContentPipelineItem[]>(INITIAL_CONTENT_PIPELINE);

  // Synchronous lock for in-flight approvals -- a useState-based guard here
  // isn't reliable against a genuine rapid double-click, because both click
  // events can fire and read the same pre-re-render state before React
  // commits the first update. A ref updates immediately/synchronously, so
  // the second click sees the first click's lock even within the same tick.
  // This is what actually stopped the "duplicate key value violates unique
  // constraint announcements_pkey" error -- two clicks both tried to create
  // the same deterministically-ID'd article, and the DB correctly rejected
  // the second one, but only after presenting a scary false-alarm error.
  const approvingDraftIds = useRef<Set<string>>(new Set());

  // --- Articles ---
  const handleAddArticle = (newArticle: ArticleItem) => {
    setArticles(prev => [newArticle, ...prev]);
    playAlertChime();
    logAction(newArticle.status === 'Published' ? 'published' : 'submitted', 'Article', newArticle.title);
    if (isSupabaseConfigured) {
      createArticleInDb(newArticle).then(errorMsg => {
        if (errorMsg) pushDbErrorNotification(`Article "${newArticle.title}"`, errorMsg);
      });
    }
  };

  const handleEditArticle = (updatedArticle: ArticleItem) => {
    // Stamp the correction/update trail -- see ArticleItem.lastEditedAt.
    // Only meaningful once an article has actually been published at least
    // once; a Draft/In Review edit isn't a "correction" a reader would ever
    // see, but stamping it unconditionally is harmless (undefined vs. a
    // timestamp before first publish makes no visible difference) and
    // keeps this simple rather than threading the previous status through.
    const editedArticle: ArticleItem = { ...updatedArticle, lastEditedAt: new Date().toISOString() };
    setArticles(prev => prev.map(a => a.id === editedArticle.id ? editedArticle : a));
    logAction('edited', 'Article', editedArticle.title);
    pushNotification({
      id: `notif-${Date.now()}`,
      title: 'Press Statement Edited',
      message: `${currentUser.name || 'A team member'} updated "${editedArticle.title}" on insight.aviyana.lk.`,
      timestamp: 'Just now',
      severity: 'low',
      type: 'approval',
      read: false
    });
    playAlertChime();
    if (isSupabaseConfigured) {
      updateArticleInDb(editedArticle).then(errorMsg => {
        if (errorMsg) pushDbErrorNotification(`Article "${editedArticle.title}" edit`, errorMsg);
      });
    }
  };

  const handleDeleteArticle = (articleId: string) => {
    const deletedTitle = articles.find(a => a.id === articleId)?.title || articleId;
    setArticles(prev => prev.filter(a => a.id !== articleId));
    logAction('deleted', 'Article', deletedTitle);
    pushNotification({
      id: `notif-${Date.now()}`,
      title: 'Press Statement Deleted',
      message: `Super Admin deleted article (ID: ${articleId}).`,
      timestamp: 'Just now',
      severity: 'high',
      type: 'warning',
      read: false
    });
    playAlertChime();
    if (isSupabaseConfigured) {
      deleteArticleFromDb(articleId).then(errorMsg => {
        if (errorMsg) pushDbErrorNotification('Article deletion', errorMsg);
      });
    }
  };

  const handleIncrementArticleViews = (articleId: string) => {
    setArticles(prev => prev.map(a => a.id === articleId ? { ...a, viewsCount: a.viewsCount + 1 } : a));
    if (isSupabaseConfigured) incrementArticleViews(articleId);
  };

  // --- Milestones ---
  const handleAddMilestone = (item: Milestone) => {
    setMilestones(prev => [item, ...prev]);
    playAlertChime();
    logAction('added', 'Milestone', item.title);
    if (isSupabaseConfigured) {
      createMilestoneInDb(item).then(err => { if (err) pushDbErrorNotification(`Milestone "${item.title}"`, err); });
    }
  };
  const handleEditMilestone = (item: Milestone) => {
    const editedItem: Milestone = { ...item, lastEditedAt: new Date().toISOString() };
    setMilestones(prev => prev.map(m => m.id === editedItem.id ? editedItem : m));
    playAlertChime();
    logAction('edited', 'Milestone', editedItem.title);
    if (isSupabaseConfigured) {
      updateMilestoneInDb(editedItem).then(err => { if (err) pushDbErrorNotification(`Milestone "${editedItem.title}" edit`, err); });
    }
  };
  const handleDeleteMilestone = (id: string) => {
    const deletedTitle = milestones.find(m => m.id === id)?.title || id;
    setMilestones(prev => prev.filter(m => m.id !== id));
    playAlertChime();
    logAction('deleted', 'Milestone', deletedTitle);
    if (isSupabaseConfigured) {
      deleteMilestoneFromDb(id).then(err => { if (err) pushDbErrorNotification('Milestone deletion', err); });
    }
  };

  // --- CSR / Guest Voice ---
  const handleAddCsrImpact = (item: CSRImpact) => {
    setCsrImpacts(prev => [item, ...prev]);
    playAlertChime();
    logAction('added', 'Guest Voice / Fleet Feature', item.title);
    if (isSupabaseConfigured) {
      createCsrImpactInDb(item).then(err => { if (err) pushDbErrorNotification(`Fleet feature "${item.title}"`, err); });
    }
  };
  const handleEditCsrImpact = (item: CSRImpact) => {
    setCsrImpacts(prev => prev.map(c => c.id === item.id ? item : c));
    playAlertChime();
    logAction('edited', 'Guest Voice / Fleet Feature', item.title);
    if (isSupabaseConfigured) {
      updateCsrImpactInDb(item).then(err => { if (err) pushDbErrorNotification(`Fleet feature "${item.title}" edit`, err); });
    }
  };
  const handleDeleteCsrImpact = (id: string) => {
    const deletedTitle = csrImpacts.find(c => c.id === id)?.title || id;
    setCsrImpacts(prev => prev.filter(c => c.id !== id));
    playAlertChime();
    logAction('deleted', 'Guest Voice / Fleet Feature', deletedTitle);
    if (isSupabaseConfigured) {
      deleteCsrImpactFromDb(id).then(err => { if (err) pushDbErrorNotification('Fleet feature deletion', err); });
    }
  };

  // --- Voice Cuts (press statements) ---
  const handleAddVoiceCut = (item: VoiceCut) => {
    setVoiceCuts(prev => [item, ...prev]);
    playAlertChime();
    logAction('added', 'Press Statement', item.title);
    if (isSupabaseConfigured) {
      createVoiceCutInDb(item).then(err => { if (err) pushDbErrorNotification(`Press statement "${item.title}"`, err); });
    }
  };
  const handleEditVoiceCut = (item: VoiceCut) => {
    setVoiceCuts(prev => prev.map(v => v.id === item.id ? item : v));
    playAlertChime();
    logAction('edited', 'Press Statement', item.title);
    if (isSupabaseConfigured) {
      updateVoiceCutInDb(item).then(err => { if (err) pushDbErrorNotification(`Press statement "${item.title}" edit`, err); });
    }
  };
  const handleDeleteVoiceCut = (id: string) => {
    const deletedTitle = voiceCuts.find(v => v.id === id)?.title || id;
    setVoiceCuts(prev => prev.filter(v => v.id !== id));
    playAlertChime();
    logAction('deleted', 'Press Statement', deletedTitle);
    if (isSupabaseConfigured) {
      deleteVoiceCutFromDb(id).then(err => { if (err) pushDbErrorNotification('Press statement deletion', err); });
    }
  };

  // --- Fact-Checks / FAQs ---
  const handleAddFactCheck = (newItem: FactCheckItem) => {
    setFactChecks(prev => [newItem, ...prev]);
    playAlertChime();
    logAction('added', 'Fact-Check / FAQ', newItem.rumor.slice(0, 60));
    if (isSupabaseConfigured) {
      createFactCheckInDb(newItem).then(err => { if (err) pushDbErrorNotification(`Fact-check "${newItem.rumor.slice(0, 40)}..."`, err); });
    }
  };
  const handleEditFactCheck = (item: FactCheckItem) => {
    const editedItem: FactCheckItem = { ...item, lastEditedAt: new Date().toISOString() };
    setFactChecks(prev => prev.map(f => f.id === editedItem.id ? editedItem : f));
    playAlertChime();
    logAction('edited', 'Fact-Check / FAQ', editedItem.rumor.slice(0, 60));
    if (isSupabaseConfigured) {
      updateFactCheckInDb(editedItem).then(err => { if (err) pushDbErrorNotification(`Fact-check "${editedItem.rumor.slice(0, 40)}..." edit`, err); });
    }
  };
  const handleDeleteFactCheck = (id: string) => {
    const deletedTitle = factChecks.find(f => f.id === id)?.rumor.slice(0, 60) || id;
    setFactChecks(prev => prev.filter(f => f.id !== id));
    playAlertChime();
    logAction('deleted', 'Fact-Check / FAQ', deletedTitle);
    if (isSupabaseConfigured) {
      deleteFactCheckFromDb(id).then(err => { if (err) pushDbErrorNotification('Fact-check deletion', err); });
    }
  };

  // --- Content Pipeline ---
  const handleAddContent = (newItem: ContentPipelineItem) => {
    setContentPipeline(prev => [newItem, ...prev]);
    playAlertChime();
    if (isSupabaseConfigured) {
      createContentPipelineInDb(newItem).then(err => { if (err) pushDbErrorNotification(`Content draft "${newItem.title}"`, err); });
    }
  };

  const handleEditContent = (item: ContentPipelineItem) => {
    setContentPipeline(prev => prev.map(c => c.id === item.id ? item : c));
    logAction(item.status === 'Pending SE Approval' ? 'resubmitted' : 'edited', 'Content Draft', item.title);
    if (isSupabaseConfigured) {
      updateContentPipelineInDb(item).then(err => { if (err) pushDbErrorNotification(`Content draft "${item.title}" edit`, err); });
    }
  };

  // Admin sends a pending draft back to whoever submitted it, with a note on
  // what to fix, instead of approving it as-is or editing it themselves.
  const handleRequestChanges = (item: ContentPipelineItem, note: string) => {
    const updated: ContentPipelineItem = { ...item, status: 'Needs Revision', revisionNote: note };
    setContentPipeline(prev => prev.map(c => c.id === item.id ? updated : c));
    logAction('requested changes on', 'Content Draft', item.title, note);
    if (isSupabaseConfigured) {
      updateContentPipelineInDb(updated).then(err => { if (err) pushDbErrorNotification(`Requesting changes on "${item.title}"`, err); });
    }
    pushNotification({
      id: `notif-revision-${Date.now()}`,
      title: `Changes Requested: "${item.title}"`,
      message: `${currentUser.name} sent this draft back to ${item.capturedBy} — "${note}"`,
      timestamp: 'Just now',
      severity: 'medium',
      type: 'review',
      read: false
    });
  };

  const handleDeleteContent = (id: string) => {
    const deletedTitle = contentPipeline.find(item => item.id === id)?.title || id;
    setContentPipeline(prev => prev.filter(item => item.id !== id));
    logAction('deleted', 'Content Draft', deletedTitle);
    if (isSupabaseConfigured) {
      deleteContentPipelineFromDb(id).then(err => { if (err) pushDbErrorNotification('Deleting content draft', err); });
    }
  };

  const handleApproveDraft = (id: string) => {
    // Synchronous ref-based guard -- see the comment on approvingDraftIds
    // above for why this replaces an earlier state-based check.
    if (approvingDraftIds.current.has(id)) return;
    approvingDraftIds.current.add(id);

    const alreadyPublished = contentPipeline.find(item => item.id === id)?.status === 'Published';
    if (alreadyPublished) {
      approvingDraftIds.current.delete(id);
      return;
    }

    let updatedItem: ContentPipelineItem | undefined;
    setContentPipeline(prev => prev.map(item => {
      if (item.id === id) {
        updatedItem = { ...item, status: 'Published', publishTimeMinutes: 4 };
        return updatedItem;
      }
      return item;
    }));

    if (isSupabaseConfigured && updatedItem) {
      updateContentPipelineInDb(updatedItem).then(err => { if (err) pushDbErrorNotification(`Content draft "${updatedItem!.title}"`, err); });
    }
    if (updatedItem) logAction('approved & published', 'Content Draft', updatedItem.title);

    // Approving a draft also creates a real, published ArticleItem from its
    // content so it actually shows up on the site (Announcements/Public
    // Hub only ever read from the articles list) -- see the plan's Priority
    // 2 notes for the history of why this specific step matters.
    if (updatedItem) {
      const capturedByName = updatedItem.capturedBy.split(' (')[0];
      const matchedUser = users.find(u => u.name === capturedByName);
      const newArticle: ArticleItem = buildArticleFromApprovedDraft(updatedItem, matchedUser?.avatar);
      setArticles(prev => [newArticle, ...prev]);
      if (isSupabaseConfigured) {
        createArticleInDb(newArticle).then(errorMsg => {
          // A "duplicate key" rejection here specifically means an article
          // with this exact ID was already successfully saved by an
          // earlier attempt (most likely a near-simultaneous double-click,
          // or two admins approving the same draft in different tabs at
          // nearly the same moment) -- the real publish already succeeded,
          // this second attempt was correctly and harmlessly rejected by
          // the database. Treating that as a scary "HIGH PRIORITY, data
          // will be lost" warning would be actively misleading, since
          // nothing was actually lost.
          if (errorMsg && /duplicate key/i.test(errorMsg)) {
            console.warn('Duplicate article publish attempt (harmless -- the original publish already succeeded):', errorMsg);
            return;
          }
          if (errorMsg) pushDbErrorNotification(`Publishing "${newArticle.title}" from Content Pipeline`, errorMsg);
        });
      }
    }

    pushNotification({
      id: `notif-${Date.now()}`,
      title: 'Draft Published in <10 Minutes',
      message: `SE IT Lead approved & published draft #${id} to insight.aviyana.lk. It now appears in Announcements.`,
      timestamp: 'Just now',
      severity: 'low',
      type: 'approval',
      read: false
    });
    playAlertChime();
    // Release the lock -- intentionally not in a .finally() on the async DB
    // calls above, since those are fire-and-forget; the lock's only job is
    // to block a second click within the same synchronous event, and that
    // window has passed by the time we get here.
    approvingDraftIds.current.delete(id);
  };

  const value: ContentContextValue = {
    articles, setArticles, milestones, setMilestones, csrImpacts, setCsrImpacts,
    voiceCuts, setVoiceCuts, factChecks, setFactChecks, contentPipeline, setContentPipeline,
    handleAddArticle, handleEditArticle, handleDeleteArticle, handleIncrementArticleViews,
    handleAddMilestone, handleEditMilestone, handleDeleteMilestone,
    handleAddCsrImpact, handleEditCsrImpact, handleDeleteCsrImpact,
    handleAddVoiceCut, handleEditVoiceCut, handleDeleteVoiceCut,
    handleAddFactCheck, handleEditFactCheck, handleDeleteFactCheck,
    handleAddContent, handleEditContent, handleDeleteContent, handleRequestChanges, handleApproveDraft
  };

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within a ContentProvider');
  return ctx;
}
