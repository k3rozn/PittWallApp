import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const MONGODB_ENABLED =
  !!process.env.MONGODB_URI &&
  process.env.MONGODB_URI !== "mongodb+srv://user:password@cluster.mongodb.net/pitwall?retryWrites=true&w=majority";

// GET /api/user/favorites?type=team
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!MONGODB_ENABLED) {
      return NextResponse.json({ favorites: [], source: "demo" });
    }

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: Favorite } = await import("@/models/preferences/Favorite");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const query: Record<string, unknown> = { userId: me._id };
    if (type) query.type = type;
    const favorites = await Favorite.find(query).lean();
    return NextResponse.json({ favorites });
  } catch (err) {
    console.error("[favorites GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/user/favorites
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, externalId, name, badge, sport } = await req.json();

    if (!MONGODB_ENABLED) {
      return NextResponse.json({ success: true, source: "demo" });
    }

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: Favorite } = await import("@/models/preferences/Favorite");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    await Favorite.findOneAndUpdate(
      { userId: me._id, type, externalId },
      { $set: { name, badge, sport } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[favorites POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE /api/user/favorites
export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { type, externalId } = await req.json();

    if (!MONGODB_ENABLED) {
      return NextResponse.json({ success: true, source: "demo" });
    }

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: Favorite } = await import("@/models/preferences/Favorite");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    await Favorite.deleteOne({ userId: me._id, type, externalId });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[favorites DELETE]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
