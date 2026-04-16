"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Trophy, Copy, Check, Users, Star } from "lucide-react";

interface Member {
  userId: { _id: string; username: string; displayName: string; avatar?: string };
  totalPoints: number;
  rank?: number;
}

interface FantasyTeamData {
  _id: string;
  name: string;
  totalPoints: number;
  formation: string;
}

interface LeagueData {
  _id: string;
  name: string;
  sport: string;
  inviteCode: string;
  currentRound: number;
  competitionName?: string;
  members: Member[];
  settings: { budget: number; maxPlayersPerClub: number; squadSize: number };
}

export default function FantasyLeaguePage() {
  const { id } = useParams<{ id: string }>();
  const [league, setLeague] = useState<LeagueData | null>(null);
  const [myTeam, setMyTeam] = useState<FantasyTeamData | null>(null);
  const [teams, setTeams] = useState<FantasyTeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [tab, setTab] = useState<"standings" | "my-team">("standings");

  useEffect(() => {
    fetch(`/api/fantasy/leagues/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setLeague(d.league);
        setMyTeam(d.myTeam);
        setTeams(d.teams || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function copyCode() {
    if (!league) return;
    navigator.clipboard.writeText(league.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  // Sort members by totalPoints
  const ranking = league
    ? [...league.members].sort((a, b) => b.totalPoints - a.totalPoints)
    : [];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-8 rounded w-64" style={{ background: "var(--color-surface)" }} />
        <div className="h-40 rounded-xl" style={{ background: "var(--color-surface)" }} />
      </div>
    );
  }
  if (!league) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p style={{ color: "var(--color-text-secondary)" }}>League not found</p>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-4 lg:px-8 py-6 border-b" style={{ borderColor: "var(--color-border)", background: "linear-gradient(to bottom, var(--color-surface), var(--color-background))" }}>
        <Link href="/fantasy" className="inline-flex items-center gap-2 text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} /> Fantasy Leagues
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,158,11,0.2)" }}>
                <Trophy size={16} style={{ color: "var(--color-warning)" }} />
              </div>
              <h1 className="text-xl font-bold font-display">{league.name}</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                <Users size={13} className="inline mr-1" />{league.members.length} members
              </span>
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Round {league.currentRound}
              </span>
            </div>
          </div>

          {/* Invite Code */}
          <button
            onClick={copyCode}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-mono transition-all"
            style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}
          >
            {copiedCode ? <Check size={14} style={{ color: "var(--color-accent)" }} /> : <Copy size={14} />}
            {league.inviteCode}
          </button>
        </div>
      </div>

      {/* My Team Summary */}
      {myTeam && (
        <div className="mx-4 lg:mx-8 mt-4">
          <Link
            href={`/fantasy/leagues/${id}/team`}
            className="card-hover flex items-center gap-4 rounded-xl border p-4 transition-all"
            style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.05))", borderColor: "rgba(59,130,246,0.2)" }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}>
              <Star size={22} style={{ color: "var(--color-primary)" }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{myTeam.name}</p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{myTeam.formation} · Manage Team →</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-display" style={{ color: "var(--color-primary)" }}>{myTeam.totalPoints}</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>pts total</p>
            </div>
          </Link>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b mt-4 px-4" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex gap-6">
          {[
            { id: "standings", label: "Standings" },
            { id: "my-team", label: "My Team" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className="py-3 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderBottomColor: tab === t.id ? "var(--color-primary)" : "transparent",
                color: tab === t.id ? "var(--color-primary)" : "var(--color-text-muted)"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6">
        {tab === "standings" && (
          <div className="rounded-xl border overflow-hidden" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            {/* Header row */}
            <div className="grid grid-cols-12 px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)", background: "var(--color-surface-elevated)" }}>
              <div className="col-span-1">#</div>
              <div className="col-span-8">Team</div>
              <div className="col-span-3 text-right">Pts</div>
            </div>

            {ranking.map((member, idx) => {
              const team = teams.find((t) => {
                const tUserId = typeof t === "object" && "userId" in t ? (t as unknown as { userId: { _id: string } }).userId?._id : null;
                const mUserId = typeof member.userId === "object" ? member.userId._id : member.userId;
                return tUserId === mUserId;
              });
              const isMe = false; // Would compare with current user

              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 px-4 py-3 border-t items-center"
                  style={{
                    borderColor: "var(--color-border)",
                    background: isMe ? "rgba(59,130,246,0.05)" : undefined,
                  }}
                >
                  <div className="col-span-1">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background:
                          idx === 0 ? "rgba(245,158,11,0.2)" :
                          idx === 1 ? "rgba(156,163,175,0.2)" :
                          idx === 2 ? "rgba(180,120,60,0.2)" :
                          "var(--color-surface-elevated)",
                        color:
                          idx === 0 ? "var(--color-warning)" :
                          idx === 1 ? "#9ca3af" :
                          "#b47c3c",
                        display: "inline-flex",
                      }}
                    >
                      {idx + 1}
                    </span>
                  </div>

                  <div className="col-span-8 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--color-surface-elevated)" }}>
                      {member.userId?.avatar ? (
                        <Image src={member.userId.avatar} alt="" width={32} height={32} className="object-cover" />
                      ) : (
                        <span className="text-xs font-bold" style={{ color: "var(--color-text-muted)" }}>
                          {member.userId?.displayName?.[0] || "?"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                        {team?.name || member.userId?.displayName || "Unknown"}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                        @{member.userId?.username || "?"}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3 text-right">
                    <span className="font-bold font-display text-lg" style={{ color: "var(--color-primary)" }}>
                      {member.totalPoints}
                    </span>
                    <span className="text-xs ml-1" style={{ color: "var(--color-text-muted)" }}>pts</span>
                  </div>
                </div>
              );
            })}

            {ranking.length === 0 && (
              <div className="py-12 text-center" style={{ color: "var(--color-text-muted)" }}>
                No members yet
              </div>
            )}
          </div>
        )}

        {tab === "my-team" && (
          <div className="text-center py-8">
            <Link
              href={`/fantasy/leagues/${id}/team`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all"
              style={{ background: "var(--color-primary)" }}
            >
              <Star size={18} /> Manage My Team
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
