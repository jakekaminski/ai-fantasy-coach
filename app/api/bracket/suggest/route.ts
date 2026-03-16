import { suggestPick } from '@/lib/bracket/suggest'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { gameId, topTeam, bottomTeam } = await req.json()
    if (!gameId || !topTeam || !bottomTeam) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const result = await suggestPick(gameId, topTeam, bottomTeam)
    return NextResponse.json(result)
  } catch (e: unknown) {
    return NextResponse.json(
      { error: (e as Error).message ?? 'Suggestion failed' },
      { status: 500 }
    )
  }
}
