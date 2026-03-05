import { useProfile } from '@/hooks/useProfile';
import { useMatches } from '@/hooks/useMatches';
import { useFavorites } from '@/hooks/useFavorites';
import { useProperties } from '@/hooks/useProperties';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { PropertyCard } from '@/components/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Users, Percent, GraduationCap } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useProfile();
  const { connected, loading: matchLoading } = useMatches();
  const { favoriteIds, toggle, isFavorite } = useFavorites();
  const { properties, loading: propLoading } = useProperties();
  const navigate = useNavigate();

  const favorited = properties.filter((p) => favoriteIds.includes(p.id));
  const firstName = (profile.full_name || 'Estudante').split(' ')[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold">Olá, {firstName}! 👋</h1>
        <p className="text-muted-foreground">Encontre o lar ideal para sua jornada na UFU.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Link to="/marketplace"><Search className="w-6 h-6 text-primary" /><span className="text-sm font-medium">Buscar imóveis</span></Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex flex-col gap-2">
          <Link to="/match"><Users className="w-6 h-6 text-primary" /><span className="text-sm font-medium">Encontrar colegas</span></Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Últimos Matches</CardTitle></CardHeader>
        <CardContent>
          {matchLoading ? (
            <div className="flex gap-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
          ) : connected.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum match ainda. <Link to="/match" className="text-primary underline">Encontre colegas!</Link></p>
          ) : (
            <div className="space-y-2">
              {connected.slice(0, 3).map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
                  <img src={m.student.avatar} alt={m.student.name} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{m.student.name}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GraduationCap className="w-3 h-3" />{m.student.course}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                    <Percent className="w-3.5 h-3.5" />{m.compatibility}%
                  </div>
                </div>
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
                  <PropertyCard property={p} isFavorite={isFavorite(p.id)} onToggleFavorite={toggle} onOpenDetails={(prop) => navigate(`/marketplace/${prop.id}`)} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        )}
      </div>
    </div>
  );
}
