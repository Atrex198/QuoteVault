import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { Quote, Category } from '@/types';

const CATEGORIES: Category[] = ['Motivation', 'Love', 'Success', 'Wisdom', 'Humor'];
const QUOTES_PER_CATEGORY = 10;
const CACHE_KEY_PREFIX = '@quotevault_initial_cache_';
const SECTIONS_CACHE_KEY = '@quotevault_sections_cache';

interface CachedData {
  data: any;
  timestamp: number;
}

/**
 * Hook to pre-cache quotes and sections on app initialization
 * Caches 10 quotes per category and all section data
 */
export function useInitialCache() {
  useEffect(() => {
    initializeCache();
  }, []);

  const initializeCache = async () => {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected && netInfo.isInternetReachable !== false;

      if (!isConnected) {
        console.log('⚠️ Offline - skipping initial cache');
        return;
      }

      // Check if cache already exists and is recent (within 24 hours)
      const lastCacheTime = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}last_update`);
      if (lastCacheTime) {
        const timeDiff = Date.now() - parseInt(lastCacheTime);
        const CACHE_VALIDITY = 24 * 60 * 60 * 1000; // 24 hours
        
        if (timeDiff < CACHE_VALIDITY) {
          console.log('✅ Initial cache still valid');
          return;
        }
      }

      console.log('📦 Starting initial cache...');

      // Cache quotes for each category in parallel
      const categoryPromises = CATEGORIES.map(async (category) => {
        try {
          const { data, error } = await supabase
            .from('quotes')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false })
            .limit(QUOTES_PER_CATEGORY);

          if (error) throw error;

          if (data && data.length > 0) {
            const cacheData: CachedData = {
              data,
              timestamp: Date.now(),
            };
            await AsyncStorage.setItem(
              `${CACHE_KEY_PREFIX}${category}`,
              JSON.stringify(cacheData)
            );
            console.log(`✅ Cached ${data.length} quotes for ${category}`);
          }
        } catch (error) {
          console.error(`❌ Failed to cache ${category}:`, error);
        }
      });

      // Cache all sections (categories for display)
      const sectionsPromise = (async () => {
        try {
          // Get count for each category
          const sectionData = await Promise.all(
            CATEGORIES.map(async (category) => {
              const { count, error } = await supabase
                .from('quotes')
                .select('*', { count: 'exact', head: true })
                .eq('category', category);

              if (error) throw error;

              return {
                category,
                count: count || 0,
              };
            })
          );

          const cacheData: CachedData = {
            data: sectionData,
            timestamp: Date.now(),
          };

          await AsyncStorage.setItem(
            SECTIONS_CACHE_KEY,
            JSON.stringify(cacheData)
          );
          console.log('✅ Cached all sections');
        } catch (error) {
          console.error('❌ Failed to cache sections:', error);
        }
      })();

      // Wait for all caching operations to complete
      await Promise.all([...categoryPromises, sectionsPromise]);

      // Update last cache time
      await AsyncStorage.setItem(
        `${CACHE_KEY_PREFIX}last_update`,
        Date.now().toString()
      );

      console.log('✅ Initial cache completed');
    } catch (error) {
      console.error('❌ Error in initial cache:', error);
    }
  };

  return null;
}

/**
 * Get cached quotes for a specific category
 */
export async function getCachedCategoryQuotes(category: Category): Promise<Quote[]> {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${category}`);
    if (cached) {
      const parsed: CachedData = JSON.parse(cached);
      return parsed.data as Quote[];
    }
  } catch (error) {
    console.error(`Error getting cached quotes for ${category}:`, error);
  }
  return [];
}

/**
 * Get cached sections data
 */
export async function getCachedSections(): Promise<Array<{ category: Category; count: number }>> {
  try {
    const cached = await AsyncStorage.getItem(SECTIONS_CACHE_KEY);
    if (cached) {
      const parsed: CachedData = JSON.parse(cached);
      return parsed.data;
    }
  } catch (error) {
    console.error('Error getting cached sections:', error);
  }
  return [];
}

/**
 * Clear initial cache (useful for debugging or when user logs out)
 */
export async function clearInitialCache(): Promise<void> {
  try {
    const keys = [
      SECTIONS_CACHE_KEY,
      `${CACHE_KEY_PREFIX}last_update`,
      ...CATEGORIES.map(cat => `${CACHE_KEY_PREFIX}${cat}`),
    ];
    await AsyncStorage.multiRemove(keys);
    console.log('✅ Initial cache cleared');
  } catch (error) {
    console.error('❌ Error clearing initial cache:', error);
  }
}
