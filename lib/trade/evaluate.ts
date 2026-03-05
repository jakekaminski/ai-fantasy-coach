import type { PositionLabel } from "@/types/coach";
import type { DvpRanks } from "@/types/coach";
import type { PlayerCard, Team } from "@/types/fantasy";
import type {
  PositionalScarcityItem,
  TradeEvaluation,
  TradeGrade,
  TradePlayer,
} from "@/types/trade";
import { positionMap } from "@/lib/espn/positions";

const POSITION_LABELS: PositionLabel[] = [
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "D/ST",
];

/** Typical starter counts per position used for scarcity calculations. */
const STARTER_COUNTS: Record<PositionLabel, number> = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  K: 1,
  "D/ST": 1,
};

/** Weight multipliers for positional scarcity — scarcer positions matter more. */
const SCARCITY_WEIGHT: Record<PositionLabel, number> = {
  QB: 1.0,
  RB: 1.4,
  WR: 1.2,
  TE: 1.3,
  K: 0.4,
  "D/ST": 0.5,
};

function toPositionLabel(raw: string): PositionLabel | undefined {
  if (POSITION_LABELS.includes(raw as PositionLabel))
    return raw as PositionLabel;
  return positionMap[Number(raw)] as PositionLabel | undefined;
}

function playerCardToTradePlayer(
  card: PlayerCard,
  fantasyTeamId: number
): TradePlayer | null {
  const pos = toPositionLabel(card.position);
  if (!pos) return null;
  return {
    id: card.id,
    name: card.name,
    position: pos,
    team: card.team,
    projectedPoints: card.projectedPoints,
    actualPoints: card.actualPoints,
    fantasyTeamId,
  };
}

export function buildTradePlayersFromRoster(
  roster: PlayerCard[],
  fantasyTeamId: number
): TradePlayer[] {
  return roster
    .map((card) => playerCardToTradePlayer(card, fantasyTeamId))
    .filter((p): p is TradePlayer => p !== null);
}

/**
 * Compute average schedule strength for a set of players.
 * Uses DvP ranks: lower rank = tougher schedule = lower multiplier.
 * Returns a normalised 0–100 scale (50 = average).
 */
function avgScheduleStrength(
  players: TradePlayer[],
  dvpRanks: DvpRanks,
  allTeams: Team[]
): number {
  if (!players.length) return 50;

  let total = 0;
  let count = 0;

  for (const p of players) {
    const nflTeam = allTeams.find(
      (t) =>
        t.abbrev?.toUpperCase() === p.team.toUpperCase() ||
        t.id === p.fantasyTeamId
    );
    if (!nflTeam) continue;

    const rank = dvpRanks[nflTeam.id]?.[p.position];
    if (typeof rank !== "number") continue;

    // Normalise 1..32 to roughly 0..100 (32 = softest = 100)
    total += (rank / 32) * 100;
    count++;
  }

  return count > 0 ? total / count : 50;
}

function computePositionalScarcity(
  giving: TradePlayer[],
  receiving: TradePlayer[],
  myRoster: TradePlayer[]
): PositionalScarcityItem[] {
  const items: PositionalScarcityItem[] = [];

  for (const pos of POSITION_LABELS) {
    const givingAtPos = giving.filter((p) => p.position === pos).length;
    const receivingAtPos = receiving.filter((p) => p.position === pos).length;

    if (givingAtPos === 0 && receivingAtPos === 0) continue;

    const currentAtPos = myRoster.filter((p) => p.position === pos).length;
    const afterTrade = currentAtPos - givingAtPos + receivingAtPos;
    const minStarters = STARTER_COUNTS[pos];

    let impact: PositionalScarcityItem["impact"] = "neutral";
    if (afterTrade < minStarters && currentAtPos >= minStarters) {
      impact = "negative";
    } else if (afterTrade > currentAtPos) {
      impact = receivingAtPos > givingAtPos ? "positive" : "neutral";
    } else if (givingAtPos > receivingAtPos) {
      impact = afterTrade >= minStarters + 1 ? "neutral" : "negative";
    }

    items.push({
      position: pos,
      givingCount: givingAtPos,
      receivingCount: receivingAtPos,
      impact,
    });
  }

  return items;
}

