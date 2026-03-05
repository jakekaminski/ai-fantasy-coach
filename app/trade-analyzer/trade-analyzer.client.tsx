"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { TradePlayer } from "@/types/trade";
import {
  ArrowLeftRight,
  CheckCircle2,
  Loader2,
  Plus,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useActionState, useCallback, useMemo, useState } from "react";
import type { TradeActionState } from "./actions";

interface TradeAnalyzerClientProps {
  myTeamId: number;
  myTeamName: string;
  myPlayers: TradePlayer[];
  otherTeamPlayers: Record<number, TradePlayer[]>;
  teamNames: Record<number, string>;
  dvpRanksJson: string;
  allTeamsJson: string;
  analyzeAction: (
    prevState: TradeActionState,
    formData: FormData
  ) => Promise<TradeActionState>;
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "bg-emerald-500 text-white",
  A: "bg-emerald-500 text-white",
  "A-": "bg-emerald-400 text-white",
  "B+": "bg-green-500 text-white",
  B: "bg-green-500 text-white",
  "B-": "bg-green-400 text-white",
  "C+": "bg-yellow-500 text-white",
  C: "bg-yellow-500 text-white",
  "C-": "bg-yellow-400 text-black",
  "D+": "bg-orange-500 text-white",
  D: "bg-orange-500 text-white",
  "D-": "bg-orange-400 text-white",
  F: "bg-red-500 text-white",
};

