'use client'

import { cn } from '@/lib/utils'
import type { SinglePickResult } from '@/lib/bracket/suggest'
import type { BracketTeam } from '@/types/bracket'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'

function seedColor(seed: number): string {
  if (seed <= 4) return 'bg-emerald-500 text-white'
  if (seed <= 8) return 'bg-blue-500 text-white'
  if (seed <= 12) return 'bg-amber-500 text-white'
  return 'bg-red-500 text-white'
}

const confidenceLabel: Record<string, string> = {
  high: '●●●',
  medium: '●●○',
  low: '●○○',
}

interface TeamSlotProps {
  team: BracketTeam | null
  isWinner: boolean
  isLoser: boolean
  isAiPick: boolean
  onClick: () => void
  compact?: boolean
}

function TeamSlot({ team, isWinner, isLoser, isAiPick, onClick, compact }: TeamSlotProps) {
  if (!team) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 border-b border-border/40 px-2',
          compact ? 'h-7' : 'h-8'
        )}
      >
        <span className="text-xs text-muted-foreground/40">TBD</span>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-1.5 border-b border-border/40 px-2 text-left transition-colors',
        compact ? 'h-7' : 'h-8',
        isWinner && 'bg-primary/10 font-semibold',
        isLoser && 'opacity-35',
        !isWinner && !isLoser && 'hover:bg-muted/60 cursor-pointer',
        isAiPick && !isWinner && !isLoser && 'ring-1 ring-inset ring-amber-400/60'
      )}
    >
      <span
        className={cn(
          'inline-flex h-4 w-5 shrink-0 items-center justify-center rounded text-[9px] font-bold',
          seedColor(team.seed)
        )}
      >
        {team.seed}
      </span>
      <span className={cn('truncate flex-1', compact ? 'text-[11px]' : 'text-xs')}>
        {compact ? (team.firstFourLabel ?? team.shortName) : (team.firstFourLabel ?? team.name)}
      </span>
      {isAiPick && (
        <Sparkles className="h-2.5 w-2.5 shrink-0 text-amber-500" aria-label="AI pick" />
      )}
    </button>
  )
}

interface GameSlotProps {
  gameId: string
  topTeam: BracketTeam | null
  bottomTeam: BracketTeam | null
  winnerId: string | undefined
  onPick: (gameId: string, teamId: string) => void
  compact?: boolean
  /** Pre-fetched AI suggestion for this slot (optional) */
  aiSuggestion?: SinglePickResult | null
  onAiSuggestionFetched?: (gameId: string, result: SinglePickResult) => void
}

export default function GameSlot({
  gameId,
  topTeam,
  bottomTeam,
  winnerId,
  onPick,
  compact,
  aiSuggestion,
  onAiSuggestionFetched,
}: GameSlotProps) {
  const [loading, setLoading] = useState(false)
  const [localSuggestion, setLocalSuggestion] = useState<SinglePickResult | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

  const suggestion = aiSuggestion ?? localSuggestion

  const canSuggest =
    !!topTeam &&
    !!bottomTeam &&
    !topTeam.isFirstFour &&
    !bottomTeam.isFirstFour

  async function fetchSuggestion() {
    if (!canSuggest || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/bracket/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, topTeam, bottomTeam }),
      })
      const data: SinglePickResult = await res.json()
      if (!res.ok) throw new Error((data as unknown as { error: string }).error)
      setLocalSuggestion(data)
      setShowTooltip(true)
      onAiSuggestionFetched?.(gameId, data)
      // Auto-hide tooltip after 5s
      setTimeout(() => setShowTooltip(false), 5000)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative rounded border border-border/60 bg-card overflow-hidden shadow-sm group">
      <TeamSlot
        team={topTeam}
        isWinner={!!winnerId && topTeam?.id === winnerId}
        isLoser={!!winnerId && topTeam?.id !== winnerId}
        isAiPick={suggestion?.pickedTeamId === topTeam?.id}
        onClick={() => topTeam && onPick(gameId, topTeam.id)}
        compact={compact}
      />
      <TeamSlot
        team={bottomTeam}
        isWinner={!!winnerId && bottomTeam?.id === winnerId}
        isLoser={!!winnerId && bottomTeam?.id !== winnerId}
        isAiPick={suggestion?.pickedTeamId === bottomTeam?.id}
        onClick={() => bottomTeam && onPick(gameId, bottomTeam.id)}
        compact={compact}
      />

      {/* AI suggest button — visible on hover when no pick yet or to re-suggest */}
      {canSuggest && (
        <button
          onClick={fetchSuggestion}
          disabled={loading}
          title="Get AI pick"
          className={cn(
            'absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded',
            'bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-amber-50 dark:hover:bg-amber-950/40',
            loading && 'opacity-100 animate-pulse'
          )}
        >
          <Sparkles
            className={cn('h-2.5 w-2.5', loading ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500')}
          />
        </button>
      )}

      {/* Suggestion tooltip */}
      {suggestion && showTooltip && (
        <div
          className="absolute z-50 left-full ml-1.5 top-0 w-48 rounded-md border border-border bg-popover p-2 text-xs shadow-lg"
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              ✦ {suggestion.pickedTeamName}
            </span>
            <span className="text-muted-foreground text-[10px]" title="Confidence">
              {confidenceLabel[suggestion.confidence]}
            </span>
          </div>
          {suggestion.upsetAlert && (
            <div className="mb-1 text-[10px] font-medium text-orange-500">⚡ Upset pick</div>
          )}
          <p className="text-muted-foreground leading-snug">{suggestion.reasoning}</p>
          <button
            onClick={() => {
              onPick(gameId, suggestion.pickedTeamId)
              setShowTooltip(false)
            }}
            className="mt-2 w-full rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            Apply pick
          </button>
        </div>
      )}
    </div>
  )
}
