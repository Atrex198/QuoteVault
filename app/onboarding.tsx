import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, User, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';

const AVATAR_COLORS = [
  { id: '1', color: '#FF6B6B', name: 'Coral' },
  { id: '2', color: '#4ECDC4', name: 'Teal' },
  { id: '3', color: '#45B7D1', name: 'Sky' },
  { id: '4', color: '#FFA07A', name: 'Peach' },
  { id: '5', color: '#98D8C8', name: 'Mint' },
  { id: '6', color: '#F7DC6F', name: 'Gold' },
  { id: '7', color: '#BB8FCE', name: 'Lavender' },
  { id: '8', color: '#85C1E2', name: 'Blue' },
  { id: '9', color: '#F8B739', name: 'Orange' },
  { id: '10', color: '#EC7063', name: 'Rose' },
  { id: '11', color: '#52BE80', name: 'Green' },
  { id: '12', color: '#AF7AC5', name: 'Purple' },
];

const AVATAR_STYLES = ['avataaars', 'bottts', 'identicon', 'initials', 'personas', 'pixel-art'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [selectedStyle, setSelectedStyle] = useState('avataaars');
  const [step, setStep] = useState(1); // 1: welcome, 2: name, 3: avatar
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    checkIfEditing();
  }, []);

  const checkIfEditing = async () => {
    try {
      const completed = await AsyncStorage.getItem('@quotevault_onboarding_complete');
      if (completed === 'true') {
        // User is editing their profile
        setIsEditing(true);
        setStep(2); // Skip welcome screen
        
        // Load existing data
        const existingName = await AsyncStorage.getItem('@quotevault_user_name');
        if (existingName) setName(existingName);
      }
    } catch (error) {
      // Error checking edit mode
    }
  };

  const getInitials = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const getAvatarUrl = () => {
    const seed = name.trim() || 'User';
    return `https://api.dicebear.com/7.x/${selectedStyle}/png?seed=${seed}&backgroundColor=${selectedColor.color.replace('#', '')}`;
  };

  const handleContinue = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!name.trim()) {
        Alert.alert('Name Required', 'Please enter your name to continue');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      try {
        // Save user data
        await AsyncStorage.setItem('@quotevault_user_name', name.trim());
        await AsyncStorage.setItem('@quotevault_user_avatar', getAvatarUrl());
        await AsyncStorage.setItem('@quotevault_onboarding_complete', 'true');
        
        // Navigate appropriately
        if (isEditing) {
          Alert.alert('Success', 'Profile updated successfully!');
          router.back();
        } else {
          router.replace('/');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to save your information. Please try again.');
      }
    }
  };

  const renderWelcome = () => (
    <View className="flex-1 items-center justify-center px-6">
      <LinearGradient
        colors={[theme.colors.primary + '20', theme.colors.primary + '05']}
        className="w-24 h-24 rounded-full items-center justify-center mb-8"
      >
        <Sparkles size={48} color={theme.colors.primary} />
      </LinearGradient>

      <Text className="text-4xl font-bold text-center mb-4" style={{ color: theme.colors.text }}>
        Welcome to QuoteVault
      </Text>
      
      <Text className="text-lg text-center mb-8 leading-7" style={{ color: theme.colors.textSecondary }}>
        Your personal collection of inspiration, wisdom, and motivation. Let's get you set up!
      </Text>

      <View className="w-full space-y-4 mb-8">
        <View className="flex-row items-start">
          <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primaryLight }}>
            <Text className="font-bold" style={{ color: theme.colors.primary }}>1</Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold mb-1" style={{ color: theme.colors.text }}>Discover Quotes</Text>
            <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>
              Browse thousands of inspiring quotes across categories
            </Text>
          </View>
        </View>

        <View className="flex-row items-start">
          <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primaryLight }}>
            <Text className="font-bold" style={{ color: theme.colors.primary }}>2</Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold mb-1" style={{ color: theme.colors.text }}>Save & Organize</Text>
            <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>
              Create collections and save your favorites
            </Text>
          </View>
        </View>

        <View className="flex-row items-start">
          <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: theme.colors.primaryLight }}>
            <Text className="font-bold" style={{ color: theme.colors.primary }}>3</Text>
          </View>
          <View className="flex-1">
            <Text className="font-semibold mb-1" style={{ color: theme.colors.text }}>Daily Inspiration</Text>
            <Text className="text-sm" style={{ color: theme.colors.textSecondary }}>
              Get a new quote every day with notifications
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderNameInput = () => (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-20 h-20 rounded-full items-center justify-center mb-6" style={{ backgroundColor: theme.colors.primaryLight }}>
        <User size={40} color={theme.colors.primary} />
      </View>

      <Text className="text-3xl font-bold text-center mb-2" style={{ color: theme.colors.text }}>
        What's your name?
      </Text>
      
      <Text className="text-base text-center mb-8" style={{ color: theme.colors.textSecondary }}>
        We'll use this to personalize your experience
      </Text>

      <View className="w-full">
        <TextInput
          className="w-full px-6 py-4 rounded-2xl text-lg font-medium"
          style={{ 
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            borderWidth: 2,
            borderColor: theme.colors.border
          }}
          placeholder="Enter your name"
          placeholderTextColor={theme.colors.textTertiary}
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={handleContinue}
        />
      </View>
    </View>
  );

  const renderAvatarPicker = () => (
    <View className="flex-1 px-6 pt-8">
      <Text className="text-3xl font-bold text-center mb-2" style={{ color: theme.colors.text }}>
        Choose Your Avatar
      </Text>
      
      <Text className="text-base text-center mb-6" style={{ color: theme.colors.textSecondary }}>
        Pick a style and color that represents you
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Avatar Preview */}
        <View className="items-center mb-8">
          <View 
            className="w-32 h-32 rounded-full items-center justify-center overflow-hidden"
            style={{ 
              backgroundColor: theme.colors.surface,
              borderWidth: 4,
              borderColor: theme.colors.primary
            }}
          >
            {name.trim() ? (
              <Image 
                source={{ uri: getAvatarUrl() }}
                className="w-full h-full"
              />
            ) : (
              <Text className="text-4xl font-bold" style={{ color: theme.colors.text }}>
                {getInitials('User')}
              </Text>
            )}
          </View>
          <Text className="text-xl font-bold mt-4" style={{ color: theme.colors.text }}>
            {name.trim() || 'Your Name'}
          </Text>
        </View>

        {/* Avatar Style Selector */}
        <Text className="text-lg font-semibold mb-3" style={{ color: theme.colors.text }}>
          Avatar Style
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          <View className="flex-row gap-3">
            {AVATAR_STYLES.map((style) => (
              <Pressable
                key={style}
                onPress={() => setSelectedStyle(style)}
                className="items-center"
              >
                <View 
                  className="w-20 h-20 rounded-2xl overflow-hidden items-center justify-center"
                  style={{
                    borderWidth: 3,
                    borderColor: selectedStyle === style ? theme.colors.primary : theme.colors.border,
                    backgroundColor: theme.colors.surface
                  }}
                >
                  <Image 
                    source={{ 
                      uri: `https://api.dicebear.com/7.x/${style}/png?seed=${name.trim() || 'User'}&backgroundColor=${selectedColor.color.replace('#', '')}`
                    }}
                    className="w-full h-full"
                  />
                </View>
                <Text 
                  className="text-xs mt-2 font-medium capitalize"
                  style={{ color: selectedStyle === style ? theme.colors.primary : theme.colors.textSecondary }}
                >
                  {style.replace('-', ' ')}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Color Selector */}
        <Text className="text-lg font-semibold mb-3" style={{ color: theme.colors.text }}>
          Background Color
        </Text>
        <View className="flex-row flex-wrap gap-3 mb-8">
          {AVATAR_COLORS.map((color) => (
            <Pressable
              key={color.id}
              onPress={() => setSelectedColor(color)}
              className="items-center"
            >
              <View 
                className="w-14 h-14 rounded-full"
                style={{
                  backgroundColor: color.color,
                  borderWidth: 3,
                  borderColor: selectedColor.id === color.id ? theme.colors.text : 'transparent'
                }}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <View className="flex-1">
        {step === 1 && renderWelcome()}
        {step === 2 && renderNameInput()}
        {step === 3 && renderAvatarPicker()}

        {/* Bottom Button */}
        <View className="px-6 pb-6">
          {step > (isEditing ? 2 : 1) && (
            <Pressable
              onPress={() => setStep(step - 1)}
              className="mb-3"
            >
              <Text className="text-center font-semibold" style={{ color: theme.colors.textSecondary }}>
                Back
              </Text>
            </Pressable>
          )}
          
          <Pressable
            onPress={handleContinue}
            className="rounded-2xl py-4 flex-row items-center justify-center"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Text className="text-white text-lg font-bold mr-2">
              {step === 1 ? 'Get Started' : step === 2 ? 'Continue' : isEditing ? 'Save Changes' : 'Complete Setup'}
            </Text>
            <ChevronRight size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Progress Indicator */}
        {!isEditing && (
          <View className="absolute top-4 left-0 right-0 flex-row justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                className="h-1 rounded-full"
                style={{
                  width: 32,
                  backgroundColor: s <= step ? theme.colors.primary : theme.colors.border
                }}
              />
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
