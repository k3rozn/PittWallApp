"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shuffle, Save, Check, Loader2 } from "lucide-react";
import { MOCK_FANTASY_PLAYERS } from "@/lib/mock-data";

type Position = "GK" | "DEF" | "MID" | "FWD";

interface FantasyPlayer {
  idPlayer: string;
  strPlayer: string;
  strTeam: string;
  strPosition?: string;
  position?: Position;
  price: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isOnBench?: boolean;
}

const FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2"];

const FORMATION_ROWS: Record<string, Position[][]> = {
  "4-3-3": [["FWD", "FWD", "FWD"], ["MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
  "4-4-2": [["FWD", "FWD"], ["MID", "MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
  "4-2-3-1": [["FWD"], ["MID", "MID", "MID"], ["MID", "MID"], ["DEF", "DEF", "DEF", "DEF"], ["GK"]],
  "3-5-2": [["FWD", "FWD"], ["MID", "MID", "MID", "MID", "MID"], ["DEF", "DEF", "DEF"], ["GK"]],
  "5-3-2": [["FWD", "FWD"], ["MID", "MID", "MID"], ["DEF", "DEF", "DEF", "DEF", "DEF"], ["GK"]],
};

const POS_COLORS: Record<string, string> = {
  GK: "bg-warning",
  DEF: "bg-accent",
  MID: "bg-primary",
  FWD: "bg-live",
};

function PlayerToken({
  player,
  onSelect,
  isCaptain,
  isVC,
}: {
  player: FantasyPlayer | null;
  position: Position;
  onSelect: () => void;
  isCaptain?: boolean;
  isVC?: boolean;
}) {
  if (!player) {
    return (
      <button
        onClick={onSelect}
        className="flex flex-col items-center gap-1 group"
      >
        <div
          className="w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center transition-colors"
          style={{ borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)" }}
        >
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 20 }}>+</span>
        </div>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Empty</span>
      </button>
    );
  }

  const pos = (player.position || player.strPosition || "MID") as Position;

  return (
    <button onClick={onSelect} className="flex flex-col items-center gap-1 group">
      <div className="relative">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${POS_COLORS[pos] || "bg-gray-500"}`}
        >
          {player.strPlayer.split(" ").pop()?.slice(0, 6)}
        </div>
        {isCaptain && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-black text-xs font-black">C</div>
        )}
        {isVC && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-black text-xs font-black">V</div>
        )}
      </div>
      <span className="text-[11px] font-medium w-full text-center truncate px-1" style={{ color: "rgba(255,255,255,0.9)" }}>
        {player.strPlayer.split(" ").pop()}
      </span>
      <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        £{player.price}m
      </span>
    </button>
  );
}

export default function FantasyTeamBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [formation, setFormation] = useState("4-3-3");
  const [selectedPlayers, setSelectedPlayers] = useState<(FantasyPlayer | null)[]>(Array(11).fill(null));
  const [bench, setBench] = useState<(FantasyPlayer | null)[]>(Array(4).fill(null));
  const [pool, setPool] = useState<FantasyPlayer[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSlot, setPickerSlot] = useState<{ index: number; isBench: boolean; position: Position } | null>(null);
  const [posFilter, setPosFilter] = useState<Position | "ALL">("ALL");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [captainIdx, setCaptainIdx] = useState<number | null>(null);

  const budget = 100;
  const spent = [...selectedPlayers, ...bench]
    .filter(Boolean)
    .reduce((sum, p) => sum + (p?.price || 0), 0);
  const remaining = budget - spent;

  useEffect(() => {
    // In demo mode use mock players, else fetch real ones
    setPool(
      MOCK_FANTASY_PLAYERS.map((p) => ({
        ...p,
        position: p.strPosition as Position,
      }))
    );
  }, []);

  const rows = FORMATION_ROWS[formation] || FORMATION_ROWS["4-3-3"];

  // Build slot index map from formation rows (GK is last slot → index 0 in reverse)
  function getSlotIdx(rowIdx: number, colIdx: number) {
    let idx = 0;
    for (let r = rows.length - 1; r > rowIdx; r--) {
      idx += rows[r].length;
    }
    idx += colIdx;
    return idx;
  }

  function openPicker(index: number, isBench: boolean, position: Position) {
    setPickerSlot({ index, isBench, position });
    setPosFilter(position);
    setPickerOpen(true);
  }

  function pickPlayer(player: FantasyPlayer) {
    if (!pickerSlot) return;
    const { index, isBench } = pickerSlot;
    if (isBench) {
      const nb = [...bench];
      nb[index] = player;
      setBench(nb);
    } else {
      const ns = [...selectedPlayers];
      ns[index] = player;
      setSelectedPlayers(ns);
    }
    setPickerOpen(false);
    setPickerSlot(null);
  }

  async function saveTeam() {
    setSaving(true);
    try {
      const res = await fetch(`/api/fantasy/leagues/${id}/team`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation,
          players: [...selectedPlayers, ...bench].filter(Boolean).map((p, i) => ({
            playerId: p!.idPlayer,
            playerName: p!.strPlayer,
            teamId: p!.strTeam,
            teamName: p!.strTeam,
            position: p!.position || p!.strPosition,
            price: p!.price,
            isCaptain: captainIdx === i,
            isOnBench: i >= 11,
          })),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  const availablePool = pool.filter(
    (p) =>
      (posFilter === "ALL" || p.strPosition === posFilter || p.position === posFilter) &&
      !selectedPlayers.some((s) => s?.idPlayer === p.idPlayer) &&
      !bench.some((b) => b?.idPlayer === p.idPlayer)
  );

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <Link href={`/fantasy/leagues/${id}`} className="flex items-center gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          <ArrowLeft size={16} /> League
        </Link>
        <h1 className="font-bold font-display">Team Builder</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono" style={{ color: remaining < 0 ? "var(--color-live)" : "var(--color-accent)" }}>
            £{remaining.toFixed(1)}m
          </span>
          <button
            onClick={saveTeam}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ background: saved ? "var(--color-accent)" : "var(--color-primary)" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Formation Picker */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ background: "var(--color-surface-elevated)" }}>
        {FORMATIONS.map((f) => (
          <button
            key={f}
            onClick={() => setFormation(f)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition-all"
            style={{
              background: formation === f ? "var(--color-primary)" : "var(--color-surface)",
              color: formation === f ? "white" : "var(--color-text-secondary)",
              border: `1px solid ${formation === f ? "var(--color-primary)" : "var(--color-border)"}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Pitch */}
      <div className="pitch-bg relative overflow-hidden" style={{ minHeight: "420px" }}>
        <div className="absolute inset-0 flex flex-col justify-around items-center py-6 gap-2">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-around w-full max-w-md px-2">
              {row.map((pos, colIdx) => {
                const slotIdx = getSlotIdx(rowIdx, colIdx);
                return (
                  <PlayerToken
                    key={colIdx}
                    player={selectedPlayers[slotIdx]}
                    position={pos}
                    isCaptain={captainIdx === slotIdx}
                    isVC={captainIdx !== null && captainIdx !== slotIdx && slotIdx === 1}
                    onSelect={() => openPicker(slotIdx, false, pos)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Centre circle */}
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.08)",
            pointerEvents: "none",
          }}
        />
        {/* Half-way line */}
        <div
          className="absolute left-0 right-0"
          style={{ top: "50%", height: 1, background: "rgba(255,255,255,0.06)", pointerEvents: "none" }}
        />
      </div>

      {/* Bench */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.3)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>Bench</p>
        <div className="flex justify-around">
          {bench.map((p, i) => (
            <PlayerToken
              key={i}
              player={p}
              position="MID"
              onSelect={() => openPicker(i, true, "MID")}
            />
          ))}
        </div>
      </div>

      {/* Captain selector */}
      {selectedPlayers.some(Boolean) && (
        <div className="px-4 py-3 border-t" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Set Captain</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {selectedPlayers.map((p, i) => p && (
              <button
                key={i}
                onClick={() => setCaptainIdx(i)}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: captainIdx === i ? "rgba(245,158,11,0.2)" : "var(--color-surface-elevated)",
                  color: captainIdx === i ? "var(--color-warning)" : "var(--color-text-secondary)",
                  border: `1px solid ${captainIdx === i ? "var(--color-warning)" : "var(--color-border)"}`,
                }}
              >
                {captainIdx === i && "©"} {p.strPlayer.split(" ").pop()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Player Picker Drawer */}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPickerOpen(false)} />
          <div
            className="relative w-full max-h-[70vh] flex flex-col rounded-t-2xl overflow-hidden"
            style={{ background: "var(--color-surface)" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-semibold">Pick a Player</h3>
              <button onClick={() => setPickerOpen(false)} style={{ color: "var(--color-text-muted)" }}>✕</button>
            </div>

            {/* Position filter */}
            <div className="flex gap-2 px-4 py-2 overflow-x-auto" style={{ background: "var(--color-surface-elevated)" }}>
              {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPosFilter(p)}
                  className="shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: posFilter === p ? "var(--color-primary)" : "var(--color-surface)",
                    color: posFilter === p ? "white" : "var(--color-text-secondary)",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1">
              {availablePool.map((player) => (
                <button
                  key={player.idPlayer}
                  onClick={() => pickPlayer(player)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b text-left hover:bg-[var(--color-surface-elevated)] transition-colors"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${POS_COLORS[(player.strPosition || "MID") as Position] || "bg-gray-500"}`}
                  >
                    {(player.strPosition || "?").slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{player.strPlayer}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{player.strTeam}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono" style={{ color: "var(--color-accent)" }}>£{player.price}m</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{player.strPosition}</p>
                  </div>
                </button>
              ))}
              {availablePool.length === 0 && (
                <div className="py-8 text-center" style={{ color: "var(--color-text-muted)" }}>
                  No players available for this position
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
