import { useState } from 'react';
import { PropertyFilters } from '@/types';
import { useProperties } from '@/hooks/useProperties';
import { useFavorites } from '@/hooks/useFavorites';
import { PropertyCard } from '@/components/PropertyCard';
import { FilterBar } from '@/components/FilterBar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function Marketplace() {
  const [filters, setFilters] = useState<PropertyFilters>({
    campus: 'todos',
    priceRange: [200, 2500],
    rooms: null,
  });

  const { properties, loading } = useProperties(filters);
  const { toggle, isFavorite } = useFavorites();

  const handleToggleFavorite = (id: string) => {
    toggle(id);
    toast.success(isFavorite(id) ? 'Removido dos favoritos' : 'Imóvel salvo nos favoritos! 💜');
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Marketplace de Imóveis</h1>
        <p className="text-muted-foreground text-sm">Encontre a moradia perfeita perto da UFU.</p>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum imóvel encontrado com esses filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
  );
}
