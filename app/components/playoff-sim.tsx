import { getSeasonBundle, getStaticBundle, TEAM_ID } from "@/lib/espn/fetchers";
import { runMonteCarloSimulation } from "@/lib/sim/monteCarlo";
import type { Team } from "@/types/fantasy";
import PlayoffSimClient from "./playoff-sim.client";

export default async function PlayoffSim({
  teamId = TEAM_ID,
}: {
  teamId?: number;
}) {
  const [seasonBundle, statics] = await Promise.all([
    getSeasonBundle(),
    getStaticBundle(),
  ]);

  const teams: Team[] = Array.isArray(statics?.teams) ? statics.teams : [];
  const schedule = seasonBundle.schedule ?? [];
  const currentWeek = seasonBundle.status?.latestScoringPeriod ?? 1;
  const finalWeek = seasonBundle.status?.finalScoringPeriod ?? 14;

  const playoffSpots = Math.min(6, Math.floor(teams.length / 2));

  const output = runMonteCarloSimulation({
    schedule,
    teams,
    currentWeek,
    finalWeek,
    playoffSpots,
    simCount: 10_000,
  });

  return <PlayoffSimClient output={output} userTeamId={teamId} />;
}
