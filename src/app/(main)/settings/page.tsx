"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Camera, Check, Loader2, Save } from "lucide-react";

// Safe hook — won't crash if ClerkProvider is not present
function useSafeUser() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useUser } = require("@clerk/nextjs");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useUser() as { isLoaded: boolean; user: { fullName?: string | null; username?: string | null; imageUrl?: string } | null };
  } catch {
    return { isLoaded: true, user: null };
  }
}

const SPORTS = [
  { id: "football", label: "Football", emoji: "⚽" },
  { id: "volleyball", label: "Volleyball", emoji: "🏐" },
  { id: "motorsport", label: "Formula 1", emoji: "🏎️" },
];

export default function SettingsPage() {
  const { user, isLoaded } = useSafeUser();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [sportPrefs, setSportPrefs] = useState<string[]>(["football"]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !user) return;
    setDisplayName(user.fullName || "");
    setUsername(user.username || "");

    // Load from our DB
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setDisplayName(d.profile.displayName || user.fullName || "");
          setUsername(d.profile.username || user.username || "");
          setBio(d.profile.bio || "");
          setSportPrefs(d.profile.sportPreferences || ["football"]);
        }
      })
      .catch(() => {});
  }, [isLoaded, user]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, sportPreferences: sportPrefs }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to save");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleSport(sport: string) {
    setSportPrefs((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  // Demo/not-logged-in state
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>Sign in to edit your profile</p>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-2xl mx-auto">
      <div className="px-4 lg:px-8 py-6 border-b" style={{ borderColor: "var(--color-border)" }}>
        <h1 className="text-2xl font-bold font-display">Settings</h1>
      </div>

      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden" style={{ background: "var(--color-surface-elevated)" }}>
            {user.imageUrl && (
              <Image src={user.imageUrl} alt={user.fullName || ""} fill className="object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <Camera size={20} className="text-white" />
            </div>
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{user.fullName}</p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>@{username}</p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="rounded-xl border p-4 space-y-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>Profile Info</h3>

          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ background: "var(--color-background)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
              onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="Tell us about yourself..."
              className="w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none"
              style={{ background: "var(--color-background)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
            />
            <p className="text-xs text-right" style={{ color: "var(--color-text-muted)" }}>{bio.length}/280</p>
          </div>
        </div>

        {/* Sport Preferences */}
        <div className="rounded-xl border p-4" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-secondary)" }}>Sports You Follow</h3>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map((sport) => (
              <button
                key={sport.id}
                onClick={() => toggleSport(sport.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all"
                style={{
                  background: sportPrefs.includes(sport.id)
                    ? "rgba(59,130,246,0.1)"
                    : "var(--color-background)",
                  borderColor: sportPrefs.includes(sport.id)
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                  color: sportPrefs.includes(sport.id)
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                }}
              >
                <span>{sport.emoji}</span>
                {sport.label}
                {sportPrefs.includes(sport.id) && <Check size={13} />}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        {error && <p className="text-sm" style={{ color: "var(--color-live)" }}>{error}</p>}
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-60"
          style={{ background: saved ? "var(--color-accent)" : "var(--color-primary)", color: "white" }}
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <Check size={16} />
          ) : (
            <Save size={16} />
          )}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
