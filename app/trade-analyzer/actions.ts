"use server";

import { evaluateTrade } from "@/lib/trade/evaluate";
import { summarizeTradeAnalysis } from "@/lib/trade/summarize";
import type { Team } from "@/types/fantasy";
import type { DvpRanks } from "@/types/coach";
import type { TradeEvaluation, TradePlayer } from "@/types/trade";
import type { TradeAnalysisLLM } from "@/types/trade.llm";

export interface TradeActionState {
  evaluation: TradeEvaluation | null;
  ai: TradeAnalysisLLM | null;
  error: string | null;
}

export async function analyzeTradeAction(
  _prev: TradeActionState,
  formData: FormData
): Promise<TradeActionState> {
  try {
    const givingRaw = formData.get("giving");
    const receivingRaw = formData.get("receiving");
    const myRosterRaw = formData.get("myRoster");
    const dvpRanksRaw = formData.get("dvpRanks");
    const allTeamsRaw = formData.get("allTeams");

    if (
      typeof givingRaw !== "string" ||
      typeof receivingRaw !== "string" ||
      typeof myRosterRaw !== "string" ||
      typeof dvpRanksRaw !== "string" ||
      typeof allTeamsRaw !== "string"
    ) {
      return { evaluation: null, ai: null, error: "Missing trade data." };
    }

    const giving: TradePlayer[] = JSON.parse(givingRaw);
    const receiving: TradePlayer[] = JSON.parse(receivingRaw);
    const myRoster: TradePlayer[] = JSON.parse(myRosterRaw);
    const dvpRanks: DvpRanks = JSON.parse(dvpRanksRaw);
    const allTeams: Team[] = JSON.parse(allTeamsRaw);

    if (!giving.length || !receiving.length) {
      return {
        evaluation: null,
        ai: null,
        error: "Select at least one player on each side of the trade.",
      };
    }

    const evaluation = evaluateTrade({
      giving,
      receiving,
      myRoster,
      dvpRanks,
      allTeams,
    });

    let ai: TradeAnalysisLLM | null = null;
    try {
      ai = await summarizeTradeAnalysis(evaluation);
    } catch {
      // AI summary is optional — evaluation still works without it
    }

    return { evaluation, ai, error: null };
  } catch (e: unknown) {
    return {
      evaluation: null,
      ai: null,
      error: (e as Error).message ?? "Failed to evaluate trade.",
    };
  }
}
