"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";

function useSafeSignedIn() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useUser } = require("@clerk/nextjs");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { isSignedIn } = useUser();
    return isSignedIn as boolean;
  } catch {
    return false;
  }
}

interface FavoriteButtonProps {
  type: "team" | "competition" | "player" | "event";
  externalId: string;
  name: string;
  badge?: string;
  sport?: string;
  className?: string;
}

export default function FavoriteButton({
  type, externalId, name, badge, sport, className = "",
}: FavoriteButtonProps) {
  const isSignedIn = useSafeSignedIn();
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch(`/api/user/favorites?type=${type}`)
      .then((r) => r.json())
      .then((d) => {
        const found = (d.favorites || []).some(
          (f: { externalId: string }) => f.externalId === externalId
        );
        setIsFav(found);
      })
      .catch(() => {});
  }, [isSignedIn, type, externalId]);

  async function toggle() {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      if (isFav) {
        await fetch("/api/user/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, externalId }),
        });
        setIsFav(false);
      } else {
        await fetch("/api/user/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, externalId, name, badge, sport }),
        });
        setIsFav(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!isSignedIn) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`p-2 rounded-lg transition-all ${className}`}
      style={{
        background: isFav ? "rgba(245,158,11,0.15)" : "transparent",
        color: isFav ? "var(--color-warning)" : "var(--color-text-muted)",
      }}
      title={isFav ? "Remove from favorites" : "Add to favorites"}
    >
      <Star size={18} fill={isFav ? "currentColor" : "none"} />
    </button>
  );
}
