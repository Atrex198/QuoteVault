import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { Edit2, Trash2, Share2 } from 'lucide-react-native';

interface CollectionOptionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
}

export function CollectionOptionsMenu({ visible, onClose, onEdit, onDelete, onShare }: CollectionOptionsMenuProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable 
        className="flex-1"
        onPress={onClose}
      >
        {/* Menu Popup */}
        <View className="absolute top-20 right-4">
          <Pressable 
            className="bg-white rounded-2xl overflow-hidden min-w-[180px]"
            onPress={(e) => e.stopPropagation()}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            {/* Edit */}
            <Pressable
              onPress={() => {
                onEdit();
                onClose();
              }}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-gray-50"
            >
              <Edit2 size={18} color="#374151" />
              <Text className="text-base text-gray-900 font-medium">Edit</Text>
            </Pressable>

            {/* Divider */}
            <View className="h-[1px] bg-gray-200 mx-4" />

            {/* Share */}
            <Pressable
              onPress={() => {
                onShare();
                onClose();
              }}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-gray-50"
            >
              <Share2 size={18} color="#374151" />
              <Text className="text-base text-gray-900 font-medium">Share</Text>
            </Pressable>

            {/* Divider */}
            <View className="h-[1px] bg-gray-200 mx-4" />

            {/* Delete */}
            <Pressable
              onPress={() => {
                onDelete();
                onClose();
              }}
              className="flex-row items-center gap-3 px-4 py-3.5 active:bg-gray-50"
            >
              <Trash2 size={18} color="#ef4444" />
              <Text className="text-base text-red-500 font-medium">Delete</Text>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
