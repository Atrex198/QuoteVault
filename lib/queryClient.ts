import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create Query Client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data remains fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - cache retention (previously cacheTime)
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: true,
      refetchOnReconnect: true, // Refetch when network reconnects (offline support)
    },
    mutations: {
      retry: 1, // Retry mutations once
    },
  },
});

// Create AsyncStorage persister for offline-first architecture
export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000, // Throttle persisting to storage
});