export default function TradeAnalyzerClient({
  myTeamName,
  myPlayers,
  otherTeamPlayers,
  teamNames,
  dvpRanksJson,
  allTeamsJson,
  analyzeAction,
}: TradeAnalyzerClientProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [givingIds, setGivingIds] = useState<Set<number>>(new Set());
  const [receivingIds, setReceivingIds] = useState<Set<number>>(new Set());

  const [{ evaluation, ai, error }, formAction, pending] = useActionState<
    TradeActionState,
    FormData
  >(analyzeAction, { evaluation: null, ai: null, error: null });

  const otherPlayers = useMemo(() => {
    const tid = selectedTeamId ? Number(selectedTeamId) : null;
    return tid ? (otherTeamPlayers[tid] ?? []) : [];
  }, [selectedTeamId, otherTeamPlayers]);

  const givingPlayers = useMemo(
    () => myPlayers.filter((p) => givingIds.has(p.id)),
    [myPlayers, givingIds]
  );

  const receivingPlayers = useMemo(
    () => otherPlayers.filter((p) => receivingIds.has(p.id)),
    [otherPlayers, receivingIds]
  );

  const toggleGiving = useCallback((id: number) => {
    setGivingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleReceiving = useCallback((id: number) => {
    setReceivingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleTeamChange = useCallback((value: string) => {
    setSelectedTeamId(value);
    setReceivingIds(new Set());
  }, []);

  const clearAll = useCallback(() => {
    setGivingIds(new Set());
    setReceivingIds(new Set());
  }, []);

  const otherTeamIds = Object.keys(otherTeamPlayers).map(Number);

  return (
    <div className="space-y-6">
      {/* Trade Builder */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Giving Side */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4 text-red-500" />
              You Give
            </CardTitle>
            <CardDescription>
              {myTeamName} — Select players to trade away
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              <div className="space-y-1.5">
                {myPlayers.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    selected={givingIds.has(player.id)}
                    onToggle={() => toggleGiving(player.id)}
                    variant="giving"
                  />
                ))}
                {!myPlayers.length && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No roster data available.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Receiving Side */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              You Receive
            </CardTitle>
            <CardDescription>Select a team, then pick players</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={selectedTeamId} onValueChange={handleTeamChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose opponent team..." />
              </SelectTrigger>
              <SelectContent>
                {otherTeamIds.map((tid) => (
                  <SelectItem key={tid} value={String(tid)}>
                    {teamNames[tid] ?? `Team ${tid}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ScrollArea className="h-60">
              <div className="space-y-1.5">
                {otherPlayers.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    selected={receivingIds.has(player.id)}
                    onToggle={() => toggleReceiving(player.id)}
                    variant="receiving"
                  />
                ))}
                {!selectedTeamId && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    Select a team to see their roster.
                  </p>
                )}
                {selectedTeamId && !otherPlayers.length && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No roster data available for this team.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Trade Summary Bar */}
      {(givingPlayers.length > 0 || receivingPlayers.length > 0) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              {/* Giving summary */}
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-red-500">Give:</span>
                {givingPlayers.map((p) => (
                  <Badge key={p.id} variant="outline" className="gap-1">
                    {p.name}
                    <span className="text-muted-foreground">
                      {p.position}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleGiving(p.id)}
                      className="ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {!givingPlayers.length && (
                  <span className="text-sm text-muted-foreground">
                    None selected
                  </span>
                )}
              </div>

              <ArrowLeftRight className="h-5 w-5 shrink-0 text-muted-foreground" />

              {/* Receiving summary */}
              <div className="flex flex-1 flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-emerald-500">
                  Get:
                </span>
                {receivingPlayers.map((p) => (
                  <Badge key={p.id} variant="outline" className="gap-1">
                    {p.name}
                    <span className="text-muted-foreground">
                      {p.position}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleReceiving(p.id)}
                      className="ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {!receivingPlayers.length && (
                  <span className="text-sm text-muted-foreground">
                    None selected
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <form action={formAction} className="flex items-center gap-3">
                <input
                  type="hidden"
                  name="giving"
                  value={JSON.stringify(givingPlayers)}
                />
                <input
                  type="hidden"
                  name="receiving"
                  value={JSON.stringify(receivingPlayers)}
                />
                <input
                  type="hidden"
                  name="myRoster"
                  value={JSON.stringify(myPlayers)}
                />
                <input type="hidden" name="dvpRanks" value={dvpRanksJson} />
                <input type="hidden" name="allTeams" value={allTeamsJson} />
                <Button
                  type="submit"
                  disabled={
                    pending ||
                    !givingPlayers.length ||
                    !receivingPlayers.length
                  }
                  className="gap-2"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Scale className="h-4 w-4" />
                  )}
                  Evaluate Trade
                </Button>
              </form>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive/40">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {evaluation && !error && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Grade Card */}
          <Card className="flex flex-col items-center justify-center py-8">
            <div
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold",
                GRADE_COLORS[evaluation.grade] ?? "bg-muted"
              )}
            >
              {evaluation.grade}
            </div>
            <p className="mt-3 text-lg font-semibold">{evaluation.gradeLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">Trade Grade</p>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trade Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatRow
                label="Projection Delta"
                value={`${evaluation.projectionDelta >= 0 ? "+" : ""}${evaluation.projectionDelta.toFixed(1)} pts`}
                positive={evaluation.projectionDelta >= 0}
              />

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Positional Impact</p>
                {evaluation.positionalScarcity.map((s) => (
                  <div
                    key={s.position}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{s.position}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500">
                        -{s.givingCount}
                      </span>
                      <span className="text-emerald-500">
                        +{s.receivingCount}
                      </span>
                      <Badge
                        variant={
                          s.impact === "positive"
                            ? "default"
                            : s.impact === "negative"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {s.impact}
                      </Badge>
                    </div>
                  </div>
                ))}
                {!evaluation.positionalScarcity.length && (
                  <p className="text-sm text-muted-foreground">
                    No positional changes.
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-sm font-medium">Schedule Strength</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Giving avg</span>
                  <span>{evaluation.scheduleStrength.givingAvg.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Receiving avg</span>
                  <span>
                    {evaluation.scheduleStrength.receivingAvg.toFixed(0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" /> AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ai ? (
                <>
                  <p className="font-semibold">{ai.headline}</p>
                  <p className="text-sm text-muted-foreground">{ai.verdict}</p>

                  {!!ai.pros?.length && (
                    <div>
                      <p className="text-sm font-medium text-emerald-500">
                        Pros
                      </p>
                      <ul className="list-inside list-disc text-sm">
                        {ai.pros.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!!ai.cons?.length && (
                    <div>
                      <p className="text-sm font-medium text-red-500">Cons</p>
                      <ul className="list-inside list-disc text-sm">
                        {ai.cons.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Separator />
                  <p className="text-sm">
                    <span className="font-medium">Recommendation:</span>{" "}
                    {ai.recommendation}
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm">{evaluation.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    AI-powered analysis unavailable — showing deterministic
                    summary.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function PlayerRow({
  player,
  selected,
  onToggle,
  variant,
}: {
  player: TradePlayer;
  selected: boolean;
  onToggle: () => void;
  variant: "giving" | "receiving";
}) {
  const accentColor =
    variant === "giving" ? "border-red-500/50" : "border-emerald-500/50";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
        selected && accentColor,
        selected && "bg-accent"
      )}
    >
      <div className="flex items-center gap-2">
        {selected ? (
          <CheckCircle2
            className={cn(
              "h-4 w-4 shrink-0",
              variant === "giving" ? "text-red-500" : "text-emerald-500"
            )}
          />
        ) : (
          <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div>
          <span className="font-medium">{player.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {player.team}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs">
          {player.position}
        </Badge>
        <span className="w-12 text-right tabular-nums text-muted-foreground">
          {player.projectedPoints.toFixed(1)}
        </span>
      </div>
    </button>
  );
}

function StatRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          positive ? "text-emerald-500" : "text-red-500"
        )}
      >
        {value}
      </span>
    </div>
  );
}
