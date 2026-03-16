export type Region = 'East' | 'West' | 'South' | 'Midwest'

export type RoundName =
  | 'First Round'
  | 'Second Round'
  | 'Sweet 16'
  | 'Elite 8'
  | 'Final Four'
  | 'Championship'

export interface BracketTeam {
  id: string
  name: string
  shortName: string
  seed: number
  region: Region
  abbreviation?: string
  record?: string
  conference?: string
  /** True for teams still in First Four play-in games */
  isFirstFour?: boolean
  /** For First Four slots: both possible team names (e.g. "Texas / NC State") */
  firstFourLabel?: string
}

export interface BracketGame {
  id: string       // e.g. "east-r1-0"
  round: number    // 1–6
  region: Region | 'FinalFour' | 'Championship'
  slotIndex: number
  topTeam: BracketTeam | null
  bottomTeam: BracketTeam | null
}

export type BracketPicks = Record<string, string> // gameId -> winnerId

export interface BracketAnalysisResult {
  headline: string
  champion: string
  finalFour: string[]
  boldPicks: Array<{ team: string; round: string; reasoning: string }>
  riskAssessment: string
  overallStrategy: string
}
