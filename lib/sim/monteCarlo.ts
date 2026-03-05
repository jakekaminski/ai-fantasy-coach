import type {
  MatchupScoreSchedule,
  SimulationOutput,
  SimulationResult,
  Team,
} from "@/types/fantasy";

const DEFAULT_SIM_COUNT = 10_000;
const DEFAULT_PLAYOFF_SPOTS = 6;
const SCORE_FLOOR = 40;

interface TeamStats {
  teamId: number;
  teamName: string;
  scores: number[];
  mean: number;
  stdDev: number;
  wins: number;
  losses: number;
}

/**
 * Box-Muller transform to generate normally-distributed random numbers.
 */
function randomNormal(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
  return mean + z * std;
}

function deriveTeamName(team: Team): string {
  const name = team.name ?? `${team.location ?? ""} ${team.nickname ?? ""}`.trim();
  return name || `Team ${team.id}`;
}

/**
 * Build per-team scoring stats from completed matchups.
 */
function buildTeamStats(
  schedule: MatchupScoreSchedule[],
  teams: Team[],
  currentWeek: number
): Map<number, TeamStats> {
  const statsMap = new Map<number, TeamStats>();

  for (const t of teams) {
    statsMap.set(t.id, {
      teamId: t.id,
      teamName: deriveTeamName(t),
      scores: [],
      mean: 0,
      stdDev: 0,
      wins: 0,
      losses: 0,
    });
  }

  const completed = schedule.filter(
    (m) =>
      m.matchupPeriodId <= currentWeek &&
      m.winner !== "UNDECIDED" &&
      (m.playoffTierType === "NONE" || !m.playoffTierType)
  );

  for (const m of completed) {
    const homeStats = statsMap.get(m.home.teamId);
    const awayStats = statsMap.get(m.away.teamId);

    if (homeStats) {
      homeStats.scores.push(m.home.totalPoints);
      if (m.winner === "HOME") homeStats.wins++;
      else if (m.winner === "AWAY") homeStats.losses++;
    }
    if (awayStats) {
      awayStats.scores.push(m.away.totalPoints);
      if (m.winner === "AWAY") awayStats.wins++;
      else if (m.winner === "HOME") awayStats.losses++;
    }
  }

  for (const stats of statsMap.values()) {
    if (stats.scores.length > 0) {
      stats.mean =
        stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
      const variance =
        stats.scores.reduce((s, x) => s + (x - stats.mean) ** 2, 0) /
        stats.scores.length;
      stats.stdDev = Math.sqrt(variance);
    } else {
      stats.mean = 110;
      stats.stdDev = 18;
    }

    if (stats.stdDev < 5) stats.stdDev = 15;
  }

  return statsMap;
}

/**
 * Rank teams by wins (tiebreak: total points scored in the sim).
 * Returns sorted array of { teamId, wins, totalPoints }.
 */
function rankTeams(
  simWins: Map<number, number>,
  simPoints: Map<number, number>
): { teamId: number; wins: number; totalPoints: number }[] {
  const entries = Array.from(simWins.entries()).map(([teamId, wins]) => ({
    teamId,
    wins,
    totalPoints: simPoints.get(teamId) ?? 0,
  }));

  entries.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalPoints - a.totalPoints;
  });

  return entries;
}

