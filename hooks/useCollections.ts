import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase, ensureAuthenticated, ensureProfile } from '@/lib/supabase';
import { getCachedCollections, setCachedCollections, getCachedCollectionQuotes, setCachedCollectionQuotes } from '@/lib/localCache';
import type { Collection, CollectionWithCount } from '@/types';

// Get all collections for the current user
export function useCollections() {
  const queryClient = useQueryClient();
  
  // Load cached data on mount
  useEffect(() => {
    getCachedCollections().then(cached => {
      if (cached && Array.isArray(cached) && cached.length > 0) {
        queryClient.setQueryData(['collections'], cached);
      }
    });
  }, []);
  
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const user = await ensureAuthenticated();
      
      if (!user) {
        return [];
      }
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('collections')
        .select(`
          id,
          user_id,
          name,
          description,
          created_at,
          updated_at,
          collection_quotes (count)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Transform to include quote count
      const collections = (data || []).map(col => ({
        ...col,
        quote_count: Array.isArray(col.collection_quotes) ? col.collection_quotes.length : 0
      })) as unknown as CollectionWithCount[];
      
      // Cache the data locally
      await setCachedCollections(collections);
      
      return collections;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get a single collection with its quotes
export function useCollection(collectionId: string) {
  return useQuery({
    queryKey: ['collection', collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          id,
          name,
          description,
          created_at,
          updated_at,
          collection_quotes (
            id,
            added_at,
            quotes (
              id,
              content,
              author,
              category,
              created_at
            )
          )
        `)
        .eq('id', collectionId)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!collectionId,
  });
}

// Get quotes in a collection
export function useCollectionQuotes(collectionId: string) {
  const queryClient = useQueryClient();
  const [initialData, setInitialData] = useState<any[]>([]);
  const [hasLoadedCache, setHasLoadedCache] = useState(false);
  
  // Load cached data synchronously on mount
  useEffect(() => {
    if (collectionId && !hasLoadedCache) {
      getCachedCollectionQuotes(collectionId).then(cached => {
        if (cached && Array.isArray(cached) && cached.length > 0) {
          setInitialData(cached);
          queryClient.setQueryData(['collection-quotes', collectionId], cached);
        }
        setHasLoadedCache(true);
      });
    }
  }, [collectionId, hasLoadedCache]);
  
  return useQuery({
    queryKey: ['collection-quotes', collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_quotes')
        .select(`
          quotes (
            id,
            content,
            author,
            category,
            created_at
          )
        `)
        .eq('collection_id', collectionId)
        .order('added_at', { ascending: false });

      if (error) throw error;

      // Extract quotes from the nested structure
      const quotes = (data || [])
        .map(item => item.quotes)
        .filter((quote): quote is any => quote !== null && !Array.isArray(quote));
      
      // Cache the data locally
      await setCachedCollectionQuotes(collectionId, quotes);
      
      return quotes;
    },
    staleTime: Infinity, // Cache forever, only refetch on invalidation
    enabled: !!collectionId,
    initialData: initialData.length > 0 ? initialData : undefined,
  });
}

// Create a new collection
export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const user = await ensureAuthenticated();
      
      if (!user) {
        throw new Error('Please log in to create collections');
      }

      const { data, error } = await supabase
        .from('collections')
        .insert({
          user_id: user.id,
          name,
          description: description || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newCollection) => {
      // Optimistic update: add new collection to cache instead of refetching
      queryClient.setQueryData(['collections'], (old: any) => {
        if (!old) return [newCollection];
        return [{ ...newCollection, quote_count: 0 }, ...old];
      });
    },
  });
}

// Update a collection
export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      name, 
      description 
    }: { 
      id: string; 
      name?: string; 
      description?: string 
    }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;

      const { data, error } = await supabase
        .from('collections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection', data.id] });
    },
  });
}

// Delete a collection
export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
}

// Add a quote to a collection
export function useAddQuoteToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, quoteId }: { collectionId: string; quoteId: string }) => {
      const { data, error } = await supabase
        .from('collection_quotes')
        .insert({
          collection_id: collectionId,
          quote_id: quoteId
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate key error gracefully
        if (error.code === '23505') {
          throw new Error('Quote already exists in this collection');
        }
        throw error;
      }

      return data;
    },
    onSuccess: (_, { collectionId, quoteId }) => {
      // Only invalidate the specific collection's quotes
      queryClient.invalidateQueries({ queryKey: ['collection-quotes', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['quote-collections', quoteId] });
      
      // Update collection quote count in cache without refetching
      queryClient.setQueryData(['collections'], (old: any) => {
        if (!old) return old;
        return old.map((col: any) => 
          col.id === collectionId 
            ? { ...col, quote_count: (col.quote_count || 0) + 1 }
            : col
        );
      });
    },
  });
}

// Remove a quote from a collection
export function useRemoveQuoteFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, quoteId }: { collectionId: string; quoteId: string }) => {
      const { error } = await supabase
        .from('collection_quotes')
        .delete()
        .eq('collection_id', collectionId)
        .eq('quote_id', quoteId);

      if (error) throw error;
    },
    onSuccess: (_, { collectionId, quoteId }) => {
      // Only invalidate the specific collection's quotes
      queryClient.invalidateQueries({ queryKey: ['collection-quotes', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['quote-collections', quoteId] });
      
      // Update collection quote count in cache without refetching
      queryClient.setQueryData(['collections'], (old: any) => {
        if (!old) return old;
        return old.map((col: any) => 
          col.id === collectionId 
            ? { ...col, quote_count: Math.max(0, (col.quote_count || 0) - 1) }
            : col
        );
      });
    },
  });
}

// Get collections that contain a specific quote
export function useQuoteCollections(quoteId: string) {
  return useQuery({
    queryKey: ['quote-collections', quoteId],
    queryFn: async () => {
      const user = await ensureAuthenticated();
      
      if (!user) {
        return [];
      }
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('collection_quotes')
        .select(`
          collection_id,
          collections (
            id,
            name,
            description,
            user_id
          )
        `)
        .eq('quote_id', quoteId);

      if (error) throw error;

      // Filter to only user's collections and transform
      return (data || [])
        .map(item => item.collections)
        .filter((col): col is any => {
          if (!col || Array.isArray(col)) return false;
          return (col as any).user_id === user.id;
        }) as Collection[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!quoteId,
  });
}
