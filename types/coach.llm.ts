import { z } from "zod";

export const CoachBriefLLMSchema = z.object({
  headline: z.string(),
  bullets: z.array(z.string()).min(1).max(6),
  risks: z.array(z.string()),
  moves: z.array(
    z.object({
      label: z.string(),
      reason: z.string(),
    })
  ),
});

export type CoachBriefLLM = z.infer<typeof CoachBriefLLMSchema>;

export const WaiverSummaryLLMSchema = z.object({
  headline: z.string(),
  moves: z.array(
    z.object({
      pickup: z.string(),
      drop: z.string().optional(),
      reason: z.string(),
      faab: z.number().optional(),
    })
  ),
  summary: z.string(),
});

export type WaiverSummaryLLM = z.infer<typeof WaiverSummaryLLMSchema>;
