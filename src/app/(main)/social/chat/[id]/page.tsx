"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function useSafeUsername(): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useUser } = require("@clerk/nextjs");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { user } = useUser();
    return user?.username ?? null;
  } catch {
    return null;
  }
}

interface MessageSender {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface Message {
  _id: string;
  senderId: MessageSender;
  content: string;
  sentAt: string;
  readBy?: { userId: string; readAt: string }[];
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const currentUsername = useSafeUsername();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout>(null);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/social/chat/${id}/messages`);
    const data = await res.json();
    setMessages(data.messages || []);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [id]);

  useEffect(() => {
    fetchMessages();
    // Poll for new messages (slowed down for local dev to avoid spam)
    pollRef.current = setInterval(fetchMessages, 60000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  async function sendMessage() {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/social/chat/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      if (res.ok) {
        setContent("");
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface shrink-0">
        <Link href="/social/chat" className="text-text-muted hover:text-text-primary">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-semibold text-text-primary">Conversation</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="text-center py-8 text-text-muted">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId.username === currentUsername;
            return (
              <div
                key={msg._id}
                className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-elevated shrink-0 flex items-center justify-center">
                  {msg.senderId.avatar ? (
                    <Image
                      src={msg.senderId.avatar}
                      alt={msg.senderId.displayName}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-text-secondary">
                      {msg.senderId.displayName?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className={`flex flex-col max-w-xs lg:max-w-md ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm ${
                      isMe
                        ? "bg-primary text-white rounded-tr-sm"
                        : "bg-surface-elevated text-text-primary rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-xs text-text-muted mt-1">
                    {formatDistanceToNow(new Date(msg.sentAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border bg-surface">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
          />
          <button
            onClick={sendMessage}
            disabled={!content.trim() || sending}
            className="w-9 h-9 bg-primary hover:bg-primary-dark rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
