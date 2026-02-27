import { useState, useEffect, useMemo } from 'react';
import { Property, PropertyFilters } from '@/types';
import { mockProperties } from '@/data/mockData';

export function useProperties(filters?: PropertyFilters) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setProperties(mockProperties);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    if (!filters) return properties;
    return properties.filter((p) => {
      if (filters.campus !== 'todos' && p.campus !== filters.campus) return false;
      if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false;
      if (filters.rooms && p.rooms !== filters.rooms) return false;
      return true;
    });
  }, [properties, filters]);

  return { properties: filtered, loading };
}
