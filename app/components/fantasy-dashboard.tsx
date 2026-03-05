import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TEAM_ID } from "@/lib/espn/fetchers";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  ChartPie,
  LineChart,
  ListChecks,
  Shuffle,
  Table2,
  TrendingUp,
} from "lucide-react";
import Filters from "../../components/dashboard/filters.client";
import CoachBriefing from "./coach-briefing";
import MatchupBreakdown from "./matchup-breakdown";
import MatchupTable from "./matchup-table";
import PlayoffSim from "./playoff-sim";
import MobileBottomNav from "./mobile-bottom-nav";
import ProjectionsChart from "./projections-chart";
import WaiverWire from "./waiver-wire";
import WinProbabilityChart from "./win-probability-chart";

export default async function FantasyDashboard({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const week = Number(params?.week) || 1;
  const teamId = Number(params?.team) || TEAM_ID;
  const risk = Number(params?.risk) || 50;
  const live = params?.live === "true";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Top Bar / Controls */}
        <Filters
          initialWeek={1}
          initialTeam="my-team"
          initialRisk={50}
          initialLiveOnly={live}
        />
        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 md:pb-6 lg:px-6 lg:py-8">
          <div
            id="section-dashboard"
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {/* LEFT COLUMN */}
            <div className="space-y-6 md:col-span-2 lg:col-span-2">
              {/* Win Probability Grid */}
              <Section
                title="Win Probability"
                icon={<ChartPie className="h-4 w-4" />}
              >
                <WinProbabilityChart
                  week={week}
                  teamId={teamId}
                  risk={risk}
                  live={live}
                />
              </Section>

              {/* Matchup Table */}
              <div id="section-matchups">
                <Section
                  title="Matchups"
                  icon={<Table2 className="h-4 w-4" />}
                >
                  <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    <MatchupTable week={week} />
                  </div>
                  <div className="mt-4 border-t pt-4">
                    <MatchupBreakdown week={week} teamId={teamId} />
                  </div>
                </Section>
              </div>

              <Section
                title="Season Projections"
                icon={<LineChart className="h-4 w-4" />}
              >
                <Tabs defaultValue="projections">
                  <TabsList>
                    <TabsTrigger value="projections" className="gap-2">
                      <TrendingUp className="h-4 w-4" /> Projections
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                      <LineChart className="h-4 w-4" /> History
                    </TabsTrigger>
                    <TabsTrigger value="sim" className="gap-2">
                      <BarChart3 className="h-4 w-4" /> Playoff Sims
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="projections" className="space-y-4 pt-4">
                    <ProjectionsChart />
                  </TabsContent>
                  <TabsContent value="history" className="space-y-4 pt-4">
                    <Placeholder
                      height="h-64"
                      label="Weekly scores line chart per team"
                    />
                    <Placeholder height="h-48" label="Head-to-head heatmap" />
                  </TabsContent>
                  <TabsContent value="sim" className="space-y-4 pt-4">
                    <PlayoffSim teamId={teamId} />
                  </TabsContent>
                </Tabs>
              </Section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6 md:col-span-2 lg:col-span-1">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-1">
                {/* AI Coach Summary */}
                <div id="section-coach">
                  <CoachBriefing
                    week={week}
                    teamId={teamId}
                    risk={risk}
                    live={live}
                  />
                </div>

                {/* Start/Sit Optimizer */}
                <div id="section-optimizer">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <ListChecks className="h-4 w-4" /> Start/Sit Optimizer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <Input placeholder="e.g., Swap WR3? Add bench RB?" />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Shuffle className="h-4 w-4" /> AI recommends:{" "}
                          <span className="font-medium text-foreground">
                            WR X → FLEX, RB Y → Bench
                          </span>
                        </div>
                        <Button size="sm" className="self-start">
                          Optimize Lineup
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Waiver Wire */}
                <div id="section-waivers" className="md:col-span-2 lg:col-span-1">
                  <WaiverWire week={week} teamId={teamId} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    </TooltipProvider>
  );
}

/* --------------------------- */
/* Small helpers / placeholders */
/* --------------------------- */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Placeholder({ height, label }: { height: string; label: string }) {
  return (
    <div
      className={`flex ${height} items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground`}
    >
      {label}
    </div>
  );
}

