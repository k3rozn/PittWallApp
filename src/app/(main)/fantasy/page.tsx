"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Users, Star, Plus, ArrowRight } from "lucide-react";

interface FantasyLeague {
  _id: string;
  name: string;
  sport: string;
  members: { userId: string; totalPoints: number }[];
  currentRound: number;
  inviteCode: string;
}

export default function FantasyPage() {
  const [leagues, setLeagues] = useState<FantasyLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/fantasy/leagues")
      .then((r) => r.json())
      .then((d) => setLeagues(d.leagues || []))
      .finally(() => setLoading(false));
  }, []);

  async function createLeague() {
    if (!newLeagueName.trim()) return;
    const res = await fetch("/api/fantasy/leagues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newLeagueName }),
    });
    if (res.ok) {
      const d = await res.json();
      setLeagues((prev) => [d.league, ...prev]);
      setNewLeagueName("");
      setShowCreate(false);
    } else {
      const d = await res.json();
      setError(d.error || "Failed to create league");
    }
  }

  async function joinLeague() {
    if (!inviteCode.trim()) return;
    const res = await fetch("/api/fantasy/leagues/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: inviteCode.trim().toUpperCase() }),
    });
    if (res.ok) {
      const d = await res.json();
      setLeagues((prev) => [...prev, d.league]);
      setInviteCode("");
      setShowJoin(false);
    } else {
      const d = await res.json();
      setError(d.error || "Invalid invite code");
    }
  }

  return (
    <div className="page-enter max-w-4xl mx-auto">
      {/* Hero */}
      <div className="bg-gradient-to-br from-warning/10 via-surface to-background border-b border-border px-4 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center">
            <Trophy size={22} className="text-warning" />
          </div>
          <h1 className="text-2xl font-bold font-display">Fantasy</h1>
        </div>
        <p className="text-text-muted text-sm">
          Build your dream team. Compete with friends.
        </p>
      </div>

      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
            className="flex items-center gap-3 bg-surface border border-border hover:border-primary/30 rounded-xl p-4 transition-all"
          >
            <Plus size={20} className="text-primary" />
            <div className="text-left">
              <p className="text-sm font-semibold text-text-primary">Create League</p>
              <p className="text-xs text-text-muted">Start a new private league</p>
            </div>
          </button>
          <button
            onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}
            className="flex items-center gap-3 bg-surface border border-border hover:border-primary/30 rounded-xl p-4 transition-all"
          >
            <Users size={20} className="text-accent" />
            <div className="text-left">
              <p className="text-sm font-semibold text-text-primary">Join League</p>
              <p className="text-xs text-text-muted">Enter an invite code</p>
            </div>
          </button>
        </div>

        {/* Create League Form */}
        {showCreate && (
          <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-text-primary">New League</h3>
            <input
              type="text"
              placeholder="League name..."
              value={newLeagueName}
              onChange={(e) => setNewLeagueName(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
            <div className="flex gap-2">
              <button
                onClick={createLeague}
                className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="text-sm px-4 py-2 rounded-lg text-text-muted hover:text-text-secondary"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-live text-sm">{error}</p>}
          </div>
        )}

        {/* Join League Form */}
        {showJoin && (
          <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-text-primary">Join with Invite Code</h3>
            <input
              type="text"
              placeholder="XXXXXXXX"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary font-mono uppercase tracking-widest"
              maxLength={8}
            />
            <div className="flex gap-2">
              <button
                onClick={joinLeague}
                className="bg-accent text-white text-sm px-4 py-2 rounded-lg hover:bg-accent-dark transition-colors"
              >
                Join
              </button>
              <button
                onClick={() => setShowJoin(false)}
                className="text-sm px-4 py-2 rounded-lg text-text-muted hover:text-text-secondary"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-live text-sm">{error}</p>}
          </div>
        )}

        {/* My Leagues */}
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
            My Leagues
          </h2>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-surface rounded-xl" />
              ))}
            </div>
          ) : leagues.length === 0 ? (
            <div className="text-center py-12 bg-surface border border-border rounded-xl">
              <Star size={40} className="mx-auto mb-3 text-text-muted opacity-30" />
              <p className="text-text-secondary">No leagues yet</p>
              <p className="text-text-muted text-sm mt-1">
                Create a league or join one with an invite code
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leagues.map((league) => (
                <Link
                  key={league._id}
                  href={`/fantasy/leagues/${league._id}`}
                  className="card-hover flex items-center gap-4 bg-surface border border-border rounded-xl p-4"
                >
                  <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center shrink-0">
                    <Trophy size={20} className="text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary">{league.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-text-muted">
                        {league.members.length} members
                      </span>
                      <span className="text-xs text-text-muted">
                        Round {league.currentRound}
                      </span>
                      <span className="text-xs font-mono text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded">
                        {league.inviteCode}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-text-muted shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
