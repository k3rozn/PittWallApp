import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function LiveBadge({ className, size = "md" }: LiveBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-white bg-live rounded",
        size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1",
        className
      )}
    >
      <span className="w-1.5 h-1.5 bg-white rounded-full live-pulse inline-block" />
      Live
    </span>
  );
}

interface SportBadgeProps {
  sport: "football" | "volleyball" | "motorsport" | "f1";
  className?: string;
}

const SPORT_CONFIG = {
  football: { label: "Football", className: "bg-accent/10 text-accent border-accent/20" },
  volleyball: { label: "Volleyball", className: "bg-warning/10 text-warning border-warning/20" },
  motorsport: { label: "Formula 1", className: "bg-live/10 text-live border-live/20" },
  f1: { label: "Formula 1", className: "bg-live/10 text-live border-live/20" },
};

export function SportBadge({ sport, className }: SportBadgeProps) {
  const config = SPORT_CONFIG[sport] || SPORT_CONFIG.football;
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  progress?: string;
  className?: string;
}

export function StatusBadge({ status, progress, className }: StatusBadgeProps) {
  if (status === "live") {
    return <LiveBadge className={className} size="sm" />;
  }
  if (status === "finished") {
    return (
      <span
        className={cn(
          "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-elevated text-text-muted border border-border uppercase tracking-wider",
          className
        )}
      >
        FT
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider",
        className
      )}
    >
      {progress || "Soon"}
    </span>
  );
}
