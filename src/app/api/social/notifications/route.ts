import { NextRequest, NextResponse } from "next/server";

const MONGODB_ENABLED =
  !!process.env.MONGODB_URI &&
  process.env.MONGODB_URI !== "mongodb+srv://user:password@cluster.mongodb.net/pitwall?retryWrites=true&w=majority";

const CLERK_ENABLED =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_your_clerk_publishable_key";

async function getAuth() {
  if (!CLERK_ENABLED) return { userId: null };
  const { auth } = await import("@clerk/nextjs/server");
  return auth();
}

// GET /api/social/notifications
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await getAuth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!MONGODB_ENABLED) return NextResponse.json({ notifications: [], unreadCount: 0, source: "demo" });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const unreadOnly = searchParams.get("unread") === "true";

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: Notification } = await import("@/models/social/Notification");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const query: Record<string, unknown> = { userId: me._id };
    if (unreadOnly) query.read = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ userId: me._id, read: false }),
    ]);
    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error("[notifications GET]", err);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

// PATCH /api/social/notifications
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await getAuth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!MONGODB_ENABLED) return NextResponse.json({ success: true, source: "demo" });

    const { id, all } = await req.json();

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: Notification } = await import("@/models/social/Notification");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    if (all) {
      await Notification.updateMany({ userId: me._id }, { $set: { read: true } });
    } else if (id) {
      await Notification.updateOne({ _id: id, userId: me._id }, { $set: { read: true } });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[notifications PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
