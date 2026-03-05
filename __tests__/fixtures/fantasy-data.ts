import type { FantasyDataDTO, MatchupDTO, PlayerCard, Team } from "@/types/fantasy";

/* ------------------------------------------------------------------ */
/*  Player card helpers                                                */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Rosters                                                            */
/* ------------------------------------------------------------------ */

export const homeRoster: PlayerCard[] = [
  // starters (first 9)
  player({ id: 1, name: "Patrick Mahomes", position: "QB", team: "KC", projectedPoints: 22.5, actualPoints: 18.0 }),
  player({ id: 2, name: "Saquon Barkley", position: "RB", team: "PHI", projectedPoints: 18.0, actualPoints: 15.0 }),
  player({ id: 3, name: "Derrick Henry", position: "RB", team: "BAL", projectedPoints: 15.5, actualPoints: 12.0 }),
  player({ id: 4, name: "Ja'Marr Chase", position: "WR", team: "CIN", projectedPoints: 19.0, actualPoints: 22.0 }),
  player({ id: 5, name: "CeeDee Lamb", position: "WR", team: "DAL", projectedPoints: 17.0, actualPoints: 14.0 }),
  player({ id: 6, name: "Travis Kelce", position: "TE", team: "KC", projectedPoints: 12.0, actualPoints: 10.0 }),
  player({ id: 7, name: "Harrison Butker", position: "K", team: "KC", projectedPoints: 8.5, actualPoints: 9.0 }),
  player({ id: 8, name: "49ers D/ST", position: "D/ST", team: "SF", projectedPoints: 7.0, actualPoints: 6.0 }),
  player({ id: 9, name: "Amon-Ra St. Brown", position: "WR", team: "DET", projectedPoints: 16.0, actualPoints: 13.0 }),
  // bench (index 9+)
  player({ id: 10, name: "Jayden Daniels", position: "QB", team: "WAS", projectedPoints: 20.0, actualPoints: 16.0, bench: true }),
  player({ id: 11, name: "Terry McLaurin", position: "WR", team: "WAS", projectedPoints: 20.0, actualPoints: 17.0, bench: true }),
  player({ id: 12, name: "David Montgomery", position: "RB", team: "DET", projectedPoints: 10.0, actualPoints: 8.0, bench: true }),
];

export const awayRoster: PlayerCard[] = [
  // starters (first 9)
  player({ id: 20, name: "Josh Allen", position: "QB", team: "BUF", projectedPoints: 24.0, actualPoints: 26.0 }),
  player({ id: 21, name: "Breece Hall", position: "RB", team: "NYJ", projectedPoints: 14.0, actualPoints: 11.0 }),
  player({ id: 22, name: "Josh Jacobs", position: "RB", team: "GB", projectedPoints: 13.0, actualPoints: 12.0 }),
  player({ id: 23, name: "Tyreek Hill", position: "WR", team: "MIA", projectedPoints: 16.5, actualPoints: 18.0 }),
  player({ id: 24, name: "Davante Adams", position: "WR", team: "NYJ", projectedPoints: 14.0, actualPoints: 10.0 }),
  player({ id: 25, name: "George Kittle", position: "TE", team: "SF", projectedPoints: 11.0, actualPoints: 9.0 }),
  player({ id: 26, name: "Tyler Bass", position: "K", team: "BUF", projectedPoints: 7.5, actualPoints: 8.0 }),
  player({ id: 27, name: "Cowboys D/ST", position: "D/ST", team: "DAL", projectedPoints: 6.0, actualPoints: 5.0 }),
  player({ id: 28, name: "DJ Moore", position: "WR", team: "CHI", projectedPoints: 12.5, actualPoints: 11.0 }),
  // bench
  player({ id: 29, name: "Geno Smith", position: "QB", team: "SEA", projectedPoints: 17.0, actualPoints: 14.0, bench: true }),
  player({ id: 30, name: "Rashod Bateman", position: "WR", team: "BAL", projectedPoints: 9.0, actualPoints: 7.0, bench: true }),
];

/* ------------------------------------------------------------------ */
/*  Teams                                                              */
/* ------------------------------------------------------------------ */

export const teams: Team[] = [
  { id: 1, abbrev: "MAHM", location: "Kansas City", nickname: "Cheetahs", name: "KC Cheetahs" },
  { id: 2, abbrev: "JOSH", location: "Buffalo", nickname: "Bills Mafia", name: "Buffalo Bills Mafia" },
  { id: 3, abbrev: "LAMAR", location: "Baltimore", nickname: "Ravens", name: "Baltimore Ravens" },
  { id: 4, abbrev: "HURTS", location: "Philadelphia", nickname: "Eagles", name: "Philadelphia Eagles" },
];

/* ------------------------------------------------------------------ */
/*  Matchup                                                            */
/* ------------------------------------------------------------------ */

