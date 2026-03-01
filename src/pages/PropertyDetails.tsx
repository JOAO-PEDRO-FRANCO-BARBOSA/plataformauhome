import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContactModal } from '@/components/ContactModal';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, ChevronLeft, ChevronRight, MapPin, BedDouble, PawPrint,
  Wifi, Car, Dumbbell, Shield, Sofa, Trees, CookingPot, BookOpen,
} from 'lucide-react';

const amenityIcons: Record<string, React.ElementType> = {
  'Wi-Fi': Wifi, 'Garagem': Car, 'Academia': Dumbbell, 'Portaria 24h': Shield,
  'Mobiliada': Sofa, 'Mobiliado': Sofa, 'Quintal': Trees, 'Quintal grande': Trees,
  'Cozinha compartilhada': CookingPot, 'Cozinha equipada': CookingPot,
  'Área de estudo': BookOpen, 'Lavanderia': CookingPot, 'Varanda': Trees,
  'Área gourmet': CookingPot, 'Perto do campus': MapPin,
};

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from('properties').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setProperty({
          id: data.id, title: data.title,
          images: (data.images as string[]) ?? [],
          price: Number(data.price),
          campus: (data.campus ?? 'Santa Mônica') as Property['campus'],
          address: data.address ?? '', rooms: data.rooms ?? 1,
          noFiador: data.no_fiador ?? false, verified: data.verified ?? false,
          description: data.description ?? '',
          amenities: (data.amenities as string[]) ?? [],
          acceptsPet: data.accepts_pet ?? false,
        });
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="py-20 flex justify-center"><Skeleton className="h-96 w-full max-w-3xl" /></div>;

  if (!property) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Imóvel não encontrado.</p>
        <Button variant="link" onClick={() => navigate('/marketplace')}>Voltar ao marketplace</Button>
      </div>
    );
  }

  const images = property.images;
  const prev = () => setImgIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setImgIndex((i) => (i === images.length - 1 ? 0 : i + 1));

  return (
    <div className="max-w-6xl mx-auto">
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => navigate('/marketplace')}>
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Button>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
            {images.length > 0 ? (
              <img src={images[imgIndex]} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Sem fotos</div>
            )}
            {images.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={() => setImgIndex(i)} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === imgIndex ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold mb-2">{property.title}</h1>
            <div className="flex flex-wrap gap-2 mb-3">
              {property.noFiador && <Badge className="bg-green-600 text-white">Sem Fiador</Badge>}
              {property.verified && <Badge className="bg-primary text-primary-foreground">Verificado</Badge>}
              {property.acceptsPet && <Badge className="bg-amber-500 text-white flex items-center gap-1"><PawPrint className="w-3 h-3" /> Aceita Pet</Badge>}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {property.address}</span>
              <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" /> {property.rooms} {property.rooms === 1 ? 'quarto' : 'quartos'}</span>
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Descrição</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
          </div>
          <div>
            <h2 className="font-semibold mb-3">Comodidades</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities.map((amenity) => {
                const Icon = amenityIcons[amenity] || Shield;
                return (
                  <div key={amenity} className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 text-sm">
                    <Icon className="w-4 h-4 text-primary shrink-0" />{amenity}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="hidden lg:block w-72 shrink-0">
          <Card className="sticky top-4">
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor mensal</p>
                <p className="text-3xl font-bold text-primary">R$ {property.price}</p>
              </div>
              <Button className="w-full" size="lg" onClick={() => setContactOpen(true)}>Tenho Interesse</Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background border-t p-4 flex items-center justify-between z-50">
        <div>
          <p className="text-xs text-muted-foreground">Valor mensal</p>
          <p className="text-xl font-bold text-primary">R$ {property.price}</p>
        </div>
        <Button size="lg" onClick={() => setContactOpen(true)}>Tenho Interesse</Button>
      </div>
      <ContactModal open={contactOpen} onOpenChange={setContactOpen} title={`Interesse: ${property.title}`} />
    </div>
  );
}
