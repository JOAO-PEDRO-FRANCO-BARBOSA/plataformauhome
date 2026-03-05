import { useState, useEffect } from 'react';
import { MessageCircle, ExternalLink, MapPin, BedDouble, Heart } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Property } from '@/types';
import { MediaCarousel } from '@/components/MediaCarousel';
import { ImageLightbox } from '@/components/ImageLightbox';

interface MarketplacePropertyPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
}

function normalizeBrazilPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
}

function getSocialHref(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '#';
  if (trimmed.startsWith('@')) {
    return `https://instagram.com/${trimmed.slice(1)}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function MarketplacePropertyPanel({ open, onOpenChange, property }: MarketplacePropertyPanelProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showContact, setShowContact] = useState(false);

  // Reset contact reveal when property changes
  useEffect(() => {
    setShowContact(false);
  }, [property?.id]);

  if (!property) return null;

  const cleanPhone = normalizeBrazilPhone(property.contactWhatsApp ?? '');
  const whatsappHref = cleanPhone ? `https://wa.me/55${cleanPhone}` : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left">Detalhes do Imóvel</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 py-4">
            <MediaCarousel
              items={property.images.map((url, index) => ({
                url,
                alt: `${property.title} - foto ${index + 1}`,
              }))}
              onItemClick={(index) => {
                setLightboxIndex(index);
                setLightboxOpen(true);
              }}
              emptyLabel="Sem fotos disponíveis"
            />

            <div className="space-y-1">
              <h2 className="text-xl font-bold leading-tight">{property.title}</h2>
              <p className="text-2xl font-extrabold text-primary">R$ {property.price.toLocaleString('pt-BR')}</p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{property.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <BedDouble className="h-4 w-4" />
                <span>{property.rooms} quarto(s)</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {property.noFiador && <Badge className="bg-emerald-600 text-white">Sem Fiador</Badge>}
              {property.verified && <Badge>Verificado</Badge>}
              {property.acceptsPet && <Badge variant="outline">Aceita Pet</Badge>}
            </div>

            {property.amenities.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Comodidades</p>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity} variant="outline">{amenity}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold">Descrição</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{property.description || 'Sem descrição informada.'}</p>
            </div>

            <Separator />

            {/* Contact Reveal Flow */}
            {!showContact ? (
              <Button
                onClick={() => setShowContact(true)}
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-base py-6"
              >
                <Heart className="h-5 w-5" />
                Tenho Interesse
              </Button>
            ) : (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-base font-semibold">📞 Contato do Proprietário</p>
                {whatsappHref ? (
                  <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 py-5">
                    <a href={whatsappHref} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-5 w-5" /> Conversar no WhatsApp
                    </a>
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">Contato via WhatsApp não informado.</p>
                )}

                {property.contactSocial && (
                  <a
                    href={getSocialHref(property.contactSocial)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {property.contactSocial}
                  </a>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ImageLightbox
        open={lightboxOpen}
        images={property.images}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
