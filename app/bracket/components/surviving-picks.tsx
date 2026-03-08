import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@radix-ui/react-card';
import { useOpenAI } from '@/lib/openai';
import { useBracket } from '@/lib/bracket';

const SurvivingPicks: React.FC = () => {
  const { bracket } = useBracket();
  const { getAnalysis } = useOpenAI();

  const survivingPicks = bracket?.rounds.flatMap(round => round.teams.filter(team => team.isSurviving));

  const analysis = React.useMemo(() => {
    if (!survivingPicks) return null;
    return getAnalysis(survivingPicks);
  }, [survivingPicks, getAnalysis]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Surviving Picks Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {analysis ? (
          <div className="space-y-4">
            {analysis.matchups.map((matchup, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">{matchup.team1.name}</span>
                  <span className="mx-2">vs</span>
                  <span className="ml-2">{matchup.team2.name}</span>
                </div>
                <div className="text-right">
                  <span className="mr-2">{matchup.eliminationTrend}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No analysis available.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default SurvivingPicks;