interface StatBarProps {
  label: string;
  home: number;
  away: number;
  unit?: string;
  format?: "number" | "percent";
}

export function StatBar({ label, home, away, unit = "", format = "number" }: StatBarProps) {
  const total = home + away;
  const homePercent = total > 0 ? (home / total) * 100 : 50;
  const awayPercent = total > 0 ? (away / total) * 100 : 50;

  const formatVal = (v: number) => {
    if (format === "percent") return `${v}%`;
    return `${v}${unit}`;
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-text-primary w-10 text-left">
          {formatVal(home)}
        </span>
        <span className="text-xs text-text-muted flex-1 text-center">{label}</span>
        <span className="font-semibold text-text-primary w-10 text-right">
          {formatVal(away)}
        </span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        <div
          className="h-full bg-primary rounded-l-full transition-all duration-700"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="h-full bg-surface-elevated flex-1"
          style={{ width: "2px", minWidth: "2px" }}
        />
        <div
          className="h-full bg-surface-elevated rounded-r-full flex-1 transition-all duration-700"
          style={{ width: `${awayPercent}%`, background: "#374151" }}
        />
      </div>
    </div>
  );
}

interface TimelineEventProps {
  time: string;
  type: string;
  detail: string;
  team: string;
  player: string;
  player2?: string;
  isHome: boolean;
}

export function TimelineEvent({
  time,
  type,
  detail,
  team,
  player,
  player2,
  isHome,
}: TimelineEventProps) {
  const getIcon = (type: string) => {
    if (type.toLowerCase().includes("goal")) return "⚽";
    if (type.toLowerCase().includes("yellow")) return "🟨";
    if (type.toLowerCase().includes("red")) return "🟥";
    if (type.toLowerCase().includes("sub")) return "🔄";
    if (type.toLowerCase().includes("var")) return "📺";
    return "•";
  };

  return (
    <div
      className={`flex items-center gap-3 py-2 ${
        isHome ? "flex-row" : "flex-row-reverse"
      }`}
    >
      <div
        className={`flex-1 ${isHome ? "text-right" : "text-left"} min-w-0`}
      >
        <p className="text-sm text-text-primary truncate">{player}</p>
        {player2 && (
          <p className="text-xs text-text-muted truncate">↗ {player2}</p>
        )}
      </div>
      <div className="flex flex-col items-center shrink-0 w-12">
        <span className="text-lg">{getIcon(type)}</span>
        <span className="text-xs font-mono text-text-muted">{time}&apos;</span>
      </div>
      <div className={`flex-1 ${isHome ? "text-left" : "text-right"} min-w-0`}>
        {!isHome && <p className="text-sm text-text-primary truncate">{player}</p>}
        {!isHome && player2 && (
          <p className="text-xs text-text-muted truncate">↗ {player2}</p>
        )}
        {isHome && <span className="text-xs text-text-muted">{detail}</span>}
        {!isHome && <span className="text-xs text-text-muted">{detail}</span>}
      </div>
    </div>
  );
}
