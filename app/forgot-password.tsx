import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, Quote, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'quotevault://reset-password',
      });

      if (error) throw error;

      setShowSuccessModal(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
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
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="max-w-md w-full mx-auto">
          {/* Back Button */}
          <Pressable 
            onPress={() => router.back()}
            className="flex-row items-center mb-8"
          >
            <ArrowLeft size={24} color="#6b7280" />
            <Text className="text-gray-600 text-base ml-2 font-medium">Back to Login</Text>
          </Pressable>

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
            <Text className="text-gray-900 text-4xl font-bold">Forgot Password?</Text>
            <Text className="text-gray-500 text-base mt-3 leading-6">
              Enter your email address and we'll send you a link to reset your password.
            </Text>
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
                  editable={!loading}
                />
              </View>
            </View>

            {/* Reset Button */}
            <Pressable
              onPress={handleResetPassword}
              disabled={loading || !email.trim()}
              className="w-full h-14 mt-2 rounded-xl overflow-hidden"
              style={{
                shadowColor: '#0df2f2',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: loading || !email.trim() ? 0.2 : 0.4,
                shadowRadius: 10,
                elevation: 8,
                opacity: loading || !email.trim() ? 0.6 : 1,
              }}
            >
              <LinearGradient
                colors={['#0df2f2', '#00e5e5']}
                className="w-full h-full items-center justify-center flex-row gap-2"
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text className="text-gray-900 font-bold text-lg">Send Reset Link</Text>
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
          router.back();
        }}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-8 w-full max-w-sm items-center">
            <View className="w-20 h-20 rounded-full bg-cyan-50 items-center justify-center mb-6">
              <CheckCircle size={48} color="#0df2f2" strokeWidth={2} />
            </View>
            
            <Text className="text-gray-900 text-2xl font-bold mb-3 text-center">
              Check Your Email
            </Text>
            
            <Text className="text-gray-600 text-base text-center leading-6 mb-8">
              We've sent a password reset link to{'\n'}
              <Text className="font-semibold text-gray-900">{email}</Text>
            </Text>

            <Pressable
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
              className="w-full h-14 rounded-xl overflow-hidden"
            >
              <LinearGradient
                colors={['#0df2f2', '#00e5e5']}
                className="w-full h-full items-center justify-center"
              >
                <Text className="text-gray-900 font-bold text-lg">Got It</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
