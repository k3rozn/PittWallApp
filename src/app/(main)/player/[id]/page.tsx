"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Flag, Ruler, Weight, Trophy, Star } from "lucide-react";

interface PlayerData {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  sport: string;
  position?: string;
  nationality?: string;
  dateBorn?: string;
  height?: string;
  weight?: string;
  number?: string;
  thumb?: string;
  description?: string;
  status?: string;
  honours?: { strHonour: string; strSeason: string; strTeam: string }[];
  formerTeams?: { strFormerTeam: string; strMoveType: string; dateSigned: string; dateContractEnd: string }[];
}

const POSITION_COLORS: Record<string, string> = {
  GK: "bg-warning/20 text-warning border-warning/30",
  DEF: "bg-accent/20 text-accent border-accent/30",
  MID: "bg-primary/20 text-primary border-primary/30",
  FWD: "bg-live/20 text-live border-live/30",
};

function age(dateBorn?: string) {
  if (!dateBorn) return null;
  const birth = new Date(dateBorn);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) age--;
  return age;
}

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sports/players/${id}`)
      .then((r) => r.json())
      .then((d) => setPlayer(d.player))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse p-8 max-w-3xl mx-auto">
        <div className="flex gap-6 mb-6">
          <div className="w-28 h-28 bg-surface rounded-2xl" />
          <div className="flex-1 space-y-3">
            <div className="h-7 bg-surface rounded w-48" />
            <div className="h-4 bg-surface rounded w-32" />
            <div className="h-4 bg-surface rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-[--color-text-secondary]">Player not found</p>
          <Link href="/" className="text-[--color-primary] text-sm mt-2 inline-block">← Back</Link>
        </div>
      </div>
    );
  }

  const playerAge = age(player.dateBorn);
  const posColor = POSITION_COLORS[player.position?.toUpperCase() || ""] || "bg-surface-elevated text-[--color-text-muted]";

  return (
    <div className="page-enter max-w-3xl mx-auto">
      {/* Header */}
      <div
        className="relative px-4 lg:px-8 py-8 border-b"
        style={{ borderColor: "var(--color-border)", background: "linear-gradient(to bottom, var(--color-surface), var(--color-background))" }}
      >
        <Link href={player.teamId ? `/team/${player.teamId}` : "/"} className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} /> {player.teamName || "Back"}
        </Link>

        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-2xl overflow-hidden shrink-0" style={{ background: "var(--color-surface-elevated)" }}>
            {player.thumb ? (
              <Image src={player.thumb} alt={player.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold" style={{ color: "var(--color-text-muted)" }}>
                {player.number || player.name?.[0]}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {player.position && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${posColor}`}>
                  {player.position}
                </span>
              )}
              {player.number && (
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}>
                  #{player.number}
                </span>
              )}
              {player.status && player.status !== "Active" && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "var(--color-live)", color: "white" }}>
                  {player.status}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>{player.name}</h1>

            <Link href={`/team/${player.teamId}`} className="text-sm font-medium hover:underline mt-0.5 inline-block" style={{ color: "var(--color-primary)" }}>
              {player.teamName}
            </Link>

            {/* Quick stats row */}
            <div className="flex flex-wrap gap-4 mt-3">
              {player.nationality && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  <Flag size={13} />
                  <span>{player.nationality}</span>
                </div>
              )}
              {playerAge && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  <Calendar size={13} />
                  <span>{playerAge} years old</span>
                </div>
              )}
              {player.height && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  <Ruler size={13} />
                  <span>{player.height}</span>
                </div>
              )}
              {player.weight && (
                <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
                  <Weight size={13} />
                  <span>{player.weight}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-8 py-6 space-y-4">
        {/* Bio */}
        {player.description && (
          <div className="rounded-xl border p-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>Biography</h3>
            <p className="text-sm leading-relaxed line-clamp-6" style={{ color: "var(--color-text-secondary)" }}>
              {player.description}
            </p>
          </div>
        )}

        {/* Honours */}
        {player.honours && player.honours.length > 0 && (
          <div className="rounded-xl border p-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--color-text-secondary)" }}>
              <Trophy size={14} style={{ color: "var(--color-warning)" }} /> Honours
            </h3>
            <div className="space-y-2">
              {player.honours.slice(0, 10).map((h, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--color-text-primary)" }}>{h.strHonour}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--color-text-muted)" }}>{h.strTeam}</span>
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--color-surface-elevated)", color: "var(--color-text-muted)" }}>
                      {h.strSeason}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Career at Clubs */}
        {player.formerTeams && player.formerTeams.length > 0 && (
          <div className="rounded-xl border p-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--color-text-secondary)" }}>
              <Star size={14} style={{ color: "var(--color-primary)" }} /> Career
            </h3>
            <div className="space-y-2">
              {player.formerTeams.map((ft, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--color-text-primary)" }}>{ft.strFormerTeam}</span>
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {ft.dateSigned ? ft.dateSigned.slice(0, 4) : "?"} – {ft.dateContractEnd ? ft.dateContractEnd.slice(0, 4) : "present"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