export function runMonteCarloSimulation(params: {
  schedule: MatchupScoreSchedule[];
  teams: Team[];
  currentWeek: number;
  finalWeek: number;
  playoffSpots?: number;
  simCount?: number;
}): SimulationOutput {
  const {
    schedule,
    teams,
    currentWeek,
    finalWeek,
    playoffSpots = DEFAULT_PLAYOFF_SPOTS,
    simCount = DEFAULT_SIM_COUNT,
  } = params;

  const teamStats = buildTeamStats(schedule, teams, currentWeek);
  const teamIds = teams.map((t) => t.id);

  const remainingMatchups = schedule.filter(
    (m) =>
      m.matchupPeriodId > currentWeek &&
      m.matchupPeriodId <= finalWeek &&
      (m.playoffTierType === "NONE" || !m.playoffTierType)
  );

  const playoffCount = new Map<number, number>();
  const seedCounts = new Map<number, Map<number, number>>();
  const champCount = new Map<number, number>();
  const totalWins = new Map<number, number>();

  for (const id of teamIds) {
    playoffCount.set(id, 0);
    champCount.set(id, 0);
    totalWins.set(id, 0);
    seedCounts.set(id, new Map());
  }

  for (let sim = 0; sim < simCount; sim++) {
    const simWins = new Map<number, number>();
    const simPoints = new Map<number, number>();

    for (const id of teamIds) {
      const stats = teamStats.get(id)!;
      simWins.set(id, stats.wins);
      simPoints.set(id, stats.scores.reduce((a, b) => a + b, 0));
    }

    for (const matchup of remainingMatchups) {
      const homeStats = teamStats.get(matchup.home.teamId);
      const awayStats = teamStats.get(matchup.away.teamId);
      if (!homeStats || !awayStats) continue;

      const homeScore = Math.max(
        SCORE_FLOOR,
        randomNormal(homeStats.mean, homeStats.stdDev)
      );
      const awayScore = Math.max(
        SCORE_FLOOR,
        randomNormal(awayStats.mean, awayStats.stdDev)
      );

      simPoints.set(
        matchup.home.teamId,
        (simPoints.get(matchup.home.teamId) ?? 0) + homeScore
      );
      simPoints.set(
        matchup.away.teamId,
        (simPoints.get(matchup.away.teamId) ?? 0) + awayScore
      );

      if (homeScore >= awayScore) {
        simWins.set(
          matchup.home.teamId,
          (simWins.get(matchup.home.teamId) ?? 0) + 1
        );
      } else {
        simWins.set(
          matchup.away.teamId,
          (simWins.get(matchup.away.teamId) ?? 0) + 1
        );
      }
    }

    const ranked = rankTeams(simWins, simPoints);

    for (let i = 0; i < ranked.length; i++) {
      const { teamId, wins } = ranked[i];
      const seed = i + 1;

      totalWins.set(teamId, (totalWins.get(teamId) ?? 0) + wins);

      const teamSeeds = seedCounts.get(teamId)!;
      teamSeeds.set(seed, (teamSeeds.get(seed) ?? 0) + 1);

      if (seed <= playoffSpots) {
        playoffCount.set(teamId, (playoffCount.get(teamId) ?? 0) + 1);
      }

      if (seed === 1) {
        champCount.set(teamId, (champCount.get(teamId) ?? 0) + 1);
      }
    }
  }

  const remainingGamesPerTeam = new Map<number, number>();
  for (const m of remainingMatchups) {
    remainingGamesPerTeam.set(
      m.home.teamId,
      (remainingGamesPerTeam.get(m.home.teamId) ?? 0) + 1
    );
    remainingGamesPerTeam.set(
      m.away.teamId,
      (remainingGamesPerTeam.get(m.away.teamId) ?? 0) + 1
    );
  }

  const results: SimulationResult[] = teamIds.map((id) => {
    const stats = teamStats.get(id)!;
    const avgWins = (totalWins.get(id) ?? 0) / simCount;
    const totalGames =
      stats.wins + stats.losses + (remainingGamesPerTeam.get(id) ?? 0);

    const teamSeeds = seedCounts.get(id)!;
    const seedDistribution: Record<number, number> = {};
    let bestSeed = teamIds.length;
    let bestSeedCount = 0;

    for (const [seed, count] of teamSeeds.entries()) {
      seedDistribution[seed] = Math.round((count / simCount) * 1000) / 10;
      if (count > bestSeedCount) {
        bestSeedCount = count;
        bestSeed = seed;
      }
    }

    const playoffProb =
      Math.round(((playoffCount.get(id) ?? 0) / simCount) * 1000) / 10;
    const magicNumber = computeMagicNumber(
      stats.wins,
      remainingGamesPerTeam.get(id) ?? 0,
      playoffProb
    );

    return {
      teamId: id,
      teamName: stats.teamName,
      currentWins: stats.wins,
      currentLosses: stats.losses,
      avgProjectedWins: Math.round(avgWins * 10) / 10,
      avgProjectedLosses: Math.round((totalGames - avgWins) * 10) / 10,
      playoffProbability: playoffProb,
      projectedSeed: bestSeed,
      seedDistribution,
      championshipProbability:
        Math.round(((champCount.get(id) ?? 0) / simCount) * 1000) / 10,
      magicNumber,
    };
  });

  results.sort((a, b) => b.playoffProbability - a.playoffProbability);

  return {
    results,
    simulationCount: simCount,
    playoffSpots,
    currentWeek,
    totalWeeks: finalWeek,
  };
}

/**
 * Estimate wins needed to clinch a playoff spot.
 * Uses a heuristic: if already >95% probability, magic number is 0.
 * Otherwise, estimate the win total needed for the Nth-place team cutoff.
 */
function computeMagicNumber(
  currentWins: number,
  remainingGames: number,
  playoffProb: number
): number | null {
  if (playoffProb >= 99.9) return 0;
  if (playoffProb < 0.1 && remainingGames === 0) return null;

  const maxWins = currentWins + remainingGames;
  const targetWins = Math.ceil(maxWins * 0.55);
  const needed = Math.max(0, targetWins - currentWins);

  if (needed > remainingGames) return null;
  return needed;
}
