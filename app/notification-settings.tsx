import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clock, Bell, ChevronDown } from 'lucide-react-native';
import Modal from 'react-native-modal';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/contexts/ThemeContext';

// Custom Time Picker Component
function TimePicker({ 
  visible, 
  onClose, 
  onSelect, 
  initialHour, 
  initialMinute,
  theme
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSelect: (hour: number, minute: number) => void;
  initialHour: number;
  initialMinute: number;
  theme: any;
}) {
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour} ${period}`;
  };

  const handleConfirm = () => {
    onSelect(selectedHour, selectedMinute);
    onClose();
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={{ justifyContent: 'center', margin: 20 }}
      backdropOpacity={0.5}
    >
      <View className="rounded-2xl p-6" style={{ backgroundColor: theme.colors.surface }}>
        <Text className="text-xl font-bold mb-4 text-center" style={{ color: theme.colors.text }}>
          Select Time
        </Text>

        <View className="flex-row justify-center gap-4 mb-6">
          {/* Hour Picker */}
          <View className="flex-1">
            <Text className="text-sm font-medium mb-2 text-center" style={{ color: theme.colors.textSecondary }}>Hour</Text>
            <ScrollView 
              className="h-40 rounded-xl"
              style={{ backgroundColor: theme.colors.background }}
              showsVerticalScrollIndicator={false}
            >
              {hours.map((hour) => (
                <Pressable
                  key={hour}
                  onPress={() => setSelectedHour(hour)}
                  className="py-3"
                  style={{ backgroundColor: selectedHour === hour ? theme.colors.primary : 'transparent' }}
                >
                  <Text className="text-center text-base font-medium" style={{ 
                    color: selectedHour === hour ? '#fff' : theme.colors.text 
                  }}>
                    {formatHour(hour)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Minute Picker */}
          <View className="flex-1">
            <Text className="text-sm font-medium mb-2 text-center" style={{ color: theme.colors.textSecondary }}>Minute</Text>
            <ScrollView 
              className="h-40 rounded-xl"
              style={{ backgroundColor: theme.colors.background }}
              showsVerticalScrollIndicator={false}
            >
              {minutes.map((minute) => (
                <Pressable
                  key={minute}
                  onPress={() => setSelectedMinute(minute)}
                  className="py-3"
                  style={{ backgroundColor: selectedMinute === minute ? theme.colors.primary : 'transparent' }}
                >
                  <Text className="text-center text-base font-medium" style={{ 
                    color: selectedMinute === minute ? '#fff' : theme.colors.text 
                  }}>
                    {minute.toString().padStart(2, '0')}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <View className="flex-row gap-3">
          <Pressable
            onPress={onClose}
            className="flex-1 py-3 rounded-xl"
            style={{ backgroundColor: theme.colors.background }}
          >
            <Text className="text-center text-base font-semibold" style={{ color: theme.colors.text }}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={handleConfirm}
            className="flex-1 py-3 rounded-xl"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Text className="text-center text-base font-semibold text-white">
              Confirm
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    notificationSettings,
    permissionStatus,
    updateNotificationTime,
    toggleNotifications,
    requestPermissions,
    sendTestNotification,
  } = useNotifications();

  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleTimeSelect = (hour: number, minute: number) => {
    updateNotificationTime(hour, minute);
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value && permissionStatus !== 'granted') {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive daily quotes.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // On iOS, you can use Linking.openSettings()
              // On Android, you'll need to guide users manually
            }},
          ]
        );
        return;
      }
    }
    await toggleNotifications(value);
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
    Alert.alert(
      'Test Notification Sent',
      'You should receive a notification in 2 seconds!',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.colors.background }} edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-4" style={{ backgroundColor: theme.colors.surface, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full"
          >
            <ChevronLeft size={24} color={theme.colors.text} />
          </Pressable>
          <Text className="text-xl font-bold ml-2" style={{ color: theme.colors.text }}>Notifications</Text>
        </View>

        <ScrollView className="flex-1">
          {/* Daily Quote Notifications Section */}
          <View className="mt-6 px-6 py-4" style={{ backgroundColor: theme.colors.surface }}>
            <View className="flex-row items-center mb-2">
              <Bell size={20} color={theme.colors.primary} />
              <Text className="text-lg font-semibold ml-2" style={{ color: theme.colors.text }}>
                Daily Quote Notifications
              </Text>
            </View>
            <Text className="text-sm mb-4" style={{ color: theme.colors.textSecondary }}>
              Get inspired every day with a new quote
            </Text>
            
            <View className="flex-row items-center justify-between py-3" style={{ borderTopWidth: 1, borderTopColor: theme.colors.border }}>
              <Text className="text-base" style={{ color: theme.colors.text }}>Enable Notifications</Text>
              <Switch
                value={notificationSettings.enabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor="#fff"
              />
            </View>

            {notificationSettings.enabled && (
              <>
                <Pressable
                  onPress={() => setShowTimePicker(true)}
                  className="flex-row items-center justify-between py-3"
                  style={{ borderTopWidth: 1, borderTopColor: theme.colors.border }}
                >
                  <View className="flex-row items-center">
                    <Clock size={18} color={theme.colors.textSecondary} />
                    <Text className="text-base ml-2" style={{ color: theme.colors.text }}>Notification Time</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-base font-semibold mr-1" style={{ color: theme.colors.primary }}>
                      {formatTime(notificationSettings.hour, notificationSettings.minute)}
                    </Text>
                    <ChevronDown size={18} color={theme.colors.primary} />
                  </View>
                </Pressable>
              </>
            )}
          </View>

          {/* Time Picker Modal */}
          <TimePicker
            visible={showTimePicker}
            onClose={() => setShowTimePicker(false)}
            onSelect={handleTimeSelect}
            initialHour={notificationSettings.hour}
            initialMinute={notificationSettings.minute}
            theme={theme}
          />

          {/* Permission Status */}
          {permissionStatus !== 'granted' && (
            <View className="mx-6 mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <Text className="text-sm font-medium text-yellow-800 mb-1">
                Notification Permission Required
              </Text>
              <Text className="text-xs text-yellow-700">
                Please enable notification permissions to receive daily quotes.
              </Text>
              <Pressable
                onPress={requestPermissions}
                className="mt-3 py-2 px-4 bg-yellow-500 rounded-lg"
              >
                <Text className="text-sm font-semibold text-white text-center">
                  Enable Permissions
                </Text>
              </Pressable>
            </View>
          )}

          {/* Test Notification */}
          {notificationSettings.enabled && permissionStatus === 'granted' && (
            <View className="mx-6 mt-4">
              <Pressable
                onPress={handleTestNotification}
                className="py-4 rounded-xl"
                style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}
              >
                <Text className="text-base font-semibold text-center" style={{ color: theme.colors.primary }}>
                  Send Test Notification
                </Text>
              </Pressable>
            </View>
          )}

          {/* Info Section */}
          <View className="mx-6 mt-6 mb-8">
            <View className="p-4 rounded-xl" style={{ backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text className="text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                ℹ️ About Daily Quotes
              </Text>
              <Text className="text-xs leading-5" style={{ color: theme.colors.textSecondary }}>
                You'll receive a notification at your chosen time each day with a new inspiring quote. 
                Tap the notification to open the app and explore more quotes.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
