import { buildImpliedDvpFromProjections } from "@/lib/coach/dvp";
import { getStaticBundle, getWeeklyBundle } from "@/lib/espn/fetchers";
import { transformWeeklyToFantasyDTO } from "@/lib/espn/helpers";
import { buildTradePlayersFromRoster } from "@/lib/trade/evaluate";
import type { TradePlayer } from "@/types/trade";
import TradeAnalyzerClient from "./trade-analyzer.client";
import { analyzeTradeAction } from "./actions";

export default async function TradeAnalyzer({
  teamId,
}: {
  teamId: number;
}) {
  const [weekly, statics] = await Promise.all([
    getWeeklyBundle(),
    getStaticBundle(),
  ]);

  const weeklyDto = transformWeeklyToFantasyDTO(weekly, statics.teams);
  const currentWeek = weeklyDto.week;
  const dvpRanks = buildImpliedDvpFromProjections(weeklyDto, currentWeek);

  const myTeam = statics.teams.find((t) => t.id === teamId);

  // Build the matchup to find players with rosters
  const matchup = weeklyDto.matchups.find(
    (m) => m.home.teamId === teamId || m.away.teamId === teamId
  );

  const myRoster =
    matchup?.home.teamId === teamId
      ? matchup.home.roster ?? []
      : matchup?.away.roster ?? [];

  const myPlayers = buildTradePlayersFromRoster(myRoster, teamId);

  // Build rosters for all other teams from matchups
  const otherTeamPlayers: Record<number, TradePlayer[]> = {};
  for (const m of weeklyDto.matchups) {
    if (m.home.teamId !== teamId && m.home.roster?.length) {
      otherTeamPlayers[m.home.teamId] = buildTradePlayersFromRoster(
        m.home.roster,
        m.home.teamId
      );
    }
    if (m.away.teamId !== teamId && m.away.roster?.length) {
      otherTeamPlayers[m.away.teamId] = buildTradePlayersFromRoster(
        m.away.roster,
        m.away.teamId
      );
    }
  }

  const teamNames: Record<number, string> = {};
  for (const t of statics.teams) {
    teamNames[t.id] =
      t.name ?? (`${t.location ?? ""} ${t.nickname ?? ""}`.trim() || `Team ${t.id}`);
  }

  return (
    <TradeAnalyzerClient
      myTeamId={teamId}
      myTeamName={
        myTeam?.name ??
        (`${myTeam?.location ?? ""} ${myTeam?.nickname ?? ""}`.trim() ||
        "My Team")
      }
      myPlayers={myPlayers}
      otherTeamPlayers={otherTeamPlayers}
      teamNames={teamNames}
      dvpRanksJson={JSON.stringify(dvpRanks)}
      allTeamsJson={JSON.stringify(statics.teams)}
      analyzeAction={analyzeTradeAction}
    />
  );
}
