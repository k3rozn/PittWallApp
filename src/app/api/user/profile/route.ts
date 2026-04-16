import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const MONGODB_ENABLED =
  !!process.env.MONGODB_URI &&
  process.env.MONGODB_URI !== "mongodb+srv://user:password@cluster.mongodb.net/pitwall?retryWrites=true&w=majority";

// GET /api/user/profile
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!MONGODB_ENABLED) {
      return NextResponse.json({
        profile: {
          clerkId,
          username: "demo_user",
          displayName: "Demo User",
          bio: "",
          sportPreferences: ["football"],
          onboardingComplete: true,
        },
        source: "demo",
      });
    }

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    await connectDB();
    const profile = await UserProfile.findOne({ clerkId }).lean();
    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[profile GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/user/profile
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { displayName, bio, sportPreferences } = await req.json();

    if (!MONGODB_ENABLED) {
      // Demo: just echo back
      return NextResponse.json({ success: true, source: "demo" });
    }

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    await connectDB();

    const update: Record<string, unknown> = {};
    if (displayName !== undefined) update.displayName = displayName;
    if (bio !== undefined) update.bio = bio;
    if (sportPreferences !== undefined) update.sportPreferences = sportPreferences;

    await UserProfile.updateOne({ clerkId }, { $set: update }, { upsert: false });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[profile PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
