import { useMemo, useState } from 'react';
import { useProperties, PropertyQueryFilters } from '@/hooks/useProperties';
import { useFavorites } from '@/hooks/useFavorites';
import { PropertyCard } from '@/components/PropertyCard';
import { MarketplacePropertyPanel } from '@/components/MarketplacePropertyPanel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Property, Campus } from '@/types';

const campusOptions: Array<Campus | 'todos'> = ['todos', 'Santa Mônica', 'Umuarama', 'Pontal', 'Glória'];

const propertyTypeOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'quarto', label: 'Quarto Individual' },
  { value: 'republica', label: 'República' },
  { value: 'apartamento', label: 'Apartamento' },
];

export default function Search() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [campus, setCampus] = useState<Campus | 'todos'>('todos');
  const [priceRange, setPriceRange] = useState<[number, number]>([200, 2500]);
  const [locationNeighborhood, setLocationNeighborhood] = useState('');
  const [propertyType, setPropertyType] = useState<string>('all');

  const queryFilters: PropertyQueryFilters = {
    campus,
    priceRange,
    locationNeighborhood: locationNeighborhood.trim() || undefined,
    propertyType: propertyType !== 'all' ? propertyType : undefined,
  };

  const { properties, loading } = useProperties(queryFilters);
  const { toggle, isFavorite } = useFavorites();

  const filtered = useMemo(() => {
    return properties.filter((property) => {
      // Additional text-based filtering on title and address
      if (locationNeighborhood.trim()) {
        const searchTerm = locationNeighborhood.trim().toLowerCase();
        const haystack = `${property.title} ${property.address}`.toLowerCase();
        if (!haystack.includes(searchTerm)) return false;
      }
      return true;
    });
  }, [properties, locationNeighborhood]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-100/60 p-5 sm:p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-purple-700">Pesquisa avançada</p>
          <h1 className="text-2xl md:text-3xl font-bold">Encontre moradia com filtros rápidos e precisos</h1>
          <p className="text-muted-foreground">Ajuste preço, localização e tipo de imóvel sem perder o foco na conversão.</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {propertyTypeOptions.map((option) => (
            <Badge
              key={option.value}
              variant={propertyType === option.value ? 'default' : 'outline'}
              className="cursor-pointer rounded-full px-4 py-2 text-sm"
              onClick={() => setPropertyType(option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit border-purple-100">
          <CardHeader>
            <CardTitle className="text-lg">Filtros avançados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Localização/Bairro</Label>
              <Input
                value={locationNeighborhood}
                onChange={(event) => setLocationNeighborhood(event.target.value)}
                placeholder="Bairro, rua ou referência"
              />
            </div>

            <div className="space-y-2">
              <Label>Campus</Label>
              <Select value={campus} onValueChange={(value) => setCampus(value as Campus | 'todos')}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os campus" />
                </SelectTrigger>
                <SelectContent>
                  {campusOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === 'todos' ? 'Todos os campus' : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Preço: R$ {priceRange[0]} - R$ {priceRange[1]}</Label>
              <Slider
                min={200}
                max={2500}
                step={50}
                value={priceRange}
                onValueChange={(value) => setPriceRange([value[0] ?? 200, value[1] ?? value[0] ?? 2500])}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!loading && (
            <p className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}</p>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <Skeleton key={index} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                Nenhum imóvel encontrado com esses filtros.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isFavorite={isFavorite(property.id)}
                  onToggleFavorite={toggle}
                  onOpenDetails={(selected) => {
                    setSelectedProperty(selected);
                    setDetailsOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <MarketplacePropertyPanel
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        property={selectedProperty}
      />
    </div>
  );
}