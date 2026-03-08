// lib/bracket-store.ts

import { useEffect, useState } from 'react';

interface BracketData {
  id: string;
  picks: { [key: string]: string };
}

const BRACKET_KEY = 'bracket_data';

export const useBracketStore = () => {
  const [bracketData, setBracketData] = useState<BracketData[]>([]);

  useEffect(() => {
    const storedData = localStorage.getItem(BRACKET_KEY);
    if (storedData) {
      setBracketData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(BRACKET_KEY, JSON.stringify(bracketData));
  }, [bracketData]);

  const addBracket = (newBracket: BracketData) => {
    setBracketData((prev) => [...prev, newBracket]);
  };

  const updateBracket = (id: string, updatedPicks: { [key: string]: string }) => {
    setBracketData((prev) =>
      prev.map((bracket) =>
        bracket.id === id ? { ...bracket, picks: updatedPicks } : bracket
      )
    );
  };

  const deleteBracket = (id: string) => {
    setBracketData((prev) => prev.filter((bracket) => bracket.id !== id));
  };

  return { bracketData, addBracket, updateBracket, deleteBracket };
};