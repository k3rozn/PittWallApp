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

// GET /api/social/chat
export async function GET() {
  try {
    const { userId: clerkId } = await getAuth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!MONGODB_ENABLED) return NextResponse.json({ conversations: [], source: "demo" });

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: Conversation } = await import("@/models/social/Conversation");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const conversations = await Conversation.find({ participants: me._id })
      .sort({ updatedAt: -1 })
      .populate("participants", "username displayName avatar clerkId")
      .limit(30)
      .lean();
    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[chat GET]", err);
    return NextResponse.json({ conversations: [] });
  }
}

// POST /api/social/chat
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await getAuth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!MONGODB_ENABLED) return NextResponse.json({ conversation: { _id: "demo" }, source: "demo" });

    const { targetUserId } = await req.json();

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: Conversation } = await import("@/models/social/Conversation");
    await connectDB();

    const [me, target] = await Promise.all([
      UserProfile.findOne({ clerkId }),
      UserProfile.findById(targetUserId),
    ]);
    if (!me || !target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let conversation = await Conversation.findOne({
      participants: { $all: [me._id, target._id], $size: 2 },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [me._id, target._id],
        unreadCounts: new Map([[me._id.toString(), 0], [target._id.toString(), 0]]),
      });
    }
    return NextResponse.json({ conversation });
  } catch (err) {
    console.error("[chat POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
