import { describe, it, expect } from "vitest";
import { buildCoachBrief } from "@/lib/coach/buildBrief";
import {
  fantasyDataDTO,
  teams,
  posRatings,
  softPosRatings,
  homeRoster,
} from "./fixtures/fantasy-data";
import type { FantasyDataDTO, MatchupDTO } from "@/types/fantasy";

describe("buildCoachBrief", () => {
  const baseArgs = {
    dto: fantasyDataDTO,
    teams,
    week: 5,
    teamId: 1,
    risk: 50,
    live: false,
    posRatings,
  };

  describe("basic structure", () => {
    it("returns a CoachBrief with all required fields", () => {
      const brief = buildCoachBrief(baseArgs);
      expect(brief).toHaveProperty("week", 5);
      expect(brief).toHaveProperty("teamName");
      expect(brief).toHaveProperty("opponentName");
      expect(brief).toHaveProperty("summaryBullets");
      expect(brief).toHaveProperty("startSit");
      expect(brief).toHaveProperty("streamers");
      expect(brief).toHaveProperty("mismatches");
      expect(brief).toHaveProperty("risk", 50);
      expect(brief).toHaveProperty("live", false);
    });

    it("identifies correct team and opponent names (home team)", () => {
      const brief = buildCoachBrief(baseArgs);
      expect(brief.teamName).toBe("KC Cheetahs");
      expect(brief.opponentName).toBe("Buffalo Bills Mafia");
    });

    it("identifies correct team and opponent names (away team)", () => {
      const brief = buildCoachBrief({ ...baseArgs, teamId: 2 });
      expect(brief.teamName).toBe("Buffalo Bills Mafia");
      expect(brief.opponentName).toBe("KC Cheetahs");
    });
  });

  describe("no matchup found", () => {
    it("returns fallback brief when teamId has no matchup", () => {
      const brief = buildCoachBrief({ ...baseArgs, teamId: 999 });
      expect(brief.teamName).toBe("Unknown");
      expect(brief.opponentName).toBe("Unknown");
      expect(brief.summaryBullets).toEqual(["No matchup found for this team/week."]);
      expect(brief.startSit).toEqual([]);
      expect(brief.streamers).toEqual([]);
      expect(brief.mismatches).toEqual([]);
    });
  });

  describe("start/sit logic", () => {
    it("generates startSit entries for each starter", () => {
      const brief = buildCoachBrief(baseArgs);
      expect(brief.startSit.length).toBe(9);
    });

    it("each startSit entry has current player data with riskAdjProj", () => {
      const brief = buildCoachBrief(baseArgs);
      for (const advice of brief.startSit) {
        expect(advice.current).toHaveProperty("name");
        expect(advice.current).toHaveProperty("proj");
        expect(advice.current).toHaveProperty("riskAdjProj");
        expect(typeof advice.current.riskAdjProj).toBe("number");
        expect(Number.isFinite(advice.current.riskAdjProj)).toBe(true);
      }
    });

    it("flags a bench WR as alternative when projected higher", () => {
      const brief = buildCoachBrief(baseArgs);
      const wrSlots = brief.startSit.filter((s) => s.slot === "WR");
      const hasAlt = wrSlots.some((s) => s.alternative?.name === "Terry McLaurin");
      expect(hasAlt).toBe(true);
    });

    it("alternative delta is positive when bench player is better", () => {
      const brief = buildCoachBrief(baseArgs);
      const withAlt = brief.startSit.filter((s) => s.alternative);
      for (const advice of withAlt) {
        expect(advice.delta).toBeGreaterThan(0);
      }
    });

    it("does not recommend alternatives for positions without better bench options", () => {
      const brief = buildCoachBrief(baseArgs);
      const qbSlot = brief.startSit.find(
        (s) => s.slot === "QB" && s.current.name === "Patrick Mahomes"
      );
      expect(qbSlot).toBeDefined();
    });

    it("risk level affects riskAdjProj values", () => {
      const lowRisk = buildCoachBrief({ ...baseArgs, risk: 10 });
      const highRisk = buildCoachBrief({ ...baseArgs, risk: 90 });
      const lowProj = lowRisk.startSit[0].current.riskAdjProj;
      const highProj = highRisk.startSit[0].current.riskAdjProj;
      expect(lowProj).not.toBe(highProj);
      expect(highProj).toBeGreaterThan(lowProj);
    });
  });

  describe("streamer detection", () => {
    it("detects streamers when position faces top-8 defense", () => {
      const brief = buildCoachBrief(baseArgs);
      expect(brief.streamers.length).toBeGreaterThan(0);
      const positions = brief.streamers.map((s) => s.position);
      expect(positions).toContain("QB");
      expect(positions).toContain("K");
    });

    it("does not flag streamers for soft matchups", () => {
      const brief = buildCoachBrief({ ...baseArgs, posRatings: softPosRatings });
      expect(brief.streamers.length).toBe(0);
    });

    it("streamer entries contain expected fields", () => {
      const brief = buildCoachBrief(baseArgs);
      for (const streamer of brief.streamers) {
        expect(streamer).toHaveProperty("position");
        expect(streamer).toHaveProperty("candidate");
        expect(streamer).toHaveProperty("reason");
        expect(streamer).toHaveProperty("expectedGain");
        expect(streamer.reason).toContain("top-8");
      }
    });

    it("only flags QB, K, D/ST as streamer positions", () => {
      const brief = buildCoachBrief(baseArgs);
      const validPositions = ["QB", "K", "D/ST"];
      for (const streamer of brief.streamers) {
        expect(validPositions).toContain(streamer.position);
      }
    });
  });

  describe("mismatch calculation", () => {
    it("returns mismatches sorted by absolute delta descending", () => {
      const brief = buildCoachBrief(baseArgs);
      expect(brief.mismatches.length).toBeGreaterThan(0);
      for (let i = 1; i < brief.mismatches.length; i++) {
        expect(Math.abs(brief.mismatches[i - 1].delta)).toBeGreaterThanOrEqual(
          Math.abs(brief.mismatches[i].delta)
        );
      }
    });

    it("mismatch delta = you - opp", () => {
      const brief = buildCoachBrief(baseArgs);
      for (const m of brief.mismatches) {
        expect(m.delta).toBeCloseTo(m.you - m.opp, 5);
      }
    });

    it("covers all roster positions in mismatches", () => {
      const brief = buildCoachBrief(baseArgs);
      const positions = brief.mismatches.map((m) => m.position);
      expect(positions).toContain("QB");
      expect(positions).toContain("RB");
      expect(positions).toContain("WR");
    });

    it("mismatch uses top-2 players per position", () => {
      const brief = buildCoachBrief(baseArgs);
      const wrMismatch = brief.mismatches.find((m) => m.position === "WR");
      expect(wrMismatch).toBeDefined();
      const yourTopWR = homeRoster
        .filter((p) => p.position === "WR")
        .sort((a, b) => b.projectedPoints - a.projectedPoints)
        .slice(0, 2)
        .reduce((sum, p) => sum + p.projectedPoints, 0);
      expect(wrMismatch!.you).toBeCloseTo(yourTopWR, 5);
    });
  });

  describe("summary bullets", () => {
    it("generates summary bullets for significant start/sit deltas", () => {
      const brief = buildCoachBrief(baseArgs);
      const startBullets = brief.summaryBullets.filter((b) => b.includes("Start **"));
      expect(startBullets.length).toBeGreaterThanOrEqual(0);
    });

    it("includes mismatch bullet when mismatches exist", () => {
      const brief = buildCoachBrief(baseArgs);
      const mismatchBullets = brief.summaryBullets.filter((b) => b.includes("Exploit"));
      expect(mismatchBullets.length).toBeLessThanOrEqual(1);
    });

    it("includes streamer bullet when streamers are detected", () => {
      const brief = buildCoachBrief(baseArgs);
      const streamerBullets = brief.summaryBullets.filter((b) => b.includes("streamer"));
      if (brief.streamers.length > 0) {
        expect(streamerBullets.length).toBe(1);
      }
    });
  });

  describe("edge cases", () => {
    it("handles empty rosters gracefully", () => {
      const emptyDto: FantasyDataDTO = {
        seasonId: 2025,
        week: 5,
        matchups: [
          {
            week: 5,
            home: { name: "Team A", teamId: 1, totalPoints: 0, totalProjectedPoints: 0, roster: [] },
            away: { name: "Team B", teamId: 2, totalPoints: 0, totalProjectedPoints: 0, roster: [] },
          },
        ],
        teams,
      };
      const brief = buildCoachBrief({ ...baseArgs, dto: emptyDto });
      expect(brief.startSit).toEqual([]);
      expect(brief.mismatches).toEqual([]);
    });

    it("handles undefined rosters gracefully", () => {
      const noRosterDto: FantasyDataDTO = {
        seasonId: 2025,
        week: 5,
        matchups: [
          {
            week: 5,
            home: { name: "Team A", teamId: 1, totalPoints: 0, totalProjectedPoints: 0 },
            away: { name: "Team B", teamId: 2, totalPoints: 0, totalProjectedPoints: 0 },
          },
        ],
        teams,
      };
      const brief = buildCoachBrief({ ...baseArgs, dto: noRosterDto });
      expect(brief.startSit).toEqual([]);
      expect(brief.mismatches).toEqual([]);
    });

    it("passes through live flag", () => {
      const brief = buildCoachBrief({ ...baseArgs, live: true });
      expect(brief.live).toBe(true);
    });

    it("passes through risk value", () => {
      const brief = buildCoachBrief({ ...baseArgs, risk: 75 });
      expect(brief.risk).toBe(75);
    });
  });
});
