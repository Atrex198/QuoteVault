import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, Quote } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            username: username.trim(),
          },
          emailRedirectTo: 'quotevault://auth/callback',
        },
      });

      if (error) throw error;

      if (data?.user) {
        // Try to create profile entry - but don't fail signup if it errors
        // Profile will be auto-created by database trigger or can be created on first login
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: username.trim(),
              preferences: {
                theme: 'light',
                fontSize: 'medium',
                notificationTime: '09:00',
                notificationsEnabled: true,
              },
            });

          if (profileError && profileError.code !== '42501') {
            // Log error but don't block signup unless it's not an RLS error
            console.warn('Profile creation warning:', profileError);
          }
        } catch (profileError) {
          // Silent fail - profile will be created on first login if needed
          console.warn('Profile creation skipped:', profileError);
        }

        Alert.alert(
          'Success',
          'Account created successfully! Please check your email to verify your account.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'An error occurred during sign up');
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
            'Google Sign Up Not Configured',
            'Google authentication is not yet set up. Please use email/password to create an account.',
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
      console.error('Signup Failed:', error);
      Alert.alert('Google Sign Up Failed', error.message || 'Failed to initiate Google sign up');
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
            className="w-16 h-16 rounded-2xl items-center justify-center mb-8 self-start"
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
            <Text className="text-gray-500 text-xl font-medium">Create your</Text>
            <Text className="text-gray-900 text-4xl font-bold mt-1">Account.</Text>
          </View>

          {/* Form */}
          <View className="gap-6">
            {/* Username Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">Username</Text>
              <View className="relative">
                <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <User size={20} color="#9ca3af" />
                </View>
                <TextInput
                  className="w-full h-14 pl-12 pr-4 bg-gray-100 rounded-xl text-gray-900 text-base"
                  placeholder="Choose a username"
                  placeholderTextColor="#9ca3af"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

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
                  placeholder="Create a password"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
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

            {/* Confirm Password Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">Confirm Password</Text>
              <View className="relative">
                <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Lock size={20} color="#9ca3af" />
                </View>
                <TextInput
                  className="w-full h-14 pl-12 pr-12 bg-gray-100 rounded-xl text-gray-900 text-base"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#9ca3af" />
                  ) : (
                    <Eye size={20} color="#9ca3af" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Sign Up Button */}
            <Pressable
              onPress={handleSignUp}
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
                    <Text className="text-gray-900 font-bold text-lg">Sign Up</Text>
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
              onPress={() => Alert.alert('Coming Soon', 'Apple sign up will be available soon')}
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
              onPress={() => Alert.alert('Coming Soon', 'Facebook sign up will be available soon')}
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

          {/* Login Link */}
          <View className="flex-row justify-center">
            <Text className="text-gray-500 text-sm">Already have an account? </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text className="text-gray-900 font-semibold text-sm">Log In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
