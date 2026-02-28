import { Match } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HabitBadges } from './HabitBadges';
import { X, UserPlus, GraduationCap, Percent, Clock } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  onConnect: (id: string) => void;
  onSkip: (id: string) => void;
}

export function MatchCard({ match, onConnect, onSkip }: MatchCardProps) {
  const { student, compatibility, status } = match;
  const isPending = status === 'pending';

  return (
    <Card className="overflow-hidden max-w-sm mx-auto shadow-xl">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={student.avatar}
          alt={student.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <h3 className="text-2xl font-bold">{student.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-white/90 text-sm">
            <GraduationCap className="w-4 h-4" />
            <span>{student.course} • {student.semester}º sem</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-1 bg-primary/90 rounded-full px-3 py-1 text-sm font-semibold">
              <Percent className="w-3.5 h-3.5" />
              {compatibility}% compatível
            </div>
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <p className="text-sm text-muted-foreground">{student.bio}</p>
        <HabitBadges habits={student.habits} size="sm" />
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => onSkip(match.id)}
            disabled={isPending}
          >
            <X className="w-5 h-5 mr-1" /> Pular
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={() => onConnect(match.id)}
            disabled={isPending}
          >
            {isPending ? (
              <><Clock className="w-5 h-5 mr-1" /> Pendente</>
            ) : (
              <><UserPlus className="w-5 h-5 mr-1" /> Pedir Conexão</>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
