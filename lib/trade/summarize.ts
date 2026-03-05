"use server";

import {
  TradeAnalysisLLMSchema,
  type TradeAnalysisLLM,
} from "@/types/trade.llm";
import type { TradeEvaluation } from "@/types/trade";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  return _openai;
}

export async function summarizeTradeAnalysis(
  evaluation: TradeEvaluation
): Promise<TradeAnalysisLLM> {
  const system = [
    "You are a fantasy football trade analyst.",
    "Only use facts from the provided JSON. Do NOT invent numbers, names, or stats.",
    "Evaluate the trade from the perspective of the user (the team giving and receiving players).",
    "Be direct and actionable. Consider projection deltas, positional scarcity, and schedule strength.",
    "The grade is already computed — reference it but focus on explaining WHY.",
    "Return only the structured result.",
  ].join("\n");

  const payload = {
    giving: evaluation.giving.map((p) => ({
      name: p.name,
      position: p.position,
      projectedPoints: p.projectedPoints,
    })),
    receiving: evaluation.receiving.map((p) => ({
      name: p.name,
      position: p.position,
      projectedPoints: p.projectedPoints,
    })),
    projectionDelta: evaluation.projectionDelta,
    positionalScarcity: evaluation.positionalScarcity,
    scheduleStrength: evaluation.scheduleStrength,
    grade: evaluation.grade,
    gradeLabel: evaluation.gradeLabel,
    summary: evaluation.summary,
  };

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 8000);

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
          format: zodTextFormat(TradeAnalysisLLMSchema, "trade_analysis"),
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
