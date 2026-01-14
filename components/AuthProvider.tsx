import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { supabase, ensureProfile } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Ensure profile exists for logged in user
      if (session?.user) {
        ensureProfile(session.user.id, session.user.email?.split('@')[0]);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Ensure profile exists when user logs in
      if (session?.user) {
        ensureProfile(session.user.id, session.user.email?.split('@')[0]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup' || segments[0] === 'forgot-password' || segments[0] === 'reset-password';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login');
    } else if (session && inAuthGroup && segments[0] !== 'reset-password') {
      // Redirect to home if authenticated and on auth screen (except reset-password which needs session to update password)
      router.replace('/');
    }
  }, [session, segments, loading]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0df2f2" />
      </View>
    );
  }

  return <>{children}</>;
}
