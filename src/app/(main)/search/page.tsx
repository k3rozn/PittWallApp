"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Loader2 } from "lucide-react";

interface SearchResult {
  type: "team" | "player" | "competition";
  id: string;
  name: string;
  badge?: string;
  subtitle: string;
  href: string;
}

const TYPE_ICONS: Record<string, string> = {
  team: "🏟️",
  player: "⚽",
  competition: "🏆",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/sports/search?q=${encodeURIComponent(query)}&type=all`
        );
        const data = await res.json();
        setResults(data.results || []);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div className="page-enter max-w-2xl mx-auto">
      {/* Search Bar */}
      <div className="px-4 py-6 border-b border-border">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search teams, players, competitions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-10 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary text-sm"
          />
          {loading ? (
            <Loader2
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted animate-spin"
            />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Results */}
      {query.length < 2 ? (
        <div className="px-4 py-12 text-center">
          <Search size={48} className="mx-auto mb-3 text-text-muted opacity-20" />
          <p className="text-text-secondary">Search for teams, players, and competitions</p>
          <p className="text-text-muted text-sm mt-1">Type at least 2 characters</p>
        </div>
      ) : results.length === 0 && !loading ? (
        <div className="px-4 py-12 text-center">
          <p className="text-text-secondary">No results for &quot;{query}&quot;</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.id}`}
              href={result.href}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface transition-colors"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-elevated shrink-0 flex items-center justify-center">
                {result.badge ? (
                  <Image
                    src={`${result.badge}/tiny`}
                    alt={result.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-lg">{TYPE_ICONS[result.type]}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{result.name}</p>
                <p className="text-xs text-text-muted">{result.subtitle}</p>
              </div>
              <span className="text-xs text-text-muted bg-surface-elevated px-1.5 py-0.5 rounded capitalize shrink-0">
                {result.type}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
