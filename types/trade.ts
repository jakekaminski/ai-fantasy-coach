import type { PositionLabel } from "./coach";

export interface TradePlayer {
  id: number;
  name: string;
  position: PositionLabel;
  team: string;
  projectedPoints: number;
  actualPoints: number;
  fantasyTeamId: number;
}

export interface PositionalScarcityItem {
  position: PositionLabel;
  givingCount: number;
  receivingCount: number;
  impact: "positive" | "negative" | "neutral";
}

export interface TradeEvaluation {
  giving: TradePlayer[];
  receiving: TradePlayer[];
  projectionDelta: number;
  positionalScarcity: PositionalScarcityItem[];
  scheduleStrength: {
    givingAvg: number;
    receivingAvg: number;
  };
  grade: TradeGrade;
  gradeLabel: string;
  summary: string;
}

export type TradeGrade =
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D+"
  | "D"
  | "D-"
  | "F";
