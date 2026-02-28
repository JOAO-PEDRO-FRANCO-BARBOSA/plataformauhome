import { useState, useEffect } from 'react';
import { Match } from '@/types';
import { mockMatches } from '@/data/mockData';
import { toast } from 'sonner';

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
    // Set to pending first
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status: 'pending' as const } : m))
    );
    // Auto-accept after 1.5s for demo
    setTimeout(() => {
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId && m.status === 'pending'
            ? { ...m, status: 'connected' as const, connectedAt: new Date().toISOString() }
            : m
        )
      );
      toast.success('Conexão aceita! 🎉');
    }, 1500);
  };

  const skip = (matchId: string) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, status: 'skipped' as const } : m))
    );
  };

  const pending = matches.filter((m) => m.status === 'pending');
  const connected = matches.filter((m) => m.status === 'connected');
  const available = matches.filter((m) => m.status !== 'connected' && m.status !== 'skipped' && m.status !== 'pending');

  return { matches, pending, connected, available, loading, connect, skip };
}
