import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert, Keyboard, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import { X, Plus, Check } from 'lucide-react-native';
import { useCollections, useAddQuoteToCollection, useCreateCollection, useQuoteCollections } from '@/hooks/useCollections';
import { useTheme } from '@/contexts/ThemeContext';

interface CollectionSelectSheetProps {
  visible: boolean;
  onClose: () => void;
  quoteId: string;
}

export function CollectionSelectSheet({ visible, onClose, quoteId }: CollectionSelectSheetProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const { theme } = useTheme();
  
  const { data: collections = [], isLoading } = useCollections();
  const { data: quoteCollections = [] } = useQuoteCollections(quoteId);
  const addToCollection = useAddQuoteToCollection();
  const createCollection = useCreateCollection();

  const handleAddToCollection = async (collectionId: string) => {
    try {
      onClose();
      await addToCollection.mutateAsync({ collectionId, quoteId });
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
      setNewCollectionName('');
      setShowCreateForm(false);
      onClose();
      
      const result = await createCollection.mutateAsync({
        name: newCollectionName.trim(),
        description: undefined,
      });

      if (result) {
        await addToCollection.mutateAsync({ collectionId: result.id, quoteId });
      }
    } catch (error: any) {
      console.error('Failed to create collection:', error);
      Alert.alert('Error', error?.message || 'Failed to create collection');
    }
  };

  const isQuoteInCollection = (collectionId: string) => {
    return quoteCollections.some(col => col.id === collectionId);
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setNewCollectionName('');
    onClose();
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
      onSwipeComplete={handleClose}
      swipeDirection={['down']}
      style={{ justifyContent: 'flex-end', margin: 0 }}
      backdropOpacity={0}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={250}
      animationOutTiming={200}
      useNativeDriver
      useNativeDriverForBackdrop
      hideModalContentWhileAnimating
    >
      <View
        className="bg-white rounded-t-3xl"
        style={{ maxHeight: '80%', minHeight: 250 }}
      >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
            <Text className="text-lg font-semibold text-gray-900">Add to Collection</Text>
            <Pressable onPress={handleClose} className="p-1">
              <X size={24} color="#000" />
            </Pressable>
          </View>

          {showCreateForm ? (
            <View className="flex-1 px-5 py-4">
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
                placeholder="Collection name"
                placeholderTextColor="#9ca3af"
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                onSubmitEditing={handleCreateCollection}
                returnKeyType="done"
                blurOnSubmit={false}
                autoFocus
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowCreateForm(false);
                    setNewCollectionName('');
                  }}
                  className="flex-1 bg-gray-200 rounded-xl py-3 items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-900 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateCollection}
                  className="flex-1 rounded-xl py-3 items-center"
                  style={{ backgroundColor: theme.colors.primary }}
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold">Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView className="flex-1">
              {/* Create New Collection Button */}
              <Pressable
                onPress={() => setShowCreateForm(true)}
                className="flex-row items-center px-5 py-4 border-b border-gray-100"
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primary }}>
                  <Plus size={20} color="#fff" />
                </View>
                <Text className="text-base font-medium text-gray-900">Create New Collection</Text>
              </Pressable>

              {/* Collections List */}
              {collections.map((collection) => {
                const isAdded = isQuoteInCollection(collection.id);
                return (
                  <Pressable
                    key={collection.id}
                    onPress={() => !isAdded && handleAddToCollection(collection.id)}
                    className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100"
                    disabled={isAdded}
                  >
                    <View className="flex-1">
                      <Text className={`text-base font-medium ${isAdded ? 'text-gray-400' : 'text-gray-900'}`}>
                        {collection.name}
                      </Text>
                      {collection.description && (
                        <Text className="text-sm text-gray-500 mt-0.5">
                          {collection.description}
                        </Text>
                      )}
                    </View>
                    {isAdded && (
                      <View className="w-6 h-6 rounded-full bg-green-500 items-center justify-center">
                        <Check size={16} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}

              {collections.length === 0 && !isLoading && (
                <View className="px-5 py-8 items-center">
                  <Text className="text-gray-500 text-center">
                    No collections yet. Create your first one!
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
      </View>
    </Modal>
  );
}
