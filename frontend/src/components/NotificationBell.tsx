import React, { useEffect, useState, useRef } from "react";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { notificationsApi, Notification } from "../api/notifications";
import { membersApi } from "../api/members";

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.list();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
    if (!n.relatedId) return;
    try {
      // relatedId format: workflowId:memberId
      const [workflowId, memberId] = n.relatedId.split(":");
      if (workflowId && memberId) {
        await membersApi.acceptInvite(workflowId, memberId);
        await handleMarkRead(n.id);
        fetchNotifications();
      }
    } catch { /* silently fail */ }
  };

  const handleDeclineInvite = async (n: Notification) => {
    if (!n.relatedId) return;
    try {
      const [workflowId, memberId] = n.relatedId.split(":");
      if (workflowId && memberId) {
        await membersApi.declineInvite(workflowId, memberId);
        await handleMarkRead(n.id);
        fetchNotifications();
      }
    } catch { /* silently fail */ }
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
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
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

          <div className="overflow-y-auto max-h-72">
            {loading && notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-500 animate-pulse">Loading...</div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No notifications yet
              </div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                  !n.read ? "bg-purple-500/5" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <div className="w-2 h-2 mt-1.5 rounded-full bg-purple-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                    <div className="text-xs text-gray-600 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                    {n.type === "workflow_invite" && !n.read && n.relatedId && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleAcceptInvite(n)}
                          className="px-3 py-1 text-xs rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(n)}
                          className="px-3 py-1 text-xs rounded-md bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-all"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                  {!n.read && n.type !== "workflow_invite" && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="shrink-0 p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
