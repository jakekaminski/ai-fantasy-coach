import { describe, it, expect } from "vitest";
import { buildImpliedDvpFromProjections } from "@/lib/coach/dvp";
import {
  fantasyDataDTO,
  multiMatchupDTO,
  singleMatchup,
} from "./fixtures/fantasy-data";
import type { FantasyDataDTO, MatchupDTO, PlayerCard } from "@/types/fantasy";
import type { DvpRanks } from "@/types/coach";

function player(
  overrides: Partial<PlayerCard> & Pick<PlayerCard, "id" | "name" | "position">
): PlayerCard {
  return {
    team: "FA",
    projectedPoints: 0,
    actualPoints: 0,
    bench: false,
    ...overrides,
  };
}

describe("buildImpliedDvpFromProjections", () => {
  describe("single matchup", () => {
    it("returns DvpRanks object with team entries", () => {
      const ranks = buildImpliedDvpFromProjections(fantasyDataDTO, 5);
      expect(typeof ranks).toBe("object");
      expect(Object.keys(ranks).length).toBeGreaterThan(0);
    });

    it("assigns rank 1 and 2 for two-team matchup", () => {
      const ranks = buildImpliedDvpFromProjections(fantasyDataDTO, 5);
      const teamIds = Object.keys(ranks).map(Number);
      expect(teamIds).toContain(1);
      expect(teamIds).toContain(2);

      for (const pos of ["QB", "RB", "WR", "TE", "K", "D/ST"] as const) {
        const rankValues = teamIds
          .map((id) => ranks[id]?.[pos])
          .filter((r): r is number => r !== undefined);
        expect(rankValues.sort()).toEqual([1, 2]);
      }
    });

    it("tougher defense (allows fewer points) gets rank 1", () => {
      const ranks = buildImpliedDvpFromProjections(fantasyDataDTO, 5);

      const homeQB = singleMatchup.home.roster!
        .filter((p) => p.position === "QB")
        .sort((a, b) => b.projectedPoints - a.projectedPoints)
        .slice(0, 1)
        .reduce((s, p) => s + p.projectedPoints, 0);

      const awayQB = singleMatchup.away.roster!
        .filter((p) => p.position === "QB")
        .sort((a, b) => b.projectedPoints - a.projectedPoints)
        .slice(0, 1)
        .reduce((s, p) => s + p.projectedPoints, 0);

      // Away defense faces home offense (homeQB), Home defense faces away offense (awayQB)
      // Rank 1 = allows fewer points = tougher
      if (homeQB < awayQB) {
        // Away defense allows less -> rank 1
        expect(ranks[2]?.QB).toBe(1);
      } else {
        expect(ranks[1]?.QB).toBe(1);
      }
    });
  });

  describe("multiple matchups", () => {
    it("ranks all four teams across two matchups", () => {
      const ranks = buildImpliedDvpFromProjections(multiMatchupDTO, 5);
      const teamIds = Object.keys(ranks).map(Number);
      expect(teamIds).toContain(1);
      expect(teamIds).toContain(2);
      expect(teamIds).toContain(3);
      expect(teamIds).toContain(4);
    });

    it("assigns ranks 1-4 per position with four teams", () => {
      const ranks = buildImpliedDvpFromProjections(multiMatchupDTO, 5);
      for (const pos of ["QB", "RB", "WR", "TE", "K", "D/ST"] as const) {
        const allRanks = [1, 2, 3, 4]
          .map((id) => ranks[id]?.[pos])
          .filter((r): r is number => r !== undefined)
          .sort((a, b) => a - b);
        expect(allRanks).toEqual([1, 2, 3, 4]);
      }
    });

    it("ranks are consistent: lower allowed points = lower rank number", () => {
      const ranks = buildImpliedDvpFromProjections(multiMatchupDTO, 5);
      for (const pos of ["QB", "RB", "WR"] as const) {
        const entries = [1, 2, 3, 4].map((id) => ({
          teamId: id,
          rank: ranks[id]?.[pos] ?? Infinity,
        }));
        entries.sort((a, b) => a.rank - b.rank);
        expect(entries[0].rank).toBe(1);
        expect(entries[entries.length - 1].rank).toBe(4);
      }
    });
  });

  describe("week filtering", () => {
    it("returns empty ranks when no matchups exist for selected week", () => {
      const ranks = buildImpliedDvpFromProjections(fantasyDataDTO, 99);
      expect(Object.keys(ranks).length).toBe(0);
    });

    it("uses dto.week as fallback when matchup lacks week field", () => {
      const noWeekMatchup: MatchupDTO = {
        ...singleMatchup,
        week: undefined as unknown as number,
      };
      const dto: FantasyDataDTO = {
        seasonId: 2025,
        week: 5,
        matchups: [noWeekMatchup],
        teams: [],
      };
      const ranks = buildImpliedDvpFromProjections(dto, 5);
      expect(Object.keys(ranks).length).toBeGreaterThan(0);
    });
  });

  describe("position mapping", () => {
    it("correctly identifies QB position from roster data", () => {
      const ranks = buildImpliedDvpFromProjections(fantasyDataDTO, 5);
      expect(ranks[1]?.QB).toBeDefined();
      expect(ranks[2]?.QB).toBeDefined();
    });

    it("correctly identifies K position", () => {
      const ranks = buildImpliedDvpFromProjections(fantasyDataDTO, 5);
      expect(ranks[1]?.K).toBeDefined();
      expect(ranks[2]?.K).toBeDefined();
    });

    it("correctly identifies D/ST position", () => {
      const ranks = buildImpliedDvpFromProjections(fantasyDataDTO, 5);
      expect(ranks[1]?.["D/ST"]).toBeDefined();
      expect(ranks[2]?.["D/ST"]).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("handles empty rosters without crashing", () => {
      const dto: FantasyDataDTO = {
        seasonId: 2025,
        week: 5,
        matchups: [
          {
            week: 5,
            home: { name: "A", teamId: 10, totalPoints: 0, totalProjectedPoints: 0, roster: [] },
            away: { name: "B", teamId: 11, totalPoints: 0, totalProjectedPoints: 0, roster: [] },
          },
        ],
        teams: [],
      };
      const ranks = buildImpliedDvpFromProjections(dto, 5);
      expect(typeof ranks).toBe("object");
    });

    it("handles undefined rosters gracefully", () => {
      const dto: FantasyDataDTO = {
        seasonId: 2025,
        week: 5,
        matchups: [
          {
            week: 5,
            home: { name: "A", teamId: 10, totalPoints: 0, totalProjectedPoints: 0 },
            away: { name: "B", teamId: 11, totalPoints: 0, totalProjectedPoints: 0 },
          },
        ],
        teams: [],
      };
      const ranks = buildImpliedDvpFromProjections(dto, 5);
      expect(typeof ranks).toBe("object");
    });

    it("handles players with 0 projected points", () => {
      const dto: FantasyDataDTO = {
        seasonId: 2025,
        week: 5,
        matchups: [
          {
            week: 5,
            home: {
              name: "A",
              teamId: 10,
              totalPoints: 0,
              totalProjectedPoints: 0,
              roster: [player({ id: 100, name: "Zero QB", position: "QB", projectedPoints: 0 })],
            },
            away: {
              name: "B",
              teamId: 11,
              totalPoints: 0,
              totalProjectedPoints: 0,
              roster: [player({ id: 101, name: "Another QB", position: "QB", projectedPoints: 15 })],
            },
          },
        ],
        teams: [],
      };
      const ranks = buildImpliedDvpFromProjections(dto, 5);
      expect(ranks[10]?.QB).toBeDefined();
      expect(ranks[11]?.QB).toBeDefined();
    });

    it("respects starter count limits (top N per position)", () => {
      const manyRBs: PlayerCard[] = Array.from({ length: 6 }, (_, i) =>
        player({
          id: 200 + i,
          name: `RB${i}`,
          position: "RB",
          projectedPoints: 20 - i * 2,
        })
      );
      const dto: FantasyDataDTO = {
        seasonId: 2025,
        week: 5,
        matchups: [
          {
            week: 5,
            home: {
              name: "A",
              teamId: 10,
              totalPoints: 0,
              totalProjectedPoints: 0,
              roster: manyRBs,
            },
            away: {
              name: "B",
              teamId: 11,
              totalPoints: 0,
              totalProjectedPoints: 0,
              roster: [player({ id: 300, name: "Solo RB", position: "RB", projectedPoints: 12 })],
            },
          },
        ],
        teams: [],
      };
      const ranks = buildImpliedDvpFromProjections(dto, 5);
      expect(ranks[11]?.RB).toBeDefined();
      // Team 11's defense faces team 10's top 2 RBs (20+18=38)
      // Team 10's defense faces team 11's top 2 RBs (12, only 1 so = 12)
      // Team 10 allows less -> rank 1
      expect(ranks[10]?.RB).toBe(1);
    });

    it("returns deterministic results for same input", () => {
      const a = buildImpliedDvpFromProjections(multiMatchupDTO, 5);
      const b = buildImpliedDvpFromProjections(multiMatchupDTO, 5);
      expect(a).toEqual(b);
    });
  });
});
