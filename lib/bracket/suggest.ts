'use server'

import OpenAI from 'openai'
import { zodTextFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import type { BracketGame, BracketPicks } from '@/types/bracket'

// ─── Single-game suggestion ───────────────────────────────────────────────────

const SinglePickSchema = z.object({
  pickedTeamId: z.string(),
  pickedTeamName: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  reasoning: z.string().max(200),
  upsetAlert: z.boolean(),
})

export type SinglePickResult = z.infer<typeof SinglePickSchema>

export async function suggestPick(
  gameId: string,
  topTeam: { id: string; name: string; seed: number; record?: string; conference?: string } | null,
  bottomTeam: { id: string; name: string; seed: number; record?: string; conference?: string } | null
): Promise<SinglePickResult> {
  if (!topTeam || !bottomTeam) throw new Error('Both teams must be known')

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  const prompt = [
    `2026 NCAA Tournament matchup:`,
    `- #${topTeam.seed} ${topTeam.name}${topTeam.record ? ` (${topTeam.record})` : ''}${topTeam.conference ? ` [${topTeam.conference}]` : ''}`,
    `- #${bottomTeam.seed} ${bottomTeam.name}${bottomTeam.record ? ` (${bottomTeam.record})` : ''}${bottomTeam.conference ? ` [${bottomTeam.conference}]` : ''}`,
    ``,
    `Pick the winner. Consider: seed, record, conference strength, team quality, upset history for these seeds.`,
    `upsetAlert = true if you're picking the lower seed (higher seed number) to win.`,
    `pickedTeamId must be exactly "${topTeam.id}" or "${bottomTeam.id}".`,
  ].join('\n')

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), 8000)

  try {
    const resp = await openai.responses.parse(
      {
        model: 'gpt-4o-mini',
        temperature: 0.4,
        input: [
          {
            role: 'system',
            content:
              'You are a sharp NCAA tournament analyst. Analyze the matchup and pick the winner. Be concise but specific in your reasoning.',
          },
          { role: 'user', content: prompt },
        ],
        text: { format: zodTextFormat(SinglePickSchema, 'pick') },
      },
      { signal: ac.signal }
    )

    const parsed = resp.output_parsed
    if (!parsed) throw new Error('No result')

    // Validate the pickedTeamId is one of the two teams
    if (parsed.pickedTeamId !== topTeam.id && parsed.pickedTeamId !== bottomTeam.id) {
      // Fallback: match by name
      if (parsed.pickedTeamName.toLowerCase().includes(topTeam.name.toLowerCase())) {
        parsed.pickedTeamId = topTeam.id
      } else {
        parsed.pickedTeamId = bottomTeam.id
      }
    }

    return parsed
  } finally {
    clearTimeout(t)
  }
}

// ─── Full-bracket AI fill ─────────────────────────────────────────────────────

const FullBracketSchema = z.object({
  picks: z.array(
    z.object({
      gameId: z.string(),
      pickedTeamId: z.string(),
      reasoning: z.string().max(120),
    })
  ),
})

export type FullBracketResult = z.infer<typeof FullBracketSchema>

function buildMatchupDescription(game: BracketGame): string {
  const { topTeam: t, bottomTeam: b } = game
  if (!t || !b) return ''
  const tStr = `#${t.seed} ${t.name}${t.record ? ` (${t.record})` : ''}${t.conference ? ` [${t.conference}]` : ''} [id:${t.id}]`
  const bStr = `#${b.seed} ${b.name}${b.record ? ` (${b.record})` : ''}${b.conference ? ` [${b.conference}]` : ''} [id:${b.id}]`
  const regionLabel =
    game.region === 'FinalFour'
      ? 'Final Four'
      : game.region === 'Championship'
        ? 'Championship'
        : `${game.region} Region`
  const roundLabel = ['', 'Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8', 'Final Four', 'Championship'][game.round] ?? `Round ${game.round}`
  return `[${game.id}] ${regionLabel} – ${roundLabel}: ${tStr} vs ${bStr}`
}

export async function suggestAllPicks(
  games: BracketGame[],
  existingPicks: BracketPicks
): Promise<BracketPicks> {
  // Only suggest for games where both teams are known and no pick exists yet
  const gamesNeedingPicks = games.filter(
    (g) => g.topTeam && g.bottomTeam && !existingPicks[g.id] && !g.topTeam.isFirstFour && !g.bottomTeam.isFirstFour
  )

  if (gamesNeedingPicks.length === 0) return {}

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  const matchupLines = gamesNeedingPicks.map(buildMatchupDescription).filter(Boolean).join('\n')

  const prompt = [
    `Fill out the 2026 NCAA Tournament bracket. Pick winners for each of these ${gamesNeedingPicks.length} matchups.`,
    ``,
    `For each game, return the gameId and the pickedTeamId (copy it exactly from [id:...] in the matchup).`,
    `Be a bold analyst — don't just pick all favorites. Consider real upsets by seed (12 over 5, 11 over 6, 10 over 7, etc.).`,
    ``,
    matchupLines,
  ].join('\n')

  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), 20000)

  try {
    const resp = await openai.responses.parse(
      {
        model: 'gpt-4o-mini',
        temperature: 0.5,
        input: [
          {
            role: 'system',
            content:
              'You are an expert NCAA tournament analyst filling out a bracket. Pick winners for each matchup using your knowledge of the 2026 teams, their records, and March Madness history. Be decisive.',
          },
          { role: 'user', content: prompt },
        ],
        text: { format: zodTextFormat(FullBracketSchema, 'bracket_fill') },
      },
      { signal: ac.signal }
    )

    const parsed = resp.output_parsed
    if (!parsed) throw new Error('No result')

    // Build a picks map, validating each pick
    const newPicks: BracketPicks = {}
    for (const pick of parsed.picks) {
      const game = gamesNeedingPicks.find((g) => g.id === pick.gameId)
      if (!game) continue
      const validId =
        pick.pickedTeamId === game.topTeam?.id || pick.pickedTeamId === game.bottomTeam?.id
          ? pick.pickedTeamId
          : game.topTeam?.id // fallback to top team if AI hallucinated
      if (validId) newPicks[pick.gameId] = validId
    }

    return newPicks
  } finally {
    clearTimeout(t)
  }
}
