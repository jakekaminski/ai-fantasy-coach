import { TEAM_ID } from "@/lib/espn/fetchers";
import { Scale } from "lucide-react";
import TradeAnalyzer from "./trade-analyzer";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TradeAnalyzerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const teamId = Number(params?.team) || TEAM_ID;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6 flex items-center gap-3">
          <Scale className="h-6 w-6" />
          <div>
            <h1 className="text-2xl font-semibold">Trade Analyzer</h1>
            <p className="text-sm text-muted-foreground">
              Evaluate proposed trades with AI-powered analysis
            </p>
          </div>
        </div>
        <TradeAnalyzer teamId={teamId} />
      </div>
    </div>
  );
}
