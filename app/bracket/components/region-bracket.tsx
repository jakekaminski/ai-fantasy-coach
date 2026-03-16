'use client'

import type { BracketGame, BracketPicks, BracketTeam, Region } from '@/types/bracket'
import GameSlot from './game-slot'

const ROUND_LABELS: Record<number, string> = {
  1: 'First Round',
  2: 'Second Round',
  3: 'Sweet 16',
  4: 'Elite 8',
}

interface RegionBracketProps {
  region: Region
  computedGames: BracketGame[]
  picks: BracketPicks
  onPick: (gameId: string, teamId: string) => void
}

export default function RegionBracket({
  region,
  computedGames,
  picks,
  onPick,
}: RegionBracketProps) {
  const rounds = [1, 2, 3, 4]

  return (
    <div className="flex flex-col gap-1">
      <div className="mb-2 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {region} Region
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {rounds.map((round) => {
          const roundGames = computedGames
            .filter((g) => g.region === region && g.round === round)
            .sort((a, b) => a.slotIndex - b.slotIndex)

          return (
            <div key={round} className="flex flex-col gap-1 min-w-[130px]">
              <div className="text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {ROUND_LABELS[round]}
              </div>
              <div
                className="flex flex-col"
                style={{
                  gap: `${(8 / roundGames.length - 1) * 4}px`,
                  justifyContent: 'space-around',
                  flex: 1,
                }}
              >
                {roundGames.map((game) => (
                  <div
                    key={game.id}
                    style={{
                      marginTop: round === 1 ? 0 : `${Math.pow(2, round - 2) * 10}px`,
                      marginBottom: round === 1 ? 0 : `${Math.pow(2, round - 2) * 10}px`,
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

export function getWinner(gameId: string, picks: BracketPicks, games: BracketGame[]): BracketTeam | null {
  const winnerId = picks[gameId]
  if (!winnerId) return null
  const game = games.find((g) => g.id === gameId)
  if (!game) return null
  return game.topTeam?.id === winnerId
    ? game.topTeam
    : game.bottomTeam?.id === winnerId
      ? game.bottomTeam
      : null
}
