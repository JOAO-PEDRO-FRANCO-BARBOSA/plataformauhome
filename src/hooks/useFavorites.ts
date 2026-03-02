import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Carregar favoritos ao inicializar
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('favorites')
          .select('property_id')
          .eq('user_id', user.id);

        if (error) throw error;
        setFavoriteIds(data?.map((fav) => fav.property_id) || []);
      } catch (err) {
        console.error('Erro ao carregar favoritos:', err);
      }
    };

    loadFavorites();
  }, []);

  // Toggle favorite no Supabase
  const toggle = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Você precisa estar logado',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const isFav = favoriteIds.includes(id);

      if (isFav) {
        // Remover dos favoritos
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', id);

        if (error) throw error;
        setFavoriteIds((prev) => prev.filter((fid) => fid !== id));
        toast({
          title: 'Removido',
          description: 'Imóvel removido dos favoritos',
        });
      } else {
        // Adicionar aos favoritos
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: user.id, property_id: id }]);

        if (error) throw error;
        setFavoriteIds((prev) => [...prev, id]);
        toast({
          title: 'Salvo',
          description: 'Imóvel salvo nos favoritos!',
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar favorito:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o favorito',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [favoriteIds, toast]);

  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  return { favoriteIds, toggle, isFavorite, loading };
}
