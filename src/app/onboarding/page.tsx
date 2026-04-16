"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ChevronRight } from "lucide-react";

const SPORTS = [
  { id: "football", label: "Football", emoji: "⚽", description: "Premier League, La Liga, Champions League" },
  { id: "volleyball", label: "Volleyball", emoji: "🏐", description: "VNL, Club World Championships" },
  { id: "motorsport", label: "Formula 1", emoji: "🏎️", description: "Grand Prix, constructors standings" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(["football"]);
  const [saving, setSaving] = useState(false);

  function toggle(sport: string) {
    setSelected((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  }

  async function finish() {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sportPreferences: selected, onboardingComplete: true }),
      });
    } catch {}
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--color-background)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-primary)" }}>
              <span className="text-white text-xl">⚡</span>
            </div>
            <span className="text-2xl font-bold font-display gradient-text">PITWALL</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            What sports do you follow?
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            We&apos;ll personalize your dashboard
          </p>
        </div>

        {/* Sport cards */}
        <div className="space-y-3 mb-8">
          {SPORTS.map((sport) => (
            <button
              key={sport.id}
              onClick={() => toggle(sport.id)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
              style={{
                background: selected.includes(sport.id)
                  ? "rgba(59,130,246,0.08)"
                  : "var(--color-surface)",
                borderColor: selected.includes(sport.id)
                  ? "var(--color-primary)"
                  : "var(--color-border)",
                transform: selected.includes(sport.id) ? "scale(1.01)" : "scale(1)",
              }}
            >
              <span className="text-3xl">{sport.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{sport.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sport.description}</p>
              </div>
              <div
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                style={{
                  background: selected.includes(sport.id) ? "var(--color-primary)" : "transparent",
                  borderColor: selected.includes(sport.id) ? "var(--color-primary)" : "var(--color-border)",
                }}
              >
                {selected.includes(sport.id) && <Check size={12} className="text-white" />}
              </div>
            </button>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={finish}
          disabled={selected.length === 0 || saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "var(--color-primary)", boxShadow: "0 4px 24px rgba(59,130,246,0.3)" }}
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              Let&apos;s Go <ChevronRight size={18} />
            </>
          )}
        </button>

        <p className="text-center text-xs mt-4" style={{ color: "var(--color-text-muted)" }}>
          You can change this anytime in Settings
        </p>
      </div>
    </div>
  );
}
