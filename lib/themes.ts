// Theme System for QuoteVault
// Supports: Light, Dark, and 2 additional custom themes

export interface Theme {
  id: string;
  name: string;
  displayName: string;
  colors: {
    // Background colors
    background: string;
    surface: string;
    surfaceVariant: string;
    
    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    
    // Secondary colors  
    secondary: string;
    secondaryLight: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;
    
    // UI element colors
    border: string;
    borderLight: string;
    divider: string;
    
    // Card colors
    card: string;
    cardElevated: string;
    
    // Status colors
    success: string;
    error: string;
    warning: string;
    info: string;
    
    // Special colors
    overlay: string;
    shadow: string;
  };
  
  // Status bar style
  statusBar: 'light-content' | 'dark-content';
  
  // Semantic meanings
  isDark: boolean;
}

// Light Theme (Default)
export const LIGHT_THEME: Theme = {
  id: 'light',
  name: 'light',
  displayName: 'Light',
  isDark: false,
  statusBar: 'dark-content',
  colors: {
    // Backgrounds
    background: '#f5f8f8',
    surface: '#ffffff',
    surfaceVariant: '#f0f0f0',
    
    // Primary
    primary: '#0df2f2',
    primaryLight: '#5ffcfc',
    primaryDark: '#00b8b8',
    
    // Secondary
    secondary: '#00b8b8',
    secondaryLight: '#64ffda',
    
    // Text
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textInverse: '#ffffff',
    
    // UI elements
    border: '#e0e0e0',
    borderLight: '#f0f0f0',
    divider: '#eeeeee',
    
    // Cards
    card: '#d4f5f5',
    cardElevated: '#ffffff',
    
    // Status
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    
    // Special
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
};

// Dark Theme
export const DARK_THEME: Theme = {
  id: 'dark',
  name: 'dark',
  displayName: 'Dark',
  isDark: true,
  statusBar: 'light-content',
  colors: {
    // Backgrounds
    background: '#102222',
    surface: '#1a3333',
    surfaceVariant: '#2a4444',
    
    // Primary
    primary: '#0df2f2',
    primaryLight: '#5ffcfc',
    primaryDark: '#00b8b8',
    
    // Secondary
    secondary: '#64ffda',
    secondaryLight: '#a7ffeb',
    
    // Text
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    textTertiary: '#808080',
    textInverse: '#000000',
    
    // UI elements
    border: '#2a4444',
    borderLight: '#3a5555',
    divider: '#2a4444',
    
    // Cards
    card: '#1a3333',
    cardElevated: '#2a4444',
    
    // Status
    success: '#66bb6a',
    error: '#ef5350',
    warning: '#ffa726',
    info: '#42a5f5',
    
    // Special
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

// Ocean Theme (Additional Theme 1)
export const OCEAN_THEME: Theme = {
  id: 'ocean',
  name: 'ocean',
  displayName: 'Ocean',
  isDark: true,
  statusBar: 'light-content',
  colors: {
    // Backgrounds
    background: '#0A192F',
    surface: '#172A45',
    surfaceVariant: '#1e3a52',
    
    // Primary
    primary: '#64FFDA',
    primaryLight: '#a7ffeb',
    primaryDark: '#1de9b6',
    
    // Secondary
    secondary: '#00D9FF',
    secondaryLight: '#84ffff',
    
    // Text
    text: '#E6F1FF',
    textSecondary: '#8892B0',
    textTertiary: '#495670',
    textInverse: '#0A192F',
    
    // UI elements
    border: '#233554',
    borderLight: '#2d4564',
    divider: '#1e3a52',
    
    // Cards
    card: '#172A45',
    cardElevated: '#1e3a52',
    
    // Status
    success: '#00E676',
    error: '#FF5252',
    warning: '#FFD740',
    info: '#00B8D4',
    
    // Special
    overlay: 'rgba(10, 25, 47, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

// Sunset Theme (Additional Theme 2)
export const SUNSET_THEME: Theme = {
  id: 'sunset',
  name: 'sunset',
  displayName: 'Sunset',
  isDark: true,
  statusBar: 'light-content',
  colors: {
    // Backgrounds
    background: '#1A1625',
    surface: '#2D2438',
    surfaceVariant: '#3a3047',
    
    // Primary
    primary: '#FF6B9D',
    primaryLight: '#ffb3d0',
    primaryDark: '#c2185b',
    
    // Secondary
    secondary: '#FFA07A',
    secondaryLight: '#ffd3b3',
    
    // Text
    text: '#FFEEF8',
    textSecondary: '#D4A5D4',
    textTertiary: '#9d7b9d',
    textInverse: '#1A1625',
    
    // UI elements
    border: '#3a3047',
    borderLight: '#4a4057',
    divider: '#2D2438',
    
    // Cards
    card: '#2D2438',
    cardElevated: '#3a3047',
    
    // Status
    success: '#69F0AE',
    error: '#FF6B9D',
    warning: '#FFD54F',
    info: '#64B5F6',
    
    // Special
    overlay: 'rgba(26, 22, 37, 0.8)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

// All available themes
export const THEMES: Theme[] = [
  LIGHT_THEME,
  DARK_THEME,
  OCEAN_THEME,
  SUNSET_THEME,
];

// Get theme by ID
export const getTheme = (themeId: string): Theme => {
  const theme = THEMES.find(t => t.id === themeId);
  return theme || LIGHT_THEME;
};

// Get theme by name (for backwards compatibility)
export const getThemeByName = (themeName: string): Theme => {
  return getTheme(themeName);
};

// Theme selector options for UI
export const THEME_OPTIONS = THEMES.map(theme => ({
  id: theme.id,
  label: theme.displayName,
  value: theme.id,
}));

// Default theme
export const DEFAULT_THEME = LIGHT_THEME;
