import { suggestAllPicks } from '@/lib/bracket/suggest'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { games, existingPicks } = await req.json()
    if (!games || !Array.isArray(games)) {
      return NextResponse.json({ error: 'Missing games array' }, { status: 400 })
    }
    const picks = await suggestAllPicks(games, existingPicks ?? {})
    return NextResponse.json({ picks })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: (e as Error).message ?? 'AI fill failed' },
      { status: 500 }
    )
  }
}
