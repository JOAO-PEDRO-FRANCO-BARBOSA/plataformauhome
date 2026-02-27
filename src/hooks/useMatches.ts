import { useState, useEffect } from 'react';
import { Match } from '@/types';
import { mockMatches } from '@/data/mockData';

export function useMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMatches(mockMatches);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const connect = (matchId: string) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status: 'connected' as const, connectedAt: new Date().toISOString() } : m))
    );
  };

  const skip = (matchId: string) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status: 'skipped' as const } : m))
    );
  };

  const pending = matches.filter((m) => m.status === 'pending');
  const connected = matches.filter((m) => m.status === 'connected');

  return { matches, pending, connected, loading, connect, skip };
}
