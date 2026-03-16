import { analyzeBracket } from '@/lib/bracket/summarize'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { picks, games } = await req.json()
    const result = await analyzeBracket(picks, games)
    return NextResponse.json(result)
  } catch (e: unknown) {
    return NextResponse.json(
      { error: (e as Error).message ?? 'Analysis failed' },
      { status: 500 }
    )
  }
}
