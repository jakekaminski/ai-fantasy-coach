import type {
  DvpRanks,
  PositionLabel,
  WaiverAnalysis,
  WaiverRecommendation,
} from "@/types/coach";
import type {
  FreeAgentEntry,
  PlayerCard,
  PlayerStatLine,
  RosterEntry,
  Team,
} from "@/types/fantasy";
import { YEAR } from "@/lib/espn/fetchers";
import { getPositionLabel } from "@/lib/espn/positions";
import { mapOpponentRankToMultiplier } from "./scoring";

const VALID_POSITIONS: PositionLabel[] = [
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "D/ST",
];

const STARTER_COUNTS: Record<PositionLabel, number> = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  K: 1,
  "D/ST": 1,
};

/** NFL pro-team abbreviation lookup (ESPN proTeamId -> abbreviation). */
const PRO_TEAM_ABBREV: Record<number, string> = {
  1: "ATL",
  2: "BUF",
  3: "CHI",
  4: "CIN",
  5: "CLE",
  6: "DAL",
  7: "DEN",
  8: "DET",
  9: "GB",
  10: "TEN",
  11: "IND",
  12: "KC",
  13: "LV",
  14: "LAR",
  15: "MIA",
  16: "MIN",
  17: "NE",
  18: "NO",
  19: "NYG",
  20: "NYJ",
  21: "PHI",
  22: "ARI",
  23: "PIT",
  24: "LAC",
  25: "SF",
  26: "SEA",
  27: "TB",
  28: "WSH",
  29: "CAR",
  30: "JAX",
  33: "BAL",
  34: "HOU",
};

function proTeamAbbrev(entry: FreeAgentEntry): string {
  return (
    entry.player.proTeamAbbreviation ??
    PRO_TEAM_ABBREV[entry.player.proTeamId] ??
    "??"
  );
}

function getProjectedPoints(
  stats: PlayerStatLine[],
  week: number
): number {
  const proj = stats.find(
    (s) =>
      s.statSourceId === 1 &&
      s.scoringPeriodId === week &&
      s.seasonId === YEAR
  );
  return proj?.appliedTotal ?? 0;
}

/**
 * Average projected points over the next N weeks.
 * Falls back to the current week's projection if future weeks aren't available.
 */
function projectedPointsNextNWeeks(
  stats: PlayerStatLine[],
  currentWeek: number,
  n: number
): number {
  let total = 0;
  let count = 0;
  for (let w = currentWeek; w < currentWeek + n; w++) {
    const pts = getProjectedPoints(stats, w);
    if (pts > 0) {
      total += pts;
      count++;
    }
  }
  if (count === 0) {
    const fallback = getProjectedPoints(stats, currentWeek);
    return fallback;
  }
  return total / count;
}

/**
 * Recent trend: average actual points in last 3 games vs season average.
 * Returns { recentAvg, seasonAvg, trend } where trend = recentAvg - seasonAvg.
 */
function computeTrend(
  stats: PlayerStatLine[],
  currentWeek: number
): { recentAvg: number; seasonAvg: number; trend: number } {
  const actuals = stats
    .filter(
      (s) =>
        s.statSourceId === 0 &&
        s.seasonId === YEAR &&
        s.scoringPeriodId < currentWeek
    )
    .sort((a, b) => b.scoringPeriodId - a.scoringPeriodId);

  const recent = actuals.slice(0, 3);
  const recentAvg =
    recent.length > 0
      ? recent.reduce((sum, s) => sum + (s.appliedTotal ?? 0), 0) /
        recent.length
      : 0;

  const seasonAvg =
    actuals.length > 0
      ? actuals.reduce((sum, s) => sum + (s.appliedTotal ?? 0), 0) /
        actuals.length
      : 0;

  return { recentAvg, seasonAvg, trend: recentAvg - seasonAvg };
}

/**
 * Compute positional need: how thin is the user's roster at this position?
 * Returns 0..1 where 1 = highest need.
 */
function computePositionalNeed(
  position: PositionLabel,
  rosterCards: PlayerCard[]
): number {
  const posPlayers = rosterCards.filter((p) => {
    const label = getPositionLabel(Number(p.position));
    return label === position;
  });

  const starterCount = STARTER_COUNTS[position] ?? 1;
  const idealDepth = starterCount + 1;

  if (posPlayers.length === 0) return 1.0;
  if (posPlayers.length <= starterCount) return 0.8;
  if (posPlayers.length <= idealDepth) return 0.4;
  return 0.1;
}

/**
 * Find the weakest rostered player to recommend dropping.
 */
function findDropCandidate(
  position: PositionLabel,
  rosterEntries: RosterEntry[],
  currentWeek: number
): WaiverRecommendation["dropCandidate"] | undefined {
  const benchEntries = rosterEntries.filter((e) => e.lineupSlotId === 20);

  if (benchEntries.length === 0) return undefined;

  let worst: {
    name: string;
    position: string;
    projectedPoints: number;
  } | null = null;

  for (const entry of benchEntries) {
    const p = entry.playerPoolEntry.player;
    const pos = getPositionLabel(p.defaultPositionId);
    const proj = getProjectedPoints(p.stats ?? [], currentWeek);

    if (!worst || proj < worst.projectedPoints) {
      worst = {
        name: p.fullName || `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
        position: pos,
        projectedPoints: Math.round(proj * 10) / 10,
      };
    }
  }

  // Prefer same-position drops if available
  const samePosDrops = benchEntries.filter((e) => {
    const pos = getPositionLabel(e.playerPoolEntry.player.defaultPositionId);
    return pos === position;
  });

  if (samePosDrops.length > 0) {
    let worstSamePos: typeof worst = null;
    for (const entry of samePosDrops) {
      const p = entry.playerPoolEntry.player;
      const pos = getPositionLabel(p.defaultPositionId);
      const proj = getProjectedPoints(p.stats ?? [], currentWeek);
      if (!worstSamePos || proj < worstSamePos.projectedPoints) {
        worstSamePos = {
          name:
            p.fullName || `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim(),
          position: pos,
          projectedPoints: Math.round(proj * 10) / 10,
        };
      }
    }
    if (worstSamePos) return worstSamePos;
  }

  return worst ?? undefined;
}

