import React from 'react';
import { View, Text, Pressable, Alert, ScrollView, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, User, Bell, Palette, Info, LayoutGrid } from 'lucide-react-native';
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { clearAllCache } from '@/lib/localCache';
import { useQueryClient } from '@tanstack/react-query';

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useTheme();

  const handleAddWidget = () => {
    if (Platform.OS === 'android') {
      Alert.alert(
        'Add Widget',
        'To add the Daily Quote widget:\n\n1. Long press on your home screen\n2. Tap "Widgets"\n3. Find "QuoteVault"\n4. Drag the "Daily Quote" widget to your home screen',
        [{ text: 'Got it' }]
      );
    } else if (Platform.OS === 'ios') {
      Alert.alert(
        'Add Widget',
        'To add the Daily Quote widget:\n\n1. Long press on your home screen\n2. Tap the "+" button in the top corner\n3. Search for "QuoteVault"\n4. Select the widget size\n5. Tap "Add Widget"',
        [{ text: 'Got it' }]
      );
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Clear all React Query cache
              queryClient.clear();
              
              // 2. Clear AsyncStorage cache
              await clearAllCache();
              
              // 3. Sign out from Supabase
              await supabase.auth.signOut();
              
              // 4. Navigate to login
              router.replace('/login');
              
              console.log('✅ Logged out successfully');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const SettingsItem = ({ 
    icon, 
    title, 
    onPress, 
    destructive = false 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    onPress: () => void; 
    destructive?: boolean;
  }) => (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-6 py-4 border-b"
      style={{ backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }}
    >
      <View className="mr-4">{icon}</View>
      <Text className={`text-base font-medium`} style={{ color: destructive ? theme.colors.error : theme.colors.text }}>
        {title}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1" edges={['top']} style={{ backgroundColor: theme.colors.background }}>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b" style={{ backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }}>
          <Text className="text-2xl font-bold" style={{ color: theme.colors.text }}>Settings</Text>
        </View>

        <ScrollView className="flex-1">
          <View className="mt-4">
            <SettingsItem
              icon={<User size={22} color={theme.colors.textSecondary} />}
              title="Edit Profile"
              onPress={() => router.push('/onboarding')}
            />
            <SettingsItem
              icon={<Bell size={22} color={theme.colors.textSecondary} />}
              title="Notifications"
              onPress={() => router.push('/notification-settings')}
            />
            <SettingsItem
              icon={<LayoutGrid size={22} color={theme.colors.textSecondary} />}
              title="Add Home Screen Widget"
              onPress={handleAddWidget}
            />
            <SettingsItem
              icon={<Palette size={22} color="#6b7280" />}
              title="Appearance"
              onPress={() => router.push('/appearance')}
            />
            <SettingsItem
              icon={<Info size={22} color="#6b7280" />}
              title="About"
              onPress={() => Alert.alert('QuoteVault', 'Version 1.0.0\n\nA beautiful quotes app')}
            />
          </View>

          <View className="mt-8">
            <SettingsItem
              icon={<LogOut size={22} color="#ef4444" />}
              title="Log Out"
              onPress={handleLogout}
              destructive
            />
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}
