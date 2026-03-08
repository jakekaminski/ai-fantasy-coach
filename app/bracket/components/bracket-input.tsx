import React, { useState } from 'react';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@radix-ui/react-select';
import { OpenAI } from 'openai';
import { useRouter } from 'next/navigation';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BracketInput: React.FC = () => {
  const router = useRouter();
  const [bracket, setBracket] = useState<{ [key: string]: { team: string; seed: number } }>({});
  const [error, setError] = useState<string | null>(null);

  const regions = ['East', 'West', 'Midwest', 'South'];
  const seeds = Array.from({ length: 16 }, (_, i) => i + 1);

  const handleTeamChange = (region: string, seed: number, team: string) => {
    setBracket((prevBracket) => ({
      ...prevBracket,
      [`${region}-${seed}`]: { team, seed },
    }));
  };

  const handleImport = async () => {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a bracket expert. Please provide a valid NCAA bracket in the format: East-1: Team1, East-2: Team2, ..., West-16: Team16.',
          },
          {
            role: 'user',
            content: 'East-1: Duke, East-2: Kentucky, East-3: Michigan State, East-4: Gonzaga, East-5: Arizona, East-6: Kansas, East-7: Butler, East-8: Villanova, East-9: Marquette, East-10: Illinois, East-11: San Diego State, East-12: Seton Hall, East-13: Washington, East-14: Oregon, East-15: Xavier, East-16: UConn, West-1: Oregon State, West-2: Gonzaga, West-3: Arizona State, West-4: Colorado, West-5: San Diego State, West-6: Utah, West-7: Washington State, West-8: Oregon, West-9: BYU, West-10: Colorado State, West-11: San Francisco, West-12: Montana, West-13: Iowa State, West-14: Arizona, West-15: San Diego State, West-16: Utah State, Midwest-1: Iowa, Midwest-2: Illinois, Midwest-3: Indiana, Midwest-4: Michigan, Midwest-5: Ohio State, Midwest-6: Penn State, Midwest-7: Wisconsin, Midwest-8: Michigan State, Midwest-9: Illinois, Midwest-10: Indiana, Midwest-11: Iowa State, Midwest-12: Penn State, Midwest-13: Wisconsin, Midwest-14: Michigan, Midwest-15: Ohio State, Midwest-16: Illinois, South-1: Kentucky, South-2: Duke, South-3: Tennessee, South-4: Kentucky, South-5: Kentucky, South-6: Kentucky, South-7: Kentucky, South-8: Kentucky, South-9: Kentucky, South-10: Kentucky, South-11: Kentucky, South-12: Kentucky, South-13: Kentucky, South-14: Kentucky, South-15: Kentucky, South-16: Kentucky',
          },
        ],
      });

      const bracketText = response.choices[0].message?.content?.trim();
      if (bracketText) {
        const bracketData = bracketText.split(',').reduce((acc, item) => {
          const [regionSeed, team] = item.split(':');
          const [region, seed] = regionSeed.split('-');
          acc[`${region}-${seed}`] = { team, seed: parseInt(seed) };
          return acc;
        }, {} as { [key: string]: { team: string; seed: number } });

        setBracket(bracketData);
      }
    } catch (error) {
      setError('Failed to import bracket. Please try again.');
    }
  };

  const handleSubmit = () => {
    router.push('/bracket/preview', { state: { bracket } });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">NCAA Bracket Input/Import</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-4 gap-4">
        {regions.map((region) => (
          <div key={region} className="space-y-2">
            <h2 className="text-xl font-bold">{region}</h2>
            {seeds.map((seed) => (
              <div key={seed} className="flex items-center space-x-2">
                <Select onValueChange={(team) => handleTeamChange(region, seed, team)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Select Team for Seed ${seed}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {seeds.map((teamSeed) => (
                      <SelectItem key={teamSeed} value={`Team${teamSeed}`}>
                        Team {teamSeed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-gray-500">Seed {seed}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Button onClick={handleImport} className="mr-2">
          Import Bracket
        </Button>
        <Button onClick={handleSubmit} disabled={Object.keys(bracket).length !== 64}>
          Submit Bracket
        </Button>
      </div>
    </div>
  );
};

export default BracketInput;