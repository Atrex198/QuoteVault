import React from 'react';
import { View, Text, Image } from 'react-native';
import { STRINGS } from '@/lib/constants';
import { useTheme } from '@/contexts/ThemeContext';

interface HeaderProps {
  userName: string;
  userAvatar?: string;
}

export function Header({ userName, userAvatar }: HeaderProps) {
  const { theme } = useTheme();
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return STRINGS.greeting.morning;
    if (hour < 17) return STRINGS.greeting.afternoon;
    if (hour < 21) return STRINGS.greeting.evening;
    return STRINGS.greeting.night;
  };

  return (
    <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
      <View className="flex-1">
        <Text className="text-3xl font-bold" style={{ color: theme.colors.text }}>
          {getGreeting()},
        </Text>
        <Text className="text-3xl font-bold" style={{ color: theme.colors.text }}>
          {userName}
        </Text>
      </View>
      {userAvatar ? (
        <Image
          source={{ uri: userAvatar }}
          className="w-14 h-14 rounded-full"
        />
      ) : (
        <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: theme.colors.primary }}>
          <Text className="text-white text-xl font-bold">
            {userName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}
