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
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const now = Date.now();
          const isActiveHighlight = (featuredUntil: string | null) =>
            Boolean(featuredUntil && new Date(featuredUntil).getTime() > now);

          const sortedRows = [...data].sort((a, b) => {
            const aFeatured = isActiveHighlight(a.featured_until);
            const bFeatured = isActiveHighlight(b.featured_until);

            if (aFeatured !== bFeatured) {
              return aFeatured ? -1 : 1;
            }

            const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0;
            const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0;
            return bCreated - aCreated;
          });

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
