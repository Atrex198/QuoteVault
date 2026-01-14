import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!SUPABASE_URL) {
  console.warn('⚠️  EXPO_PUBLIC_SUPABASE_URL is not set in your .env file');
}

if (!SUPABASE_ANON_KEY) {
  console.warn('⚠️  EXPO_PUBLIC_SUPABASE_ANON_KEY is not set in your .env file');
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database Types (matching your Supabase schema)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          preferences?: {
            theme?: string;
            fontSize?: string;
            notificationTime?: string;
            notificationsEnabled?: boolean;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          preferences?: {
            theme?: string;
            fontSize?: string;
            notificationTime?: string;
            notificationsEnabled?: boolean;
          };
          created_at?: string;
          updated_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          content: string;
          author: string;
          category: 'Motivation' | 'Love' | 'Success' | 'Wisdom' | 'Humor';
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          author: string;
          category: 'Motivation' | 'Love' | 'Success' | 'Wisdom' | 'Humor';
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          author?: string;
          category?: 'Motivation' | 'Love' | 'Success' | 'Wisdom' | 'Humor';
          created_at?: string;
        };
      };
      favorites: {
        Row: {
          user_id: string;
          quote_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          quote_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          quote_id?: string;
          created_at?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      collection_quotes: {
        Row: {
          collection_id: string;
          quote_id: string;
          added_at: string;
        };
        Insert: {
          collection_id: string;
          quote_id: string;
          added_at?: string;
        };
        Update: {
          collection_id?: string;
          quote_id?: string;
          added_at?: string;
        };
      };
      daily_quotes: {
        Row: {
          date: string;
          quote_id: string;
          created_at: string;
        };
        Insert: {
          date: string;
          quote_id: string;
          created_at?: string;
        };
        Update: {
          date?: string;
          quote_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {
      rotate_daily_quote: {
        Args: {};
        Returns: void;
      };
      get_user_favorite_count: {
        Args: { user_uuid: string };
        Returns: number;
      };
      get_collection_quote_count: {
        Args: { collection_uuid: string };
        Returns: number;
      };
    };
  };
}

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Helper function to ensure user is authenticated
export const ensureAuthenticated = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      return user;
    }

    // No user found - return null instead of throwing
    return null;
  } catch (error) {
    // Silent fail - return null instead of logging
    return null;
  }
};

// Check if user is logged in
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
};

// Ensure user profile exists (create if missing)
export const ensureProfile = async (userId: string, username?: string) => {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      return true;
    }

    // Try to create profile with service role or user permissions
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: username || 'User',
        preferences: {
          theme: 'light',
          fontSize: 'medium',
          notificationTime: '09:00',
          notificationsEnabled: true,
        },
      });

    if (error && error.code !== '42501' && error.code !== '23505') {
      console.warn('Profile creation warning:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Profile check/creation error:', error);
    return false;
  }
};

// Export types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
