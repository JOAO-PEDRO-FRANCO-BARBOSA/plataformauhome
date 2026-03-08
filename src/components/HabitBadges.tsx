import { HabitProfile } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, PartyPopper, Cigarette, Dog, Sparkles, BookOpen, Volume2, Users } from 'lucide-react';

interface HabitBadgesProps {
  habits: HabitProfile;
  size?: 'sm' | 'default';
}

const habitConfig = [
  { key: 'smokes' as const, label: 'Fuma', icon: Cigarette, show: true, color: 'bg-destructive/10 text-destructive' },
  { key: 'smokes' as const, label: 'Não fuma', icon: Cigarette, show: false, color: 'bg-green-100 text-green-700' },
  { key: 'likesParties' as const, label: 'Festeiro', icon: PartyPopper, show: true, color: 'bg-primary/10 text-primary' },
  { key: 'hasPet' as const, label: 'Tem pet', icon: Dog, show: true, color: 'bg-amber-100 text-amber-700' },
  { key: 'organized' as const, label: 'Organizado', icon: Sparkles, show: true, color: 'bg-blue-100 text-blue-700' },
  { key: 'earlyBird' as const, label: 'Diurno', icon: Sun, show: true, color: 'bg-yellow-100 text-yellow-700' },
  { key: 'earlyBird' as const, label: 'Noturno', icon: Moon, show: false, color: 'bg-indigo-100 text-indigo-700' },
];

const studyConfig = {
  silencioso: { icon: BookOpen, label: 'Estudo silencioso', color: 'bg-emerald-100 text-emerald-700' },
  moderado: { icon: Volume2, label: 'Estudo moderado', color: 'bg-sky-100 text-sky-700' },
  social: { icon: Users, label: 'Estudo social', color: 'bg-orange-100 text-orange-700' },
};

export function HabitBadges({ habits, size = 'default' }: HabitBadgesProps) {
  if (!habits) return null;

  const badges = habitConfig.filter((h) => {
    if (h.key === 'smokes') return habits.smokes === h.show;
    if (h.key === 'earlyBird') return habits.earlyBird === h.show;
    return habits[h.key] === h.show;
  });

  const study = studyConfig[habits.studyHabit] ?? studyConfig.moderado;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b) => (
        <Badge key={b.label} variant="secondary" className={`${b.color} ${size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}>
          <b.icon className="w-3 h-3 mr-1" />
          {b.label}
        </Badge>
      ))}
      <Badge variant="secondary" className={`${study.color} ${size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-xs px-2 py-0.5'}`}>
        <study.icon className="w-3 h-3 mr-1" />
        {study.label}
      </Badge>
    </div>
  );
}
