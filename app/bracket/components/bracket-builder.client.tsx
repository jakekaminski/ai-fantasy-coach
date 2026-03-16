'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BracketGame, BracketPicks, BracketTeam, Region } from '@/types/bracket'
import { RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AiAdvisor from './ai-advisor.client'
import GameSlot from './game-slot'

const STORAGE_KEY = 'mm-bracket-2026'

const REGIONS: Region[] = ['East', 'West', 'South', 'Midwest']

// Final Four pairing: East vs West, South vs Midwest
const SEMIFINAL_PAIRS: [Region, Region][] = [
  ['East', 'West'],
  ['South', 'Midwest'],
]

function getWinnerTeam(gameId: string, picks: BracketPicks, games: BracketGame[]): BracketTeam | null {
  const winnerId = picks[gameId]
  if (!winnerId) return null
  const game = games.find((g) => g.id === gameId)
  if (!game) return null
  if (game.topTeam?.id === winnerId) return game.topTeam
  if (game.bottomTeam?.id === winnerId) return game.bottomTeam
  return null
}

/** Build computed games for rounds 2-4 within a region, plus Final Four + Championship */
function computeAllGames(initialGames: BracketGame[], picks: BracketPicks): BracketGame[] {
  const all: BracketGame[] = [...initialGames]

  // Build regional rounds 2, 3, 4
  for (const region of REGIONS) {
    for (let round = 2; round <= 4; round++) {
      const prevRoundGames = all
        .filter((g) => g.region === region && g.round === round - 1)
        .sort((a, b) => a.slotIndex - b.slotIndex)

      const gamesInThisRound = prevRoundGames.length / 2

      for (let slot = 0; slot < gamesInThisRound; slot++) {
        const gameId = `${region.toLowerCase()}-r${round}-${slot}`
        const topSourceGame = prevRoundGames[slot * 2]
        const bottomSourceGame = prevRoundGames[slot * 2 + 1]

        const topTeam = topSourceGame ? getWinnerTeam(topSourceGame.id, picks, all) : null
        const bottomTeam = bottomSourceGame ? getWinnerTeam(bottomSourceGame.id, picks, all) : null

        // Remove stale version if already added
        const existingIdx = all.findIndex((g) => g.id === gameId)
        const game: BracketGame = {
          id: gameId,
          round,
          region,
          slotIndex: slot,
          topTeam,
          bottomTeam,
        }
        if (existingIdx >= 0) {
          all[existingIdx] = game
        } else {
          all.push(game)
        }
      }
    }
  }

  // Build Final Four (round 5)
  SEMIFINAL_PAIRS.forEach(([regionA, regionB], i) => {
    const elite8A = all.find((g) => g.region === regionA && g.round === 4 && g.slotIndex === 0)
    const elite8B = all.find((g) => g.region === regionB && g.round === 4 && g.slotIndex === 0)

    const topTeam = elite8A ? getWinnerTeam(elite8A.id, picks, all) : null
    const bottomTeam = elite8B ? getWinnerTeam(elite8B.id, picks, all) : null

    const gameId = `semifinal-${i}`
    const existing = all.findIndex((g) => g.id === gameId)
    const game: BracketGame = {
      id: gameId,
      round: 5,
      region: 'FinalFour',
      slotIndex: i,
      topTeam,
      bottomTeam,
    }
    if (existing >= 0) all[existing] = game
    else all.push(game)
  })

  // Championship (round 6)
  const sf0 = all.find((g) => g.id === 'semifinal-0')
  const sf1 = all.find((g) => g.id === 'semifinal-1')
  const champGame: BracketGame = {
    id: 'championship',
    round: 6,
    region: 'Championship',
    slotIndex: 0,
    topTeam: sf0 ? getWinnerTeam('semifinal-0', picks, all) : null,
    bottomTeam: sf1 ? getWinnerTeam('semifinal-1', picks, all) : null,
  }
  const champIdx = all.findIndex((g) => g.id === 'championship')
  if (champIdx >= 0) all[champIdx] = champGame
  else all.push(champGame)

  return all
}

const ROUND_LABELS: Record<number, string> = {
  1: 'First Round',
  2: 'Second Round',
  3: 'Sweet 16',
  4: 'Elite 8',
}

interface RegionColumnProps {
  region: Region
  computedGames: BracketGame[]
  picks: BracketPicks
  onPick: (gameId: string, teamId: string) => void
}

function RegionColumn({ region, computedGames, picks, onPick }: RegionColumnProps) {
  const rounds = [1, 2, 3, 4]

  return (
    <div className="flex flex-col gap-2">
      <div className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {region}
      </div>
      <div className="flex gap-2">
        {rounds.map((round) => {
          const roundGames = computedGames
            .filter((g) => g.region === region && g.round === round)
            .sort((a, b) => a.slotIndex - b.slotIndex)

          // Spacing: each higher round has fewer games, so we space them out
          const spacer = Math.pow(2, round - 1)

          return (
            <div key={round} className="flex flex-col min-w-[120px]">
              <div className="mb-1 text-center text-[9px] font-medium uppercase tracking-wide text-muted-foreground/70">
                {ROUND_LABELS[round]}
              </div>
              <div className="flex flex-1 flex-col" style={{ gap: `${spacer * 4}px` }}>
                {roundGames.map((game, idx) => (
                  <div
                    key={game.id}
                    style={{
                      marginTop: idx === 0 ? `${(spacer - 1) * 2}px` : 0,
                    }}
                  >
                    <GameSlot
                      gameId={game.id}
                      topTeam={game.topTeam}
                      bottomTeam={game.bottomTeam}
                      winnerId={picks[game.id]}
                      onPick={onPick}
                      compact
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface BracketBuilderProps {
  initialGames: BracketGame[]
}

export default function BracketBuilder({ initialGames }: BracketBuilderProps) {
  const [picks, setPicks] = useState<BracketPicks>({})
  const [hydrated, setHydrated] = useState(false)
  const [aiFilling, setAiFilling] = useState(false)
  const [aiFillError, setAiFillError] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setPicks(JSON.parse(stored))
    } catch {}
    setHydrated(true)
  }, [])

  // Save to localStorage on picks change
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(picks))
    } catch {}
  }, [picks, hydrated])

  const computedGames = useMemo(
    () => computeAllGames(initialGames, picks),
    [initialGames, picks]
  )

  const handlePick = useCallback((gameId: string, teamId: string) => {
    setPicks((prev) => {
      const next = { ...prev, [gameId]: teamId }

      // Invalidate downstream picks if team changed
      const prevWinner = prev[gameId]
      if (prevWinner && prevWinner !== teamId) {
        // Clear picks for all downstream games
        // We'll just recompute — clearing all picks for subsequent rounds is complex,
        // so we let the computed state handle showing TBD while preserving other picks
        // Actually, we need to clear picks for games where this game's winner was the source
        // Simple approach: only clear picks where the old winner was picked as a winner downstream
        const purge = (oldTeamId: string, games: BracketGame[]) => {
          for (const g of games) {
            if (next[g.id] === oldTeamId) {
              delete next[g.id]
              purge(oldTeamId, games)
            }
          }
        }
        purge(prevWinner, computedGames)
      }

      return next
    })
  }, [computedGames])

  /** Iteratively fill the bracket round by round using AI suggestions */
  async function aiFillBracket() {
    setAiFilling(true)
    setAiFillError(null)
    try {
      let currentPicks = { ...picks }

      // Fill rounds 1–6 progressively
      for (let round = 1; round <= 6; round++) {
        const currentGames = computeAllGames(initialGames, currentPicks)
        const gamesThisRound = currentGames.filter(
          (g) =>
            g.round === round &&
            g.topTeam &&
            g.bottomTeam &&
            !currentPicks[g.id] &&
            !g.topTeam.isFirstFour &&
            !g.bottomTeam?.isFirstFour
        )
        if (gamesThisRound.length === 0) continue

        const res = await fetch('/api/bracket/suggest-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ games: gamesThisRound, existingPicks: currentPicks }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'AI fill failed')
        currentPicks = { ...currentPicks, ...data.picks }
      }

      setPicks(currentPicks)
    } catch (e: unknown) {
      setAiFillError((e as Error).message ?? 'AI fill failed')
    } finally {
      setAiFilling(false)
    }
  }

  const champion = picks['championship']
    ? computedGames.find((g) => g.id === 'championship')?.topTeam?.id === picks['championship']
      ? computedGames.find((g) => g.id === 'championship')?.topTeam
      : computedGames.find((g) => g.id === 'championship')?.bottomTeam
    : null

  const picksCount = Object.keys(picks).length
  const totalGames = 63 // 32 + 16 + 8 + 4 + 2 + 1

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6">
      {/* Header bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {picksCount}/{totalGames} picks
          </Badge>
          {champion && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
              <Trophy className="h-4 w-4" />
              {champion.name}
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {aiFillError && (
            <span className="text-xs text-destructive">{aiFillError}</span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            onClick={aiFillBracket}
            disabled={aiFilling}
          >
            <Sparkles className={`h-3.5 w-3.5 ${aiFilling ? 'animate-pulse' : ''}`} />
            {aiFilling ? 'AI filling…' : 'AI Fill'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={() => { setPicks({}); setAiFillError(null) }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <div className="flex gap-6 lg:flex-row flex-col">
        {/* Bracket */}
        <div className="flex-1 min-w-0 space-y-6 overflow-x-auto">
          {/* Regions grid */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {REGIONS.map((region) => (
              <Card key={region} className="overflow-hidden">
                <CardContent className="p-3">
                  <RegionColumn
                    region={region}
                    computedGames={computedGames}
                    picks={picks}
                    onPick={handlePick}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Final Four + Championship */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-amber-500" />
                Final Four &amp; Championship
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {/* Semifinal 0 */}
                <div className="min-w-[140px]">
                  <div className="mb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    East / West
                  </div>
                  <GameSlot
                    gameId="semifinal-0"
                    topTeam={computedGames.find((g) => g.id === 'semifinal-0')?.topTeam ?? null}
                    bottomTeam={computedGames.find((g) => g.id === 'semifinal-0')?.bottomTeam ?? null}
                    winnerId={picks['semifinal-0']}
                    onPick={handlePick}
                  />
                </div>

                {/* Championship */}
                <div className="min-w-[160px]">
                  <div className="mb-1 text-center text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    🏆 Championship
                  </div>
                  <GameSlot
                    gameId="championship"
                    topTeam={computedGames.find((g) => g.id === 'championship')?.topTeam ?? null}
                    bottomTeam={computedGames.find((g) => g.id === 'championship')?.bottomTeam ?? null}
                    winnerId={picks['championship']}
                    onPick={handlePick}
                  />
                </div>

                {/* Semifinal 1 */}
                <div className="min-w-[140px]">
                  <div className="mb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    South / Midwest
                  </div>
                  <GameSlot
                    gameId="semifinal-1"
                    topTeam={computedGames.find((g) => g.id === 'semifinal-1')?.topTeam ?? null}
                    bottomTeam={computedGames.find((g) => g.id === 'semifinal-1')?.bottomTeam ?? null}
                    winnerId={picks['semifinal-1']}
                    onPick={handlePick}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Advisor sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <AiAdvisor picks={picks} games={computedGames} />
        </div>
      </div>
    </div>
  )
}
