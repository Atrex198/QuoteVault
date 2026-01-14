import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Copy, Share2, Minus, Plus, Download } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { captureRef } from 'react-native-view-shot';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 32, 340);

type CardStyle = 'minimal' | 'bold' | 'paper' | 'neon' | 'gradient';

const CARD_STYLES = [
  {
    id: 'minimal',
    label: 'Minimal',
    bgType: 'solid',
    colors: ['#1a2332', '#1a2332'],
  },
  {
    id: 'bold',
    label: 'Bold',
    bgType: 'solid',
    colors: ['#e5e5e5', '#e5e5e5'],
  },
  {
    id: 'paper',
    label: 'Paper',
    bgType: 'solid',
    colors: ['#e8e4d9', '#e8e4d9'],
  },
  {
    id: 'neon',
    label: 'Neon',
    bgType: 'solid',
    colors: ['#000000', '#000000'],
  },
  {
    id: 'gradient',
    label: 'Gradient',
    bgType: 'gradient',
    colors: ['#667eea', '#764ba2'],
  },
] as const;

export default function CustomizeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const cardRef = useRef<View>(null);
  const { theme } = useTheme();
  
  // Quote data from params or fallback
  const quote = {
    content: params.content as string || "The only way to do great work is to love what you do",
    author: params.author as string || "Steve Jobs",
  };

  const [selectedStyle, setSelectedStyle] = useState<CardStyle>('minimal');
  const [fontSize, setFontSize] = useState(24);
  const [isSharing, setIsSharing] = useState(false);

  const currentStyle = CARD_STYLES.find(s => s.id === selectedStyle) || CARD_STYLES[0];

  const handleCopyText = async () => {
    try {
      await Clipboard.setStringAsync(`"${quote.content}" — ${quote.author}`);
      Alert.alert('Copied!', 'Quote copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy text');
    }
  };

  const handleShareImage = async () => {
    try {
      setIsSharing(true);
      
      console.log('📸 Starting image capture...');
      
      // Use captureRef for new architecture
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });
      
      console.log('✅ Image captured:', uri);
      
      if (!uri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      console.log('📤 Sharing image...');
      
      // Share the image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Quote Card',
        UTI: 'public.png',
      });
      
      console.log('✅ Share completed');
    } catch (error: any) {
      console.error('Share error:', error);
      Alert.alert('Error', `Failed to share image: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSharing(false);
    }
  };

  const handleSaveToGallery = async () => {
    try {
      setIsSharing(true);
      
      console.log('💾 Requesting permissions...');
      
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      console.log('📋 Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save images to your gallery');
        return;
      }

      console.log('📸 Capturing image...');
      
      // Use captureRef for new architecture
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
      });
      
      console.log('✅ Image captured:', uri);
      
      if (!uri) {
        Alert.alert('Error', 'Failed to capture image');
        return;
      }

      console.log('💾 Saving to gallery...');
      
      // Save to media library
      const asset = await MediaLibrary.saveToLibraryAsync(uri);
      
      console.log('✅ Saved successfully:', asset);
      
      Alert.alert('Saved!', 'Quote card saved to gallery');
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', `Failed to save image: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }} edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.colors.surface }}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </Pressable>
          <Text className="text-lg font-bold" style={{ color: theme.colors.text }}>Customize</Text>
          <View className="w-10" />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Canvas Preview */}
          <View className="px-4 mt-4 mb-8 items-center">
            <View
              ref={cardRef}
              collapsable={false}
              style={{
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
              }}
            >
              <View style={{
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                borderRadius: 16,
                overflow: 'hidden',
              }}>
              {currentStyle.bgType === 'gradient' ? (
                <LinearGradient
                  colors={currentStyle.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="flex-1 items-center justify-center p-8"
                >
                  <Text
                    className="text-white font-bold text-center mb-6"
                    style={{ fontSize, lineHeight: fontSize * 1.4 }}
                  >
                    "{quote.content}"
                  </Text>
                  <Text className="text-white/80 text-sm font-medium tracking-wide uppercase">
                    — {quote.author}
                  </Text>
                  <Text className="absolute bottom-3 text-white/30 text-[10px] tracking-widest uppercase">
                    QUOTEVAULT
                  </Text>
                </LinearGradient>
              ) : (
                <View
                  className="flex-1 items-center justify-center p-8"
                  style={{ backgroundColor: currentStyle.colors[0] }}
                >
                  {selectedStyle === 'minimal' && (
                    <View className="absolute inset-0 opacity-10">
                      {/* Geometric pattern overlay */}
                      <View className="absolute inset-0" style={{ backgroundColor: '#000' }} />
                    </View>
                  )}
                  {selectedStyle === 'bold' && (
                    <Text
                      className="absolute text-black/10 font-black rotate-12 scale-150"
                      style={{ fontSize: 120 }}
                    >
                      Aa
                    </Text>
                  )}
                  <Text
                    className={`${selectedStyle === 'bold' ? 'text-black' : 'text-white'} font-bold text-center mb-6`}
                    style={{ fontSize, lineHeight: fontSize * 1.4 }}
                  >
                    "{quote.content}"
                  </Text>
                  <Text
                    className={`${selectedStyle === 'bold' ? 'text-black/70' : 'text-white/80'} text-sm font-medium tracking-wide uppercase`}
                  >
                    — {quote.author}
                  </Text>
                  <Text
                    className={`absolute bottom-3 ${selectedStyle === 'bold' ? 'text-black/20' : 'text-white/30'} text-[10px] tracking-widest uppercase`}
                  >
                    QUOTEVAULT
                  </Text>
                </View>
              )}
              </View>
            </View>
          </View>
          
          {/* Style Selector */}
          <View className="mb-6 px-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm font-semibold uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                Style
              </Text>
              <Pressable>
                <Text className="text-xs font-bold" style={{ color: theme.colors.primary }}>See All</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              className="flex-row gap-3"
            >
              {CARD_STYLES.map((style) => {
                const isSelected = selectedStyle === style.id;
                return (
                  <Pressable
                    key={style.id}
                    onPress={() => setSelectedStyle(style.id as CardStyle)}
                    className={`w-28 h-36 rounded-xl overflow-hidden`}
                    style={{
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      shadowColor: isSelected ? theme.colors.primary : '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isSelected ? 0.3 : 0.1,
                      shadowRadius: 4,
                      elevation: isSelected ? 4 : 2,
                    }}
                  >
                    {style.bgType === 'gradient' ? (
                      <LinearGradient
                        colors={style.colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="flex-1"
                      />
                    ) : (
                      <View
                        className="flex-1 items-center justify-center"
                        style={{ backgroundColor: style.colors[0] }}
                      >
                        {style.id === 'minimal' && (
                          <View className="items-center gap-2">
                            <View className="w-8 h-1 bg-white/20 rounded-full" />
                            <View className="w-12 h-1 bg-white/20 rounded-full" />
                            <View className="w-6 h-1 bg-white/20 rounded-full" />
                          </View>
                        )}
                        {style.id === 'bold' && (
                          <Text className="text-black/20 font-black text-3xl rotate-12 scale-150">
                            Aa
                          </Text>
                        )}
                        {style.id === 'neon' && (
                          <View
                            className="w-16 h-16 rounded-full border-2 border-fuchsia-500"
                            style={{ opacity: 0.6 }}
                          />
                        )}
                      </View>
                    )}
                    <View className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                      <Text className="text-white font-bold text-sm">{style.label}</Text>
                    </View>
                    {isSelected && (
                      <View className="absolute top-2 right-2 rounded-full w-5 h-5 items-center justify-center" style={{ backgroundColor: theme.colors.primary }}>
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Font Size Control */}
          <View className="mx-4 rounded-xl p-4" style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xs font-medium uppercase tracking-wider" style={{ color: theme.colors.textSecondary }}>
                Size
              </Text>
              <Text className="text-xs font-bold" style={{ color: theme.colors.text }}>{fontSize}px</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setFontSize(Math.max(16, fontSize - 2))}
                className="w-10 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: theme.colors.background }}
              >
                <Minus size={20} color={theme.colors.text} />
              </Pressable>
              <View className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme.colors.background }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${((fontSize - 16) / (36 - 16)) * 100}%`, backgroundColor: theme.colors.primary }}
                />
              </View>
              <Pressable
                onPress={() => setFontSize(Math.min(36, fontSize + 2))}
                className="w-10 h-10 rounded-lg items-center justify-center"
                style={{ backgroundColor: theme.colors.background }}
              >
                <Plus size={20} color={theme.colors.text} />
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Bottom Action Bar */}
        <View
          className="absolute bottom-0 left-0 right-0 p-4 pb-8"
          style={{
            backgroundColor: `${theme.colors.background}f0`,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleCopyText}
              disabled={isSharing}
              className="flex-1 h-14 flex-row items-center justify-center gap-2 rounded-xl"
              style={{ borderWidth: 2, borderColor: theme.colors.border, backgroundColor: 'transparent' }}
            >
              <Copy size={18} color={theme.colors.text} />
              <Text className="font-bold text-sm" style={{ color: theme.colors.text }}>Copy</Text>
            </Pressable>
            <Pressable
              onPress={handleSaveToGallery}
              disabled={isSharing}
              className="flex-1 h-14 flex-row items-center justify-center gap-2 rounded-xl"
              style={{ borderWidth: 2, borderColor: theme.colors.primary, backgroundColor: 'transparent' }}
            >
              <Download size={18} color={theme.colors.primary} />
              <Text className="font-bold text-sm" style={{ color: theme.colors.primary }}>Save</Text>
            </Pressable>
            <Pressable
              onPress={handleShareImage}
              disabled={isSharing}
              className="flex-[1.5] h-14 flex-row items-center justify-center gap-2 rounded-xl"
              style={{
                backgroundColor: theme.colors.primary,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text className="text-white font-bold text-sm">
                {isSharing ? 'Processing...' : 'Share'}
              </Text>
              {!isSharing && <Share2 size={18} color="#fff" />}
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
