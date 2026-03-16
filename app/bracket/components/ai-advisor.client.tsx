'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { BracketAnalysisResult } from '@/lib/bracket/summarize'
import type { BracketGame, BracketPicks } from '@/types/bracket'
import { Sparkles, Target, Trophy, Zap } from 'lucide-react'
import { useState } from 'react'

interface AiAdvisorProps {
  picks: BracketPicks
  games: BracketGame[]
}

export default function AiAdvisor({ picks, games }: AiAdvisorProps) {
  const [result, setResult] = useState<BracketAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const picksCount = Object.keys(picks).length

  async function analyze() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/bracket/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picks, games }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed')
      setResult(data)
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-amber-500" />
          AI Bracket Advisor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!result && !loading && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {picksCount === 0
                ? 'Make some picks to get AI analysis of your bracket.'
                : `You have ${picksCount} pick${picksCount === 1 ? '' : 's'} — ready for AI analysis.`}
            </p>
            <Button
              size="sm"
              onClick={analyze}
              disabled={picksCount < 8}
              className="gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Analyze My Bracket
            </Button>
            {picksCount < 8 && (
              <p className="text-xs text-muted-foreground">
                Make at least 8 picks to unlock analysis.
              </p>
            )}
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}

        {error && (
          <div className="space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={analyze}>
              Try Again
            </Button>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            <p className="text-sm font-medium leading-snug">{result.headline}</p>

            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Champion Pick</div>
                <div className="text-sm font-semibold">{result.champion}</div>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Target className="h-3.5 w-3.5" /> Final Four
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.finalFour.map((team) => (
                  <Badge key={team} variant="secondary" className="text-xs">
                    {team}
                  </Badge>
                ))}
              </div>
            </div>

            {result.boldPicks.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-amber-500" /> Bold Picks
                </div>
                <div className="space-y-2">
                  {result.boldPicks.map((pick, i) => (
                    <div key={i} className="rounded-md border border-border/60 p-2 text-xs">
                      <div className="font-medium">
                        {pick.team}{' '}
                        <Badge variant="outline" className="text-[10px] ml-1">
                          {pick.round}
                        </Badge>
                      </div>
                      <div className="mt-0.5 text-muted-foreground">{pick.reasoning}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Strategy: </span>
              {result.overallStrategy}
            </div>

            <div className="text-xs text-muted-foreground italic">{result.riskAssessment}</div>

            <Button size="sm" variant="outline" onClick={analyze} className="w-full gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Re-analyze
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
