"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { WaiverAnalysis, WaiverSummaryLLM } from "@/types/coach";
import {
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Sparkle,
  TrendingUp,
  Users,
} from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";

export default function WaiverWireClient({
  analysis,
  refreshAction,
}: {
  analysis: WaiverAnalysis;
  refreshAction: (
    prevState: { ai: WaiverSummaryLLM | null; error: string | null },
    formData: FormData
  ) => Promise<{ ai: WaiverSummaryLLM | null; error: string | null }>;
}) {
  const [{ ai, error }, formAction, pending] = useActionState<
    { ai: WaiverSummaryLLM | null; error: string | null },
    FormData
  >(refreshAction, { ai: null, error: null });

  const storageKey = useMemo(() => {
    try {
      const raw = JSON.stringify({
        week: analysis.week,
        count: analysis.recommendations.length,
      });
      return `waiverSummary:${raw}`;
    } catch {
      return "waiverSummary:default";
    }
  }, [analysis]);

  const [cached, setCached] = useState<{
    ai: WaiverSummaryLLM | null;
    error: string | null;
  }>(() => {
    if (typeof window === "undefined") return { ai: null, error: null };
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : { ai: null, error: null };
    } catch {
      return { ai: null, error: null };
    }
  });

  useEffect(() => {
    const hasUpdate = ai !== null || error !== null;
    if (!hasUpdate) return;
    const next = { ai, error };
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
    setCached(next);
  }, [ai, error, storageKey]);

  const { recommendations, usesFaab } = analysis;
  const hasRecs = recommendations.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" /> Waiver Wire Targets
        </CardTitle>
        <CardAction>
          <form action={formAction} className="inline-flex items-center">
            <input
              type="hidden"
              name="analysis"
              value={JSON.stringify(analysis)}
            />
            <Button
              type="submit"
              size="default"
              variant="outline"
              disabled={pending || !hasRecs}
              title="Generate AI summary"
            >
              <Sparkle
                className={cn("h-4 w-4", pending ? "animate-spin" : "")}
              />
            </Button>
          </form>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* AI Summary */}
        {cached.error && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm">
            {cached.error}
          </div>
        )}
        {!cached.error && cached.ai && (
          <div className="rounded border bg-accent p-3">
            <h3 className="text-sm font-semibold">{cached.ai.headline}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {cached.ai.summary}
            </p>
          </div>
        )}

        {/* Recommendations list */}
        {hasRecs ? (
          <ScrollArea className="h-64">
            <div className="space-y-2 text-sm">
              {recommendations.map((rec) => (
                <div
                  key={rec.player.id}
                  className="rounded-lg border p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rec.player.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {rec.player.position}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {rec.player.team}
                      </span>
                    </div>
                    <Badge variant="outline" className="tabular-nums">
                      {rec.projectedPoints} pts
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {rec.recentAvg} avg (last 3)
                    </span>
                    {rec.trend !== 0 && (
                      <span
                        className={cn(
                          "flex items-center gap-0.5",
                          rec.trend > 0 ? "text-green-600" : "text-red-500"
                        )}
                      >
                        {rec.trend > 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                        {rec.trend > 0 ? "+" : ""}
                        {rec.trend}
                      </span>
                    )}
                    {usesFaab && rec.faabRecommendation !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        FAAB: ${rec.faabRecommendation}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">{rec.reason}</p>

                  {rec.dropCandidate && (
                    <div className="flex items-center gap-1 text-xs">
                      <RefreshCw className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Drop:</span>
                      <span className="font-medium">
                        {rec.dropCandidate.name}
                      </span>
                      <span className="text-muted-foreground">
                        ({rec.dropCandidate.projectedPoints} pts proj)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No waiver recommendations available for this week.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
