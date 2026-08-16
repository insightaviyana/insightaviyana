import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Star, 
  ArrowUpRight, 
  Sparkles, 
  Send, 
  Search, 
  Bot, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Video,
  Layout,
  BarChart3,
  Users,
  MessageSquare,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { User, ContentPipelineItem, ArticleItem, PublicInquiry, NotificationItem, FactCheckItem } from '../types';

interface DashboardViewProps {
  currentUser: User;
  users: User[];
  onNavigateTab: (tab: string) => void;
  onOpenProfileModal: () => void;
  contentPipeline: ContentPipelineItem[];
  articles: ArticleItem[];
  factChecks?: FactCheckItem[];
  inquiries: PublicInquiry[];
  notifications: NotificationItem[];
  onApproveDraft: (id: string) => void;
  onApproveFactCheck?: (item: FactCheckItem) => void;
  isAdmin?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  users,
  onNavigateTab,
  onOpenProfileModal,
  contentPipeline,
  articles,
  factChecks = [],
  inquiries,
  notifications,
  isAdmin = currentUser.accountType === 'admin',
  onApproveDraft,
  onApproveFactCheck
}) => {
  const [activeDashboardSubTab, setActiveDashboardSubTab] = useState<'overview' | 'metrics'>('overview');

  // All figures below are computed live from real app state (contentPipeline,
  // articles, inquiries, users) -- no fabricated numbers. Previously this
  // whole Overview + Metrics section used hardcoded mock arrays (fake SERP
  // rank data, a fake "89% Brand Sentiment", a fake "8.4 min SLA", fake
  // 8-month growth trends that never happened) presented as if real, with
  // no indication most of it wasn't. There's no real Search Console, review
  // aggregation, or sentiment-analysis integration connected -- rather than
  // keep showing invented numbers for those (even labeled "demo"), this
  // section now only shows metrics this app can actually, honestly compute.
  const publishedArticlesCount = articles.filter(a => a.status === 'Published').length;
  const pendingApprovalsCount =
    contentPipeline.filter(c => c.status === 'Pending SE Approval').length +
    articles.filter(a => a.status === 'In Review').length +
    factChecks.filter(f => f.approvalStatus === 'Pending Approval').length;
  const totalInquiriesCount = inquiries.length;
  const activeStaffCount = users.filter(u => u.accountType === 'admin' || u.accountType === 'staff').length;

  const pipelineStatusData = [
    { status: 'Published', count: contentPipeline.filter(c => c.status === 'Published').length, fill: '#10b981' },
    { status: 'Pending Approval', count: contentPipeline.filter(c => c.status === 'Pending SE Approval').length, fill: '#d97706' },
    { status: 'Needs Revision', count: contentPipeline.filter(c => c.status === 'Needs Revision').length, fill: '#ef4444' },
    { status: 'Draft', count: contentPipeline.filter(c => c.status === 'Draft Captured').length, fill: '#64748b' }
  ];

  const inquiriesByCategoryData = (() => {
    const counts: Record<string, number> = {};
    for (const inq of inquiries) counts[inq.category] = (counts[inq.category] || 0) + 1;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444', '#06b6d4'];
    return Object.entries(counts).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
  })();

  const contentByStaffData = (() => {
    const counts: Record<string, number> = {};
    for (const c of contentPipeline) counts[c.capturedBy] = (counts[c.capturedBy] || 0) + 1;
    return Object.entries(counts)
      .map(([name, count]) => ({ name: name.split(' (')[0], count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  })();

  const pendingDrafts = contentPipeline.filter(c => c.status === 'Pending SE Approval');

  return (
    <div id="dashboard-root" className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-8 pb-20">
      
      {/* Role-Tailored Operational Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-14 h-14 rounded-xl object-cover border-2 border-amber-400 shadow-md shrink-0" 
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {currentUser.role.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400">insight.aviyana.lk Operational Console</span>
              </div>
              <h1 className="text-2xl font-serif font-bold text-white mt-1">
                Welcome back, {currentUser.name}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                Primary Goal: <strong className="text-amber-300 font-semibold">{currentUser.title}</strong> — Maintaining Ceylon reputation through facts and transparent storytelling.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => isAdmin ? onNavigateTab('user-management') : onOpenProfileModal()}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-lg flex items-center space-x-2 border border-amber-400/40"
            >
              <Users size={16} />
              <span>{isAdmin ? `Manage Team Accounts (${users.length})` : 'Edit My Profile'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('ai-assistant')}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center space-x-2"
            >
              <Bot size={16} />
              <span>Launch Gemini PR AI</span>
            </button>

            <button
              onClick={() => onNavigateTab('pipeline')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold rounded-xl text-xs transition-all flex items-center space-x-2"
            >
              <Send size={15} />
              <span>Pending Drafts ({pendingDrafts.length})</span>
            </button>
          </div>
        </div>

        {/* Dashboard Sub-tab Switcher: Overview vs Performance Metrics */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center space-x-3">
          <button
            onClick={() => setActiveDashboardSubTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeDashboardSubTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Layout size={15} />
            <span>Operational Console & Overview</span>
          </button>

          <button
            onClick={() => setActiveDashboardSubTab('metrics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeDashboardSubTab === 'metrics'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BarChart3 size={15} />
            <span>Performance Metrics (Recharts)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono">
              Live
            </span>
          </button>
        </div>
      </div>

      {/* ADMIN-ONLY EXECUTIVE SUMMARY -- only admins see this panel. Real
          numbers only, no mock data: staff roster breakdown, everything
          currently awaiting an admin's approval across the whole app, and
          the most recent high-severity notifications. */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck size={16} />
            <span>Admin-Only Executive Summary</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-serif font-bold text-white">{users.length}</div>
              <div className="text-[11px] text-slate-400">
                Total accounts ({users.filter(u => u.accountType === 'admin').length} admin, {users.filter(u => u.accountType === 'staff').length} staff, {users.filter(u => u.accountType === 'guest').length} guest)
              </div>
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-white">
                {pendingApprovalsCount}
              </div>
              <div className="text-[11px] text-slate-400">Waiting on your approval right now</div>
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-white">{contentPipeline.filter(c => c.status === 'Needs Revision').length}</div>
              <div className="text-[11px] text-slate-400">Sent back for edits, not yet resubmitted</div>
            </div>
            <div>
              <div className="text-2xl font-serif font-bold text-white">{notifications.filter(n => n.severity === 'high' && !n.read).length}</div>
              <div className="text-[11px] text-slate-400">Unread high-severity notifications</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-amber-500/20">
            <button
              onClick={() => onNavigateTab('user-management')}
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-all"
            >
              Manage User Accounts
            </button>
            <button
              onClick={() => onNavigateTab('activity-log')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition-all"
            >
              View Full Activity Log
            </button>
          </div>
        </div>
      )}

      {/* OVERVIEW SUB-TAB VIEW */}
      {activeDashboardSubTab === 'overview' && (
        <>
          {/* Live Team Profiles Banner */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <Users size={18} className="text-amber-400" />
                  <h3 className="font-serif font-bold text-base text-white">
                    Ceylon Executive & Operations Personnel Directory
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {users.length > 0
                    ? 'Live accounts from the database. Click a profile, or use "Manage" for full account control.'
                    : 'No real accounts yet — add staff through User Management to populate this directory.'}
                </p>
              </div>

              <button
                onClick={() => isAdmin ? onNavigateTab('user-management') : onOpenProfileModal()}
                className="self-start sm:self-auto px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/40 font-bold rounded-xl text-xs transition-all flex items-center space-x-1.5"
              >
                <FileEdit size={14} />
                <span>{isAdmin ? 'Manage & Edit Accounts' : 'Edit My Profile'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {users.map((u) => {
                const isCurrent = currentUser.id === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => isCurrent ? onOpenProfileModal() : (isAdmin ? onNavigateTab('user-management') : undefined)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] ${
                      isCurrent
                        ? 'bg-amber-950/40 border-amber-400 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-10 h-10 rounded-xl object-cover border border-amber-400/60 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{u.name}</h4>
                          {isCurrent && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500 text-slate-950 font-bold shrink-0">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-amber-300/90 font-medium truncate">{u.title}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{u.email}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KPI Cards Grid -- all real, computed from live app state */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Published Articles</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileText size={18} />
                </div>
              </div>
              <div className="mt-3 text-3xl font-serif font-bold text-white">{publishedArticlesCount}</div>
              <div className="text-[11px] text-emerald-400 font-medium mt-1">Live on insight.aviyana.lk</div>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Awaiting Approval</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Clock size={18} />
                </div>
              </div>
              <div className="mt-3 text-3xl font-serif font-bold text-white">{pendingApprovalsCount}</div>
              <div className="text-[11px] text-amber-300 font-medium mt-1">Articles + content drafts combined</div>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Inquiries</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <MessageSquare size={18} />
                </div>
              </div>
              <div className="mt-3 text-3xl font-serif font-bold text-white">{totalInquiriesCount}</div>
              <div className="text-[11px] text-blue-300 font-medium mt-1">Received via public inquiry desk</div>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Active Staff</span>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Users size={18} />
                </div>
              </div>
              <div className="mt-3 text-3xl font-serif font-bold text-white">{activeStaffCount}</div>
              <div className="text-[11px] text-purple-300 font-medium mt-1">Staff & admin accounts</div>
            </div>

          </div>

          {/* Data Visualizations Section -- real breakdowns, not fabricated
              trend data. No live SERP/sentiment/review API is connected to
              this app, so charts that would need that data are simply not
              shown here rather than filled in with invented numbers. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">Content Pipeline Status</h3>
                  <p className="text-xs text-slate-400">Real-time breakdown of every draft currently in the pipeline</p>
                </div>
              </div>
              {contentPipeline.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-16">No content pipeline items yet.</p>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineStatusData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="status" stroke="#94a3b8" fontSize={10} />
                      <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#d97706', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="count" name="Drafts" radius={[4, 4, 0, 0]}>
                        {pipelineStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-white">Inquiries by Category</h3>
                  <p className="text-xs text-slate-400">Real breakdown of every public inquiry ever received</p>
                </div>
              </div>
              {inquiriesByCategoryData.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-16">No inquiries received yet.</p>
              ) : (
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={inquiriesByCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ value }) => `${value}`}
                      >
                        {inquiriesByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#10b981', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>
        </>
      )}

      {/* DEDICATED PERFORMANCE METRICS SUB-TAB VIEW -- real data only */}
      {activeDashboardSubTab === 'metrics' && (
        <div className="space-y-8 animate-fadeIn">

          {/* Performance Metrics Header Banner */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono uppercase font-bold mb-1">
                <BarChart3 size={16} />
                <span>Real Operational Metrics</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-white">
                Team Activity & Content Breakdown
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Computed live from actual content pipeline and inquiry records -- no projected or simulated growth data.
              </p>
            </div>
          </div>

          {/* RECHART: CONTENT BY TEAM MEMBER */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                  <Send size={18} className="text-blue-400" />
                  Content Captured by Team Member
                </h3>
                <p className="text-xs text-slate-400">
                  Real count of content pipeline drafts captured by each staff member
                </p>
              </div>
            </div>

            {contentByStaffData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-16">No content pipeline activity yet.</p>
            ) : (
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contentByStaffData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" allowDecimals={false} stroke="#94a3b8" fontSize={11} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={110} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#3b82f6', borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="count" name="Drafts Captured" fill="#d97706" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Pending Approval Table for SE Lead */}
      <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-white">Daily Operational Pipeline Queue</h3>
            <p className="text-xs text-slate-400">Content captured by Hotel School Crew awaiting SE IT Lead approval</p>
          </div>
          <button
            onClick={() => onNavigateTab('pipeline')}
            className="text-xs font-semibold text-amber-300 hover:underline flex items-center gap-1"
          >
            <span>View Full Pipeline</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {/* Only items still awaiting approval belong in this queue -- this
            used to list every pipeline item regardless of status, which made
            already-approved drafts look like they kept coming back for
            re-approval after a refresh. */}
        <div className="space-y-3">
          {contentPipeline.filter(cp => cp.status === 'Pending SE Approval').length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">Nothing pending — the queue is clear.</p>
          )}
          {contentPipeline.filter(cp => cp.status === 'Pending SE Approval').map((cp) => (
            <div key={cp.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <img src={cp.mediaPreviewUrl} alt="Content pipeline media preview" className="w-16 h-16 rounded-lg object-cover border border-slate-700 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      cp.status === 'Published' 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}>
                      {cp.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{cp.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">{cp.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{cp.notes}</p>
                  <div className="text-[10px] text-amber-300/80 mt-1 font-mono">By: {cp.capturedBy}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {cp.status === 'Pending SE Approval' && isAdmin && (
                  <button
                    onClick={() => onApproveDraft(cp.id)}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center space-x-1.5 shadow-md"
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve & Publish (&lt;10 min)</span>
                  </button>
                )}

                <button
                  onClick={() => onNavigateTab('ai-assistant')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                >
                  <Bot size={14} />
                  <span>AI Caption</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Fact-Checks -- previously invisible from the Dashboard:
          staff-submitted fact-checks go into their own approval queue
          (fact_checks.approval_status), completely separate from
          content_pipeline, so admins checking this page for "what needs my
          approval" never saw them here, and a staff member had no way to
          confirm from the Dashboard that their submission actually landed
          somewhere. Surfacing them here (in addition to the Fact-Check &
          FAQ tab's own "Pending Approval" tab, which still exists and still
          works) gives one place to see everything waiting on approval. */}
      {factChecks.filter(f => f.approvalStatus === 'Pending Approval').length > 0 && (
        <div className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-white">Pending Fact-Checks</h3>
              <p className="text-xs text-slate-400">Submitted by staff, awaiting admin approval before publishing</p>
            </div>
            <button
              onClick={() => onNavigateTab('faq')}
              className="text-xs font-semibold text-amber-300 hover:underline flex items-center gap-1"
            >
              <span>View Fact-Check Tab</span>
              <ExternalLink size={12} />
            </button>
          </div>

          <div className="space-y-3">
            {factChecks.filter(f => f.approvalStatus === 'Pending Approval').map((fc) => (
              <div key={fc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                      {fc.category}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{fc.verifiedDate}</span>
                  </div>
                  <h4 className="text-sm font-bold text-red-200 line-through opacity-80 mt-1">{fc.rumor}</h4>
                  <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{fc.fact}</p>
                  {fc.createdBy && <div className="text-[10px] text-amber-300/80 mt-1 font-mono">By: {fc.createdBy}</div>}
                </div>

                {isAdmin && onApproveFactCheck && (
                  <button
                    onClick={() => onApproveFactCheck({ ...fc, approvalStatus: 'Published' })}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center space-x-1.5 shadow-md shrink-0"
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve & Publish</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs Revision -- these were previously invisible on the Dashboard
          entirely (only the full Content Pipeline tab showed them), so a
          sent-back-for-edits draft could easily be forgotten. */}
      {contentPipeline.some(cp => cp.status === 'Needs Revision') && (
        <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-6">
          <h3 className="font-serif font-bold text-lg text-white mb-3">Sent Back for Edits</h3>
          <div className="space-y-2">
            {contentPipeline
              .filter(cp => cp.status === 'Needs Revision')
              .slice(0, 8)
              .map(cp => (
                <div key={cp.id} className="p-3 rounded-xl bg-slate-950 border border-red-500/20">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-xs font-bold text-white truncate">{cp.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-red-950 text-red-300 border border-red-500/30 shrink-0">
                      Needs Revision
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cp.date} · By {cp.capturedBy}</div>
                  {cp.revisionNote && <p className="text-[11px] text-red-300 mt-1.5">{cp.revisionNote}</p>}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recently Published — separate from the pending queue above, so
          approved drafts stay visible/checkable somewhere instead of just
          disappearing once approved. */}
      {contentPipeline.some(cp => cp.status === 'Published') && (
        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-6">
          <h3 className="font-serif font-bold text-lg text-white mb-3">Recently Published</h3>
          <div className="space-y-2">
            {contentPipeline
              .filter(cp => cp.status === 'Published')
              .slice(0, 8)
              .map(cp => (
                <div key={cp.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{cp.title}</h4>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cp.date} · By {cp.capturedBy}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 shrink-0">
                    Published
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

    </div>
  );
};
