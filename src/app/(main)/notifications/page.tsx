"use client";

import { useState, useEffect } from "react";
import { Bell, Check, UserPlus, MessageCircle, Trophy, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  friend_request: UserPlus,
  friend_accepted: UserPlus,
  new_message: MessageCircle,
  event_start: Bell,
  event_incident: Bell,
  fantasy_update: Trophy,
  fantasy_points: Star,
};

const TYPE_COLORS: Record<string, string> = {
  friend_request: "text-primary bg-primary/10",
  friend_accepted: "text-accent bg-accent/10",
  new_message: "text-primary bg-primary/10",
  event_start: "text-warning bg-warning/10",
  event_incident: "text-live bg-live/10",
  fantasy_update: "text-warning bg-warning/10",
  fantasy_points: "text-accent bg-accent/10",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/social/notifications?limit=50")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  async function markAllRead() {
    await fetch("/api/social/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  async function markRead(id: string) {
    await fetch("/api/social/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  return (
    <div className="page-enter max-w-2xl mx-auto">
      <div className="px-4 lg:px-8 py-6 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-text-muted mt-0.5">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-glow transition-colors"
          >
            <Check size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          <div className="space-y-1 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-surface rounded-xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={48} className="mx-auto mb-3 text-text-muted opacity-30" />
            <p className="text-text-secondary">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] || Bell;
            const colorClass = TYPE_COLORS[n.type] || "text-text-muted bg-surface-elevated";

            return (
              <button
                key={n._id}
                onClick={() => !n.read && markRead(n._id)}
                className={`w-full flex items-start gap-3 px-4 py-4 hover:bg-surface transition-colors text-left ${
                  !n.read ? "bg-primary/5" : ""
                }`}
              >
                <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${colorClass}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      n.read ? "text-text-secondary" : "text-text-primary"
                    }`}
                  >
                    {n.title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                    {n.body}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
