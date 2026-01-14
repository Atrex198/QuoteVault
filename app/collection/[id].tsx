import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MoreVertical, Trash2 } from 'lucide-react-native';
import { QuoteCard } from '@/components/QuoteCard';
import { useCollection, useCollectionQuotes, useDeleteCollection } from '@/hooks/useCollections';
import { useTheme } from '@/contexts/ThemeContext';
import Modal from 'react-native-modal';

export default function CollectionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { theme } = useTheme();

  const { data: collection, isLoading: collectionLoading } = useCollection(id);
  const { data: quotes = [], isLoading: quotesLoading, refetch } = useCollectionQuotes(id);
  const deleteCollection = useDeleteCollection();

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collection?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCollection.mutateAsync(id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete collection');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }} edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-4 py-3" style={{ backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full"
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </Pressable>
            <Pressable
              onPress={() => setShowMenu(true)}
              className="w-10 h-10 items-center justify-center rounded-full"
            >
              <MoreVertical size={24} color={theme.colors.text} />
            </Pressable>
          </View>

          <View className="mt-3">
            <Text className="text-2xl font-bold" style={{ color: theme.colors.text }}>
              {collection?.name || 'Collection'}
            </Text>
            {collection?.description && (
              <Text className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                {collection.description}
              </Text>
            )}
            <Text className="text-xs mt-2" style={{ color: theme.colors.textSecondary }}>
              {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'}
            </Text>
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
          {collectionLoading || quotesLoading ? (
            <View className="py-12">
              <Text className="text-center" style={{ color: theme.colors.textSecondary }}>Loading quotes...</Text>
            </View>
          ) : quotes.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-xl font-bold text-gray-900 mb-2">No quotes yet</Text>
              <Text className="text-gray-500 text-center px-8">
                Add quotes to this collection by tapping the bookmark icon on any quote
              </Text>
            </View>
          ) : (
            <View className="py-4">
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
            </View>
          )}
        </ScrollView>
      </View>

      {/* Options Menu */}
      <Modal
        isVisible={showMenu}
        onBackdropPress={() => setShowMenu(false)}
        onBackButtonPress={() => setShowMenu(false)}
        style={{ justifyContent: 'flex-end', margin: 0 }}
      >
        <View className="rounded-t-3xl p-6" style={{ backgroundColor: theme.colors.surface }}>
          <Text className="text-xl font-bold mb-4" style={{ color: theme.colors.text }}>Collection Options</Text>
          
          <Pressable
            onPress={() => {
              setShowMenu(false);
              handleDelete();
            }}
            className="flex-row items-center py-4"
          >
            <Trash2 size={22} color="#ef4444" />
            <Text className="text-base font-medium ml-3" style={{ color: '#ef4444' }}>Delete Collection</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
