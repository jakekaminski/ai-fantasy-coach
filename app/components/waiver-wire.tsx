import { buildImpliedDvpFromProjections } from "@/lib/coach/dvp";
import { summarizeWaiverTargets } from "@/lib/coach/summarize";
import { buildWaiverAnalysis } from "@/lib/coach/waivers";
import {
  fetchFreeAgents,
  getStaticBundle,
  getWeeklyBundle,
  TEAM_ID,
} from "@/lib/espn/fetchers";
import { transformWeeklyToFantasyDTO } from "@/lib/espn/helpers";
import type { WaiverAnalysis, WaiverSummaryLLM } from "@/types/coach";
import WaiverWireClient from "./waiver-wire.client";

export async function refreshWaiverSummaryAction(
  _prev: { ai: WaiverSummaryLLM | null; error: string | null },
  formData: FormData
): Promise<{ ai: WaiverSummaryLLM | null; error: string | null }> {
  "use server";
  try {
    const raw = formData.get("analysis");
    if (!raw || typeof raw !== "string") {
      return { ai: null, error: "No input provided" };
    }
    const analysis: WaiverAnalysis = JSON.parse(raw);
    const ai = await summarizeWaiverTargets(analysis);
    return { ai, error: null };
  } catch (e: unknown) {
    return {
      ai: null,
      error: (e as Error).message ?? "Failed to generate waiver summary.",
    };
  }
}

export default async function WaiverWire({
  week,
  teamId,
}: {
  week: number;
  teamId: number;
}) {
  let analysis: WaiverAnalysis;

  try {
    const [freeAgentBundle, weekly, statics] = await Promise.all([
      fetchFreeAgents(50),
      getWeeklyBundle(),
      getStaticBundle(),
    ]);

    const weeklyDto = transformWeeklyToFantasyDTO(weekly, statics.teams);
    const currentWeek = week || weeklyDto.week;
    const dvpRanks = buildImpliedDvpFromProjections(weeklyDto, currentWeek);

    const resolvedTeamId = teamId || TEAM_ID;
    const userTeam = statics.teams.find((t) => t.id === resolvedTeamId);

    if (!userTeam) {
      return (
        <WaiverWireClient
          analysis={{
            week: currentWeek,
            recommendations: [],
            usesFaab: false,
          }}
          refreshAction={refreshWaiverSummaryAction}
        />
      );
    }

    const matchup = weeklyDto.matchups.find(
      (m) =>
        m.home.teamId === resolvedTeamId || m.away.teamId === resolvedTeamId
    );
    const rosterCards =
      (matchup?.home.teamId === resolvedTeamId
        ? matchup.home.roster
        : matchup?.away.roster) ?? [];

    analysis = buildWaiverAnalysis({
      freeAgents: freeAgentBundle.players ?? [],
      userTeam,
      rosterCards,
      dvpRanks,
      currentWeek,
      usesFaab: false,
      faabRemaining: undefined,
    });
  } catch {
    analysis = {
      week: week || 1,
      recommendations: [],
      usesFaab: false,
    };
  }

  return (
    <WaiverWireClient
      analysis={analysis}
      refreshAction={refreshWaiverSummaryAction}
    />
  );
}
