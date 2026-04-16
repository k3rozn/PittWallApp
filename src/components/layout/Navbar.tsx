"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  Users,
  Trophy,
  MapPin,
  Swords,
  MessageSquare,
  Search,
  LogIn,
} from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { name: "Drivers", href: "/sport/f1", icon: Car },
  { name: "Teams", href: "/competition/4370", icon: Users },
  { name: "Categories", href: "/", icon: Trophy },
  { name: "Tracks", href: "#", icon: MapPin },
  { name: "Fantasy", href: "/fantasy", icon: Swords },
  { name: "Chat", href: "/social/chat", icon: MessageSquare },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full bg-primary border-b border-primary-dark shadow-md text-white">
      <div className="max-w-[1600px] mx-auto px-4">
        {/* Top Header Row */}
        <div className="flex h-16 items-center gap-3 lg:gap-4">
          {/* Logo & Search */}
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 lg:w-[320px] lg:flex-none xl:w-[420px]">
            <Link href="/" className="group flex shrink-0 items-center gap-2">
              <div className="w-10 h-10 bg-black/80 rounded-full flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                <span className="text-white font-display font-bold text-xl italic tracking-tighter">
                  PW
                </span>
              </div>
              <span className="font-display font-bold text-2xl tracking-wide hidden sm:block">
                PitWall
              </span>
            </Link>
            
            {/* Search Input inline with Logo like mockup */}
            <div className="relative hidden min-w-0 flex-1 md:block lg:hidden xl:block">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45"
              />
              <input
                type="text"
                placeholder="Pilots, Teams or Categories"
                className="h-9 w-full rounded-full border border-white/15 bg-black/20 pl-10 pr-4 text-center text-sm leading-none text-white placeholder:text-white/55 transition-all focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-white/30"
              />
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 px-2 lg:flex xl:gap-4">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex min-w-[64px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition-all ${
                    isActive
                      ? "bg-black/20 text-white"
                      : "text-white/70 hover:bg-black/10 hover:text-white"
                  }`}
                >
                  <link.icon size={22} className={isActive ? "scale-110 shadow-sm" : ""} />
                  <span className="text-[11px] font-medium tracking-wide uppercase">
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Auth Tokens */}
          <div className="flex shrink-0 items-center justify-end">
            {isLoaded ? (
              isSignedIn ? (
                <div className="p-1 bg-black/20 rounded-full flex items-center justify-center">
                  <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
                </div>
              ) : (
                <div className="flex items-center rounded-full border border-white/15 bg-gradient-to-r from-black/35 via-black/20 to-black/35 p-1 shadow-inner backdrop-blur-sm">
                  <SignInButton mode="modal">
                    <Button
                      size="default"
                      variant="ghost"
                      className="h-10 min-w-[132px] rounded-full px-6 text-white/95 hover:bg-white/12 hover:text-white"
                    >
                      <LogIn data-icon="inline-start" />
                      Login
                    </Button>
                  </SignInButton>
                </div>
              )
            ) : (
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            )}
          </div>
        </div>

        {/* Mobile Search - Visible only on small screens */}
        <div className="md:hidden pb-3">
           <div className="relative w-full">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45"
              />
              <input
                type="text"
                placeholder="Search..."
                className="h-10 w-full rounded-full border border-white/15 bg-black/20 pl-10 pr-4 text-sm leading-none text-white placeholder:text-white/55 focus:outline-none focus:ring-1 focus:ring-white/30"
              />
            </div>
        </div>
      </div>
    </header>
  );
}
