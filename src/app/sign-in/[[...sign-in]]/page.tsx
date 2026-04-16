import Link from "next/link";
import { Activity } from "lucide-react";

function isValidClerkKey(key: string | undefined): boolean {
  if (!key) return false;
  if (!key.startsWith("pk_test_") && !key.startsWith("pk_live_")) return false;
  const suffix = key.replace(/^pk_(test|live)_/, "");
  return suffix.length >= 30 && !suffix.includes("your") && !suffix.includes("key");
}

const CLERK_ENABLED = isValidClerkKey(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default async function SignInPage() {
  if (!CLERK_ENABLED) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--color-background)" }}
      >
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--color-primary)" }}
            >
              <Activity size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold font-display gradient-text">PITWALL</span>
          </div>

          <div
            className="rounded-2xl border p-8"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="text-4xl mb-4">🔑</div>
            <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-text-primary)" }}>
              Running in Demo Mode
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
              Sign-in requires Clerk credentials. Configure your{" "}
              <code
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ background: "var(--color-surface-elevated)", color: "var(--color-primary)" }}
              >
                NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
              </code>{" "}
              in <code className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "var(--color-surface-elevated)", color: "var(--color-primary)" }}>.env.local</code> to enable auth.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
              style={{ background: "var(--color-primary)" }}
            >
              <Activity size={16} /> Browse as Guest
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { SignIn } = await import("@clerk/nextjs");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--color-background)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--color-primary)" }}
            >
              <Activity size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold font-display gradient-text">PITWALL</span>
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Real-time sports tracking
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
