import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const STATUS_MAP: Record<string, { label: string; style: string }> = {
  'pending_docs': { label: 'Em Análise', style: 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30' },
  'active': { label: 'Ativo', style: 'bg-green-500/15 text-green-700 border-green-500/30' },
  'paused': { label: 'Pausado', style: 'bg-muted text-muted-foreground border-muted-foreground/20' },
};

interface Listing {
  id: string;
  title: string;
  images: string[];
  price: number;
  validation_status: string;
}

export default function HostDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('properties').select('id, title, images, price, validation_status')
      .eq('owner_id', user.id)
      .then(({ data }) => {
        setListings((data ?? []).map((p) => ({
          id: p.id,
          title: p.title,
          images: (p.images as string[]) ?? [],
          price: Number(p.price),
          validation_status: p.validation_status ?? 'pending_docs',
        })));
        setLoading(false);
      });
  }, [user]);

  const status = (s: string) => STATUS_MAP[s] ?? STATUS_MAP['pending_docs'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Anúncios</h1>
        <Button onClick={() => navigate('/host/new')} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Anúncio
        </Button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>Nenhum anúncio ainda.</p>
          <Button variant="link" onClick={() => navigate('/host/new')}>Criar primeiro anúncio</Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => {
            const st = status(listing.validation_status);
            return (
              <Card key={listing.id} className="overflow-hidden">
                <CardContent className="p-0 flex flex-col sm:flex-row">
                  {listing.images[0] ? (
                    <img src={listing.images[0]} alt={listing.title} className="w-full sm:w-40 h-32 sm:h-auto object-cover" />
                  ) : (
                    <div className="w-full sm:w-40 h-32 sm:h-auto bg-muted flex items-center justify-center text-muted-foreground text-xs">Sem foto</div>
                  )}
                  <div className="flex-1 p-4 flex flex-col justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{listing.title}</h3>
                      <p className="text-lg font-bold text-primary">R$ {listing.price}/mês</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={st.style}>{st.label}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
