import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { THEMES } from '@/lib/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FONT_SIZE_KEY = '@quotevault_font_size';

const FONT_SIZES = {
  small: { label: 'Small', size: 14, preview: 16 },
  medium: { label: 'Medium', size: 16, preview: 18 },
  large: { label: 'Large', size: 20, preview: 22 },
};

export default function AppearanceScreen() {
  const router = useRouter();
  const { theme, themeId, setTheme, availableThemes } = useTheme();
  const [currentFontSize, setCurrentFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  useEffect(() => {
    loadFontSize();
  }, []);

  const loadFontSize = async () => {
    try {
      const saved = await AsyncStorage.getItem(FONT_SIZE_KEY);
      if (saved) {
        setCurrentFontSize(saved as 'small' | 'medium' | 'large');
      }
    } catch (error) {
      // Error loading font size
    }
  };

  const handleThemeChange = async (newThemeId: string) => {
    await setTheme(newThemeId);
  };

  const handleFontSizeChange = async (size: string) => {
    try {
      await AsyncStorage.setItem(FONT_SIZE_KEY, size);
      setCurrentFontSize(size as 'small' | 'medium' | 'large');
    } catch (error) {
      // Error saving font size
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: theme.colors.background }}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-4" style={{ backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full active:bg-gray-100"
          >
            <ChevronLeft size={24} color={theme.colors.text} />
          </Pressable>
          <Text className="text-xl font-bold ml-2" style={{ color: theme.colors.text }}>Appearance</Text>
        </View>

        <ScrollView className="flex-1">
          {/* Theme Selection */}
          <View className="mt-6 px-6 py-4" style={{ backgroundColor: theme.colors.surface }}>
            <Text className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>Theme</Text>
            <Text className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
              Choose your preferred color theme
            </Text>

            <View className="gap-3">
              {THEMES.map((t) => {
                const isSelected = t.id === themeId;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => handleThemeChange(t.id)}
                    className="flex-row items-center justify-between p-4 rounded-xl border-2"
                    style={{
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.background
                    }}
                  >
                    <View className="flex-row items-center gap-3">
                      {/* Theme Color Preview */}
                      <View className="gap-1">
                        <View
                          className="w-12 h-12 rounded-lg"
                          style={{ backgroundColor: t.colors.primary }}
                        />
                        <View className="flex-row gap-1">
                          <View
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: t.colors.background }}
                          />
                          <View
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: t.colors.surface }}
                          />
                          <View
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: t.colors.text }}
                          />
                        </View>
                      </View>

                      <View>
                        <Text className="text-base font-semibold" style={{ color: theme.colors.text }}>
                          {t.displayName}
                        </Text>
                        <Text className="text-sm capitalize" style={{ color: theme.colors.textSecondary }}>
                          {t.isDark ? 'Dark Theme' : 'Light Theme'}
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: theme.colors.primary }}>
                        <Check size={16} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Font Size Selection */}
          <View className="mt-6 px-6 py-4" style={{ backgroundColor: theme.colors.surface }}>
            <Text className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>Font Size</Text>
            <Text className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
              Adjust the size of quote text throughout the app
            </Text>

            <View className="gap-3">
              {Object.entries(FONT_SIZES).map(([key, config]) => {
                const isSelected = key === currentFontSize;
                return (
                  <Pressable
                    key={key}
                    onPress={() => handleFontSizeChange(key)}
                    className="p-4 rounded-xl border-2"
                    style={{
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.background
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-base font-semibold" style={{ color: theme.colors.text }}>
                        {config.label}
                      </Text>
                      {isSelected && (
                        <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: theme.colors.primary }}>
                          <Check size={16} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text
                      style={{ fontSize: config.preview, color: theme.colors.textSecondary }}
                    >
                      "The only way to do great work is to love what you do."
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Quick Toggle */}
          <View className="mt-6 px-6 py-4" style={{ backgroundColor: theme.colors.surface }}>
            <Text className="text-lg font-semibold mb-4" style={{ color: theme.colors.text }}>Quick Actions</Text>
            
            <View className="flex-row items-center justify-between py-3">
              <View>
                <Text className="text-base font-medium" style={{ color: theme.colors.text }}>Dark Mode</Text>
                <Text className="text-sm mt-1" style={{ color: theme.colors.textSecondary }}>
                  {theme.isDark ? 'Currently using dark theme' : 'Switch to dark theme'}
                </Text>
              </View>
              <Switch
                value={theme.isDark}
                onValueChange={(value) => {
                  const newTheme = value ? 'dark' : 'light';
                  handleThemeChange(newTheme);
                }}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <View className="h-20" />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
