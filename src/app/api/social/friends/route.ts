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

// GET /api/social/friends
export async function GET() {
  try {
    const { userId: clerkId } = await getAuth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!MONGODB_ENABLED) {
      return NextResponse.json({ friends: [], pendingReceived: [], pendingSent: [], source: "demo" });
    }

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: FriendRequest } = await import("@/models/social/FriendRequest");
    const { default: Friendship } = await import("@/models/social/Friendship");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const friendships = await Friendship.find({ users: me._id })
      .populate("users", "username displayName avatar clerkId")
      .lean();

    const friends = friendships.map((f) =>
      (f.users as unknown[]).find(
        (u: unknown) => (u as { _id: { toString(): string } })._id.toString() !== me._id.toString()
      )
    );

    const pendingReceived = await FriendRequest.find({ receiverId: me._id, status: "pending" })
      .populate("senderId", "username displayName avatar clerkId").lean();

    const pendingSent = await FriendRequest.find({ senderId: me._id, status: "pending" })
      .populate("receiverId", "username displayName avatar clerkId").lean();

    return NextResponse.json({ friends, pendingReceived, pendingSent });
  } catch (err) {
    console.error("[friends GET]", err);
    return NextResponse.json({ friends: [], pendingReceived: [], pendingSent: [] });
  }
}

// POST /api/social/friends
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await getAuth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!MONGODB_ENABLED) return NextResponse.json({ success: true, source: "demo" });

    const { targetUsername } = await req.json();

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: FriendRequest } = await import("@/models/social/FriendRequest");
    const { default: Friendship } = await import("@/models/social/Friendship");
    const { default: Notification } = await import("@/models/social/Notification");
    await connectDB();

    const [me, target] = await Promise.all([
      UserProfile.findOne({ clerkId }),
      UserProfile.findOne({ username: targetUsername.toLowerCase() }),
    ]);

    if (!me) return NextResponse.json({ error: "Your profile not found" }, { status: 404 });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (me._id.toString() === target._id.toString())
      return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

    const existing = await Friendship.findOne({ users: { $all: [me._id, target._id] } });
    if (existing) return NextResponse.json({ error: "Already friends" }, { status: 400 });

    const dup = await FriendRequest.findOne({
      $or: [{ senderId: me._id, receiverId: target._id }, { senderId: target._id, receiverId: me._id }],
      status: "pending",
    });
    if (dup) return NextResponse.json({ error: "Request already pending" }, { status: 400 });

    const request = await FriendRequest.create({ senderId: me._id, receiverId: target._id });
    await Notification.create({
      userId: target._id,
      type: "friend_request",
      title: "New Friend Request",
      body: `${me.displayName} (@${me.username}) sent you a friend request`,
      data: { requestId: request._id, senderId: me._id.toString() },
    });
    return NextResponse.json({ success: true, request });
  } catch (err) {
    console.error("[friends POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/social/friends
export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkId } = await getAuth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!MONGODB_ENABLED) return NextResponse.json({ success: true, source: "demo" });

    const { requestId, action } = await req.json();

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: FriendRequest } = await import("@/models/social/FriendRequest");
    const { default: Friendship } = await import("@/models/social/Friendship");
    const { default: Notification } = await import("@/models/social/Notification");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    if (action === "remove") {
      const target = await UserProfile.findById(requestId);
      if (target) await Friendship.deleteOne({ users: { $all: [me._id, target._id] } });
      return NextResponse.json({ success: true });
    }

    const request = await FriendRequest.findOne({ _id: requestId, receiverId: me._id, status: "pending" });
    if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (action === "accept") {
      await request.updateOne({ status: "accepted" });
      await Friendship.create({ users: [request.senderId, request.receiverId] });
      const sender = await UserProfile.findById(request.senderId);
      if (sender) {
        await Notification.create({
          userId: request.senderId,
          type: "friend_accepted",
          title: "Friend Request Accepted",
          body: `${me.displayName} accepted your friend request`,
          data: { userId: me._id.toString() },
        });
      }
    } else {
      await request.updateOne({ status: "declined" });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[friends PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
