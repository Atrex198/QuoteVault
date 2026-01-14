import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { Heart, Bookmark, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import type { Quote } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavorites';
import { useQuoteCollections } from '@/hooks/useCollections';
import { ShareMenu } from '@/components/ShareMenu';
import { CollectionSelectSheet } from '@/components/CollectionSelectSheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FONT_SIZES } from '@/lib/constants';
import { useEffect } from 'react';

interface QuoteCardProps {
  quote: Quote;
  variant?: 'light' | 'dark' | 'image';
  onFavoritePress?: (id: string) => void;
}

export function QuoteCard({
  quote,
  variant = 'light',
  onFavoritePress,
}: QuoteCardProps) {
  const isDark = variant === 'dark';
  const isImage = variant === 'image';
  const router = useRouter();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [showFullQuote, setShowFullQuote] = useState(false);
  const [fontSizeKey, setFontSizeKey] = useState<'small' | 'medium' | 'large'>('small');
  
  useEffect(() => {
    AsyncStorage.getItem('@quotevault_font_size').then(size => {
      if (size) setFontSizeKey(size as 'small' | 'medium' | 'large');
    }).catch(() => {});
  }, []);
  
  const fontSize = FONT_SIZES[fontSizeKey];
  const cardRef = useRef<View>(null);

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

  const handleLongPress = () => {
    setShowShareMenu(true);
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

  if (isImage) {
    return (
      <>        
        <View ref={cardRef} collapsable={false}>
        <Pressable
        className="rounded-3xl overflow-hidden h-52"
        onLongPress={handleLongPress}
        onPress={() => setShowFullQuote(true)}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="flex-1 p-4 justify-between"
        >
          <View>
            <Text
              className="text-white font-medium leading-6"
              numberOfLines={4}
              style={{ fontSize: fontSize.quote }}
            >
              {quote.content}
            </Text>
          </View>
          <View className="pr-20">
            <Text
              className="text-white/90 font-medium"
              numberOfLines={2}
              style={{ fontSize: fontSize.author }}
            >
              — {quote.author}
            </Text>
          </View>
          
          {/* Absolute positioned icons */}
          <View className="absolute bottom-4 right-4 flex-row gap-2">
            <Pressable
              onPress={handleFavoritePress}
              disabled={isTogglingFavorite}
              className="w-9 h-9 items-center justify-center bg-white/20 rounded-full"
            >
              <Heart size={20} color={isFavorited ? '#ef4444' : '#fff'} fill={isFavorited ? '#ef4444' : 'none'} strokeWidth={2.5} />
            </Pressable>
            <Pressable
              onPress={handleBookmarkPress}
              className="w-9 h-9 items-center justify-center bg-white/20 rounded-full"
            >
              <Bookmark size={20} color={isInAnyCollection ? '#0df2f2' : '#fff'} fill={isInAnyCollection ? '#0df2f2' : 'none'} strokeWidth={2.5} />
            </Pressable>
          </View>
        </LinearGradient>
      </Pressable>
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

  return (
    <>
    <View ref={cardRef} collapsable={false}>
      <Pressable
      className={`rounded-3xl p-4 h-52 justify-between ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}
      onLongPress={handleLongPress}
      onPress={() => setShowFullQuote(true)}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.2 : 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View>
        <Text
          className={`font-medium leading-6 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
          numberOfLines={5}
          style={{ fontSize: fontSize.quote }}
        >
          {quote.content}
        </Text>
      </View>
      
      <View className="pr-20">
        <Text
          className={`font-medium ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}
          numberOfLines={2}
          style={{ fontSize: fontSize.author }}
        >
          — {quote.author}
        </Text>
      </View>
      
      {/* Absolute positioned icons */}
      <View className="absolute bottom-4 right-4 flex-row gap-2">
        <Pressable
          disabled={isTogglingFavorite}
          onPress={handleFavoritePress}
          className={`w-9 h-9 items-center justify-center rounded-full ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}
        >
          <Heart
            size={18}
            color={isFavorited ? '#ef4444' : (isDark ? '#fff' : '#000')}
            fill={isFavorited ? '#ef4444' : 'none'}
            strokeWidth={2.5}
          />
        </Pressable>
        <Pressable
          onPress={handleBookmarkPress}
          className={`w-9 h-9 items-center justify-center rounded-full ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}
        >
          <Bookmark
            size={18}
            color={isInAnyCollection ? '#0df2f2' : (isDark ? '#fff' : '#000')}
            fill={isInAnyCollection ? '#0df2f2' : 'none'}
            strokeWidth={2.5}
          />
        </Pressable>
      </View>
    </Pressable>
    </View>
    
    {/* Full Quote Modal */}
    <Modal
      visible={showFullQuote}
      transparent
      animationType="fade"
      onRequestClose={() => setShowFullQuote(false)}
    >
      <Pressable 
        className="flex-1 bg-black/50 items-center justify-center p-6"
        onPress={() => setShowFullQuote(false)}
      >
        <View
          className={`rounded-3xl p-6 w-full max-w-md ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
          style={{
            height: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <Pressable
            onPress={() => setShowFullQuote(false)}
            className="absolute top-4 right-4 w-8 h-8 items-center justify-center bg-gray-100 rounded-full z-10"
          >
            <X size={18} color="#000" />
          </Pressable>
          
          <ScrollView showsVerticalScrollIndicator={true} className="flex-1 pr-8">
            <Text
              className={`text-lg font-medium leading-7 mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
            >
              {quote.content}
            </Text>
            <Text
              className={`text-base font-semibold ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              — {quote.author}
            </Text>
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
    
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
