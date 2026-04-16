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

// GET /api/social/chat/[id]/messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;

  try {
    const { userId: clerkId } = await getAuth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!MONGODB_ENABLED) return NextResponse.json({ messages: [], source: "demo" });

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: Conversation } = await import("@/models/social/Conversation");
    const { default: Message } = await import("@/models/social/Message");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const before = searchParams.get("before");
    const limit = parseInt(searchParams.get("limit") || "50");

    const conv = await Conversation.findOne({ _id: conversationId, participants: me._id });
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const query: Record<string, unknown> = { conversationId };
    if (before) query.sentAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ sentAt: -1 })
      .limit(limit)
      .populate("senderId", "username displayName avatar")
      .lean();

    await conv.updateOne({ $set: { [`unreadCounts.${me._id.toString()}`]: 0 } });
    return NextResponse.json({ messages: messages.reverse() });
  } catch (err) {
    console.error("[messages GET]", err);
    return NextResponse.json({ messages: [] });
  }
}

// POST /api/social/chat/[id]/messages
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;

  try {
    const { userId: clerkId } = await getAuth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!MONGODB_ENABLED) return NextResponse.json({ message: { _id: "demo", content: "Demo message", senderId: { username: "demo", displayName: "Demo User" }, sentAt: new Date().toISOString() }, source: "demo" });

    const { content } = await req.json();
    if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: Conversation } = await import("@/models/social/Conversation");
    const { default: Message } = await import("@/models/social/Message");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const conv = await Conversation.findOne({ _id: conversationId, participants: me._id });
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const message = await Message.create({
      conversationId,
      senderId: me._id,
      content: content.trim(),
      type: "text",
      sentAt: new Date(),
    });

    const otherParticipants = conv.participants.filter(
      (p) => p.toString() !== me._id.toString()
    );
    const unreadUpdate: Record<string, number> = {};
    for (const otherId of otherParticipants) {
      const currentUnread = (conv.unreadCounts as Map<string, number>).get(otherId.toString()) || 0;
      unreadUpdate[`unreadCounts.${otherId.toString()}`] = currentUnread + 1;
    }

    await conv.updateOne({
      lastMessage: { content: content.trim(), senderId: me._id, sentAt: new Date() },
      $set: unreadUpdate,
      updatedAt: new Date(),
    });

    const populated = await message.populate("senderId", "username displayName avatar");
    return NextResponse.json({ message: populated });
  } catch (err) {
    console.error("[messages POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
