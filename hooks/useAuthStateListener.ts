import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { clearAllCache } from '@/lib/localCache';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to listen for auth state changes and clear cache on logout
 */
export function useAuthStateListener() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔐 Setting up auth state listener');
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, 'Has session:', !!session);
      
      if (event === 'SIGNED_OUT') {
        console.log('🔐 User signed out, clearing all cache');
        
        // Clear React Query cache
        queryClient.clear();
        
        // Clear AsyncStorage cache
        await clearAllCache();
        
        console.log('✅ Cache cleared on logout');
      }
      
      if (event === 'SIGNED_IN' && session) {
        console.log('🔐 User signed in:', session.user.email);
        
        // Clear cache to ensure fresh data for new user
        queryClient.clear();
        await clearAllCache();
        
        console.log('✅ Cache cleared for new login');
      }
    });

    return () => {
      console.log('🔐 Cleaning up auth state listener');
      authListener.subscription.unsubscribe();
    };
  }, [queryClient]);
}
