import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, getTheme, DEFAULT_THEME, THEMES } from '@/lib/themes';

interface ThemeContextType {
  theme: Theme;
  themeId: string;
  setTheme: (themeId: string) => Promise<void>;
  toggleTheme: () => Promise<void>;
  availableThemes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@quotevault_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>(DEFAULT_THEME.id);
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Update theme object when themeId changes
  useEffect(() => {
    const newTheme = getTheme(themeId);
    setThemeState(newTheme);
  }, [themeId]);

  const loadSavedTheme = async () => {
    try {
      const savedThemeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedThemeId) {
        setThemeId(savedThemeId);
      }
    } catch (error) {
      // Error loading theme
    }
  };

  const setTheme = async (newThemeId: string) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeId);
      setThemeId(newThemeId);
    } catch (error) {
      // Error saving theme
    }
  };

  const toggleTheme = async () => {
    // Toggle between light and dark
    const newThemeId = themeId === 'light' ? 'dark' : 'light';
    await setTheme(newThemeId);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeId,
        setTheme,
        toggleTheme,
        availableThemes: THEMES,
      }}
    >
      <StatusBar
        barStyle={theme.statusBar}
        backgroundColor={theme.colors.background}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
