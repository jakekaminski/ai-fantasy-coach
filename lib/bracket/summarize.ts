'use server'

import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import type { BracketGame, BracketPicks } from '@/types/bracket'

const BracketAnalysisSchema = z.object({
  headline: z.string(),
  champion: z.string(),
  finalFour: z.array(z.string()).length(4),
  boldPicks: z
    .array(
      z.object({
        team: z.string(),
        round: z.string(),
        reasoning: z.string(),
      })
    )
    .max(5),
  riskAssessment: z.string(),
  overallStrategy: z.string(),
})

export type BracketAnalysisResult = z.infer<typeof BracketAnalysisSchema>

function buildPicksSummary(picks: BracketPicks, games: BracketGame[]): string {
  const lines: string[] = []
  const roundNames: Record<number, string> = {
    1: 'First Round',
    2: 'Second Round',
    3: 'Sweet 16',
    4: 'Elite 8',
    5: 'Final Four',
    6: 'Championship',
  }

  for (const game of games) {
    const winnerId = picks[game.id]
    if (!winnerId) continue

    const winner =
      game.topTeam?.id === winnerId
        ? game.topTeam
        : game.bottomTeam?.id === winnerId
          ? game.bottomTeam
          : null

    const loser =
      game.topTeam?.id === winnerId
        ? game.bottomTeam
        : game.bottomTeam?.id === winnerId
          ? game.topTeam
          : null

    if (!winner) continue

    const round = roundNames[game.round] ?? `Round ${game.round}`
    const region =
      game.region === 'FinalFour'
        ? 'Final Four'
        : game.region === 'Championship'
          ? 'Championship'
          : game.region

    if (loser) {
      lines.push(
        `${region} - ${round}: #${winner.seed} ${winner.name} over #${loser.seed} ${loser.name}`
      )
    } else {
      lines.push(`${region} - ${round}: ${winner.name} advances`)
    }
  }

  return lines.join('\n')
}

export async function analyzeBracket(
  picks: BracketPicks,
  games: BracketGame[]
): Promise<BracketAnalysisResult> {
  const system = [
    'You are a sharp college basketball analyst covering March Madness.',
    'Analyze the user\'s bracket picks. Be opinionated, specific, and entertaining.',
    'Reference seed numbers when discussing upsets (e.g., "#12 Liberty over #5 Miss St").',
    'Identify the boldest picks and whether they reflect a safe chalk bracket or a risky upset-heavy one.',
    'Return only the structured result.',
  ].join('\n')

  const summary = buildPicksSummary(picks, games)

  if (!summary) {
    throw new Error('No picks to analyze — fill out your bracket first!')
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), 10000)

  try {
    const resp = await openai.responses.parse(
      {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        input: [
          { role: 'system', content: system },
          {
            role: 'system',
            content: 'Return ONLY valid JSON matching the schema. No explanations.',
          },
          {
            role: 'user',
            content: `Here are my bracket picks:\n\n${summary}\n\nAnalyze my bracket.`,
          },
        ],
        text: {
          format: zodTextFormat(BracketAnalysisSchema, 'bracket_analysis'),
        },
      },
      { signal: ac.signal }
    )

    const parsed = resp.output_parsed
    if (!parsed) throw new Error('Structured parse returned null')
    return parsed
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      throw new Error('Analysis timed out — try again')
    }
    throw err
  } finally {
    clearTimeout(t)
  }
}
