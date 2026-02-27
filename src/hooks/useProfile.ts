import { useState } from 'react';
import { StudentProfile } from '@/types';
import { mockCurrentUser } from '@/data/mockData';

export function useProfile() {
  const [profile, setProfile] = useState<StudentProfile>(mockCurrentUser);
  const [loading] = useState(false);

  const updateProfile = (updates: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  return { profile, loading, updateProfile };
}
