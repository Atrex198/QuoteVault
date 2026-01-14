// Type definitions for QuoteVault

// Database Types (matching Supabase schema)
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  preferences: {
    theme: string;
    fontSize: string;
    notificationTime: string;
    notificationsEnabled: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  content: string;
  author: string;
  category: 'Motivation' | 'Love' | 'Success' | 'Wisdom' | 'Humor';
  created_at: string;
}

export interface Favorite {
  user_id: string;
  quote_id: string;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionQuote {
  collection_id: string;
  quote_id: string;
  added_at: string;
}

export interface DailyQuote {
  date: string;
  quote_id: string;
  created_at: string;
  quotes?: Quote; // Joined quote data
}

// Helper Types
export interface QuoteWithFavorite extends Quote {
  is_favorited?: boolean;
}

export interface CollectionWithCount extends Collection {
  quote_count?: number;
}

// App Types
export type Category = 'Motivation' | 'Love' | 'Success' | 'Wisdom' | 'Humor';

export type Theme = 'light' | 'dark' | 'ocean' | 'sunset';

export type FontSize = 'small' | 'medium' | 'large';

export type CardStyle = 'light' | 'dark' | 'image';

export interface UserPreferences {
  theme: Theme;
  fontSize: FontSize;
  notificationTime: string;
  notificationsEnabled: boolean;
}

// Legacy types for backward compatibility with current UI
export interface User {
  id: string;
  name: string;
  avatar?: string;
}
