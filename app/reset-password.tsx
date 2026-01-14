import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Modal, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff, Quote, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function ResetPasswordScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log('🚀 Reset password screen mounted');
    
    // Check for stored tokens from deep link and create session
    const setupSession = async () => {
      try {
        const tokensJson = await AsyncStorage.getItem('@quotevault_reset_tokens');
        
        if (tokensJson) {
          console.log('✅ Found stored tokens, creating session for password reset');
          const tokens = JSON.parse(tokensJson);
          
          // Create session so user can update password
          const { error } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          });
          
          if (error) {
            console.error('❌ Failed to create session:', error);
            setError('Reset link expired or invalid. Please request a new one.');
            setTimeout(() => router.replace('/login'), 3000);
          } else {
            console.log('✅ Session created successfully');
          }
          
          // Clean up stored tokens
          await AsyncStorage.removeItem('@quotevault_reset_tokens');
        } else {
          console.log('⚠️ No recovery tokens found');
          setError('Invalid reset link. Please request a new one.');
          setTimeout(() => router.replace('/login'), 3000);
        }
      } catch (error) {
        console.error('❌ Error setting up session:', error);
        setError('Failed to process reset link');
      }
    };
    
    setupSession();
  }, []);

  const handleDeepLinkFromUrl = async (url: string) => {
    console.log('🔗 Processing URL:', url);
    
    try {
      const urlObj = new URL(url);
      const tokenHash = urlObj.searchParams.get('token_hash');
      const type = urlObj.searchParams.get('type');
      const accessToken = urlObj.searchParams.get('access_token');
      const refreshToken = urlObj.searchParams.get('refresh_token');

      console.log('🔑 Extracted params:', {
        tokenHash: tokenHash?.substring(0, 20) + '...',
        type,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken
      });

      if (tokenHash && type === 'recovery') {
        console.log('✅ Using token_hash flow');
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });

        console.log('🔐 VerifyOtp result:', { 
          hasData: !!data, 
          hasSession: !!data?.session,
          hasUser: !!data?.user,
          error: error?.message 
        });

        if (error) throw error;
        
        if (!data?.session) {
          throw new Error('No session returned from verifyOtp');
        }
        
        console.log('✅ Token verified successfully with session');
      } else if (accessToken) {
        console.log('✅ Using access_token flow');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        console.log('🔐 SetSession result:', { error: error?.message });

        if (error) throw error;
        
        console.log('✅ Session set successfully');
      } else {
        console.log('⚠️ No tokens found in URL');
        setError('Invalid or expired reset link');
        setTimeout(() => router.replace('/login'), 3000);
      }
    } catch (error: any) {
      console.error('❌ Error processing URL:', error);
      setError('Failed to verify reset link: ' + error.message);
      setTimeout(() => router.replace('/login'), 3000);
    }
  };

  const handleDeepLink = async () => {
    console.log('🔗 Reset Password - Deep link params from router:', JSON.stringify(params, null, 2));
    
    // Try params from router first
    const tokenHash = params.token_hash as string;
    const type = params.type as string;
    const accessToken = params.access_token as string;
    const refreshToken = params.refresh_token as string;

    if (tokenHash || accessToken) {
      console.log('🔑 Using params from router');
      try {
        if (tokenHash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });
          if (error) throw error;
        } else if (accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          if (error) throw error;
        }
      } catch (error: any) {
        console.error('❌ Error with router params:', error);
        setError('Failed to verify reset link');
      }
    } else {
      console.log('⚠️ No params from router, waiting for URL event...');
    }
  };

  const handleResetPassword = async () => {
    setError('');

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // Check session before updating
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('🔐 Current session before update:', { hasSession: !!sessionData.session });
      
      if (!sessionData.session) {
        throw new Error('No active session. Please try clicking the reset link again.');
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      console.log('🔐 Update password result:', { error: error?.message });

      if (error) throw error;

      console.log('✅ Password updated successfully');
      
      // Sign out immediately - user must login with new password
      await supabase.auth.signOut();
      console.log('✅ Signed out successfully');
      
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('❌ Password update error:', error);
      setError(error.message || 'Failed to reset password');
    } finally {
      setLoading(false);
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
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}
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
            <Text className="text-gray-900 text-4xl font-bold">Create New Password</Text>
            <Text className="text-gray-500 text-base mt-3 leading-6">
              Enter your new password below.
            </Text>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View className="gap-4">
            {/* New Password Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2 ml-1">New Password</Text>
              <View className="relative">
                <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <Lock size={20} color="#9ca3af" />
                </View>
                <TextInput
                  className="w-full h-14 pl-12 pr-14 bg-gray-100 rounded-xl text-gray-900 text-base"
                  placeholder="Enter new password"
                  placeholderTextColor="#9ca3af"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <Pressable
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Eye size={20} color="#9ca3af" />
                  ) : (
                    <EyeOff size={20} color="#9ca3af" />
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
                  className="w-full h-14 pl-12 pr-14 bg-gray-100 rounded-xl text-gray-900 text-base"
                  placeholder="Confirm new password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <Pressable
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <Eye size={20} color="#9ca3af" />
                  ) : (
                    <EyeOff size={20} color="#9ca3af" />
                  )}
                </Pressable>
              </View>
            </View>

            <Text className="text-gray-500 text-sm ml-1">
              Password must be at least 6 characters long
            </Text>

            {/* Reset Button */}
            <Pressable
              onPress={handleResetPassword}
              disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
              className="w-full h-14 mt-2 rounded-xl overflow-hidden"
              style={{
                shadowColor: '#0df2f2',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: loading || !newPassword.trim() ? 0.2 : 0.4,
                shadowRadius: 10,
                elevation: 8,
                opacity: loading || !newPassword.trim() || !confirmPassword.trim() ? 0.6 : 1,
              }}
            >
              <LinearGradient
                colors={['#0df2f2', '#00e5e5']}
                className="w-full h-full items-center justify-center flex-row gap-2"
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="text-gray-900 font-bold text-lg">Reset Password</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowSuccessModal(false);
          router.replace('/');
        }}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-8 w-full max-w-sm items-center">
            <View className="w-20 h-20 rounded-full bg-cyan-50 items-center justify-center mb-6">
              <CheckCircle size={48} color="#0df2f2" strokeWidth={2} />
            </View>
            
            <Text className="text-gray-900 text-2xl font-bold mb-3 text-center">
              Password Reset!
            </Text>
            
            <Text className="text-gray-600 text-base text-center leading-6 mb-8">
              You have been signed out. Please login with your new password.
            </Text>

            <Pressable
              onPress={() => {
                setShowSuccessModal(false);
                router.replace('/login');
              }}
              className="w-full h-14 rounded-xl overflow-hidden"
            >
              <LinearGradient
                colors={['#0df2f2', '#00e5e5']}
                className="w-full h-full items-center justify-center"
              >
                <Text className="text-gray-900 font-bold text-lg">Go to Login</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}