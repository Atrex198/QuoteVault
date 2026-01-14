import React from 'react';
import { View, Pressable } from 'react-native';
import { Home, Search, Heart, Settings } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { STRINGS, COLORS } from '@/lib/constants';
import { useTheme } from '@/contexts/ThemeContext';

interface BottomNavProps {
  activeTab?: 'home' | 'search' | 'favorites' | 'settings';
  onTabPress?: (tab: 'home' | 'search' | 'favorites' | 'settings') => void;
}

export function BottomNav({ activeTab: controlledActiveTab, onTabPress }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();

  // Determine active tab from pathname if not controlled
  const getActiveTabFromPath = () => {
    if (pathname === '/') return 'home';
    if (pathname === '/search') return 'search';
    if (pathname === '/favorites') return 'favorites';
    if (pathname === '/settings') return 'settings';
    return 'home';
  };

  const activeTab = controlledActiveTab || getActiveTabFromPath();

  const handleTabPress = (tab: 'home' | 'search' | 'favorites' | 'settings') => {
    if (onTabPress) {
      onTabPress(tab);
    } else {
      // Use router navigation
      if (tab === 'home') router.push('/');
      else if (tab === 'search') router.push('/search');
      else if (tab === 'favorites') router.push('/favorites');
      else if (tab === 'settings') router.push('/settings');
    }
  };
  const tabs = [
    { id: 'home', icon: Home, label: STRINGS.labels.home },
    { id: 'search', icon: Search, label: STRINGS.labels.search },
    { id: 'favorites', icon: Heart, label: STRINGS.labels.favorites },
    { id: 'settings', icon: Settings, label: STRINGS.labels.settings },
  ] as const;

  return (
    <View
      className="flex-row items-center justify-around px-4 py-3"
      style={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Pressable
            key={tab.id}
            onPress={() => handleTabPress(tab.id as typeof activeTab)}
            className="items-center py-2 px-4"
          >
            <Icon
              size={24}
              color={isActive ? theme.colors.primary : theme.colors.textSecondary}
              fill={isActive && tab.id === 'home' ? theme.colors.primary : 'transparent'}
            />
            <View
              style={{
                marginTop: 4,
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: isActive ? theme.colors.primary : 'transparent'
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
