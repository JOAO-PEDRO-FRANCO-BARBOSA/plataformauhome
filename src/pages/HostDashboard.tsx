import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_STYLES: Record<string, string> = {
  'Ativo': 'bg-green-500/15 text-green-700 border-green-500/30',
  'Em Análise': 'bg-yellow-500/15 text-yellow-700 border-yellow-500/30',
  'Pausado': 'bg-muted text-muted-foreground border-muted-foreground/20',
};

const mockListings = [
  {
    id: '1',
    title: 'Kitnet mobiliada próx. Santa Mônica',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    price: 850,
    status: 'Ativo',
    interested: 7,
  },
  {
    id: '2',
    title: 'Quarto em república — Umuarama',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop',
    price: 550,
    status: 'Em Análise',
    interested: 3,
  },
  {
    id: '3',
    title: 'Apartamento 2 quartos — Glória',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
    price: 1200,
    status: 'Pausado',
    interested: 0,
  },
];

export default function HostDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meus Anúncios</h1>
        <Button onClick={() => navigate('/host/new')} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Anúncio
        </Button>
      </div>

      <div className="grid gap-4">
        {mockListings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden">
            <CardContent className="p-0 flex flex-col sm:flex-row">
              <img
                src={listing.image}
                alt={listing.title}
                className="w-full sm:w-40 h-32 sm:h-auto object-cover"
              />
              <div className="flex-1 p-4 flex flex-col justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{listing.title}</h3>
                  <p className="text-lg font-bold text-primary">R$ {listing.price}/mês</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={STATUS_STYLES[listing.status]}>
                    {listing.status}
                  </Badge>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {listing.interested} interessado{listing.interested !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
