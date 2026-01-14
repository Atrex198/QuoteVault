import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { Quote, Category } from '@/types';

const CACHE_KEY = '@quotevault_cached_quotes';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHED_QUOTES = 500; // Maximum quotes to keep in cache

interface UseQuotesOptions {
  category?: Category | 'All';
  searchQuery?: string;
  limit?: number;
}

// Helper to save quotes to local cache
const cacheQuotes = async (quotes: Quote[]) => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    let existingQuotes: Quote[] = [];
    
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
        existingQuotes = parsed.quotes;
      }
    }

    // Merge new quotes with existing (avoid duplicates)
    const quoteMap = new Map<string, Quote>();
    [...existingQuotes, ...quotes].forEach(q => quoteMap.set(q.id, q));
    
    // Keep only most recent MAX_CACHED_QUOTES
    const allQuotes = Array.from(quoteMap.values());
    const quotesToCache = allQuotes
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, MAX_CACHED_QUOTES);

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
      quotes: quotesToCache,
      timestamp: Date.now()
    }));
  } catch (error) {
    // Error caching quotes
  }
};

// Helper to get cached quotes
const getCachedQuotes = async (): Promise<Quote[]> => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
        return parsed.quotes;
      }
    }
  } catch (error) {
    // Error getting cached quotes
  }
  return [];
};

export function useQuotes({ category, searchQuery, limit = 50 }: UseQuotesOptions = {}) {
  return useQuery({
    queryKey: ['quotes', category, searchQuery, limit],
    queryFn: async () => {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable !== false;
      
      // If offline, return cached quotes
      if (!isConnected) {
        const cachedQuotes = await getCachedQuotes();
        
        // Apply filters to cached quotes
        let filteredQuotes = cachedQuotes;
        
        if (category && category !== 'All') {
          filteredQuotes = filteredQuotes.filter(q => q.category === category);
        }
        
        if (searchQuery && searchQuery.trim()) {
          const search = searchQuery.toLowerCase();
          filteredQuotes = filteredQuotes.filter(q => 
            q.content.toLowerCase().includes(search) || 
            q.author.toLowerCase().includes(search)
          );
        }
        
        return filteredQuotes.slice(0, limit);
      }

      // Online - fetch from Supabase
      let query = supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by category if not 'All'
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      // Search in content or author
      if (searchQuery && searchQuery.trim()) {
        query = query.or(`content.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        // If error, try to return cached data
        const cachedQuotes = await getCachedQuotes();
        if (cachedQuotes.length > 0) {
          return cachedQuotes;
        }
        throw new Error(error.message);
      }

      // Cache the quotes
      if (data) {
        cacheQuotes(data);
      }

      return data as Quote[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry if offline
      return failureCount < 2;
    },
  });
}

// Hook for infinite scroll pagination
export function useInfiniteQuotes({ category, searchQuery, randomSeed }: Omit<UseQuotesOptions, 'limit'> & { randomSeed?: number } = {}) {
  const PAGE_SIZE = 20;

  return useInfiniteQuery({
    queryKey: ['quotes-infinite', category, searchQuery, randomSeed],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * PAGE_SIZE;
      
      // Get total count first for random ordering
      let countQuery = supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true });
      
      if (category && category !== 'All') {
        countQuery = countQuery.eq('category', category);
      }

      if (searchQuery && searchQuery.trim()) {
        countQuery = countQuery.or(`content.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
      }

      const { count } = await countQuery;
      
      // If we have a random seed, calculate a random offset
      const useRandomOrder = randomSeed !== undefined;
      const randomOffset = useRandomOrder && count 
        ? Math.floor((randomSeed + pageParam) * 7919) % Math.max(1, count - PAGE_SIZE)
        : offset;
      
      let query = supabase
        .from('quotes')
        .select('*');

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      if (searchQuery && searchQuery.trim()) {
        query = query.or(`content.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`);
      }

      // Use random offset when random seed is provided, otherwise use sequential
      query = query
        .order('created_at', { ascending: false })
        .range(useRandomOrder ? randomOffset : offset, useRandomOrder ? randomOffset + PAGE_SIZE - 1 : offset + PAGE_SIZE - 1);

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Cache the quotes
      if (data && data.length > 0) {
        cacheQuotes(data);
      }

      return data as Quote[];
    },
    getNextPageParam: (lastPage, allPages) => {
      // If last page has fewer items than PAGE_SIZE, we've reached the end
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for getting a single quote by ID
export function useQuote(quoteId: string) {
  return useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as Quote;
    },
    enabled: !!quoteId,
  });
}

// Hook for getting quotes by author
export function useQuotesByAuthor(author: string) {
  return useQuery({
    queryKey: ['quotes', 'author', author],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('author', author)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data as Quote[];
    },
    enabled: !!author,
  });
}

// Hook for getting random quotes
export function useRandomQuotes(count: number = 10) {
  return useQuery({
    queryKey: ['quotes', 'random', count],
    queryFn: async () => {
      // Get total count first
      const { count: totalCount } = await supabase
        .from('quotes')
        .select('*', { count: 'exact', head: true });

      if (!totalCount) {
        return [];
      }

      // Get random quotes by generating random offsets
      const quotes: Quote[] = [];
      const randomOffsets = Array.from({ length: Math.min(count, totalCount) }, () =>
        Math.floor(Math.random() * totalCount)
      );

      for (const offset of randomOffsets) {
        const { data } = await supabase
          .from('quotes')
          .select('*')
          .range(offset, offset)
          .single();

        if (data) {
          quotes.push(data as Quote);
        }
      }

      return quotes;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
