import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PitWall — Sports Tracking in Real Time",
    template: "%s | PitWall",
  },
  description:
    "Real-time sports tracking platform. Follow live scores, stats, fantasy leagues, and more for Football, Volleyball, and Formula 1.",
  keywords: ["sports", "live scores", "football", "f1", "volleyball", "fantasy"],
  authors: [{ name: "PitWall" }],
  openGraph: { type: "website", locale: "en_US", siteName: "PitWall" },
};

function isValidClerkKey(key: string | undefined): boolean {
  if (!key) return false;
  if (!key.startsWith("pk_test_") && !key.startsWith("pk_live_")) return false;
  const suffix = key.replace(/^pk_(test|live)_/, "");
  return suffix.length >= 30 && !suffix.includes("your") && !suffix.includes("key");
}

const CLERK_ENABLED = isValidClerkKey(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If Clerk is enabled, we use ClerkProvider. Otherwise, we just render a fragment/div.
  if (CLERK_ENABLED) {
    return (
      <ClerkProvider
        appearance={{
          variables: {
            colorPrimary: "#b03a2e",
            colorBackground: "#111827",
            colorText: "#f1f5f9",
            colorInputBackground: "#1c2333",
            colorInputText: "#f1f5f9",
          },
        }}
      >
        <html lang="en" className="font-sans">
          <body>{children}</body>
        </html>
      </ClerkProvider>
    );
  }

  return (
    <html lang="en" className="font-sans">
      <body>{children}</body>
    </html>
  );
}
