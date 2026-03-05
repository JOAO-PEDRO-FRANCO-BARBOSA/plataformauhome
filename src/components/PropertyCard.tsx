import { Property } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MapPin, BedDouble, ChevronLeft, ChevronRight, PawPrint } from 'lucide-react';
import { useState } from 'react';

interface PropertyCardProps {
  property: Property;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => Promise<void>;
  onOpenDetails: (property: Property) => void;
}

export function PropertyCard({ property, isFavorite, onToggleFavorite, onOpenDetails }: PropertyCardProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);

  const images = property.images;
  const hasMultiple = images.length > 1;

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSavingFavorite(true);
    try {
      await onToggleFavorite(property.id);
    } finally {
      setIsSavingFavorite(false);
    }
  };

  return (
    <>
      <Card
        className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onOpenDetails(property)}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={images[imgIndex]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {/* Carousel arrows */}
          {hasMultiple && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          {/* Dots */}
          {hasMultiple && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
          {/* Favorite */}
          <button
            onClick={handleToggleFavorite}
            disabled={isSavingFavorite}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Heart className={`w-5 h-5 transition-all ${isFavorite ? 'fill-destructive text-destructive' : 'text-muted-foreground'} ${isSavingFavorite ? 'scale-90' : ''}`} />
          </button>
          {/* Badges */}
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {property.noFiador && (
              <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">Sem Fiador</Badge>
            )}
            {property.verified && (
              <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">Verificado</Badge>
            )}
            {property.acceptsPet && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs flex items-center gap-1">
                <PawPrint className="w-3 h-3" /> Pet
              </Badge>
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
          <Button size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); onOpenDetails(property); }}>
            Tenho Interesse
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
