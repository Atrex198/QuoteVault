import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X } from 'lucide-react-native';
import { BottomNav } from '@/components/BottomNav';
import { QuoteCard } from '@/components/QuoteCard';
import { useFavorites } from '@/hooks/useFavorites';
import { useCollections } from '@/hooks/useCollections';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

type TabType = 'favorites' | 'collections';

export default function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('favorites');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();
  
  const { data: favorites = [], isLoading: favoritesLoading, refetch: refetchFavorites } = useFavorites();
  const { data: collections = [], isLoading: collectionsLoading, refetch: refetchCollections } = useCollections();
  
  const [refreshing, setRefreshing] = useState(false);

  // Filter favorites based on search query
  const filteredFavorites = useMemo(() => {
    if (!searchQuery.trim()) return favorites;
    const query = searchQuery.toLowerCase();
    return favorites.filter(
      (quote) =>
        quote.content.toLowerCase().includes(query) ||
        quote.author.toLowerCase().includes(query)
    );
  }, [favorites, searchQuery]);

  // Filter collections based on search query
  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const query = searchQuery.toLowerCase();
    return collections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(query) ||
        (collection.description?.toLowerCase().includes(query) || false)
    );
  }, [collections, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'favorites') {
      await refetchFavorites();
    } else {
      await refetchCollections();
    }
    setRefreshing(false);
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: theme.colors.background }}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 pt-4 pb-3" style={{ borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-3xl font-bold" style={{ color: theme.colors.text }}>Library</Text>
            <Pressable 
              onPress={handleSearchToggle}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-100"
            >
              {showSearch ? (
                <X size={22} color={theme.colors.text} />
              ) : (
                <Search size={22} color={theme.colors.text} />
              )}
            </Pressable>
          </View>

          {/* Search Bar */}
          {showSearch && (
            <View className="mb-4">
              <TextInput
                className="h-12 px-4 rounded-xl text-base"
                style={{ 
                  backgroundColor: theme.colors.surface, 
                  color: theme.colors.text,
                  borderWidth: 1,
                  borderColor: theme.colors.border
                }}
                placeholder={activeTab === 'favorites' ? 'Search favorites...' : 'Search collections...'}
                placeholderTextColor={theme.colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          )}

          {/* Tabs */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setActiveTab('favorites')}
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor: activeTab === 'favorites' ? theme.colors.primary : theme.colors.surface
              }}
            >
              <Text
                className="font-semibold"
                style={{
                  color: activeTab === 'favorites' ? '#FFFFFF' : theme.colors.textSecondary
                }}
              >
                Favorites
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('collections')}
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor: activeTab === 'collections' ? theme.colors.primary : theme.colors.surface
              }}
            >
              <Text
                className="font-semibold"
                style={{
                  color: activeTab === 'collections' ? '#FFFFFF' : theme.colors.textSecondary
                }}
              >
                Collections
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {activeTab === 'favorites' ? (
            <View className="py-4">
              {favoritesLoading ? (
                <Text className="text-center text-gray-500 mt-8">Loading favorites...</Text>
              ) : filteredFavorites.length === 0 ? (
                <View className="items-center justify-center py-12">
                  <Text className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
                    {searchQuery ? 'No matching favorites' : 'No favorites yet'}
                  </Text>
                  <Text className="text-center" style={{ color: theme.colors.textSecondary }}>
                    {searchQuery ? 'Try a different search term' : 'Long press any quote to add it to your favorites'}
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap justify-between">
                  {filteredFavorites.map((quote, index) => (
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
              )}
            </View>
          ) : (
            <View className="py-4">
              {collectionsLoading ? (
                <Text className="text-center text-gray-500 mt-8">Loading collections...</Text>
              ) : filteredCollections.length === 0 ? (
                <View className="items-center justify-center py-12">
                  <Text className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>
                    {searchQuery ? 'No matching collections' : 'No collections yet'}
                  </Text>
                  <Text className="text-center" style={{ color: theme.colors.textSecondary }}>
                    {searchQuery ? 'Try a different search term' : 'Create collections to organize your favorite quotes'}
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {filteredCollections.map((collection) => (
                    <Pressable
                      key={collection.id}
                      onPress={() => router.push(`/collection/${collection.id}`)}
                      className="p-4 rounded-2xl"
                      style={{
                        backgroundColor: theme.colors.surface,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                    >
                      <Text className="text-lg font-bold mb-1" style={{ color: theme.colors.text }}>
                        {collection.name}
                      </Text>
                      {collection.description && (
                        <Text className="text-sm mb-2" numberOfLines={2} style={{ color: theme.colors.textSecondary }}>
                          {collection.description}
                        </Text>
                      )}
                      <Text className="text-xs" style={{ color: theme.colors.textTertiary }}>
                        {collection.quote_count || 0} quotes
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}