export const singleMatchup: MatchupDTO = {
  week: 5,
  matchupId: 1,
  home: {
    name: "KC Cheetahs",
    teamId: 1,
    totalPoints: 110.0,
    totalProjectedPoints: 135.5,
    roster: homeRoster,
  },
  away: {
    name: "Buffalo Bills Mafia",
    teamId: 2,
    totalPoints: 105.0,
    totalProjectedPoints: 118.0,
    roster: awayRoster,
  },
};

/* ------------------------------------------------------------------ */
/*  Second matchup (for DvP multi-matchup testing)                     */
/* ------------------------------------------------------------------ */

export const secondMatchup: MatchupDTO = {
  week: 5,
  matchupId: 2,
  home: {
    name: "Baltimore Ravens",
    teamId: 3,
    totalPoints: 95.0,
    totalProjectedPoints: 108.0,
    roster: [
      player({ id: 40, name: "Lamar Jackson", position: "QB", team: "BAL", projectedPoints: 25.0, actualPoints: 28.0 }),
      player({ id: 41, name: "Jahmyr Gibbs", position: "RB", team: "DET", projectedPoints: 16.0, actualPoints: 14.0 }),
      player({ id: 42, name: "Kyren Williams", position: "RB", team: "LAR", projectedPoints: 14.5, actualPoints: 12.0 }),
      player({ id: 43, name: "Malik Nabers", position: "WR", team: "NYG", projectedPoints: 15.0, actualPoints: 13.0 }),
      player({ id: 44, name: "Drake London", position: "WR", team: "ATL", projectedPoints: 14.0, actualPoints: 11.0 }),
      player({ id: 45, name: "Mark Andrews", position: "TE", team: "BAL", projectedPoints: 10.0, actualPoints: 8.0 }),
      player({ id: 46, name: "Justin Tucker", position: "K", team: "BAL", projectedPoints: 9.0, actualPoints: 10.0 }),
      player({ id: 47, name: "Ravens D/ST", position: "D/ST", team: "BAL", projectedPoints: 8.0, actualPoints: 7.0 }),
      player({ id: 48, name: "Christian Kirk", position: "WR", team: "JAX", projectedPoints: 11.0, actualPoints: 9.0 }),
    ],
  },
  away: {
    name: "Philadelphia Eagles",
    teamId: 4,
    totalPoints: 100.0,
    totalProjectedPoints: 112.0,
    roster: [
      player({ id: 50, name: "Jalen Hurts", position: "QB", team: "PHI", projectedPoints: 21.0, actualPoints: 19.0 }),
      player({ id: 51, name: "Bijan Robinson", position: "RB", team: "ATL", projectedPoints: 17.5, actualPoints: 16.0 }),
      player({ id: 52, name: "De'Von Achane", position: "RB", team: "MIA", projectedPoints: 15.0, actualPoints: 13.0 }),
      player({ id: 53, name: "Nico Collins", position: "WR", team: "HOU", projectedPoints: 16.0, actualPoints: 15.0 }),
      player({ id: 54, name: "Garrett Wilson", position: "WR", team: "NYJ", projectedPoints: 13.5, actualPoints: 11.0 }),
      player({ id: 55, name: "Sam LaPorta", position: "TE", team: "DET", projectedPoints: 9.0, actualPoints: 7.0 }),
      player({ id: 56, name: "Ka'imi Fairbairn", position: "K", team: "HOU", projectedPoints: 8.0, actualPoints: 9.0 }),
      player({ id: 57, name: "Steelers D/ST", position: "D/ST", team: "PIT", projectedPoints: 7.5, actualPoints: 6.0 }),
      player({ id: 58, name: "Jaylen Waddle", position: "WR", team: "MIA", projectedPoints: 12.0, actualPoints: 10.0 }),
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Full DTO                                                           */
/* ------------------------------------------------------------------ */

export const fantasyDataDTO: FantasyDataDTO = {
  seasonId: 2025,
  week: 5,
  matchups: [singleMatchup],
  teams,
};

export const multiMatchupDTO: FantasyDataDTO = {
  seasonId: 2025,
  week: 5,
  matchups: [singleMatchup, secondMatchup],
  teams,
};

/* ------------------------------------------------------------------ */
/*  posRatings fixture                                                 */
/* ------------------------------------------------------------------ */

export const posRatings: Record<string, { defenseRankAgainst: number }> = {
  QB: { defenseRankAgainst: 5 },
  RB: { defenseRankAgainst: 16 },
  WR: { defenseRankAgainst: 20 },
  TE: { defenseRankAgainst: 28 },
  K: { defenseRankAgainst: 3 },
  "D/ST": { defenseRankAgainst: 12 },
};

export const softPosRatings: Record<string, { defenseRankAgainst: number }> = {
  QB: { defenseRankAgainst: 30 },
  RB: { defenseRankAgainst: 28 },
  WR: { defenseRankAgainst: 25 },
  TE: { defenseRankAgainst: 32 },
  K: { defenseRankAgainst: 29 },
  "D/ST": { defenseRankAgainst: 27 },
};
