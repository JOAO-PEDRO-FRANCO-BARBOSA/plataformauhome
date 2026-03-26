import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface MatchProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  match_photo_url: string;
  course: string;
  campus: string;
  semester: number;
  bio: string;
  habits: Record<string, any>;
}

export interface MatchItem {
  id: string; // connection id or profile id for available
  student: {
    id: string;
    name: string;
    avatar: string;
    course: string;
    campus: string;
    semester: number;
    bio: string;
    habits: Record<string, any>;
  };
  compatibility: number;
  status: 'available' | 'pending' | 'connected' | 'skipped';
  connectionId?: string;
}

function calculateCompatibility(a: Record<string, any>, b: Record<string, any>): number {
  let score = 0;
  const total = 6;
  if (a.smokes !== undefined && a.smokes === b.smokes) score++;
  if (a.likesParties !== undefined && a.likesParties === b.likesParties) score++;
  if (a.hasPet !== undefined && a.hasPet === b.hasPet) score++;
  if (a.organized !== undefined && a.organized === b.organized) score++;
  if (a.earlyBird !== undefined && a.earlyBird === b.earlyBird) score++;
  if (a.studyHabit !== undefined && a.studyHabit === b.studyHabit) score++;
  return Math.round((score / total) * 100);
}

function toMatchStudent(p: MatchProfile) {
  return {
    id: p.id,
    name: p.full_name || 'Sem nome',
    avatar: p.match_photo_url || p.avatar_url || '',
    course: p.course || '',
    campus: p.campus || '',
    semester: p.semester || 1,
    bio: p.bio || '',
    habits: (p.habits as Record<string, any>) || {},
  };
}

export function useMatches() {
  const { user, profile: myProfile } = useAuth();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // Fetch all profiles except self
    const { data: profiles } = await supabase.from('profiles').select('*').neq('id', user.id);
    // Fetch all connections involving current user
    const { data: connections } = await supabase.from('connections').select('*')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    const profileMap = new Map<string, MatchProfile>();
    (profiles ?? []).forEach((p) => profileMap.set(p.id, p as unknown as MatchProfile));

    const myHabits = (myProfile?.habits as Record<string, any>) || {};

    const items: MatchItem[] = [];
    const connectedIds = new Set<string>();

    (connections ?? []).forEach((c) => {
      const otherId = c.requester_id === user.id ? c.receiver_id : c.requester_id;
      connectedIds.add(otherId);
      const p = profileMap.get(otherId);
      if (!p) return;

      let status: MatchItem['status'] = 'available';
      if (c.status === 'accepted') status = 'connected';
      else if (c.status === 'pending') status = 'pending';
      else if (c.status === 'skipped') status = 'skipped';

      items.push({
        id: c.id,
        student: toMatchStudent(p),
        compatibility: calculateCompatibility(myHabits, (p.habits as Record<string, any>) || {}),
        status,
        connectionId: c.id,
      });
    });

    // Add profiles without connections as available
    (profiles ?? []).forEach((p) => {
      if (!connectedIds.has(p.id)) {
        const mp = p as unknown as MatchProfile;
        items.push({
          id: p.id,
          student: toMatchStudent(mp),
          compatibility: calculateCompatibility(myHabits, (mp.habits as Record<string, any>) || {}),
          status: 'available',
        });
      }
    });

    items.sort((a, b) => b.compatibility - a.compatibility);
    setMatches(items);
    setLoading(false);
  }, [user, myProfile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const connect = useCallback(async (profileId: string) => {
    if (!user) return;
    // Update UI optimistically
    setMatches((prev) => prev.map((m) =>
      m.student.id === profileId ? { ...m, status: 'pending' as const } : m
    ));
    const { data, error } = await supabase.from('connections').insert({
      requester_id: user.id,
      receiver_id: profileId,
      status: 'pending',
    }).select().single();
    if (error) {
      toast.error('Erro ao enviar conexão');
      fetchAll();
    } else if (data) {
      setMatches((prev) => prev.map((m) =>
        m.student.id === profileId ? { ...m, id: data.id, connectionId: data.id, status: 'pending' as const } : m
      ));
    }
  }, [user, fetchAll]);

  const accept = useCallback(async (connectionId: string) => {
    await supabase.from('connections').update({ status: 'accepted' }).eq('id', connectionId);
    setMatches((prev) => prev.map((m) =>
      m.connectionId === connectionId ? { ...m, status: 'connected' as const } : m
    ));
    toast.success('Conexão aceita! 🎉');
  }, []);

  const skip = useCallback(async (profileId: string) => {
    if (!user) return;

    setMatches((prev) => prev.map((m) =>
      m.student.id === profileId ? { ...m, status: 'skipped' as const } : m
    ));

    await supabase.from('connections').insert({
      requester_id: user.id,
      receiver_id: profileId,
      status: 'skipped',
    });
  }, [user]);

  const pending = matches.filter((m) => m.status === 'pending');
  const connected = matches.filter((m) => m.status === 'connected');
  const available = matches.filter((m) => m.status === 'available');

  return { matches, pending, connected, available, loading, connect, accept, skip };
}
