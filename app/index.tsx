import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, StatusBar, RefreshControl, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { QuoteOfTheDayCard } from '@/components/QuoteOfTheDayCard';
import { CategoryPills } from '@/components/CategoryPills';
import { QuoteCard } from '@/components/QuoteCard';
import { BottomNav } from '@/components/BottomNav';
import { CATEGORIES, STRINGS } from '@/lib/constants';
import { MOCK_USER } from '@/data/mockData';
import { useInfiniteQuotes } from '@/hooks/useQuotes';
import { useDailyQuote } from '@/hooks/useDailyQuote';
import type { Quote, Category } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../global.css';

export default function HomeScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userName, setUserName] = useState('User');
  const [userAvatar, setUserAvatar] = useState<string | undefined>();
  const [randomSeed, setRandomSeed] = useState(Math.random());

  // Load user data from AsyncStorage
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('@quotevault_user_name');
      const avatar = await AsyncStorage.getItem('@quotevault_user_avatar');
      if (name) setUserName(name);
      if (avatar) setUserAvatar(avatar);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // Debounce search query to avoid API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch quotes from Supabase with infinite scroll
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuotes({
    category: selectedCategory,
    searchQuery: debouncedSearch.trim() || undefined,
    randomSeed: randomSeed,
  });

  // Flatten all pages into a single array and remove duplicates
  const quotes = React.useMemo(() => {
    console.log('📊 Recalculating quotes array');
    console.log('📊 Number of pages:', data?.pages.length ?? 0);
    const allQuotes = data?.pages.flatMap(page => page) ?? [];
    console.log('📊 Total quotes before dedup:', allQuotes.length);
    // Remove duplicates by creating a Map with id as key
    const uniqueQuotes = Array.from(
      new Map(allQuotes.map(quote => [quote.id, quote])).values()
    );
    console.log('📊 Total quotes after dedup:', uniqueQuotes.length);
    return uniqueQuotes;
  }, [data]);

  // Fetch daily quote
  const { data: dailyQuote, isLoading: isDailyLoading, refetch: refetchDaily } = useDailyQuote();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Generate new random seed to get different quotes
      const newSeed = Math.random();
      setRandomSeed(newSeed);
      
      // Reset infinite queries back to first page by removing all cached data
      await queryClient.resetQueries({ 
        queryKey: ['quotes-infinite', selectedCategory, debouncedSearch.trim() || undefined],
        exact: false 
      });
      await queryClient.invalidateQueries({ queryKey: ['daily-quote'] });
      await refetchDaily();
    } catch (error) {
      // Error handling
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Error state
  if (isError) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6" edges={['top']} style={{ backgroundColor: theme.colors.background }}>
        <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.error }}>Error Loading Quotes</Text>
        <Text className="text-center mb-4" style={{ color: theme.colors.textSecondary }}>{error?.message || 'Something went wrong'}</Text>
        <Text className="underline" style={{ color: theme.colors.primary }} onPress={() => refetch()}>
          Tap to retry
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.statusBar} backgroundColor={theme.colors.background} />
      
      <View className="flex-1">
        <FlatList
          data={quotes}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 16, gap: 12 }}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Header */}
              <Header userName={userName} userAvatar={userAvatar} />

              {/* Quote of the Day */}
              {isDailyLoading ? (
                <View className="mx-4 mt-6 h-48 rounded-3xl items-center justify-center" style={{ backgroundColor: theme.colors.surface }}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : dailyQuote ? (
                <View className="mx-4 mt-6">
                  <QuoteOfTheDayCard
                    quote={{
                      id: dailyQuote.id,
                      content: dailyQuote.content,
                      author: dailyQuote.author,
                      category: dailyQuote.category,
                      created_at: dailyQuote.created_at,
                    }}
                  />
                </View>
              ) : null}

              {/* Categories */}
              <CategoryPills
                selectedCategory={selectedCategory}
                onSelectCategory={(category) => setSelectedCategory(category as Category | 'All')}
              />

              {/* Section Title */}
              <View className="px-4 mt-6 mb-3">
                <Text className="text-lg font-semibold" style={{ color: theme.colors.text }}>
                  {selectedCategory === 'All' ? 'All Quotes' : `${selectedCategory} Quotes`}
                </Text>
              </View>
            </>
          }
          renderItem={({ item, index }) => (
            <View className="flex-1 mb-4">
              <QuoteCard
                quote={item}
                variant={
                  index % 3 === 0 ? 'light' :
                  index % 3 === 1 ? 'dark' : 'image'
                }
              />
            </View>
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center justify-center py-12 px-4">
                <Text className="text-center" style={{ color: theme.colors.textSecondary }}>
                  No quotes found for this category
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />

        {/* Bottom Navigation */}
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}
