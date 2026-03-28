import { useState } from 'react';
import { useMatches } from '@/hooks/useMatches';
import { MatchCard } from '@/components/MatchCard';
import { ContactModal } from '@/components/ContactModal';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { GraduationCap, Percent, MessageCircle, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function MatchPage() {
  const { available, pending, connected, loading, connect, accept, skip } = useMatches();
  const { user } = useAuth();
  const [contactOpen, setContactOpen] = useState(false);
  const navigate = useNavigate();

  const handleConnect = (id: string) => {
    connect(id);
    toast('Pedido de conexão enviado! ⏳');
  };

  const current = available[0];

  // Build a Match-compatible object for MatchCard
  const currentMatch = current ? {
    id: current.id,
    student: {
      id: current.student.id,
      name: current.student.name,
      avatar: current.student.avatar,
      course: current.student.course,
      campus: current.student.campus as any,
      semester: current.student.semester,
      bio: current.student.bio,
      habits: current.student.habits as any,
      searchType: 'republica' as const,
      priceRange: [400, 800] as [number, number],
    },
    compatibility: current.compatibility,
    status: current.status,
  } : null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Match de República</h1>
        <p className="text-muted-foreground text-sm">Encontre colegas com hábitos compatíveis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex justify-center">
          {loading ? (
            <Skeleton className="h-[500px] w-full max-w-sm rounded-xl" />
          ) : !currentMatch ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">Você já viu todos os perfis! 🎓</p>
              <p className="text-sm text-muted-foreground mt-1">Volte depois para novos perfis.</p>
            </div>
          ) : (
            <MatchCard
              match={currentMatch}
              onConnect={() => handleConnect(current!.student.id)}
              onSkip={() => skip(current!.student.id)}
            />
          )}
        </div>

        <div className="space-y-4">
          {/* Pending - received requests */}
          {pending.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" /> Pendentes ({pending.length})
              </h2>
              {pending.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-dashed">
                  <img src={m.student.avatar} alt={m.student.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{m.student.name}</p>
                    <p className="text-xs text-muted-foreground">Aguardando resposta...</p>
                  </div>
                  {m.connectionId && (
                    <Button size="sm" variant="outline" onClick={() => accept(m.connectionId!)}>
                      <Check className="w-3 h-3 mr-1" /> Aceitar
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <h2 className="font-semibold text-lg">Conexões ({connected.length})</h2>
            {connected.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma conexão ainda.</p>
            ) : (
              connected.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                  <img src={m.student.avatar} alt={m.student.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{m.student.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GraduationCap className="w-3 h-3" />{m.student.course}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <Percent className="w-3 h-3" />{m.compatibility}%
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => navigate('/messages')}>
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ContactModal open={contactOpen} onOpenChange={setContactOpen} title="Conversar sobre moradia" />
    </div>
  );
}