function buildReason(
  projPts: number,
  trend: number,
  matchupMult: number,
  positionalNeed: number,
  position: PositionLabel
): string {
  const parts: string[] = [];

  if (projPts >= 15) parts.push(`${projPts.toFixed(1)} pts projected`);
  else if (projPts >= 10) parts.push(`${projPts.toFixed(1)} pts projected`);

  if (trend > 2) parts.push("trending up");
  else if (trend > 0.5) parts.push("on the rise");

  if (matchupMult > 1.05) parts.push("favorable upcoming matchup");

  if (positionalNeed >= 0.8) parts.push(`fills ${position} need`);
  else if (positionalNeed >= 0.4) parts.push(`adds ${position} depth`);

  if (parts.length === 0) parts.push("solid weekly upside");

  return parts.join("; ");
}

/**
 * Estimate a FAAB bid as percentage of remaining budget, scaled by composite score.
 */
function estimateFaab(
  compositeScore: number,
  maxScore: number,
  faabRemaining: number
): number {
  if (maxScore <= 0 || faabRemaining <= 0) return 0;
  const pct = Math.min(compositeScore / maxScore, 1);
  const bid = Math.round(faabRemaining * pct * 0.3);
  return Math.max(1, Math.min(bid, faabRemaining));
}

export function buildWaiverAnalysis({
  freeAgents,
  userTeam,
  rosterCards,
  dvpRanks,
  currentWeek,
  usesFaab,
  faabRemaining,
}: {
  freeAgents: FreeAgentEntry[];
  userTeam: Team;
  rosterCards: PlayerCard[];
  dvpRanks: DvpRanks;
  currentWeek: number;
  usesFaab: boolean;
  faabRemaining?: number;
}): WaiverAnalysis {
  const rosterEntries = userTeam.roster?.entries ?? [];

  const scored: WaiverRecommendation[] = [];

  for (const fa of freeAgents) {
    const pos = getPositionLabel(fa.player.defaultPositionId);
    if (!VALID_POSITIONS.includes(pos as PositionLabel)) continue;

    const position = pos as PositionLabel;
    const stats = fa.player.stats ?? [];

    const projPts = projectedPointsNextNWeeks(stats, currentWeek, 3);
    if (projPts <= 0) continue;

    const { recentAvg, seasonAvg, trend } = computeTrend(
      stats,
      currentWeek
    );

    // Matchup quality for the upcoming week
    const matchupRank =
      dvpRanks[fa.player.proTeamId]?.[position] ?? 16;
    const matchupMult = mapOpponentRankToMultiplier(matchupRank);

    const positionalNeed = computePositionalNeed(position, rosterCards);

    // Composite scoring: weighted blend
    const W_PROJ = 0.40;
    const W_TREND = 0.20;
    const W_MATCHUP = 0.20;
    const W_NEED = 0.20;

    const normalizedProj = Math.min(projPts / 25, 1);
    const normalizedTrend = Math.min(Math.max(trend + 5, 0) / 15, 1);
    const normalizedMatchup = (matchupMult - 0.9) / 0.2;

    const compositeScore =
      W_PROJ * normalizedProj +
      W_TREND * normalizedTrend +
      W_MATCHUP * normalizedMatchup +
      W_NEED * positionalNeed;

    const reason = buildReason(
      projPts,
      trend,
      matchupMult,
      positionalNeed,
      position
    );

    const dropCandidate = findDropCandidate(
      position,
      rosterEntries,
      currentWeek
    );

    scored.push({
      player: {
        id: fa.player.id,
        name:
          fa.player.fullName ||
          `${fa.player.firstName ?? ""} ${fa.player.lastName ?? ""}`.trim(),
        position,
        team: proTeamAbbrev(fa),
        proTeamId: fa.player.proTeamId,
      },
      projectedPoints: Math.round(projPts * 10) / 10,
      recentAvg: Math.round(recentAvg * 10) / 10,
      seasonAvg: Math.round(seasonAvg * 10) / 10,
      trend: Math.round(trend * 10) / 10,
      matchupRating: matchupRank,
      positionalNeed,
      compositeScore: Math.round(compositeScore * 1000) / 1000,
      reason,
      dropCandidate,
    });
  }

  scored.sort((a, b) => b.compositeScore - a.compositeScore);

  const maxScore = scored[0]?.compositeScore ?? 0;

  if (usesFaab && faabRemaining !== undefined) {
    for (const rec of scored) {
      rec.faabRecommendation = estimateFaab(
        rec.compositeScore,
        maxScore,
        faabRemaining
      );
    }
  }

  return {
    week: currentWeek,
    recommendations: scored.slice(0, 10),
    usesFaab,
    faabRemaining,
  };
}
