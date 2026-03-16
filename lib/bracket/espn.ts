import type { BracketGame, BracketTeam, Region } from '@/types/bracket'

// Standard Round 1 seed matchups: [topSeed, bottomSeed]
const SEED_MATCHUPS: [number, number][] = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
]

// ─── 2026 NCAA Tournament Bracket ───────────────────────────────────────────
// Selection Sunday: March 15, 2026
// Seeds 1–16 per region; First Four slots marked with isFirstFour + firstFourLabel

type TeamDef = {
  name: string
  shortName: string
  abbreviation: string
  record: string
  conference: string
  isFirstFour?: boolean
  firstFourLabel?: string
}

const BRACKET_2026: Record<Region, TeamDef[]> = {
  // East Regional – Capital One Arena, Washington D.C.
  East: [
    { name: 'Duke', shortName: 'Duke', abbreviation: 'DUKE', record: '32–2', conference: 'ACC' },
    { name: 'UConn', shortName: 'UConn', abbreviation: 'CONN', record: '29–5', conference: 'Big East' },
    { name: 'Michigan State', shortName: 'Mich St', abbreviation: 'MSU', record: '25–7', conference: 'Big Ten' },
    { name: 'Kansas', shortName: 'Kansas', abbreviation: 'KU', record: '23–10', conference: 'Big 12' },
    { name: "St. John's", shortName: "St John's", abbreviation: 'SJU', record: '28–6', conference: 'Big East' },
    { name: 'Louisville', shortName: 'Louisville', abbreviation: 'LOU', record: '23–10', conference: 'ACC' },
    { name: 'UCLA', shortName: 'UCLA', abbreviation: 'UCLA', record: '23–11', conference: 'Big Ten' },
    { name: 'Ohio State', shortName: 'Ohio St', abbreviation: 'OSU', record: '21–12', conference: 'Big Ten' },
    { name: 'TCU', shortName: 'TCU', abbreviation: 'TCU', record: '22–11', conference: 'Big 12' },
    { name: 'UCF', shortName: 'UCF', abbreviation: 'UCF', record: '21–11', conference: 'Big 12' },
    { name: 'South Florida', shortName: 'S Florida', abbreviation: 'USF', record: '25–8', conference: 'American' },
    { name: 'Northern Iowa', shortName: 'N Iowa', abbreviation: 'UNI', record: '23–12', conference: 'MVC' },
    { name: 'California Baptist', shortName: 'Cal Baptist', abbreviation: 'CBU', record: '25–8', conference: 'WAC' },
    { name: 'North Dakota State', shortName: 'ND State', abbreviation: 'NDSU', record: '27–7', conference: 'Summit' },
    { name: 'Furman', shortName: 'Furman', abbreviation: 'FUR', record: '22–12', conference: 'Southern' },
    { name: 'Siena', shortName: 'Siena', abbreviation: 'SIE', record: '23–11', conference: 'MAAC' },
  ],

  // West Regional – SAP Center, San Jose CA
  West: [
    { name: 'Arizona', shortName: 'Arizona', abbreviation: 'ARIZ', record: '32–2', conference: 'Big 12' },
    { name: 'Purdue', shortName: 'Purdue', abbreviation: 'PUR', record: '27–8', conference: 'Big Ten' },
    { name: 'Gonzaga', shortName: 'Gonzaga', abbreviation: 'GONZ', record: '30–3', conference: 'WCC' },
    { name: 'Arkansas', shortName: 'Arkansas', abbreviation: 'ARK', record: '26–8', conference: 'SEC' },
    { name: 'Wisconsin', shortName: 'Wisconsin', abbreviation: 'WIS', record: '24–10', conference: 'Big Ten' },
    { name: 'BYU', shortName: 'BYU', abbreviation: 'BYU', record: '23–11', conference: 'Big 12' },
    { name: 'Miami (FL)', shortName: 'Miami FL', abbreviation: 'MIA', record: '25–8', conference: 'ACC' },
    { name: 'Villanova', shortName: 'Villanova', abbreviation: 'VILL', record: '24–8', conference: 'Big East' },
    { name: 'Utah State', shortName: 'Utah St', abbreviation: 'USU', record: '28–6', conference: 'Mountain West' },
    { name: 'Missouri', shortName: 'Missouri', abbreviation: 'MIZ', record: '20–12', conference: 'SEC' },
    {
      name: 'Texas / NC State',
      shortName: 'TX/NCST',
      abbreviation: 'FF11W',
      record: '—',
      conference: 'First Four',
      isFirstFour: true,
      firstFourLabel: 'Texas / NC State',
    },
    { name: 'High Point', shortName: 'High Point', abbreviation: 'HPU', record: '30–4', conference: 'Big South' },
    { name: "Hawai'i", shortName: "Hawai'i", abbreviation: 'HAW', record: '24–8', conference: 'Big West' },
    { name: 'Kennesaw State', shortName: 'Kennesaw St', abbreviation: 'KSU', record: '21–13', conference: 'C-USA' },
    { name: 'Queens', shortName: 'Queens', abbreviation: 'QUNS', record: '21–13', conference: 'ASUN' },
    { name: 'LIU', shortName: 'LIU', abbreviation: 'LIU', record: '24–10', conference: 'NEC' },
  ],

  // South Regional – Toyota Center, Houston TX
  South: [
    { name: 'Florida', shortName: 'Florida', abbreviation: 'FLA', record: '26–7', conference: 'SEC' },
    { name: 'Houston', shortName: 'Houston', abbreviation: 'HOU', record: '28–6', conference: 'Big 12' },
    { name: 'Illinois', shortName: 'Illinois', abbreviation: 'ILL', record: '24–7', conference: 'Big Ten' },
    { name: 'Nebraska', shortName: 'Nebraska', abbreviation: 'NEB', record: '26–6', conference: 'Big Ten' },
    { name: 'Vanderbilt', shortName: 'Vanderbilt', abbreviation: 'VAN', record: '26–8', conference: 'SEC' },
    { name: 'North Carolina', shortName: 'N Carolina', abbreviation: 'UNC', record: '24–8', conference: 'ACC' },
    { name: "Saint Mary's", shortName: "St Mary's", abbreviation: 'SMC', record: '27–5', conference: 'WCC' },
    { name: 'Clemson', shortName: 'Clemson', abbreviation: 'CLEM', record: '24–10', conference: 'ACC' },
    { name: 'Iowa', shortName: 'Iowa', abbreviation: 'IOWA', record: '21–12', conference: 'Big Ten' },
    { name: 'Texas A&M', shortName: 'Texas A&M', abbreviation: 'TXAM', record: '21–11', conference: 'SEC' },
    { name: 'VCU', shortName: 'VCU', abbreviation: 'VCU', record: '27–7', conference: 'Atlantic 10' },
    { name: 'McNeese', shortName: 'McNeese', abbreviation: 'MCNS', record: '28–5', conference: 'Southland' },
    { name: 'Troy', shortName: 'Troy', abbreviation: 'TROY', record: '22–11', conference: 'Sun Belt' },
    { name: 'Penn', shortName: 'Penn', abbreviation: 'PENN', record: '18–11', conference: 'Ivy' },
    { name: 'Idaho', shortName: 'Idaho', abbreviation: 'IDHO', record: '21–14', conference: 'Big Sky' },
    {
      name: 'Prairie View / Lehigh',
      shortName: 'PV/Lehigh',
      abbreviation: 'FF16S',
      record: '—',
      conference: 'First Four',
      isFirstFour: true,
      firstFourLabel: 'Prairie View A&M / Lehigh',
    },
  ],

  // Midwest Regional – United Center, Chicago IL
  Midwest: [
    { name: 'Michigan', shortName: 'Michigan', abbreviation: 'MICH', record: '31–2', conference: 'Big Ten' },
    { name: 'Iowa State', shortName: 'Iowa St', abbreviation: 'ISU', record: '27–7', conference: 'Big 12' },
    { name: 'Virginia', shortName: 'Virginia', abbreviation: 'UVA', record: '29–5', conference: 'ACC' },
    { name: 'Alabama', shortName: 'Alabama', abbreviation: 'ALA', record: '23–9', conference: 'SEC' },
    { name: 'Texas Tech', shortName: 'Texas Tech', abbreviation: 'TTU', record: '22–10', conference: 'Big 12' },
    { name: 'Tennessee', shortName: 'Tennessee', abbreviation: 'TENN', record: '22–11', conference: 'SEC' },
    { name: 'Kentucky', shortName: 'Kentucky', abbreviation: 'UK', record: '21–13', conference: 'SEC' },
    { name: 'Georgia', shortName: 'Georgia', abbreviation: 'UGA', record: '22–10', conference: 'SEC' },
    { name: 'Saint Louis', shortName: 'Saint Louis', abbreviation: 'SLU', record: '28–5', conference: 'Atlantic 10' },
    { name: 'Santa Clara', shortName: 'Santa Clara', abbreviation: 'SCU', record: '26–8', conference: 'WCC' },
    {
      name: 'Miami (OH) / SMU',
      shortName: 'MiamiOH/SMU',
      abbreviation: 'FF11M',
      record: '—',
      conference: 'First Four',
      isFirstFour: true,
      firstFourLabel: 'Miami (OH) / SMU',
    },
    { name: 'Akron', shortName: 'Akron', abbreviation: 'AKR', record: '29–5', conference: 'MAC' },
    { name: 'Hofstra', shortName: 'Hofstra', abbreviation: 'HOF', record: '24–10', conference: 'CAA' },
    { name: 'Wright State', shortName: 'Wright St', abbreviation: 'WSU', record: '23–11', conference: 'Horizon' },
    { name: 'Tennessee State', shortName: 'TN State', abbreviation: 'TNST', record: '23–9', conference: 'OVC' },
    {
      name: 'UMBC / Howard',
      shortName: 'UMBC/How',
      abbreviation: 'FF16M',
      record: '—',
      conference: 'First Four',
      isFirstFour: true,
      firstFourLabel: 'UMBC / Howard',
    },
  ],
}

