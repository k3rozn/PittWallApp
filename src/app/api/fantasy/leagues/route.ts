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

// GET /api/fantasy/leagues
export async function GET() {
  try {
    const { userId: clerkId } = await getAuth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!MONGODB_ENABLED) return NextResponse.json({ leagues: [], source: "demo" });

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: FantasyLeague } = await import("@/models/fantasy/FantasyLeague");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const leagues = await FantasyLeague.find({ "members.userId": me._id }).lean();
    return NextResponse.json({ leagues });
  } catch (err) {
    console.error("[fantasy leagues GET]", err);
    return NextResponse.json({ leagues: [] });
  }
}

// POST /api/fantasy/leagues
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await getAuth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!MONGODB_ENABLED) return NextResponse.json({
      league: { _id: "demo", name: "Demo League", inviteCode: "DEMO1234", members: [], currentRound: 1, settings: { budget: 100 } },
      source: "demo",
    }, { status: 201 });

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: FantasyLeague } = await import("@/models/fantasy/FantasyLeague");
    const { default: FantasyTeam } = await import("@/models/fantasy/FantasyTeam");
    const { generateInviteCode } = await import("@/lib/utils");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    let inviteCode = generateInviteCode();
    for (let i = 0; i < 5; i++) {
      const exists = await FantasyLeague.findOne({ inviteCode });
      if (!exists) break;
      inviteCode = generateInviteCode();
    }

    const league = await FantasyLeague.create({
      name: name.trim(),
      sport: "football",
      ownerId: me._id,
      members: [{ userId: me._id, joinedAt: new Date(), totalPoints: 0 }],
      inviteCode,
      isPublic: false,
      currentRound: 1,
      settings: { budget: 100, maxPlayersPerClub: 3, squadSize: 15 },
    });

    await FantasyTeam.create({
      userId: me._id,
      leagueId: league._id,
      name: `${me.displayName}'s Team`,
      formation: "4-3-3",
      players: [],
      totalPoints: 0,
      remainingBudget: 100,
    });

    return NextResponse.json({ league }, { status: 201 });
  } catch (err) {
    console.error("[fantasy leagues POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
