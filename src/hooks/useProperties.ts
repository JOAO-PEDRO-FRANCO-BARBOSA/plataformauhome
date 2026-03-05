import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Property, PropertyFilters } from '@/types';
import { toast } from 'sonner';

export function useProperties(filters?: PropertyFilters) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovedProperties = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'approved');

        if (error) throw error;

        if (data) {
          setProperties(data.map((p) => ({
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
          })));
        }
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
    return properties.filter((p) => {
      if (filters.campus !== 'todos' && p.campus !== filters.campus) return false;
      if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false;
      if (filters.rooms && p.rooms !== filters.rooms) return false;
      if (filters.acceptsPet === true && !p.acceptsPet) return false;
      return true;
    });
  }, [properties, filters]);

  return { properties: filtered, loading };
}