function build2026Teams(): Record<Region, BracketTeam[]> {
  const regions: Region[] = ['East', 'West', 'South', 'Midwest']
  const result = {} as Record<Region, BracketTeam[]>

  for (const region of regions) {
    result[region] = BRACKET_2026[region].map((t, i) => ({
      id: `${region.toLowerCase()}-seed${i + 1}`,
      name: t.name,
      shortName: t.shortName,
      abbreviation: t.abbreviation,
      seed: i + 1,
      region,
      record: t.record,
      conference: t.conference,
      isFirstFour: t.isFirstFour,
      firstFourLabel: t.firstFourLabel,
    }))
  }

  return result
}

// ─── ESPN Live Results (active once tournament starts March 19) ───────────────
// Maps matchup "topTeamName vs bottomTeamName" → winner name, from ESPN scoreboard
export type LiveResults = Map<string, { winnerId: string; completed: boolean }>

export async function getLiveResults(): Promise<LiveResults> {
  const results: LiveResults = new Map()
  try {
    // Tournament dates: March 19 – April 6, 2026
    const today = new Date()
    const tourneyStart = new Date('2026-03-19')
    const tourneyEnd = new Date('2026-04-07')
    if (today < tourneyStart || today > tourneyEnd) return results

    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=100&dates=${dateStr}&limit=64`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) return results

    const data = await res.json()
    for (const event of data?.events ?? []) {
      const competition = event?.competitions?.[0]
      if (!competition) continue
      const completed = competition.status?.type?.completed ?? false
      if (!completed) continue

      const competitors: Array<{ team: { displayName: string }; winner?: boolean; id: string }> =
        competition.competitors ?? []
      const winner = competitors.find((c) => c.winner)
      if (!winner) continue

      const names = competitors.map((c) => c.team.displayName).sort().join(' vs ')
      results.set(names, { winnerId: winner.team.displayName, completed: true })
    }
  } catch {
    // silently ignore
  }
  return results
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getBracketTeams(): Promise<Record<Region, BracketTeam[]>> {
  // 2026 bracket is hardcoded from Selection Sunday (March 15, 2026)
  return build2026Teams()
}

export function buildInitialGames(teams: Record<Region, BracketTeam[]>): BracketGame[] {
  const games: BracketGame[] = []
  const regions: Region[] = ['East', 'West', 'South', 'Midwest']

  for (const region of regions) {
    const regionTeams = teams[region]
    const bySeed = (seed: number) => regionTeams.find((t) => t.seed === seed) ?? null

    SEED_MATCHUPS.forEach(([topSeed, bottomSeed], slotIndex) => {
      games.push({
        id: `${region.toLowerCase()}-r1-${slotIndex}`,
        round: 1,
        region,
        slotIndex,
        topTeam: bySeed(topSeed),
        bottomTeam: bySeed(bottomSeed),
      })
    })
  }

  return games
}
