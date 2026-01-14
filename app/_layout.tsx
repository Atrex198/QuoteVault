import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/components/AuthProvider';
import { queryClient, persister } from '@/lib/queryClient';
import { useNotifications } from '@/hooks/useNotifications';
import { useWidgetData } from '@/hooks/useWidgetData';
import { useAuthStateListener } from '@/hooks/useAuthStateListener';
import { useInitialCache } from '@/hooks/useInitialCache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import 'react-native-url-polyfill/auto';
import '../global.css';

function DeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle deep links globally
    const handleDeepLink = async (url: string) => {
      console.log('🌐 Global deep link received:', url);
      
      // Handle email confirmation
      if (url.includes('auth/callback') || url.includes('type=signup') || url.includes('type=email')) {
        console.log('📧 Processing email confirmation link');
        
        try {
          // Parse both hash and query parameters
          const hashPart = url.split('#')[1] || '';
          const queryPart = url.split('?')[1]?.split('#')[0] || '';
          
          const hashParams = new URLSearchParams(hashPart);
          const queryParams = new URLSearchParams(queryPart);
          
          // Try to get tokens from either source
          const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
          const type = hashParams.get('type') || queryParams.get('type');
          
          console.log('📦 Extracted params:', { hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken, type });
          
          if (accessToken && refreshToken) {
            console.log('✅ Email confirmed, creating session');
            
            // Set the session
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (!error) {
              console.log('✅ Session created successfully');
              // Check if onboarding is complete
              const completed = await AsyncStorage.getItem('@quotevault_onboarding_complete');
              if (!completed) {
                console.log('Navigating to onboarding');
                setTimeout(() => {
                  router.replace('/onboarding');
                }, 100);
              } else {
                console.log('Onboarding already complete, navigating to home');
                setTimeout(() => {
                  router.replace('/');
                }, 100);
              }
            } else {
              console.error('❌ Failed to set session:', error.message);
              router.replace('/login');
            }
          }
        } catch (error) {
          console.error('❌ Error processing email confirmation:', error);
        }
        return;
      }
      
      if (url.includes('reset-password')) {
        console.log('🔑 Processing password reset link');
        
        try {
          // Parse hash parameters (Supabase uses # not ?)
          const hashPart = url.split('#')[1];
          const params = new URLSearchParams(hashPart);
          
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const tokenHash = params.get('token_hash');
          const type = params.get('type');
          
          console.log('📦 Extracted params:', { 
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            hasTokenHash: !!tokenHash,
            type 
          });
          
          if (accessToken && refreshToken && type === 'recovery') {
            console.log('✅ Found recovery tokens, navigating to reset screen');
            
            // Store token hash temporarily for verification only (no session)
            await AsyncStorage.setItem('@quotevault_reset_tokens', JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken
            }));
            
            // Navigate to reset screen - NO session will be created
            router.replace('/reset-password');
          } else if (tokenHash && type === 'recovery') {
            console.log('✅ Verifying OTP token...');
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery',
            });
            
            console.log('🔐 VerifyOtp result:', { 
              hasSession: !!data?.session,
              error: error?.message 
            });
            
            if (!error && data?.session) {
              console.log('✅ Session established, navigating to reset screen');
              setTimeout(() => {
                router.push('/reset-password');
              }, 100);
            } else {
              console.error('❌ Failed to verify token:', error?.message);
            }
          }
        } catch (error) {
          console.error('❌ Error processing reset link:', error);
        }
      }
    };

    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Listen for URL events
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription.remove();
  }, []);

  return null;
}

function NotificationInitializer() {
  const { notificationSettings, scheduleDailyNotification } = useNotifications();

  useEffect(() => {
    // Schedule daily notification when app loads (if enabled)
    if (notificationSettings.enabled) {
      scheduleDailyNotification(notificationSettings.hour, notificationSettings.minute);
    }
  }, [notificationSettings.enabled, notificationSettings.hour, notificationSettings.minute]);

  return null;
}

function WidgetDataProvider() {
  // Initialize widget data provider - updates widget when daily quote changes
  useWidgetData();
  return null;
}

function InitialCacheProvider() {
  // Pre-cache quotes and sections on app load
  useInitialCache();
  return null;
}

function OnboardingCheck() {
  const router = useRouter();
  const segments = useSegments();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const completed = await AsyncStorage.getItem('@quotevault_onboarding_complete');
      const currentPath = segments.join('/');
      
      // Don't check if on auth screens or onboarding
      if (currentPath === 'onboarding' || currentPath === 'login' || currentPath === 'signup' || currentPath === 'forgot-password' || currentPath === 'reset-password') {
        setIsChecking(false);
        return;
      }
      
      // If onboarding not completed, redirect to onboarding
      if (!completed) {
        router.replace('/onboarding');
      }
    } catch (error) {
      console.error('Error checking onboarding:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return null;
}

function AuthStateListener() {
  useAuthStateListener();
  return null;
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <ThemeProvider>
        <AuthProvider>
          <DeepLinkHandler />
          <OnboardingCheck />
          <NotificationInitializer />
          <WidgetDataProvider />
          <InitialCacheProvider />
          <AuthStateListener />
          <Slot />
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}

