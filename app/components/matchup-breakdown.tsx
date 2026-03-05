import { buildImpliedDvpFromProjections } from "@/lib/coach/dvp";
import { getStaticBundle, getWeeklyBundle } from "@/lib/espn/fetchers";
import { transformWeeklyToFantasyDTO } from "@/lib/espn/helpers";
import type { DvpRanks, PositionLabel } from "@/types/coach";
import type { PlayerCard } from "@/types/fantasy";
import MatchupBreakdownClient, {
  type BreakdownData,
  type PositionSlot,
  type SlotComparison,
} from "./matchup-breakdown.client";

type Props = {
  week: number;
  teamId: number;
};

const POSITION_SLOTS: PositionSlot[] = [
  "QB",
  "RB1",
  "RB2",
  "WR1",
  "WR2",
  "TE",
  "FLEX",
  "D/ST",
  "K",
];

const SLOT_TO_DVP: Record<PositionSlot, PositionLabel | null> = {
  QB: "QB",
  RB1: "RB",
  RB2: "RB",
  WR1: "WR",
  WR2: "WR",
  TE: "TE",
  FLEX: null,
  "D/ST": "D/ST",
  K: "K",
};

/* ------------------------------------------------------------------ */
/*  Slot assignment                                                    */
/* ------------------------------------------------------------------ */

function assignSlots(
  roster: PlayerCard[]
): Record<PositionSlot, PlayerCard | null> {
  const starters = roster.filter((p) => !p.bench);
  const hasSlotData = starters.some((p) => p.lineupSlotId !== undefined);

  if (hasSlotData) {
    const bySlot = new Map<number, PlayerCard[]>();
    for (const p of starters) {
      const sid = p.lineupSlotId ?? -1;
      if (!bySlot.has(sid)) bySlot.set(sid, []);
      bySlot.get(sid)!.push(p);
    }
    const sort = (arr: PlayerCard[]) =>
      arr.sort((a, b) => b.projectedPoints - a.projectedPoints);

    const qbs = sort(bySlot.get(0) ?? []);
    const rbs = sort(bySlot.get(2) ?? []);
    const wrs = sort([...(bySlot.get(3) ?? []), ...(bySlot.get(4) ?? [])]);
    const tes = sort(bySlot.get(6) ?? []);
    const flex = sort(bySlot.get(23) ?? []);
    const ks = sort(bySlot.get(5) ?? []);
    const dsts = sort(bySlot.get(16) ?? bySlot.get(17) ?? []);

    return {
      QB: qbs[0] ?? null,
      RB1: rbs[0] ?? null,
      RB2: rbs[1] ?? null,
      WR1: wrs[0] ?? null,
      WR2: wrs[1] ?? null,
      TE: tes[0] ?? null,
      FLEX: flex[0] ?? null,
      "D/ST": dsts[0] ?? null,
      K: ks[0] ?? null,
    };
  }

  // Fallback: group by position
  const byPos = (posId: string) =>
    starters
      .filter((p) => p.position === posId)
      .sort((a, b) => b.projectedPoints - a.projectedPoints);

  const qbs = byPos("1");
  const rbs = byPos("2");
  const wrs = byPos("3");
  const tes = byPos("4");
  const ks = byPos("5");
  const dsts = byPos("16");

  const flexCandidates = [...rbs.slice(2), ...wrs.slice(2), ...tes.slice(1)]
    .sort((a, b) => b.projectedPoints - a.projectedPoints);

  return {
    QB: qbs[0] ?? null,
    RB1: rbs[0] ?? null,
    RB2: rbs[1] ?? null,
    WR1: wrs[0] ?? null,
    WR2: wrs[1] ?? null,
    TE: tes[0] ?? null,
    FLEX: flexCandidates[0] ?? null,
    "D/ST": dsts[0] ?? null,
    K: ks[0] ?? null,
  };
}

/* ------------------------------------------------------------------ */
/*  Matchup quality from DvP ranks                                     */
/* ------------------------------------------------------------------ */

function getMatchupQuality(
  dvpRanks: DvpRanks,
  oppTeamId: number,
  slot: PositionSlot
): "good" | "neutral" | "bad" {
  const dvpPos = SLOT_TO_DVP[slot];
  if (!dvpPos) return "neutral";

  const rank = dvpRanks[oppTeamId]?.[dvpPos];
  if (!rank) return "neutral";

  const totalTeams = Object.keys(dvpRanks).length;
  if (totalTeams === 0) return "neutral";

  const third = Math.ceil(totalTeams / 3);
  if (rank <= third) return "bad";
  if (rank > totalTeams - third) return "good";
  return "neutral";
}

/* ------------------------------------------------------------------ */
/*  Server component                                                   */
/* ------------------------------------------------------------------ */

export default async function MatchupBreakdown({ week, teamId }: Props) {
  const [weekly, statics] = await Promise.all([
    getWeeklyBundle(),
    getStaticBundle(),
  ]);
  const dto = transformWeeklyToFantasyDTO(weekly, statics?.teams ?? []);
  const selectedWeek = week || dto.week;

  const dvpRanks = buildImpliedDvpFromProjections(dto, selectedWeek);

  const matchup = dto.matchups.find(
    (m) =>
      (m.week ?? dto.week) === selectedWeek &&
      (m.home.teamId === teamId || m.away.teamId === teamId)
  );

  if (!matchup) return null;

  const isHome = matchup.home.teamId === teamId;
  const yourSide = isHome ? matchup.home : matchup.away;
  const oppSide = isHome ? matchup.away : matchup.home;

  const yourSlots = assignSlots(yourSide.roster ?? []);
  const oppSlots = assignSlots(oppSide.roster ?? []);

  const slots: SlotComparison[] = POSITION_SLOTS.map((slot) => {
    const you = yourSlots[slot];
    const opp = oppSlots[slot];
    const yourProj = you?.projectedPoints ?? 0;
    const oppProj = opp?.projectedPoints ?? 0;

    return {
      slot,
      you,
      opp,
      yourProj,
      oppProj,
      delta: yourProj - oppProj,
      matchupQuality: getMatchupQuality(dvpRanks, oppSide.teamId, slot),
    };
  });

  const totalYourProj = slots.reduce((s, c) => s + c.yourProj, 0);
  const totalOppProj = slots.reduce((s, c) => s + c.oppProj, 0);
  const total = totalYourProj + totalOppProj;
  const overallEdge =
    total > 0 ? Math.round((totalYourProj / total) * 100) : 50;

  const advantages = slots.filter((s) => s.delta > 0.5).length;
  const disadvantages = slots.filter((s) => s.delta < -0.5).length;

  const data: BreakdownData = {
    teamName: yourSide.name,
    opponentName: oppSide.name,
    slots,
    overallEdge,
    advantages,
    disadvantages,
    neutral: slots.length - advantages - disadvantages,
  };

  return <MatchupBreakdownClient data={data} />;
}
