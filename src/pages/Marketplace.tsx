import { useState } from 'react';
import { PropertyFilters } from '@/types';
import { useProperties } from '@/hooks/useProperties';
import { useFavorites } from '@/hooks/useFavorites';
import { PropertyCard } from '@/components/PropertyCard';
import { SidebarFilters } from '@/components/SidebarFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';

export default function Marketplace() {
  const [filters, setFilters] = useState<PropertyFilters>({
    campus: 'todos',
    priceRange: [200, 2500],
    rooms: null,
    acceptsPet: null,
  });

  const { properties, loading } = useProperties(filters);
  const { toggle, isFavorite } = useFavorites();

  const handleToggleFavorite = (id: string) => {
    toggle(id);
    toast.success(isFavorite(id) ? 'Removido dos favoritos' : 'Imóvel salvo nos favoritos! 💜');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">Marketplace de Imóveis</h1>
        <p className="text-muted-foreground text-sm">Encontre a moradia perfeita perto da UFU.</p>
      </div>

      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-4 p-4 bg-card rounded-lg border">
            <h2 className="font-semibold text-sm mb-4">Filtros</h2>
            <SidebarFilters filters={filters} onChange={setFilters} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter button */}
          <div className="lg:hidden mb-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <SidebarFilters filters={filters} onChange={setFilters} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Results count */}
          {!loading && (
            <p className="text-sm text-muted-foreground mb-4">
              {properties.length} {properties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 rounded-lg" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum imóvel encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  isFavorite={isFavorite(p.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
