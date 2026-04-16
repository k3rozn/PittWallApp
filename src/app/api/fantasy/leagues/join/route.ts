import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb";
import UserProfile from "@/models/social/UserProfile";
import FantasyLeague from "@/models/fantasy/FantasyLeague";
import FantasyTeam from "@/models/fantasy/FantasyTeam";

// POST /api/fantasy/leagues/join
export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteCode } = await req.json();
  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code required" }, { status: 400 });
  }

  await connectDB();
  const me = await UserProfile.findOne({ clerkId });
  if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const league = await FantasyLeague.findOne({ inviteCode: inviteCode.toUpperCase() });
  if (!league) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  // Check if already a member
  const isMember = league.members.some(
    (m) => m.userId.toString() === me._id.toString()
  );
  if (isMember) {
    return NextResponse.json({ error: "Already a member" }, { status: 400 });
  }

  await league.updateOne({
    $push: {
      members: { userId: me._id, joinedAt: new Date(), totalPoints: 0 },
    },
  });

  // Create fantasy team for new member
  await FantasyTeam.create({
    userId: me._id,
    leagueId: league._id,
    name: `${me.displayName}'s Team`,
    formation: "4-3-3",
    players: [],
    totalPoints: 0,
    remainingBudget: 100,
  });

  return NextResponse.json({ league });
}
