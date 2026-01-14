// App Configuration
export const APP_NAME = 'QuoteVault';

// Colors
export const COLORS = {
  primary: '#0df2f2',
  secondary: '#00b8b8',
  accent: '#64ffda',
  background: {
    light: '#f5f8f8',
    dark: '#102222',
  },
  card: {
    light: '#d4f5f5',
    dark: '#1a3333',
    accent: '#5a5a5a',
  },
  text: {
    primary: '#000000',
    secondary: '#666666',
    tertiary: '#999999',
    light: '#ffffff',
  },
} as const;

// Categories
export const CATEGORIES = [
  { id: 'motivation', label: 'Motivation', color: '#0df2f2' },
  { id: 'wisdom', label: 'Wisdom', color: '#ffffff' },
  { id: 'love', label: 'Love', color: '#ffffff' },
  { id: 'humor', label: 'Humor', color: '#ffffff' },
  { id: 'success', label: 'Success', color: '#ffffff' },
] as const;

// Font Sizes
export const FONT_SIZES = {
  small: {
    quote: 14,
    author: 12,
    title: 16,
  },
  medium: {
    quote: 16,
    author: 14,
    title: 18,
  },
  large: {
    quote: 20,
    author: 16,
    title: 22,
  },
} as const;

// UI Strings
export const STRINGS = {
  greeting: {
    morning: 'Good Morning',
    afternoon: 'Good Afternoon',
    evening: 'Good Evening',
    night: 'Good Night',
  },
  labels: {
    quoteOfTheDay: 'QUOTE OF THE DAY',
    home: 'Home',
    search: 'Search',
    favorites: 'Favorites',
    settings: 'Settings',
  },
  placeholders: {
    search: 'Search quotes, authors...',
  },
  buttons: {
    retry: 'Tap to retry',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
  },
  empty: {
    noQuotes: 'No quotes found',
    noFavorites: 'No favorites yet',
  },
} as const;

// Typography
export const TYPOGRAPHY = {
  fontSizes: {
    xs: 10,
    sm: 12,
    base: 14,
    lg: 16,
    xl: 18,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
  fontWeights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

// Border Radius
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;
