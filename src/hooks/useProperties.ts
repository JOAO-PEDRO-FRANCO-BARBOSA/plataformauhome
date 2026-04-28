import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyFilters } from '@/types';
import { toast } from 'sonner';

export interface PropertyQueryFilters {
  campus?: string | 'todos';
  priceRange?: [number, number];
  propertyType?: string;
  locationNeighborhood?: string;
  rooms?: number | null;
  acceptsPet?: boolean | null;
}

export function useProperties(filters?: PropertyQueryFilters | PropertyFilters) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovedProperties = async () => {
      setLoading(true);
      try {
        const nowIso = new Date().toISOString();

        // Query 1: Fetch highlighted properties (active featured listings)
        const { data: highlightedData, error: highlightError } = await supabase
          .from('properties')
          .select('*, property_type, location_neighborhood')
          .eq('status', 'approved')
          .gt('featured_until', nowIso)
          .order('created_at', { ascending: false });

        if (highlightError) throw highlightError;

        // Query 2: Fetch regular properties (no highlight or expired)
        const { data: regularData, error: regularError } = await supabase
          .from('properties')
          .select('*, property_type, location_neighborhood')
          .eq('status', 'approved')
          .or(`featured_until.is.null,featured_until.lte.${nowIso}`)
          .order('created_at', { ascending: false });

        if (regularError) throw regularError;

        const sortedRows = [...(highlightedData || []), ...(regularData || [])];

        setProperties(sortedRows.map((p) => ({
          id: p.id,
          title: p.title,
          images: (p.images as string[]) ?? [],
          price: Number(p.price),
          campus: (p.campus ?? 'Santa Mônica') as Property['campus'],
          address: p.address ?? '',
          rooms: p.rooms ?? 1,
          noFiador: p.no_fiador ?? false,
          verified: p.verified ?? false,
          description: p.description ?? '',
          amenities: (p.amenities as string[]) ?? [],
          acceptsPet: p.accepts_pet ?? false,
          contactWhatsApp: p.contact_whatsapp ?? undefined,
          contactSocial: p.contact_social ?? undefined,
          featured_until: p.featured_until ?? null,
          property_type: p.property_type ?? undefined,
          location_neighborhood: p.location_neighborhood ?? undefined,
        })));
      } catch (error) {
        console.error(error);
        toast.error('Não foi possível carregar os imóveis aprovados.');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedProperties();
  }, []);

  const filtered = useMemo(() => {
    if (!filters) return properties;
    
    const typedFilters = filters as PropertyQueryFilters;
    
    return properties.filter((p) => {
      if (typedFilters.campus && typedFilters.campus !== 'todos' && p.campus !== typedFilters.campus) return false;
      
      if (typedFilters.priceRange) {
        if (p.price < typedFilters.priceRange[0] || p.price > typedFilters.priceRange[1]) return false;
      }
      
      if (typedFilters.propertyType && typedFilters.propertyType !== 'all' && p.property_type !== typedFilters.propertyType) return false;
      
      if (typedFilters.locationNeighborhood && p.location_neighborhood) {
        const searchTerm = typedFilters.locationNeighborhood.toLowerCase();
        if (!p.location_neighborhood.toLowerCase().includes(searchTerm)) return false;
      }
      
      if (typedFilters.rooms && p.rooms !== typedFilters.rooms) return false;
      if (typedFilters.acceptsPet === true && !p.acceptsPet) return false;
      return true;
    });
  }, [properties, filters]);

  return { properties: filtered, loading };
}
