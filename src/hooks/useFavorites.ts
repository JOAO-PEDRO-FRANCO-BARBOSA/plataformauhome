import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const favoriteIdsRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    favoriteIdsRef.current = new Set(favoriteIds);
  }, [favoriteIds]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('favorites' as unknown as never)
          .select('property_id')
          .eq('user_id', user.id);

        if (error) throw error;
        const ids = (data ?? [])
          .map((fav) => (fav as { property_id?: string }).property_id)
          .filter((propertyId): propertyId is string => typeof propertyId === 'string');
        favoriteIdsRef.current = new Set(ids);
        setFavoriteIds(ids);
      } catch (err) {
        console.error('Erro ao carregar favoritos:', err);
      }
    };

    loadFavorites();
  }, []);

  const toggle = useCallback(async (id: string) => {
    if (inFlightRef.current.has(id)) return;

    inFlightRef.current.add(id);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado',
          variant: 'destructive',
        });
        return;
      }

      const isFav = favoriteIdsRef.current.has(id);

      if (isFav) {
        const { error } = await supabase
          .from('favorites' as unknown as never)
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', id);

        if (error) throw error;
        setFavoriteIds((prev) => {
          const next = prev.filter((fid) => fid !== id);
          favoriteIdsRef.current = new Set(next);
          return next;
        });
        toast({ title: 'Removido', description: 'Imóvel removido dos favoritos' });
      } else {
        const { error } = await supabase
          .from('favorites' as unknown as never)
          .insert([{ user_id: user.id, property_id: id }] as unknown as never);

        if (error) throw error;
        setFavoriteIds((prev) => {
          if (prev.includes(id)) return prev;
          const next = [...prev, id];
          favoriteIdsRef.current = new Set(next);
          return next;
        });
        toast({ title: 'Salvo', description: 'Imóvel salvo nos favoritos!' });
      }
    } catch (err) {
      console.error('Erro ao atualizar favorito:', err);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o favorito', variant: 'destructive' });
    } finally {
      inFlightRef.current.delete(id);
      setLoading(false);
    }
  }, [toast]);

  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  return { favoriteIds, toggle, isFavorite, loading };
}
