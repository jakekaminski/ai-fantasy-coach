import { buildWaiverAnalysis } from "@/lib/coach/waivers";
import { buildImpliedDvpFromProjections } from "@/lib/coach/dvp";
import {
  fetchFreeAgents,
  getStaticBundle,
  getWeeklyBundle,
  TEAM_ID,
} from "@/lib/espn/fetchers";
import { transformWeeklyToFantasyDTO } from "@/lib/espn/helpers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = Number(searchParams.get("teamId")) || TEAM_ID;
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const [freeAgentBundle, weekly, statics] = await Promise.all([
      fetchFreeAgents(limit),
      getWeeklyBundle(),
      getStaticBundle(),
    ]);

    const weeklyDto = transformWeeklyToFantasyDTO(weekly, statics.teams);
    const currentWeek = weeklyDto.week;
    const dvpRanks = buildImpliedDvpFromProjections(weeklyDto, currentWeek);

    const userTeam = statics.teams.find((t) => t.id === teamId);
    if (!userTeam) {
      return NextResponse.json(
        { error: `Team ${teamId} not found` },
        { status: 404 }
      );
    }

    const matchup = weeklyDto.matchups.find(
      (m) => m.home.teamId === teamId || m.away.teamId === teamId
    );
    const rosterCards =
      (matchup?.home.teamId === teamId
        ? matchup.home.roster
        : matchup?.away.roster) ?? [];

    // Detect FAAB from team transaction counter (heuristic: if acquisitions exist)
    const usesFaab = false;
    const faabRemaining = undefined;

    const analysis = buildWaiverAnalysis({
      freeAgents: freeAgentBundle.players ?? [],
      userTeam,
      rosterCards,
      dvpRanks,
      currentWeek,
      usesFaab,
      faabRemaining,
    });

    return NextResponse.json(analysis, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300",
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
