"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserRef {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface Conversation {
  _id: string;
  participants: UserRef[];
  lastMessage?: {
    content: string;
    senderId: string;
    sentAt: string;
  };
  unreadCounts?: Record<string, number>;
  updatedAt: string;
}

interface ConversationsData {
  conversations: Conversation[];
}

export default function ChatListPage() {
  const [data, setData] = useState<ConversationsData>({ conversations: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/social/chat")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-surface rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="page-enter max-w-2xl mx-auto">
      <div className="px-4 lg:px-8 py-6 border-b border-border">
        <h1 className="text-2xl font-bold font-display">Messages</h1>
      </div>

      {data.conversations.length === 0 ? (
        <div className="text-center py-20">
          <MessageCircle size={48} className="mx-auto mb-3 text-text-muted opacity-30" />
          <p className="text-text-secondary font-medium">No conversations yet</p>
          <p className="text-text-muted text-sm mt-1">
            Start a chat from your friends list
          </p>
          <Link
            href="/social/friends"
            className="mt-4 inline-block bg-primary text-white text-sm px-4 py-2 rounded-lg"
          >
            Go to Friends
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {data.conversations.map((conv) => {
            // Find the other participant (not current user)
            const other = conv.participants[0]; // simplified
            return (
              <Link
                key={conv._id}
                href={`/social/chat/${conv._id}`}
                className="flex items-center gap-3 px-4 py-4 hover:bg-surface transition-colors"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-elevated shrink-0 flex items-center justify-center">
                  {other?.avatar ? (
                    <Image
                      src={other.avatar}
                      alt={other.displayName}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  ) : (
                    <span className="font-semibold text-text-secondary">
                      {other?.displayName?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-text-primary">
                      {other?.displayName}
                    </p>
                    {conv.lastMessage && (
                      <span className="text-xs text-text-muted">
                        {formatDistanceToNow(new Date(conv.lastMessage.sentAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted truncate">
                    {conv.lastMessage?.content || "No messages yet"}
                  </p>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
