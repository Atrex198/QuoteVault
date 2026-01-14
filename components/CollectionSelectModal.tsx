import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, TextInput, Alert } from 'react-native';
import { X, Plus, FolderOpen, Check } from 'lucide-react-native';
import { useCollections, useAddQuoteToCollection, useCreateCollection } from '@/hooks/useCollections';
import { useQuoteCollections } from '@/hooks/useCollections';

interface CollectionSelectModalProps {
  visible: boolean;
  onClose: () => void;
  quoteId: string;
}

export function CollectionSelectModal({ visible, onClose, quoteId }: CollectionSelectModalProps) {
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');

  const { data: collections = [], isLoading } = useCollections();
  const { data: quoteCollections = [] } = useQuoteCollections(quoteId);
  const addToCollection = useAddQuoteToCollection();
  const createCollection = useCreateCollection();

  const handleAddToCollection = async (collectionId: string) => {
    try {
      await addToCollection.mutateAsync({ collectionId, quoteId });
      Alert.alert('Success', 'Quote added to collection');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to add quote to collection');
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }

    try {
      const result = await createCollection.mutateAsync({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim() || undefined,
      });

      if (result) {
        await addToCollection.mutateAsync({ collectionId: result.id, quoteId });
        Alert.alert('Success', 'Collection created and quote added');
        setNewCollectionName('');
        setNewCollectionDescription('');
        setShowCreateNew(false);
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create collection');
    }
  };

  const isQuoteInCollection = (collectionId: string) => {
    return quoteCollections.some(col => col.id === collectionId);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1"
        onPress={onClose}
      >
        <View className="absolute top-20 right-4 left-4">
        <Pressable 
          className="bg-white rounded-2xl overflow-hidden"
          onPress={(e) => e.stopPropagation()}
          style={{
            maxHeight: 500,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 12,
          }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900">Add to Collection</Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 items-center justify-center rounded-full active:bg-gray-100"
            >
              <X size={18} color="#6B7280" />
            </Pressable>
          </View>

          <ScrollView className="flex-1" style={{ maxHeight: 400 }}>
            {/* Create New Collection Button */}
            {!showCreateNew && (
              <View className="px-4 pt-3">
                <Pressable
                  onPress={() => setShowCreateNew(true)}
                  className="flex-row items-center gap-2 p-3 rounded-xl border-2 border-dashed border-primary bg-primary/5 active:bg-primary/10"
                >
                  <Plus size={18} color="#0df2f2" />
                  <Text className="text-sm font-semibold text-primary">Create New Collection</Text>
                </Pressable>
              </View>
            )}

            {/* Create New Collection Form */}
            {showCreateNew && (
              <View className="px-4 pt-3 pb-3 border-b border-gray-200">
                <View className="gap-2">
                  <TextInput
                    placeholder="Collection name"
                    value={newCollectionName}
                    onChangeText={setNewCollectionName}
                    className="p-3 border border-gray-300 rounded-xl text-sm"
                    autoFocus
                  />
                  <TextInput
                    placeholder="Description (optional)"
                    value={newCollectionDescription}
                    onChangeText={setNewCollectionDescription}
                    className="p-3 border border-gray-300 rounded-xl text-sm"
                    multiline
                    numberOfLines={2}
                  />
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => {
                        setShowCreateNew(false);
                        setNewCollectionName('');
                        setNewCollectionDescription('');
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-300 items-center active:bg-gray-50"
                    >
                      <Text className="font-semibold text-gray-700 text-sm">Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleCreateCollection}
                      disabled={createCollection.isPending}
                      className="flex-1 py-2.5 rounded-xl bg-primary items-center active:bg-primary/90"
                    >
                      <Text className="font-semibold text-white text-sm">
                        {createCollection.isPending ? 'Creating...' : 'Create'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* Collections List */}
            <View className="px-4 pt-3 pb-4">
              {isLoading ? (
                <Text className="text-center text-gray-500 py-6 text-sm">Loading collections...</Text>
              ) : collections.length === 0 ? (
                <View className="py-6 items-center">
                  <FolderOpen size={40} color="#D1D5DB" />
                  <Text className="text-gray-500 text-center mt-3 text-sm">No collections yet</Text>
                  <Text className="text-gray-400 text-xs text-center mt-1">Create one to get started</Text>
                </View>
              ) : (
                <View className="gap-2">
                  {collections.map((collection) => {
                    const isAdded = isQuoteInCollection(collection.id);
                    return (
                      <Pressable
                        key={collection.id}
                        onPress={() => !isAdded && handleAddToCollection(collection.id)}
                        disabled={isAdded || addToCollection.isPending}
                        className={`flex-row items-center justify-between p-3 rounded-xl ${
                          isAdded ? 'bg-gray-100' : 'bg-gray-50 active:bg-gray-100'
                        }`}
                      >
                        <View className="flex-1">
                          <Text className={`text-sm font-semibold ${isAdded ? 'text-gray-500' : 'text-gray-900'}`}>
                            {collection.name}
                          </Text>
                          {collection.description && (
                            <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                              {collection.description}
                            </Text>
                          )}
                          <Text className="text-xs text-gray-400 mt-0.5">
                            {collection.quote_count || 0} quotes
                          </Text>
                        </View>
                        {isAdded && (
                          <View className="w-6 h-6 rounded-full bg-green-500 items-center justify-center">
                            <Check size={14} color="#fff" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
