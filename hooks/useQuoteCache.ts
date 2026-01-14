import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const CACHE_KEY = '@quotevault_quote_cache';
const CACHE_TIMESTAMP_KEY = '@quotevault_cache_timestamp';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const QUOTES_PER_CATEGORY = 10;

interface CachedQuote {
  id: string;
  content: string;
  author: string;
  category: string | null;
}

interface QuoteCache {
  [category: string]: CachedQuote[];
}

// Fetch quotes from cache
export async function getCachedQuotes(category?: string): Promise<CachedQuote[]> {
  try {
    const cacheData = await AsyncStorage.getItem(CACHE_KEY);
    if (!cacheData) return [];

    const cache: QuoteCache = JSON.parse(cacheData);
    
    if (category) {
      return cache[category] || [];
    }
    
    // Return all quotes if no category specified
    return Object.values(cache).flat();
  } catch (error) {
    console.error('Error reading quote cache:', error);
    return [];
  }
}

// Check if cache is expired
async function isCacheExpired(): Promise<boolean> {
  try {
    const timestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (!timestamp) return true;
    
    const lastUpdate = parseInt(timestamp, 10);
    const now = Date.now();
    
    return (now - lastUpdate) > CACHE_DURATION;
  } catch (error) {
    return true;
  }
}

// Fetch and cache quotes
async function fetchAndCacheQuotes(): Promise<QuoteCache> {
  const categories = ['motivation', 'inspiration', 'wisdom', 'life', 'love', 'success', 'happiness'];
  const cache: QuoteCache = {};

  // Fetch quotes for each category
  for (const category of categories) {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, content, author, category')
        .eq('category', category)
        .limit(QUOTES_PER_CATEGORY);

      if (error) throw error;
      cache[category] = data || [];
    } catch (error) {
      console.error(`Error fetching ${category} quotes:`, error);
      cache[category] = [];
    }
  }

  // Also cache some general quotes without category
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('id, content, author, category')
      .is('category', null)
      .limit(QUOTES_PER_CATEGORY);

    if (error) throw error;
    cache['general'] = data || [];
  } catch (error) {
    console.error('Error fetching general quotes:', error);
    cache['general'] = [];
  }

  // Save to AsyncStorage
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error saving cache:', error);
  }

  return cache;
}

// Hook to manage quote caching
export function useQuoteCache() {
  const { data: cache, isLoading, refetch } = useQuery({
    queryKey: ['quoteCache'],
    queryFn: async () => {
      const expired = await isCacheExpired();
      
      if (expired) {
        // Fetch fresh data
        return await fetchAndCacheQuotes();
      } else {
        // Load from cache
        const cacheData = await AsyncStorage.getItem(CACHE_KEY);
        if (cacheData) {
          return JSON.parse(cacheData) as QuoteCache;
        }
        // If no cache, fetch fresh
        return await fetchAndCacheQuotes();
      }
    },
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION * 2, // Keep in memory for 48 hours
  });

  // Initialize cache on mount
  useEffect(() => {
    const initCache = async () => {
      const expired = await isCacheExpired();
      if (expired) {
        refetch();
      }
    };
    initCache();
  }, []);

  return {
    cache,
    isLoading,
    refreshCache: refetch,
  };
}

// Get cached quotes by category (for offline use)
export async function getOfflineQuotes(category?: string): Promise<CachedQuote[]> {
  return getCachedQuotes(category);
}

// Clear cache (useful for debugging or force refresh)
export async function clearQuoteCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    await AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}
