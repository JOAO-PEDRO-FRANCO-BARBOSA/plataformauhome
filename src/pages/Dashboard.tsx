import { useMemo, useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useFavorites } from '@/hooks/useFavorites';
import { useProperties } from '@/hooks/useProperties';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { PropertyCard } from '@/components/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Search, MapPinned, BedDouble, Building2 } from 'lucide-react';
import { MarketplacePropertyPanel } from '@/components/MarketplacePropertyPanel';
import { Property } from '@/types';

const quickPills = [
  { label: 'Quarto Individual', match: ['quarto individual', 'quarto'], type: 'quarto' },
  { label: 'República', match: ['república', 'republica'], type: 'republica' },
  { label: 'Apartamento', match: ['apartamento', 'apto'], type: 'apartamento' },
];

function inferPropertyType(property: Property): 'quarto' | 'republica' | 'apartamento' {
  const haystack = `${property.title} ${property.description}`.toLowerCase();
  if (haystack.includes('apartamento') || haystack.includes('apto')) return 'apartamento';
  if (haystack.includes('quarto individual') || haystack.includes('quarto')) return 'quarto';
  return 'republica';
}

export default function Dashboard() {
  const { profile } = useProfile();
  const { favoriteIds, toggle, isFavorite } = useFavorites();
  const { properties, loading: propLoading } = useProperties();

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeType, setActiveType] = useState<'all' | 'quarto' | 'republica' | 'apartamento'>('all');

  const firstName = (profile?.full_name || 'Estudante').split(' ')[0];

  const nearbyProperties = useMemo(() => {
    const campus = profile?.campus?.trim();
    return properties
      .filter((property) => !campus || property.campus === campus)
      .filter((property) => activeType === 'all' ? true : inferPropertyType(property) === activeType)
      .slice(0, 6);
  }, [activeType, properties, profile?.campus]);

  const favorited = properties.filter((p) => favoriteIds.includes(p.id));

  const handleOpenDetails = (property: Property) => {
    setSelectedProperty(property);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <section className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-100/60 p-5 sm:p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-purple-700">Discovery</p>
            <h1 className="text-2xl md:text-3xl font-bold">Olá, {firstName}!</h1>
            <p className="text-muted-foreground">Veja agora as moradias mais próximas do seu campus e ajuste o filtro em segundos.</p>
          </div>
          <Button asChild className="hidden sm:inline-flex gap-2">
            <Link to="/search"><Search className="w-4 h-4" /> Buscar</Link>
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge
            variant={activeType === 'all' ? 'default' : 'secondary'}
            className="cursor-pointer rounded-full px-4 py-2 text-sm"
            onClick={() => setActiveType('all')}
          >
            Todos
          </Badge>
          {quickPills.map((pill) => (
            <Badge
              key={pill.label}
              variant={activeType === pill.type ? 'default' : 'outline'}
              className="cursor-pointer rounded-full px-4 py-2 text-sm"
              onClick={() => setActiveType(pill.type as typeof activeType)}
            >
              {pill.label}
            </Badge>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-purple-100">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-2xl bg-purple-100 p-3 text-purple-700"><MapPinned className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Campus</p>
              <p className="font-semibold">{profile?.campus || 'Todos'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-100">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-2xl bg-purple-100 p-3 text-purple-700"><BedDouble className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Favoritos</p>
              <p className="font-semibold">{favorited.length} salvos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-100">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-2xl bg-purple-100 p-3 text-purple-700"><Building2 className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Descobrir</p>
              <p className="font-semibold">{nearbyProperties.length} opções perto de você</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-lg">Moradias perto de você</CardTitle>
          <Button asChild variant="ghost" size="sm"><Link to="/search">Ver pesquisa avançada</Link></Button>
        </CardHeader>
        <CardContent>
          {propLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}</div>
          ) : nearbyProperties.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum imóvel encontrado para este filtro. <Link to="/search" className="text-primary underline">Refine a busca</Link>.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {nearbyProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isFavorite={isFavorite(property.id)}
                  onToggleFavorite={toggle}
                  onOpenDetails={handleOpenDetails}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Imóveis Favoritos</h2>
        {propLoading ? (
          <div className="flex gap-4">{[1, 2].map((i) => <Skeleton key={i} className="h-64 w-72 rounded-lg shrink-0" />)}</div>
        ) : favorited.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum favorito ainda. <Link to="/marketplace" className="text-primary underline">Explore o marketplace!</Link></p>
        ) : (
          <Carousel opts={{ align: 'start' }} className="w-full">
            <CarouselContent className="-ml-3">
              {favorited.map((p) => (
                <CarouselItem key={p.id} className="pl-3 basis-[280px] md:basis-[320px]">
                  <PropertyCard property={p} isFavorite={isFavorite(p.id)} onToggleFavorite={toggle} onOpenDetails={handleOpenDetails} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        )}
      </div>

      <MarketplacePropertyPanel
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        property={selectedProperty}
      />
    </div>
  );
}
