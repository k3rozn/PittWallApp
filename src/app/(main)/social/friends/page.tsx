"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { UserPlus, Check, X, Users2, UserCheck } from "lucide-react";

interface UserRef {
  _id: string;
  clerkId: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface FriendRequest {
  _id: string;
  senderId: UserRef;
  receiverId: UserRef;
  status: string;
}

interface FriendsData {
  friends: UserRef[];
  pendingReceived: FriendRequest[];
  pendingSent: FriendRequest[];
}

function Avatar({ user }: { user: UserRef }) {
  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-elevated shrink-0 flex items-center justify-center">
      {user.avatar ? (
        <Image src={user.avatar} alt={user.displayName} width={40} height={40} className="object-cover" />
      ) : (
        <span className="text-sm font-semibold text-text-secondary">
          {user.displayName[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
}

export default function FriendsPage() {
  const [data, setData] = useState<FriendsData>({ friends: [], pendingReceived: [], pendingSent: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"friends" | "requests" | "add">("friends");
  const [targetUsername, setTargetUsername] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    fetch("/api/social/friends")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  async function sendRequest() {
    if (!targetUsername.trim()) return;
    setSendStatus("sending");
    setSendError("");

    const res = await fetch("/api/social/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUsername: targetUsername.trim() }),
    });

    if (res.ok) {
      setSendStatus("sent");
      setTargetUsername("");
    } else {
      const data = await res.json();
      setSendStatus("error");
      setSendError(data.error || "Failed to send request");
    }
  }

  async function handleRequest(requestId: string, action: "accept" | "decline") {
    await fetch("/api/social/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    // Refresh
    const res = await fetch("/api/social/friends");
    const newData = await res.json();
    setData(newData);
  }

  async function removeFriend(friendId: string) {
    await fetch("/api/social/friends", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: friendId, action: "remove" }),
    });
    const res = await fetch("/api/social/friends");
    const newData = await res.json();
    setData(newData);
  }

  const pendingCount = data.pendingReceived.length;

  return (
    <div className="page-enter max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-4 lg:px-8 py-6 border-b border-border">
        <h1 className="text-2xl font-bold font-display">Friends</h1>
        <p className="text-sm text-text-muted mt-1">
          {data.friends.length} friends
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-4">
        <div className="flex gap-6">
          {[
            { id: "friends", label: "My Friends", icon: UserCheck },
            {
              id: "requests",
              label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ""}`,
              icon: Users2,
            },
            { id: "add", label: "Add Friend", icon: UserPlus },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6">
        {tab === "friends" && (
          <div className="space-y-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-surface rounded-xl animate-pulse" />
                ))}
              </div>
            ) : data.friends.length === 0 ? (
              <div className="text-center py-12">
                <Users2 size={48} className="mx-auto mb-3 text-text-muted opacity-30" />
                <p className="text-text-secondary font-medium">No friends yet</p>
                <p className="text-text-muted text-sm mt-1">
                  Use the &quot;Add Friend&quot; tab to find people
                </p>
              </div>
            ) : (
              data.friends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3"
                >
                  <Avatar user={friend} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      {friend.displayName}
                    </p>
                    <p className="text-xs text-text-muted">@{friend.username}</p>
                  </div>
                  <button
                    onClick={() => removeFriend(friend._id)}
                    className="text-xs text-text-muted hover:text-live border border-border hover:border-live/30 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "requests" && (
          <div className="space-y-4">
            {data.pendingReceived.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">
                  Received
                </h3>
                <div className="space-y-2">
                  {data.pendingReceived.map((req) => (
                    <div
                      key={req._id}
                      className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3"
                    >
                      <Avatar user={req.senderId} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary">
                          {req.senderId.displayName}
                        </p>
                        <p className="text-xs text-text-muted">@{req.senderId.username}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRequest(req._id, "accept")}
                          className="p-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-lg transition-colors"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleRequest(req._id, "decline")}
                          className="p-2 bg-live/10 text-live hover:bg-live/20 rounded-lg transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.pendingSent.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-text-secondary mb-2">Sent</h3>
                <div className="space-y-2">
                  {data.pendingSent.map((req) => (
                    <div
                      key={req._id}
                      className="flex items-center gap-3 bg-surface border border-border rounded-xl p-3"
                    >
                      <Avatar user={req.receiverId} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary">
                          {req.receiverId.displayName}
                        </p>
                        <p className="text-xs text-text-muted">@{req.receiverId.username}</p>
                      </div>
                      <span className="text-xs bg-warning/10 text-warning border border-warning/20 px-2 py-1 rounded">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.pendingReceived.length === 0 && data.pendingSent.length === 0 && (
              <div className="text-center py-12">
                <Users2 size={48} className="mx-auto mb-3 text-text-muted opacity-30" />
                <p className="text-text-secondary">No pending requests</p>
              </div>
            )}
          </div>
        )}

        {tab === "add" && (
          <div className="max-w-sm mx-auto">
            <div className="bg-surface border border-border rounded-xl p-6">
              <UserPlus size={40} className="mx-auto mb-4 text-primary" />
              <h3 className="text-center font-semibold text-text-primary mb-1">
                Add a Friend
              </h3>
              <p className="text-center text-sm text-text-muted mb-4">
                Enter their username to send a friend request
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="@username"
                  value={targetUsername}
                  onChange={(e) => {
                    setTargetUsername(e.target.value);
                    setSendStatus("idle");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && sendRequest()}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                />
                <button
                  onClick={sendRequest}
                  disabled={sendStatus === "sending" || !targetUsername.trim()}
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {sendStatus === "sending" ? "..." : "Send"}
                </button>
              </div>

              {sendStatus === "sent" && (
                <p className="text-accent text-sm mt-2 text-center flex items-center justify-center gap-1">
                  <Check size={14} /> Request sent!
                </p>
              )}
              {sendStatus === "error" && (
                <p className="text-live text-sm mt-2 text-center">{sendError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
