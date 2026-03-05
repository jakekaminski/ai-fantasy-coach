"use client";

import { Badge } from "@/components/ui/badge";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { PlayerCard } from "@/types/fantasy";
import {
  ChevronDown,
  ChevronUp,
  Minus,
  Shield,
  Swords,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export type PositionSlot =
  | "QB"
  | "RB1"
  | "RB2"
  | "WR1"
  | "WR2"
  | "TE"
  | "FLEX"
  | "D/ST"
  | "K";

export type SlotComparison = {
  slot: PositionSlot;
  you: PlayerCard | null;
  opp: PlayerCard | null;
  yourProj: number;
  oppProj: number;
  delta: number;
  matchupQuality: "good" | "neutral" | "bad";
};

export type BreakdownData = {
  teamName: string;
  opponentName: string;
  slots: SlotComparison[];
  overallEdge: number;
  advantages: number;
  disadvantages: number;
  neutral: number;
};

/* ------------------------------------------------------------------ */
/*  Recharts config for the overall edge bar                           */
/* ------------------------------------------------------------------ */

const edgeChartConfig = {
  you: { label: "You", color: "var(--chart-1)" },
  opp: { label: "Opponent", color: "var(--chart-2)" },
} satisfies ChartConfig;

const toNum = (v: unknown, fallback = 0): number =>
  Number.isFinite(Number(v)) ? Number(v) : fallback;

/* ------------------------------------------------------------------ */
/*  Main client component                                              */
/* ------------------------------------------------------------------ */

export default function MatchupBreakdownClient({
  data,
}: {
  data: BreakdownData;
}) {
  const [expanded, setExpanded] = useState(false);

  const oppEdge = 100 - data.overallEdge;
  const chartData = [
    { name: "edge", you: data.overallEdge, opp: oppEdge, total: 100 },
  ];

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4" />
          <span className="text-sm font-medium">Position Breakdown</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? "Collapse" : "Expand"}
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Overall edge (Recharts horizontal bar) */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{data.teamName}</span>
          <span className="font-medium text-foreground">
            {data.overallEdge > 50
              ? `+${data.overallEdge - 50}%`
              : data.overallEdge < 50
                ? `${data.overallEdge - 50}%`
                : "Even"}
          </span>
          <span>{data.opponentName}</span>
        </div>
        <ChartContainer config={edgeChartConfig} className="h-10 w-full">
          <BarChart
            layout="vertical"
            accessibilityLayer
            data={chartData}
            barCategoryGap={0}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} horizontal={false} />
            <XAxis type="number" dataKey="total" hide />
            <YAxis type="category" dataKey="name" hide />
            <Bar
              dataKey="you"
              stackId="edge"
              fill="var(--color-you)"
              radius={[6, 0, 0, 6]}
            >
              <LabelList
                dataKey="you"
                className="fill-foreground text-xs"
                formatter={(v: unknown) => `${toNum(v)}%`}
              />
            </Bar>
            <Bar
              dataKey="opp"
              stackId="edge"
              fill="var(--color-opp)"
              radius={[0, 6, 6, 0]}
            >
              <LabelList
                dataKey="opp"
                className="fill-foreground text-xs"
                formatter={(v: unknown) => `${toNum(v)}%`}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1">
          <TrendingUp className="h-3 w-3 text-emerald-500" />
          {data.advantages} advantage{data.advantages !== 1 ? "s" : ""}
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <TrendingDown className="h-3 w-3 text-red-500" />
          {data.disadvantages} disadvantage{data.disadvantages !== 1 ? "s" : ""}
        </Badge>
        {data.neutral > 0 && (
          <Badge variant="outline" className="gap-1">
            <Minus className="h-3 w-3" />
            {data.neutral} even
          </Badge>
        )}
      </div>

      {/* Expandable position breakdown */}
      {expanded && (
        <div className="space-y-2 pt-1">
          {data.slots.map((slot) => (
            <PositionRow key={slot.slot} slot={slot} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Position row                                                       */
/* ------------------------------------------------------------------ */

function PositionRow({ slot }: { slot: SlotComparison }) {
  const total = slot.yourProj + slot.oppProj;
  const yourPct = total > 0 ? (slot.yourProj / total) * 100 : 50;

  const hasAdvantage = slot.delta > 0.5;
  const hasDisadvantage = slot.delta < -0.5;

  return (
    <div className="space-y-2 rounded-lg border p-3">
      {/* Slot label + matchup quality + delta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-9 text-xs font-semibold uppercase tracking-wide">
            {slot.slot}
          </span>
          <MatchupQualityBadge quality={slot.matchupQuality} />
        </div>
        <div className="flex items-center gap-1">
          {hasAdvantage && <TrendingUp className="h-3 w-3 text-emerald-500" />}
          {hasDisadvantage && (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          {!hasAdvantage && !hasDisadvantage && (
            <Minus className="h-3 w-3 text-muted-foreground" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              hasAdvantage
                ? "text-emerald-500"
                : hasDisadvantage
                  ? "text-red-500"
                  : "text-muted-foreground"
            )}
          >
            {slot.delta > 0 ? "+" : ""}
            {slot.delta.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Player vs Player */}
      <div className="flex items-center justify-between gap-3">
        <PlayerCell player={slot.you} proj={slot.yourProj} align="left" />
        <span className="shrink-0 text-xs text-muted-foreground">vs</span>
        <PlayerCell player={slot.opp} proj={slot.oppProj} align="right" />
      </div>

      {/* Advantage meter */}
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all",
            hasAdvantage
              ? "bg-emerald-500"
              : hasDisadvantage
                ? "bg-red-500"
                : "bg-yellow-500"
          )}
          style={{ width: `${yourPct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Player cell                                                        */
/* ------------------------------------------------------------------ */

function PlayerCell({
  player,
  proj,
  align,
}: {
  player: PlayerCard | null;
  proj: number;
  align: "left" | "right";
}) {
  const isRight = align === "right";

  return (
    <div className={cn("min-w-0 flex-1", isRight && "text-right")}>
      <div
        className={cn(
          "flex items-center gap-1.5",
          isRight && "justify-end"
        )}
      >
        <span className="truncate text-sm font-medium">
          {player?.name ?? "Empty"}
        </span>
        {player?.injuryStatus &&
          player.injuryStatus !== "ACTIVE" &&
          player.injuryStatus !== "NORMAL" && (
            <Badge
              variant="destructive"
              className="shrink-0 px-1 py-0 text-[10px]"
            >
              {player.injuryStatus}
            </Badge>
          )}
      </div>
      <div className="text-xs text-muted-foreground">
        {proj.toFixed(1)} pts
        {player?.projectedStats?.yards != null &&
          ` · ${Math.round(player.projectedStats.yards)} yds`}
        {player?.projectedStats?.tds != null &&
          player.projectedStats.tds > 0 &&
          ` · ${player.projectedStats.tds.toFixed(1)} TD`}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Matchup quality badge                                              */
/* ------------------------------------------------------------------ */

function MatchupQualityBadge({
  quality,
}: {
  quality: "good" | "neutral" | "bad";
}) {
  return (
    <Badge
      variant={
        quality === "good"
          ? "default"
          : quality === "bad"
            ? "destructive"
            : "outline"
      }
      className="px-1.5 py-0 text-[10px]"
    >
      <Shield className="h-2.5 w-2.5" />
      {quality === "good"
        ? "Favorable"
        : quality === "bad"
          ? "Tough"
          : "Neutral"}
    </Badge>
  );
}