/**
 * Map a numeric score differential to a letter grade.
 * score range roughly: -50 (terrible) .. 0 (even) .. +50 (great)
 */
function scoreToGrade(score: number): { grade: TradeGrade; label: string } {
  if (score >= 30) return { grade: "A+", label: "Exceptional" };
  if (score >= 22) return { grade: "A", label: "Great" };
  if (score >= 16) return { grade: "A-", label: "Very Good" };
  if (score >= 11) return { grade: "B+", label: "Good" };
  if (score >= 6) return { grade: "B", label: "Above Average" };
  if (score >= 2) return { grade: "B-", label: "Slightly Favorable" };
  if (score >= -2) return { grade: "C+", label: "Roughly Even" };
  if (score >= -5) return { grade: "C", label: "Fair" };
  if (score >= -10) return { grade: "C-", label: "Slightly Unfavorable" };
  if (score >= -15) return { grade: "D+", label: "Below Average" };
  if (score >= -21) return { grade: "D", label: "Poor" };
  if (score >= -29) return { grade: "D-", label: "Bad" };
  return { grade: "F", label: "Terrible" };
}

export function evaluateTrade({
  giving,
  receiving,
  myRoster,
  dvpRanks,
  allTeams,
}: {
  giving: TradePlayer[];
  receiving: TradePlayer[];
  myRoster: TradePlayer[];
  dvpRanks: DvpRanks;
  allTeams: Team[];
}): TradeEvaluation {
  // 1. Projection delta
  const givingProj = giving.reduce((s, p) => s + p.projectedPoints, 0);
  const receivingProj = receiving.reduce((s, p) => s + p.projectedPoints, 0);
  const projectionDelta = receivingProj - givingProj;

  // 2. Positional scarcity
  const positionalScarcity = computePositionalScarcity(
    giving,
    receiving,
    myRoster
  );

  // 3. Schedule strength
  const givingAvg = avgScheduleStrength(giving, dvpRanks, allTeams);
  const receivingAvg = avgScheduleStrength(receiving, dvpRanks, allTeams);

  // Composite score: weighted combination of all factors
  let compositeScore = 0;

  // Projection delta contributes most (scale to roughly ±30 range)
  compositeScore += Math.max(-30, Math.min(30, projectionDelta * 0.8));

  // Schedule strength differential (scale ±10)
  const schedDiff = receivingAvg - givingAvg;
  compositeScore += Math.max(-10, Math.min(10, schedDiff * 0.2));

  // Positional scarcity penalty/bonus (±10)
  for (const item of positionalScarcity) {
    const weight = SCARCITY_WEIGHT[item.position];
    if (item.impact === "negative") compositeScore -= 4 * weight;
    if (item.impact === "positive") compositeScore += 2 * weight;
  }

  const { grade, label: gradeLabel } = scoreToGrade(compositeScore);

  // Deterministic summary
  const summaryParts: string[] = [];
  if (projectionDelta > 0) {
    summaryParts.push(
      `You gain ${projectionDelta.toFixed(1)} projected points.`
    );
  } else if (projectionDelta < 0) {
    summaryParts.push(
      `You lose ${Math.abs(projectionDelta).toFixed(1)} projected points.`
    );
  } else {
    summaryParts.push("Projected points are roughly even.");
  }

  const negScarcity = positionalScarcity.filter(
    (s) => s.impact === "negative"
  );
  if (negScarcity.length) {
    summaryParts.push(
      `Roster depth concern at ${negScarcity.map((s) => s.position).join(", ")}.`
    );
  }

  if (Math.abs(schedDiff) > 10) {
    summaryParts.push(
      schedDiff > 0
        ? "Receiving players have an easier remaining schedule."
        : "Giving up players with easier remaining schedules."
    );
  }

  return {
    giving,
    receiving,
    projectionDelta,
    positionalScarcity,
    scheduleStrength: { givingAvg, receivingAvg },
    grade,
    gradeLabel,
    summary: summaryParts.join(" "),
  };
}
