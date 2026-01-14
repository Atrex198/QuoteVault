import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Quote } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      if (data?.user) {
        // Check if onboarding is complete
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const completed = await AsyncStorage.getItem('@quotevault_onboarding_complete');
        
        if (!completed) {
          Alert.alert('Success', 'Logged in successfully!', [
            { text: 'OK', onPress: () => router.replace('/onboarding') }
          ]);
        } else {
          Alert.alert('Success', 'Logged in successfully!');
          router.replace('/');
        }
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = makeRedirectUri({
        scheme: 'quotevault',
        path: 'google-auth',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        if (error.message.includes('provider') || error.message.includes('not enabled')) {
          Alert.alert(
            'Google Login Not Configured',
            'Google authentication is not yet set up. Please use email/password to sign in.',
            [{ text: 'OK' }]
          );
          return;
        }
        throw error;
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        
        if (result.type === 'success') {
          const urlObj = new URL(result.url);
          const params = new URLSearchParams(urlObj.hash.replace('#', '?'));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;

            router.replace('/');
          }
        }
      }
    } catch (error: any) {
      console.error('Login Failed:', error);
      Alert.alert('Google Login Failed', error.message || 'Failed to initiate Google login');
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Abstract Background */}
      <View className="absolute top-0 left-0 w-full h-full">
        <View className="absolute -top-40 -right-20 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <View className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-blue-400/5 blur-3xl" />
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-md w-full mx-auto">
          {/* Logo */}
          <LinearGradient
            colors={['#0df2f2', '#22d3ee']}
            className="w-16 h-16 rounded-2xl items-center justify-center mb-8"
            style={{
              shadowColor: '#0df2f2',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Quote size={32} color="#000" strokeWidth={2.5} />
          </LinearGradient>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-gray-500 text-xl font-medium">Welcome to</Text>
            <Text className="text-gray-900 text-4xl font-bold mt-1">QuoteVault.</Text>
          </View>

          {/* Form */}
          <View className="gap-6">
            {/* Email Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">Email</Text>
              <View className="relative">
                <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Mail size={20} color="#9ca3af" />
                </View>
                <TextInput
                  className="w-full h-14 pl-12 pr-4 bg-gray-100 rounded-xl text-gray-900 text-base"
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
            </View>

            {/* Password Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">Password</Text>
              <View className="relative">
                <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Lock size={20} color="#9ca3af" />
                </View>
                <TextInput
                  className="w-full h-14 pl-12 pr-12 bg-gray-100 rounded-xl text-gray-900 text-base"
                  placeholder="Enter your password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9ca3af" />
                  ) : (
                    <Eye size={20} color="#9ca3af" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Forgot Password */}
            <View className="items-end">
              <Pressable onPress={() => router.push('/forgot-password')}>
                <Text className="text-sm font-medium text-gray-500">Forgot Password?</Text>
              </Pressable>
            </View>

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={loading}
              className="w-full h-14 mt-2 rounded-xl overflow-hidden"
              style={{
                shadowColor: '#0df2f2',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={['#0df2f2', '#00e5e5']}
                className="w-full h-full items-center justify-center flex-row gap-2"
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text className="text-gray-900 font-bold text-lg">Log In</Text>
                    <ArrowRight size={20} color="#000" strokeWidth={3} />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Divider */}
          <View className="relative my-8">
            <View className="absolute w-full h-px bg-gray-200 top-1/2" />
            <View className="flex-row justify-center">
              <Text className="bg-gray-50 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Or continue with
              </Text>
            </View>
          </View>

          {/* Social Buttons */}
          <View className="flex-row justify-center gap-6 mb-8">
            <Pressable
              onPress={handleGoogleLogin}
              className="w-14 h-14 rounded-2xl bg-white items-center justify-center border border-gray-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View className="w-6 h-6 rounded bg-red-500 items-center justify-center">
                <Text className="text-white font-bold text-sm">G</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => Alert.alert('Coming Soon', 'Apple login will be available soon')}
              className="w-14 h-14 rounded-2xl bg-white items-center justify-center border border-gray-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View className="w-6 h-6 bg-black rounded-full items-center justify-center">
                <Text className="text-white font-bold text-lg"></Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => Alert.alert('Coming Soon', 'Facebook login will be available soon')}
              className="w-14 h-14 rounded-2xl bg-white items-center justify-center border border-gray-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <View className="w-6 h-6 rounded bg-blue-600 items-center justify-center">
                <Text className="text-white font-bold text-sm">f</Text>
              </View>
            </Pressable>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center">
            <Text className="text-gray-500 text-sm">Don't have an account? </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text className="text-gray-900 font-semibold text-sm">Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
