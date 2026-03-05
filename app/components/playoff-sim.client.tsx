"use client";

import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { SimulationOutput } from "@/types/fantasy";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const chartConfig = {
  playoffProbability: {
    label: "Playoff %",
    color: "var(--chart-1)",
  },
  championshipProbability: {
    label: "Championship %",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export default function PlayoffSimClient({
  output,
  userTeamId,
}: {
  output: SimulationOutput;
  userTeamId: number;
}) {
  const { results, simulationCount, playoffSpots, currentWeek, totalWeeks } =
    output;

  const barData = results.map((r) => ({
    name: r.teamName,
    playoffProbability: r.playoffProbability,
    championshipProbability: r.championshipProbability,
    isUser: r.teamId === userTeamId,
  }));

  const userResult = results.find((r) => r.teamId === userTeamId);
  const seedEntries = userResult
    ? Object.entries(userResult.seedDistribution)
        .map(([seed, pct]) => ({ seed: Number(seed), pct }))
        .filter((e) => e.pct > 0)
        .sort((a, b) => a.seed - b.seed)
    : [];

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          {simulationCount.toLocaleString()} simulations &middot; Week{" "}
          {currentWeek} of {totalWeeks}
        </span>
        <span>Top {playoffSpots} make playoffs</span>
      </div>

      {/* Playoff probability bar chart */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Playoff Probability</h4>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <BarChart
            data={barData}
            layout="vertical"
            margin={{ top: 4, right: 40, bottom: 4, left: 4 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, "Playoff %"]}
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            />
            <Bar dataKey="playoffProbability" radius={[0, 4, 4, 0]}>
              {barData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.isUser ? "var(--chart-1)" : "var(--chart-2)"
                  }
                  fillOpacity={entry.isUser ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Championship probability */}
      <div>
        <h4 className="mb-2 text-sm font-medium">Championship Probability</h4>
        <ChartContainer config={chartConfig} className="h-[320px] w-full">
          <BarChart
            data={barData}
            layout="vertical"
            margin={{ top: 4, right: 40, bottom: 4, left: 4 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              domain={[0, "auto"]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value: number) => [`${value}%`, "Championship %"]}
              cursor={{ fill: "var(--muted)", opacity: 0.3 }}
            />
            <Bar
              dataKey="championshipProbability"
              radius={[0, 4, 4, 0]}
            >
              {barData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.isUser ? "var(--chart-3)" : "var(--chart-4)"
                  }
                  fillOpacity={entry.isUser ? 1 : 0.6}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Your team details */}
      {userResult && (
        <div className="space-y-4 rounded-lg border p-4">
          <h4 className="text-sm font-medium">
            Your Team: {userResult.teamName}
          </h4>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <StatCard
              label="Record"
              value={`${userResult.currentWins}-${userResult.currentLosses}`}
            />
            <StatCard
              label="Proj. Wins"
              value={`${userResult.avgProjectedWins}`}
            />
            <StatCard
              label="Playoff %"
              value={`${userResult.playoffProbability}%`}
              highlight
            />
            <StatCard
              label="Magic #"
              value={
                userResult.magicNumber === null
                  ? "—"
                  : userResult.magicNumber === 0
                  ? "Clinched"
                  : `${userResult.magicNumber} wins`
              }
            />
          </div>

          {/* Seed distribution */}
          {seedEntries.length > 0 && (
            <div>
              <h5 className="mb-2 text-xs font-medium text-muted-foreground">
                Projected Seeding Distribution
              </h5>
              <div className="flex flex-wrap gap-2">
                {seedEntries.map(({ seed, pct }) => (
                  <div
                    key={seed}
                    className="flex flex-col items-center rounded-md border px-3 py-1.5"
                  >
                    <span className="text-xs text-muted-foreground">
                      {ordinal(seed)} seed
                    </span>
                    <span className="text-sm font-semibold">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full standings table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-2 py-1.5">#</th>
              <th className="px-2 py-1.5">Team</th>
              <th className="px-2 py-1.5 text-right">W-L</th>
              <th className="px-2 py-1.5 text-right">Proj W</th>
              <th className="px-2 py-1.5 text-right">Playoff %</th>
              <th className="px-2 py-1.5 text-right">Champ %</th>
              <th className="px-2 py-1.5 text-right">Magic #</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr
                key={r.teamId}
                className={`border-b ${
                  r.teamId === userTeamId
                    ? "bg-accent/40 font-medium"
                    : ""
                } ${i < playoffSpots ? "" : "text-muted-foreground"}`}
              >
                <td className="px-2 py-1.5">{i + 1}</td>
                <td className="px-2 py-1.5">{r.teamName}</td>
                <td className="px-2 py-1.5 text-right">
                  {r.currentWins}-{r.currentLosses}
                </td>
                <td className="px-2 py-1.5 text-right">
                  {r.avgProjectedWins}
                </td>
                <td className="px-2 py-1.5 text-right">
                  {r.playoffProbability}%
                </td>
                <td className="px-2 py-1.5 text-right">
                  {r.championshipProbability}%
                </td>
                <td className="px-2 py-1.5 text-right">
                  {r.magicNumber === null
                    ? "—"
                    : r.magicNumber === 0
                    ? "✓"
                    : r.magicNumber}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-md border px-3 py-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={`text-lg font-semibold ${
          highlight ? "text-primary" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
