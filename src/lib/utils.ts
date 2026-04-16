import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEventDate(date?: string, time?: string): string {
  if (!date) return "TBD";

  const normalizedTime = (time || "00:00").slice(0, 5);
  const dateTime = new Date(`${date}T${normalizedTime}:00`);

  if (Number.isNaN(dateTime.getTime())) {
    return `${date}${time ? ` ${normalizedTime}` : ""}`;
  }

  return dateTime.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function normalizeSport(value?: string): "football" | "volleyball" | "motorsport" {
  const sport = (value || "").toLowerCase().trim();

  if (!sport) return "football";

  if (
    sport.includes("motor") ||
    sport.includes("formula") ||
    sport === "f1" ||
    sport.includes("racing")
  ) {
    return "motorsport";
  }

  if (sport.includes("volley")) {
    return "volleyball";
  }

  if (sport.includes("football") || sport.includes("soccer")) {
    return "football";
  }

  return "football";
}

export function normalizeStatus(value?: string): "live" | "finished" | "scheduled" | "postponed" | "cancelled" {
  const status = (value || "").toLowerCase().trim();

  if (!status) return "scheduled";

  if (
    status.includes("live") ||
    status.includes("in progress") ||
    status.includes("1st") ||
    status.includes("2nd") ||
    status.includes("3rd") ||
    status.includes("half")
  ) {
    return "live";
  }

  if (
    status.includes("finished") ||
    status.includes("full time") ||
    status === "ft" ||
    status.includes("after penalties") ||
    status.includes("aet")
  ) {
    return "finished";
  }

  if (status.includes("postponed") || status.includes("delayed") || status.includes("suspended")) {
    return "postponed";
  }

  if (status.includes("cancelled") || status.includes("abandoned")) {
    return "cancelled";
  }

  return "scheduled";
}

export function generateInviteCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}
