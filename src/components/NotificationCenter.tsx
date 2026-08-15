import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Send, 
  Search, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCheck,
  Zap,
  ExternalLink
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSimulateAlert: () => void;
  onActionClick: (notif: NotificationItem) => void;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onSimulateAlert,
  onActionClick,
  audioEnabled,
  setAudioEnabled
}) => {
  const [filter, setFilter] = useState<'all' | 'high' | 'unread'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'high') return n.severity === 'high';
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-500/40">HIGH PRIORITY</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">INFO</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mention': return <MessageSquare className="text-red-400" size={16} />;
      case 'approval': return <Send className="text-amber-400" size={16} />;
      case 'review': return <CheckCircle2 className="text-emerald-400" size={16} />;
      case 'serp': return <Search className="text-blue-400" size={16} />;
      default: return <Bell className="text-slate-400" size={16} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-950/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl w-full max-w-md p-5 text-slate-100 shadow-2xl relative my-auto sm:my-0">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                Realtime Alert Center
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <p className="text-[11px] text-slate-400">Google My Business, Social & SERP Monitoring</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Controls & Sound Toggle */}
        <div className="py-3 flex items-center justify-between border-b border-slate-800/80 text-xs">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${filter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${filter === 'unread' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              Unread ({notifications.filter(n => !n.read).length})
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${filter === 'high' ? 'bg-red-500 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              High Priority
            </button>
          </div>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-amber-300"
            title="Toggle Notification Sound"
          >
            {audioEnabled ? <Volume2 size={15} className="text-amber-400" /> : <VolumeX size={15} />}
          </button>
        </div>

        {/* Live Simulation Button */}
        <div className="my-3">
          <button
            onClick={onSimulateAlert}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all hover:bg-amber-500/30"
          >
            <Zap size={14} className="text-amber-400 animate-bounce" />
            <span>Simulate Realtime Mention / Alert Trigger</span>
          </button>
        </div>

        {/* Notification List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <CheckCheck size={28} className="mx-auto mb-2 text-slate-600" />
              <span>No notifications matching current filter.</span>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-xl border transition-all ${
                  notif.read 
                    ? 'bg-slate-950/40 border-slate-800 opacity-75' 
                    : 'bg-slate-950 border-amber-500/30 shadow-md shadow-amber-500/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(notif.type)}
                    <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                  </div>
                  {getSeverityBadge(notif.severity)}
                </div>

                <p className="text-xs text-slate-300 my-2 leading-relaxed">
                  {notif.message}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
                  <span className="font-mono">{notif.timestamp}</span>

                  <div className="flex items-center space-x-2">
                    {notif.actionRequired && (
                      <button
                        onClick={() => {
                          onActionClick(notif);
                          onMarkRead(notif.id);
                          onClose();
                        }}
                        className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 font-bold transition-all flex items-center gap-1"
                      >
                        <span>{notif.actionRequired}</span>
                        <ExternalLink size={10} />
                      </button>
                    )}

                    {!notif.read && (
                      <button
                        onClick={() => onMarkRead(notif.id)}
                        className="text-slate-400 hover:text-white"
                        title="Mark as Read"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{notifications.filter(n => !n.read).length} unread alerts</span>
          <button
            onClick={onMarkAllRead}
            className="text-amber-300 hover:underline text-xs font-medium"
          >
            Mark All as Read
          </button>
        </div>

      </div>
    </div>
  );
};
