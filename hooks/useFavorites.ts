import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase, ensureAuthenticated } from '@/lib/supabase';
import { getCachedFavorites, setCachedFavorites } from '@/lib/localCache';
import type { Favorite, Quote, QuoteWithFavorite } from '@/types';

// Get all favorites for the current user
export function useFavorites() {
  const queryClient = useQueryClient();
  
  // Load cached data on mount
  useEffect(() => {
    getCachedFavorites().then(cached => {
      if (cached && Array.isArray(cached) && cached.length > 0) {
        queryClient.setQueryData(['favorites'], cached);
      }
    });
  }, []);
  
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const user = await ensureAuthenticated();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          quote_id,
          created_at,
          quotes (
            id,
            content,
            author,
            category,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform to QuoteWithFavorite format
      const favorites = (data || []).map(fav => ({
        ...(fav.quotes as any),
        favorite_id: `${user.id}-${fav.quote_id}`, // Composite key
        is_favorite: true
      })) as QuoteWithFavorite[];
      
      // Cache the data locally
      await setCachedFavorites(favorites);
      
      return favorites;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Check if a specific quote is favorited
export function useIsFavorite(quoteId: string) {
  return useQuery({
    queryKey: ['is-favorite', quoteId],
    queryFn: async () => {
      const user = await ensureAuthenticated();

      if (!user) {
        return { isFavorite: false, favoriteId: null };
      }

      const { data, error } = await supabase
        .from('favorites')
        .select('quote_id')
        .eq('user_id', user.id)
        .eq('quote_id', quoteId)
        .maybeSingle();

      if (error) throw error;

      return {
        isFavorite: !!data,
        favoriteId: data ? `${user.id}-${data.quote_id}` : null
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Add a quote to favorites
export function useAddFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const user = await ensureAuthenticated();

      if (!user) {
        throw new Error('Please log in to add favorites');
      }

      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          quote_id: quoteId
        })
        .select()
        .single();

      if (error) {
        // Silently handle duplicate key errors
        if (error.code === '23505') {
          return null;
        }
        throw error;
      }
      
      return data;
    },
    onMutate: async (quoteId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['is-favorite', quoteId] });
      
      // Snapshot the previous value
      const previousFavorite = queryClient.getQueryData(['is-favorite', quoteId]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['is-favorite', quoteId], { isFavorite: true, favoriteId: null });
      
      // Return context with previous value
      return { previousFavorite };
    },
    onSuccess: async (_, quoteId) => {
      // Immediately refetch the favorites list
      await queryClient.refetchQueries({ queryKey: ['favorites'] });
    },
    onError: (error: any, quoteId, context) => {
      // Rollback on error (unless it's a duplicate)
      if (error?.code !== '23505' && context?.previousFavorite) {
        queryClient.setQueryData(['is-favorite', quoteId], context.previousFavorite);
      }
    }
  });
}

// Remove a quote from favorites
export function useRemoveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quoteId: string) => {
      const user = await ensureAuthenticated();

      if (!user) {
        throw new Error('Please log in to remove favorites');
      }

      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('quote_id', quoteId);

      if (error) throw error;
    },
    onMutate: async (quoteId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['is-favorite', quoteId] });
      
      // Snapshot the previous value
      const previousFavorite = queryClient.getQueryData(['is-favorite', quoteId]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['is-favorite', quoteId], { isFavorite: false, favoriteId: null });
      
      // Return context with previous value
      return { previousFavorite };
    },
    onSuccess: async (_, quoteId) => {
      // Immediately refetch the favorites list
      await queryClient.refetchQueries({ queryKey: ['favorites'] });
    },
    onError: (error, quoteId, context) => {
      // Rollback on error
      if (context?.previousFavorite) {
        queryClient.setQueryData(['is-favorite', quoteId], context.previousFavorite);
      }
    }
  });
}

// Toggle favorite status
export function useToggleFavorite() {
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  return {
    toggleFavorite: async (quoteId: string, currentlyFavorited: boolean) => {
      if (currentlyFavorited) {
        await removeFavorite.mutateAsync(quoteId);
      } else {
        await addFavorite.mutateAsync(quoteId);
      }
    },
    isLoading: addFavorite.isPending || removeFavorite.isPending,
  };
}

// Get favorites count for the current user
export function useFavoritesCount() {
  return useQuery({
    queryKey: ['favorites-count'],
    queryFn: async () => {
      const user = await ensureAuthenticated();

      if (!user) {
        return 0;
      }

      const { count, error } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });
}
