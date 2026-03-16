import { getBracketTeams, buildInitialGames } from '@/lib/bracket/espn'
import Link from 'next/link'
import BracketBuilder from './components/bracket-builder.client'

export const metadata = {
  title: 'March Madness Bracket Builder | AI Fantasy Coach',
  description: 'Build your 2026 NCAA Tournament bracket with AI-powered analysis.',
}

export default async function BracketPage() {
  const teams = await getBracketTeams()
  const initialGames = buildInitialGames(teams)

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-4 py-3">
        <div className="mx-auto max-w-screen-2xl flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Fantasy Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-base font-semibold">🏀 March Madness Bracket Builder</h1>
        </div>
      </div>
      <BracketBuilder initialGames={initialGames} />
    </div>
  )
}
