import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const MONGODB_ENABLED =
  !!process.env.MONGODB_URI &&
  process.env.MONGODB_URI !== "mongodb+srv://user:password@cluster.mongodb.net/pitwall?retryWrites=true&w=majority";

// GET /api/fantasy/leagues/[id]/team
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!MONGODB_ENABLED) {
      return NextResponse.json({
        team: { name: "My Demo Team", formation: "4-3-3", players: [], totalPoints: 0, remainingBudget: 100 },
        source: "demo",
      });
    }

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: FantasyTeam } = await import("@/models/fantasy/FantasyTeam");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const team = await FantasyTeam.findOne({ userId: me._id, leagueId: id }).lean();
    return NextResponse.json({ team });
  } catch (err) {
    console.error("[fantasy team GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/fantasy/leagues/[id]/team — update formation + players
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { formation, players } = await req.json();

    if (!MONGODB_ENABLED) {
      return NextResponse.json({ success: true, source: "demo" });
    }

    const { default: connectDB } = await import("@/lib/mongodb");
    const { default: UserProfile } = await import("@/models/social/UserProfile");
    const { default: FantasyTeam } = await import("@/models/fantasy/FantasyTeam");
    await connectDB();

    const me = await UserProfile.findOne({ clerkId });
    if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Validate budget
    const totalCost = (players || []).reduce((s: number, p: { price: number }) => s + (p.price || 0), 0);
    if (totalCost > 100) {
      return NextResponse.json({ error: `Over budget: £${totalCost.toFixed(1)}m / £100m` }, { status: 400 });
    }

    await FantasyTeam.updateOne(
      { userId: me._id, leagueId: id },
      { $set: { formation, players, remainingBudget: 100 - totalCost } },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[fantasy team PATCH]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
