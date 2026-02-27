import { Property } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, BedDouble } from 'lucide-react';
import { useState } from 'react';
import { ContactModal } from './ContactModal';

interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export function PropertyCard({ property, isFavorite, onToggleFavorite }: PropertyCardProps) {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <button
            onClick={() => onToggleFavorite(property.id)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
          </button>
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {property.noFiador && (
              <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">Sem Fiador</Badge>
            )}
            {property.verified && (
              <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">Verificado</Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{property.title}</h3>
            <span className="text-lg font-bold text-primary whitespace-nowrap">R$ {property.price}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{property.address}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
            <BedDouble className="w-3.5 h-3.5" />
            <span>{property.rooms} {property.rooms === 1 ? 'quarto' : 'quartos'}</span>
          </div>
          <Button size="sm" className="w-full" onClick={() => setContactOpen(true)}>
            Tenho Interesse
          </Button>
        </CardContent>
      </Card>
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} title={`Interesse: ${property.title}`} />
    </>
  );
}
