import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ProfileData {
  id: string;
  full_name: string;
  avatar_url: string;
  match_photo_url: string;
  course: string;
  campus: string;
  semester: number;
  bio: string;
  habits: Record<string, any>;
  search_type: string;
  price_range_min: number;
  price_range_max: number;
}

const defaultProfile: ProfileData = {
  id: '',
  full_name: '',
  avatar_url: '',
  match_photo_url: '',
  course: '',
  campus: 'Santa Mônica',
  semester: 1,
  bio: '',
  habits: { smokes: false, likesParties: false, hasPet: false, organized: true, earlyBird: false, studyHabit: 'moderado' },
  search_type: 'republica',
  price_range_min: 400,
  price_range_max: 800,
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name ?? '',
          avatar_url: data.avatar_url ?? '',
          match_photo_url: data.match_photo_url ?? '',
          course: data.course ?? '',
          campus: data.campus ?? 'Santa Mônica',
          semester: data.semester ?? 1,
          bio: data.bio ?? '',
          habits: (data.habits as Record<string, any>) ?? defaultProfile.habits,
          search_type: data.search_type ?? 'republica',
          price_range_min: data.price_range_min ?? 400,
          price_range_max: data.price_range_max ?? 800,
        });
      }
      setLoading(false);
    });
  }, [user]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateProfile = useCallback((updates: Partial<ProfileData>) => {
    if (!user) return;

    // Update state immediately for responsiveness
    setProfile((prev) => ({ ...prev, ...updates }));

    // Debounce the Supabase write
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSaving(true);
      const dbUpdates: Record<string, any> = {};
      // We need to get the latest profile state to build dbUpdates
      // Use the updates directly since they're what changed
      if (updates.full_name !== undefined) dbUpdates.full_name = updates.full_name;
      if (updates.avatar_url !== undefined) dbUpdates.avatar_url = updates.avatar_url;
      if (updates.match_photo_url !== undefined) dbUpdates.match_photo_url = updates.match_photo_url;
      if (updates.course !== undefined) dbUpdates.course = updates.course;
      if (updates.campus !== undefined) dbUpdates.campus = updates.campus;
      if (updates.semester !== undefined) dbUpdates.semester = updates.semester;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.habits !== undefined) dbUpdates.habits = updates.habits;
      if (updates.search_type !== undefined) dbUpdates.search_type = updates.search_type;
      if (updates.price_range_min !== undefined) dbUpdates.price_range_min = updates.price_range_min;
      if (updates.price_range_max !== undefined) dbUpdates.price_range_max = updates.price_range_max;

      if (Object.keys(dbUpdates).length > 0) {
        await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
      }
      setIsSaving(false);
    }, 800);
  }, [user]);

  return { profile, loading, updateProfile, isSaving };
}
