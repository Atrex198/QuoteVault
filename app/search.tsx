import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search as SearchIcon, X } from 'lucide-react-native';
import { QuoteCard } from '@/components/QuoteCard';
import { BottomNav } from '@/components/BottomNav';
import { useQuotes } from '@/hooks/useQuotes';
import { STRINGS } from '@/lib/constants';
import type { Quote } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { theme } = useTheme();

  // Debounce search query to avoid API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch quotes based on search
  const { data: quotes = [], isLoading, isError, error } = useQuotes({
    searchQuery: debouncedSearch.trim() || undefined,
  });

  const hasSearched = debouncedSearch.trim().length > 0;
  const showResults = hasSearched && quotes.length > 0;
  const showEmpty = hasSearched && quotes.length === 0 && !isLoading;

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: theme.colors.background }}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-6 pb-4">
          <Text className="text-3xl font-bold mb-2" style={{ color: theme.colors.text }}>Search</Text>
          <Text className="text-base" style={{ color: theme.colors.textSecondary }}>
            Search quotes by content or author
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mx-4 mb-6">
          <View className="flex-row items-center rounded-2xl px-4 py-3" style={{ backgroundColor: theme.colors.surface }}>
            <SearchIcon size={20} color={theme.colors.textSecondary} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: theme.colors.text }}
              placeholder={STRINGS.placeholders.search}
              placeholderTextColor={theme.colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Results */}
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Loading state */}
          {isLoading && hasSearched && (
            <View className="items-center justify-center py-12">
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text className="mt-4" style={{ color: theme.colors.textSecondary }}>Searching...</Text>
            </View>
          )}

          {/* Error state */}
          {isError && (
            <View className="items-center justify-center py-12 px-6">
              <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.error }}>Error</Text>
              <Text className="text-center" style={{ color: theme.colors.textSecondary }}>
                {error?.message || 'Something went wrong'}
              </Text>
            </View>
          )}

          {/* Empty state - no search yet */}
          {!hasSearched && !isLoading && (
            <View className="items-center justify-center py-20 px-6">
              <SearchIcon size={64} color={theme.colors.border} />
              <Text className="text-xl font-semibold mt-6 mb-2" style={{ color: theme.colors.text }}>
                Search for Quotes
              </Text>
              <Text className="text-center" style={{ color: theme.colors.textSecondary }}>
                Type a keyword, phrase, or author name to find quotes
              </Text>
            </View>
          )}

          {/* Empty state - no results */}
          {showEmpty && (
            <View className="items-center justify-center py-12 px-6">
              <Text className="text-lg font-semibold mb-2" style={{ color: theme.colors.text }}>
                No quotes found
              </Text>
              <Text className="text-center" style={{ color: theme.colors.textSecondary }}>
                Try searching with different keywords or author names
              </Text>
            </View>
          )}

          {/* Results grid */}
          {showResults && (
            <>
              <Text className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
                {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'} found
              </Text>
              <View className="flex-row flex-wrap justify-between">
                {quotes.map((quote, index) => (
                  <View
                    key={quote.id}
                    className="w-[48%] mb-4"
                  >
                    <QuoteCard
                      quote={quote}
                      variant={
                        index % 3 === 0 ? 'light' :
                        index % 3 === 1 ? 'dark' : 'image'
                      }
                    />
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}
