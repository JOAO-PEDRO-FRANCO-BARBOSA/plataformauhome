export interface HabitProfile {
  smokes: boolean;
  likesParties: boolean;
  hasPet: boolean;
  organized: boolean;
  earlyBird: boolean; // true = diurno, false = noturno
  studyHabit: 'silencioso' | 'moderado' | 'social';
}

export interface StudentProfile {
  id: string;
  name: string;
  avatar: string;
  course: string;
  campus: Campus;
  semester: number;
  bio: string;
  habits: HabitProfile;
  searchType: 'quarto' | 'republica';
  priceRange: [number, number];
}

export interface Property {
  id: string;
  title: string;
  images: string[];
  price: number;
  campus: Campus;
  address: string;
  rooms: number;
  noFiador: boolean;
  verified: boolean;
  description: string;
  amenities: string[];
  acceptsPet: boolean;
}

export interface Match {
  id: string;
  student: StudentProfile;
  compatibility: number; // 0-100
  connectedAt?: string;
  status: 'pending' | 'connected' | 'skipped';
}

export type Campus = 'Santa Mônica' | 'Umuarama' | 'Pontal' | 'Glória';

export interface PropertyFilters {
  campus: Campus | 'todos';
  priceRange: [number, number];
  rooms: number | null;
  acceptsPet: boolean | null;
}
