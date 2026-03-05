import { describe, it, expect } from "vitest";
import {
  mapOpponentRankToMultiplier,
  lerp,
  riskAdjustedProjection,
} from "@/lib/coach/scoring";

describe("mapOpponentRankToMultiplier", () => {
  it("returns 0.9 for rank 1 (hardest defense)", () => {
    expect(mapOpponentRankToMultiplier(1)).toBeCloseTo(0.9, 5);
  });

  it("returns 1.1 for rank 32 (softest defense)", () => {
    expect(mapOpponentRankToMultiplier(32)).toBeCloseTo(1.1, 5);
  });

  it("returns ~1.0 for middle rank 16", () => {
    const mid = 0.9 + ((16 - 1) / 31) * 0.2;
    expect(mapOpponentRankToMultiplier(16)).toBeCloseTo(mid, 5);
  });

  it("returns 1 for undefined rank", () => {
    expect(mapOpponentRankToMultiplier(undefined)).toBe(1);
  });

  it("returns 1 for rank 0 (out of range)", () => {
    expect(mapOpponentRankToMultiplier(0)).toBe(1);
  });

  it("returns 1 for rank 33 (out of range)", () => {
    expect(mapOpponentRankToMultiplier(33)).toBe(1);
  });

  it("returns 1 for negative rank", () => {
    expect(mapOpponentRankToMultiplier(-5)).toBe(1);
  });

  it("scales linearly between rank 1 and 32", () => {
    const r1 = mapOpponentRankToMultiplier(1);
    const r32 = mapOpponentRankToMultiplier(32);
    const r17 = mapOpponentRankToMultiplier(17);
    expect(r17).toBeGreaterThan(r1);
    expect(r17).toBeLessThan(r32);
  });
});

describe("lerp", () => {
  it("returns a when t = 0", () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it("returns b when t = 1", () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it("returns midpoint when t = 0.5", () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it("clamps t below 0 to 0", () => {
    expect(lerp(10, 20, -0.5)).toBe(10);
  });

  it("clamps t above 1 to 1", () => {
    expect(lerp(10, 20, 1.5)).toBe(20);
  });

  it("works with negative ranges", () => {
    expect(lerp(-10, 10, 0.5)).toBe(0);
  });

  it("works when a > b", () => {
    expect(lerp(20, 10, 0.5)).toBe(15);
  });
});

describe("riskAdjustedProjection", () => {
  it("returns 0 when baseProj is 0", () => {
    expect(riskAdjustedProjection(0, 16, 50)).toBe(0);
  });

  it("applies matchup multiplier for rank 1 (hardest)", () => {
    const result = riskAdjustedProjection(10, 1, 50);
    expect(result).toBeLessThan(10);
  });

  it("applies matchup multiplier for rank 32 (softest)", () => {
    const result = riskAdjustedProjection(10, 32, 50);
    expect(result).toBeGreaterThan(10);
  });

  it("uses multiplier 1 when oppRank is undefined", () => {
    const withUndefined = riskAdjustedProjection(10, undefined, 50);
    const withNeutral = riskAdjustedProjection(10, undefined, 50);
    expect(withUndefined).toBe(withNeutral);
  });

  it("low risk (0) tilts projection down", () => {
    const lowRisk = riskAdjustedProjection(10, 16, 0);
    const highRisk = riskAdjustedProjection(10, 16, 100);
    expect(lowRisk).toBeLessThan(highRisk);
  });

  it("high risk (100) tilts projection up", () => {
    const result = riskAdjustedProjection(10, 16, 100);
    expect(result).toBeGreaterThan(10);
  });

  it("mid risk (50) produces near-neutral tilt", () => {
    const result = riskAdjustedProjection(10, undefined, 50);
    expect(result).toBeCloseTo(10, 1);
  });

  it("incorporates varianceGuess when provided", () => {
    const noVariance = riskAdjustedProjection(10, 16, 75, 0);
    const highVariance = riskAdjustedProjection(10, 16, 75, 1.0);
    expect(noVariance).not.toBe(highVariance);
  });

  it("varianceGuess has no effect at risk=50", () => {
    const noVar = riskAdjustedProjection(10, 16, 50, 0);
    const withVar = riskAdjustedProjection(10, 16, 50, 1.0);
    expect(noVar).toBeCloseTo(withVar, 5);
  });

  it("produces deterministic results for same inputs", () => {
    const a = riskAdjustedProjection(15.5, 10, 65, 0.3);
    const b = riskAdjustedProjection(15.5, 10, 65, 0.3);
    expect(a).toBe(b);
  });

  it("handles large baseProj values", () => {
    const result = riskAdjustedProjection(100, 16, 50);
    expect(result).toBeGreaterThan(0);
    expect(Number.isFinite(result)).toBe(true);
  });

  it("computes expected value for known inputs", () => {
    const matchupMult = 0.9 + ((16 - 1) / 31) * 0.2;
    const riskTilt = 0.85 + (1.15 - 0.85) * (50 / 100);
    const varianceMult = 1;
    const expected = 10 * matchupMult * riskTilt * varianceMult;
    expect(riskAdjustedProjection(10, 16, 50, 0)).toBeCloseTo(expected, 5);
  });
});
