"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Trophy, Users, Bell, Star } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Activity },
  { href: "/sport/football", label: "Football", icon: Trophy },
  { href: "/fantasy", label: "Fantasy", icon: Star },
  { href: "/social/friends", label: "Social", icon: Users },
  { href: "/notifications", label: "Alerts", icon: Bell },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex lg:hidden z-30"
      style={{
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-colors"
            style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
