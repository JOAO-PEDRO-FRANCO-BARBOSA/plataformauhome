import { useState, useCallback } from 'react';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(['p1', 'p4', 'p6']);

  const toggle = useCallback((id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  }, []);

  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  return { favoriteIds, toggle, isFavorite };
}
