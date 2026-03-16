"use server";

import { CoachBriefLLMSchema, type CoachBriefLLM } from "@/types/coach.llm";
import {
  WaiverSummaryLLMSchema,
  type WaiverSummaryLLM,
} from "@/types/coach.llm";
import type { WaiverAnalysis } from "@/types/coach";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
  }
  return _openai;
}

export async function summarizeCoachBrief(brief: {
  week: number;
  teamName: string;
  opponentName: string;
  risk: number;
  live: boolean;
  startSit: Array<{
    slot: string;
    current: { name: string; proj: number; riskAdjProj: number };
    alternative?: { name: string; proj: number; riskAdjProj: number } | null;
    delta: number;
  }>;
  mismatches: unknown[];
  streamers: unknown[];
}): Promise<CoachBriefLLM> {
  // Strict system guidance (grounding + style)
  const system = [
    "You are a fantasy football coach assistant.",
    "Only use facts from the provided JSON. Do NOT invent numbers, names, statuses, or injuries.",
    "Keep it concise and actionable. Prefer imperative voice.",
    "Prioritize start/sit deltas, positional mismatches, and streamer needs.",
    "Return only the structured result.",
  ].join("\n");

  // Minimal facts for the model
  const payload = {
    week: brief.week,
    teamName: brief.teamName,
    opponentName: brief.opponentName,
    risk: brief.risk,
    live: brief.live,
    startSit: brief.startSit.map((s) => ({
      slot: s.slot,
      current: {
        name: s.current.name,
        proj: s.current.proj,
        rAdj: s.current.riskAdjProj,
      },
      alternative: s.alternative
        ? {
            name: s.alternative.name,
            proj: s.alternative.proj,
            rAdj: s.alternative.riskAdjProj,
          }
        : null,
      delta: s.delta,
    })),
    mismatches: brief.mismatches,
    streamers: brief.streamers,
  };

  // Optional: runtime timeout
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 5000);

  try {
    const resp = await getOpenAI().responses.parse(
      {
        model: "gpt-4o-mini",
        temperature: 0,
        input: [
          { role: "system", content: system },
          {
            role: "system",
            content:
              "Return ONLY valid JSON matching the schema. No explanations.",
          },
          { role: "user", content: JSON.stringify(payload) },
        ],
        text: { format: zodTextFormat(CoachBriefLLMSchema, "coach_brief") },
      },
      { signal: ac.signal }
    );

    const parsed = resp.output_parsed;
    if (!parsed) throw new Error("Structured parse returned null");
    return parsed;
  } catch (err: unknown) {
    if ((err as Error)?.name === "AbortError") {
      throw new Error("LLM request timed out");
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

export async function summarizeWaiverTargets(
  analysis: WaiverAnalysis
): Promise<WaiverSummaryLLM> {
  const system = [
    "You are a fantasy football waiver wire analyst.",
    "Only use facts from the provided JSON. Do NOT invent numbers, names, or stats.",
    "Explain the top 3 waiver moves in natural language.",
    "If FAAB is used, include bid recommendations in context.",
    "Keep it concise—two or three sentences per move, one overall summary sentence.",
    "Return only the structured result.",
  ].join("\n");

  const payload = {
    week: analysis.week,
    usesFaab: analysis.usesFaab,
    faabRemaining: analysis.faabRemaining,
    top: analysis.recommendations.slice(0, 3).map((r) => ({
      name: r.player.name,
      pos: r.player.position,
      team: r.player.team,
      proj: r.projectedPoints,
      recentAvg: r.recentAvg,
      trend: r.trend,
      matchupRating: r.matchupRating,
      reason: r.reason,
      drop: r.dropCandidate?.name ?? null,
      faab: r.faabRecommendation ?? null,
    })),
  };

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 5000);

  try {
    const resp = await getOpenAI().responses.parse(
      {
        model: "gpt-4o-mini",
        temperature: 0,
        input: [
          { role: "system", content: system },
          {
            role: "system",
            content:
              "Return ONLY valid JSON matching the schema. No explanations.",
          },
          { role: "user", content: JSON.stringify(payload) },
        ],
        text: {
          format: zodTextFormat(WaiverSummaryLLMSchema, "waiver_summary"),
        },
      },
      { signal: ac.signal }
    );

    const parsed = resp.output_parsed;
    if (!parsed) throw new Error("Structured parse returned null");
    return parsed;
  } catch (err: unknown) {
    if ((err as Error)?.name === "AbortError") {
      throw new Error("LLM request timed out");
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}
