import React, { useEffect, useState, useRef } from "react";
import { Bell, Check, CheckCheck, UserPlus, Zap, Play, CheckCircle, XCircle, Plus, Trash2, Settings } from "lucide-react";
import { notificationsApi, Notification } from "../api/notifications";
import { membersApi } from "../api/members";

const typeIcon: Record<string, React.ReactNode> = {
  workflow_invite: <UserPlus className="h-4 w-4 text-purple-400" />,
  workflow_invite_sent: <UserPlus className="h-4 w-4 text-blue-400" />,
  workflow_invite_accepted: <CheckCircle className="h-4 w-4 text-emerald-400" />,
  workflow_invite_declined: <XCircle className="h-4 w-4 text-red-400" />,
  workflow_created: <Zap className="h-4 w-4 text-amber-400" />,
  workflow_run_started: <Play className="h-4 w-4 text-blue-400" />,
  workflow_success: <CheckCircle className="h-4 w-4 text-emerald-400" />,
  workflow_failed: <XCircle className="h-4 w-4 text-red-400" />,
  node_added: <Plus className="h-4 w-4 text-emerald-400" />,
  node_deleted: <Trash2 className="h-4 w-4 text-red-400" />,
  node_updated: <Settings className="h-4 w-4 text-blue-400" />,
};

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.list();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch {
      /* silently fail */
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silently fail */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* silently fail */ }
  };

  const handleAcceptInvite = async (n: Notification) => {
    const token = n.meta?.inviteToken;
    if (!token) return;
    setActionLoading(n.id);
    try {
      await membersApi.acceptInviteByToken(token);
      await handleMarkRead(n.id);
      fetchNotifications();
    } catch { /* silently fail */ }
    setActionLoading(null);
  };

  const handleDeclineInvite = async (n: Notification) => {
    const token = n.meta?.inviteToken;
    if (!token) return;
    setActionLoading(n.id);
    try {
      await membersApi.declineInviteByToken(token);
      await handleMarkRead(n.id);
      fetchNotifications();
    } catch { /* silently fail */ }
    setActionLoading(null);
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) handleMarkRead(n.id);
    if (n.relatedId && n.type !== "workflow_invite") {
      window.location.href = `/workflows/${n.relatedId}`;
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[28rem] bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-96">
            {loading && notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-500 animate-pulse">Loading...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet</div>
            )}
            {notifications.map((n) => {
              const isInvite = n.type === "workflow_invite" && !n.read && n.meta?.inviteToken;
              return (
                <div
                  key={n.id}
                  onClick={() => !isInvite && handleNotificationClick(n)}
                  className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.read ? "bg-purple-500/5" : ""
                    } ${!isInvite ? "cursor-pointer" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      {typeIcon[n.type] || <Bell className="h-4 w-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${!n.read ? "text-white" : "text-gray-300"}`}>{n.title}</p>
                        <span className="text-[10px] text-gray-600 shrink-0 ml-2">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                      {isInvite && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAcceptInvite(n); }}
                            disabled={actionLoading === n.id}
                            className="px-3 py-1 text-xs rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                          >
                            {actionLoading === n.id ? "..." : "Accept"}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeclineInvite(n); }}
                            disabled={actionLoading === n.id}
                            className="px-3 py-1 text-xs rounded-md bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all disabled:opacity-50"
                          >
                            {actionLoading === n.id ? "..." : "Decline"}
                          </button>
                        </div>
                      )}
                    </div>
                    {!n.read && !isInvite && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                        className="shrink-0 p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
