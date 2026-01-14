import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearInitialCache } from '@/hooks/useInitialCache';

const CACHE_KEYS = {
  FAVORITES: 'cache_favorites',
  COLLECTIONS: 'cache_collections',
  COLLECTION_QUOTES: 'cache_collection_quotes_',
} as const;

// Generic cache functions
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Error reading cache:', error);
  }
  return null;
}

export async function setCachedData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Error writing cache:', error);
  }
}

export async function removeCachedData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn('Error removing cache:', error);
  }
}

// Specific cache functions for favorites
export async function getCachedFavorites() {
  return getCachedData(CACHE_KEYS.FAVORITES);
}

export async function setCachedFavorites(favorites: any[]) {
  return setCachedData(CACHE_KEYS.FAVORITES, favorites);
}

// Specific cache functions for collections
export async function getCachedCollections() {
  return getCachedData(CACHE_KEYS.COLLECTIONS);
}

export async function setCachedCollections(collections: any[]) {
  return setCachedData(CACHE_KEYS.COLLECTIONS, collections);
}

// Specific cache functions for collection quotes
export async function getCachedCollectionQuotes(collectionId: string) {
  return getCachedData(`${CACHE_KEYS.COLLECTION_QUOTES}${collectionId}`);
}

export async function setCachedCollectionQuotes(collectionId: string, quotes: any[]) {
  return setCachedData(`${CACHE_KEYS.COLLECTION_QUOTES}${collectionId}`, quotes);
}

export async function removeCachedCollectionQuotes(collectionId: string) {
  return removeCachedData(`${CACHE_KEYS.COLLECTION_QUOTES}${collectionId}`);
}

// Clear all cache
export async function clearAllCache() {
  try {
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter for cache keys and collection quote keys
    const cacheKeys = allKeys.filter(key => 
      key.startsWith('cache_') || 
      key.startsWith('@quotevault_')
    );
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('✅ Cleared all cache:', cacheKeys.length, 'keys');
    }
    
    // Also clear initial cache if the module is available
    try {
      const { clearInitialCache } = await import('@/hooks/useInitialCache');
      await clearInitialCache();
    } catch (e) {
      // Initial cache module not available, skip
    }
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
}
