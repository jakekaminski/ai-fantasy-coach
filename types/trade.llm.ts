import { z } from "zod";

export const TradeAnalysisLLMSchema = z.object({
  headline: z.string(),
  verdict: z.string(),
  pros: z.array(z.string()).min(1).max(5),
  cons: z.array(z.string()).min(1).max(5),
  recommendation: z.string(),
});

export type TradeAnalysisLLM = z.infer<typeof TradeAnalysisLLMSchema>;
