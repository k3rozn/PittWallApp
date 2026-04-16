"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar, Flame, Clock, CheckCircle } from "lucide-react";
import EventCard from "@/components/sports/EventCard";
import { SportBadge } from "@/components/sports/Badges";

const SPORT_FILTERS = [
  { value: "all", label: "All Configs" },
  { value: "f1", label: "Formula 1" },
  { value: "football", label: "Football" },
];

const STATUS_FILTERS = [
  { value: "all", label: "All", icon: Calendar },
  { value: "live", label: "Live", icon: Flame },
];

interface Event {
  externalId: string;
  sport: string;
  competition: { id: string; name: string; badge?: string };
  status: string;
  startTime: string;
  homeTeam?: { id: string; name: string; badge?: string };
  awayTeam?: { id: string; name: string; badge?: string };
  score?: { home: number | null; away: number | null; progress?: string };
  raceName?: string;
  circuit?: string;
  venue?: string;
}

function EventSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 bg-surface-elevated rounded" />
        <div className="h-3 bg-surface-elevated rounded w-32" />
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-surface-elevated rounded-full" />
          <div className="h-4 bg-surface-elevated rounded flex-1" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (sportFilter !== "all") params.append("sport", sportFilter);

      const res = await fetch(`/api/sports/events?${params}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, sportFilter]);

  useEffect(() => {
    fetchEvents();
    // Refresh live events every 60s
    const interval = setInterval(() => {
      if (statusFilter === "live" || statusFilter === "all") {
        fetchEvents();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchEvents, statusFilter]);

  const filtered = events.filter((e) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, Event[]>>((acc, event) => {
    const key = event.competition.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  const liveCount = events.filter((e) => e.status === "live").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[150px_200px_1fr_300px_150px] xl:grid-cols-[200px_220px_1fr_350px_200px] w-full h-[calc(100vh-64px)] overflow-hidden">
      
      {/* COLUMN 1: Ads Margin Left */}
      <div className="hidden lg:flex flex-col bg-[#1A1A1A] p-4 border-r border-border overflow-y-auto flex-shrink-0 relative">
        <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 opacity-50 rounded-lg">
          <span className="text-text-muted text-sm font-medium tracking-widest uppercase">ADS</span>
        </div>
      </div>

      {/* COLUMN 2: Categories */}
      <div className="hidden md:flex flex-col bg-surface border-r border-border overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-border sticky top-0 bg-surface/90 backdrop-blur z-10">
          <h2 className="font-display font-semibold text-text-primary tracking-wide text-lg">Categories</h2>
        </div>
        <div className="p-3 space-y-2">
          {["Formula 1", "Formula 2", "Nascar", "IndyCar", "Football", "Volleyball"].map((cat) => (
             <button
               key={cat}
               className="w-full text-left px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-white/5 rounded-md transition-colors"
             >
               {cat}
             </button>
          ))}
        </div>
      </div>

      {/* COLUMN 3: Main Feed */}
      <div className="flex flex-col bg-background overflow-y-auto w-full relative">
        <div className="p-4 border-b border-border sticky top-0 bg-background/90 backdrop-blur z-10 flex flex-col gap-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-text-primary tracking-wide text-lg">
              Next Race by default
            </h2>
            {liveCount > 0 && (
              <div className="flex items-center gap-2 bg-live/10 border border-live/20 rounded-lg px-2.5 py-1">
                <span className="w-2 h-2 bg-live rounded-full live-pulse" />
                <span className="text-xs font-medium text-live">{liveCount} live</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {SPORT_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setSportFilter(f.value)}
                className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-all border ${
                  sportFilter === f.value
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-surface text-text-secondary border-border hover:border-primary/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-6">
          {loading ? (
             <div className="grid gap-3">
               {Array.from({ length: 5 }).map((_, i) => <EventSkeleton key={i} />)}
             </div>
          ) : filtered.length === 0 ? (
             <div className="text-center py-20 flex flex-col items-center opacity-50">
               <span className="text-4xl mb-4">🏁</span>
               <p className="text-text-secondary font-medium">No active events found</p>
             </div>
          ) : (
            Object.entries(grouped).map(([comp, compEvents]) => (
              <div key={comp} className="animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-bold tracking-tight text-white/90">{comp}</h3>
                  <div className="flex-1 h-px bg-white/5" />
                  <SportBadge sport={compEvents[0].sport as any} />
                </div>
                <div className="grid gap-3">
                  {compEvents.map((event) => (
                    <EventCard key={event.externalId} event={event} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COLUMN 4: Context / Details */}
      <div className="hidden lg:flex flex-col bg-surface border-l border-border overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-border sticky top-0 bg-surface/90 backdrop-blur z-10 flex flex-col gap-1">
           <h2 className="font-display font-semibold text-text-primary tracking-wide text-lg">Details by default</h2>
           <p className="text-xs text-text-muted">(Fav driver)</p>
        </div>
        
        <div className="p-4">
           {/* Placeholder for selected driver/event details */}
           <div className="rounded-xl bg-surface-elevated overflow-hidden border border-border shadow-sm mb-4">
             <div className="h-32 bg-gradient-to-br from-primary-dark to-surface-elevated relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.thesportsdb.com/images/media/event/thumb/fnm8in1588669527.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
             </div>
             <div className="p-4 -mt-10 relative z-10">
                 <div className="w-16 h-16 rounded-lg bg-surface border-4 border-surface overflow-hidden shadow-lg mb-2">
                    <img src="https://www.thesportsdb.com/images/media/player/thumb/haaland.jpg" className="w-full h-full object-cover grayscale opacity-80" alt="Placeholder" />
                 </div>
                 <h4 className="text-white font-bold text-lg leading-tight">Max Verstappen</h4>
                 <p className="text-xs text-text-muted mb-4">Red Bull Racing • Formula 1</p>

                 <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-black/20 p-2 rounded-md">
                       <p className="text-[10px] text-text-muted uppercase">Wins</p>
                       <p className="text-primary font-mono font-bold">54</p>
                    </div>
                    <div className="bg-black/20 p-2 rounded-md">
                       <p className="text-[10px] text-text-muted uppercase">Points</p>
                       <p className="text-primary font-mono font-bold">2582</p>
                    </div>
                 </div>
             </div>
           </div>

           <div className="mt-4 pt-4 border-t border-border">
              <h3 className="font-display font-semibold text-sm mb-3">Fantasy by category</h3>
              <div className="space-y-2">
                 <div className="flex items-center justify-between p-2 rounded hover:bg-white/5 cursor-pointer">
                    <span className="text-sm font-medium text-text-secondary">F1 Global League</span>
                    <span className="text-xs text-accent">Join</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* COLUMN 5: Ads Margin Right */}
      <div className="hidden lg:flex flex-col bg-[#1A1A1A] p-4 border-l border-border overflow-y-auto flex-shrink-0 relative">
        <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 opacity-50 rounded-lg">
          <span className="text-text-muted text-sm font-medium tracking-widest uppercase">ADS</span>
        </div>
      </div>

    </div>
  );
}
