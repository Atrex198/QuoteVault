import React, { useState, useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Heart, Share2, MoreVertical, Bookmark } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import type { Quote } from '@/types';
import { STRINGS, FONT_SIZES } from '@/lib/constants';
import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavorites';
import { useQuoteCollections } from '@/hooks/useCollections';
import { ShareMenu } from '@/components/ShareMenu';
import { CollectionSelectSheet } from '@/components/CollectionSelectSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface QuoteOfTheDayCardProps {
  quote: Quote;
  onFavoritePress?: (id: string) => void;
  onSharePress?: (id: string) => void;
  onMenuPress?: () => void;
}

export function QuoteOfTheDayCard({
  quote,
  onFavoritePress,
  onSharePress,
  onMenuPress,
}: QuoteOfTheDayCardProps) {
  const router = useRouter();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const cardRef = useRef<View>(null);
  const [fontSizeKey, setFontSizeKey] = useState<'small' | 'medium' | 'large'>('small');
  const { theme } = useTheme();
  
  useEffect(() => {
    AsyncStorage.getItem('@quotevault_font_size').then(size => {
      if (size) setFontSizeKey(size as 'small' | 'medium' | 'large');
    }).catch(() => {});
  }, []);
  
  const fontSize = FONT_SIZES[fontSizeKey];

  // Favorites functionality
  const { data: favoriteData } = useIsFavorite(quote.id);
  const { toggleFavorite, isLoading: isTogglingFavorite } = useToggleFavorite();

  // Collections functionality
  const { data: quoteCollections = [] } = useQuoteCollections(quote.id);
  const isInAnyCollection = quoteCollections.length > 0;

  const handleFavoritePress = async () => {
    // Prevent multiple rapid clicks
    if (isTogglingFavorite) return;
    
    if (onFavoritePress) {
      onFavoritePress(quote.id);
    } else {
      await toggleFavorite(quote.id, favoriteData?.isFavorite || false);
    }
  };

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      setShowShareMenu(true);
    }
  };

  const handleBookmarkPress = () => {
    setShowCollectionMenu(true);
  };

  const handleCopyText = async () => {
    await Clipboard.setStringAsync(`"${quote.content}" — ${quote.author}`);
  };

  const handleShareCard = () => {
    router.push({
      pathname: '/customize',
      params: {
        content: quote.content,
        author: quote.author,
      },
    });
  };

  const isFavorited = favoriteData?.isFavorite || false;

  return (
    <>
    <View ref={cardRef} collapsable={false}>
    <View className="rounded-3xl p-5" style={{ backgroundColor: theme.colors.surface }}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-xs font-semibold tracking-wider" style={{ color: theme.colors.textSecondary }}>
          {STRINGS.labels.quoteOfTheDay}
        </Text>
        <Pressable onPress={handleMenuPress}>
          <MoreVertical size={20} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {/* Quote Content */}
      <Text
        className="font-normal mb-6 leading-9"
        style={{ fontSize: fontSize.title, color: theme.colors.text }}
      >
        "{quote.content}"
      </Text>

      {/* Author Info */}
      <View className="mb-4">
        <Text
          className="font-semibold"
          style={{ fontSize: fontSize.author, color: theme.colors.text }}
        >
          {quote.author}
        </Text>
        {quote.category && (
          <Text className="text-sm font-medium mt-1" style={{ color: theme.colors.primary }}>
            {quote.category}
          </Text>
        )}
      </View>

      {/* Actions */}
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={handleFavoritePress}
          disabled={isTogglingFavorite}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: theme.colors.background,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Heart size={20} color={isFavorited ? '#ef4444' : theme.colors.text} fill={isFavorited ? '#ef4444' : 'none'} />
        </Pressable>
        <Pressable
          onPress={handleBookmarkPress}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: theme.colors.background,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Bookmark size={20} color={isInAnyCollection ? theme.colors.primary : theme.colors.text} fill={isInAnyCollection ? theme.colors.primary : 'none'} />
        </Pressable>
        <Pressable
          onPress={() => setShowShareMenu(true)}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: theme.colors.background,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
        >
          <Share2 size={20} color={theme.colors.text} />
        </Pressable>
      </View>
    </View>
    </View>
    <ShareMenu
      visible={showShareMenu}
      onClose={() => setShowShareMenu(false)}
      onCopyText={handleCopyText}
      onShareCard={handleShareCard}
      quoteId={quote.id}
    />
    <CollectionSelectSheet
      visible={showCollectionMenu}
      onClose={() => setShowCollectionMenu(false)}
      quoteId={quote.id}
    />
    </>
  );
}
