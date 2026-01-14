import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { DailyQuote, Quote } from '@/types';

export function useDailyQuote() {
  return useQuery({
    queryKey: ['daily-quote'],
    queryFn: async () => {
      // Get current UTC date from Supabase server to ensure consistency across devices
      let today: string;
      try {
        const { data: serverTime, error: rpcError } = await supabase.rpc('get_current_date');
        if (rpcError) throw rpcError;
        today = serverTime || new Date().toISOString().split('T')[0];
      } catch (error) {
        // Fallback to local date if RPC doesn't exist yet
        console.log('Using local date (RPC not available):', error);
        today = new Date().toISOString().split('T')[0];
      }

      // Try to get today's daily quote
      const { data: dailyQuoteData, error: dailyError } = await supabase
        .from('daily_quotes')
        .select(`
          date,
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
        .eq('date', today)
        .single();

      if (dailyError) {
        // If no daily quote exists, get a random quote as fallback
        const { data: randomQuote, error: randomError } = await supabase
          .from('quotes')
          .select('*')
          .limit(1);

        if (randomError || !randomQuote || randomQuote.length === 0) {
          throw new Error('Could not fetch daily quote');
        }

        return randomQuote[0] as Quote;
      }

      // Return the quote from the joined data - handle both array and object
      const quoteData = dailyQuoteData.quotes;
      if (Array.isArray(quoteData)) {
        return quoteData[0] as Quote;
      }
      return quoteData as Quote;
    },
    staleTime: 1 * 60 * 60 * 1000, // 1 hour - check more frequently
    gcTime: 24 * 60 * 60 * 1000,
    refetchInterval: 1 * 60 * 60 * 1000, // Refetch every hour to catch date changes
  });
}

// Hook to manually rotate daily quote (admin function)
export function useRotateDailyQuote() {
  return async () => {
    const { error } = await supabase.rpc('rotate_daily_quote');
    
    if (error) {
      throw new Error(error.message);
    }
    
    return true;
  };
}
