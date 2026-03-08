// components/dashboard/bracket-widget.tsx

import React from 'react';
import { Button } from '@radix-ui/react-button';
import { useQuery } from '@tanstack/react-query';
import { getBracketSummary } from '@/lib/api/bracket';
import { BracketSummary } from '@/types/bracket';
import { HiOutlineChevronDoubleRight } from 'react-icons/hi';

interface BracketWidgetProps {
  bracketId: string;
}

const BracketWidget: React.FC<BracketWidgetProps> = ({ bracketId }) => {
  const { data: bracketSummary, isLoading, isError } = useQuery<BracketSummary, Error>(
    ['bracketSummary', bracketId],
    () => getBracketSummary(bracketId),
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error fetching bracket summary</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-2">Bracket Summary</h2>
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold mb-2">{bracketSummary.currentScore}</div>
        <div className="text-gray-500 mb-4">Projected Score: {bracketSummary.projectedScore}</div>
        <Button asChild>
          <a href={`/bracket/${bracketId}`} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            View Bracket <HiOutlineChevronDoubleRight className="ml-2" />
          </a>
        </Button>
      </div>
    </div>
  );
};

export default BracketWidget;