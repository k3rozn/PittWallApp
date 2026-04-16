import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import connectDB from "@/lib/mongodb";
import UserProfile from "@/models/social/UserProfile";
import FantasyLeague from "@/models/fantasy/FantasyLeague";
import FantasyTeam from "@/models/fantasy/FantasyTeam";
import FantasyPoints from "@/models/fantasy/FantasyPoints";

// GET /api/fantasy/leagues/[id] — league details + ranking
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const me = await UserProfile.findOne({ clerkId });
  if (!me) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const league = await FantasyLeague.findById(id)
    .populate("members.userId", "username displayName avatar")
    .lean();

  if (!league) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check membership
  const isMember = league.members.some(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (m: any) => m.userId._id?.toString() === me._id.toString() || m.userId?.toString() === me._id.toString()
  );
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get teams and rank
  const teams = await FantasyTeam.find({ leagueId: id })
    .populate("userId", "username displayName avatar")
    .lean();

  // Get points history
  const pointsHistory = await FantasyPoints.find({ leagueId: id })
    .sort({ roundNumber: -1, totalRoundPoints: -1 })
    .lean();

  const myTeam = teams.find(
    (t) => t.userId?._id?.toString() === me._id.toString() || t.userId?.toString() === me._id.toString()
  );

  return NextResponse.json({ league, teams, pointsHistory, myTeam });
}
