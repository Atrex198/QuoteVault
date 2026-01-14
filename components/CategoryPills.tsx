import React from 'react';
import { ScrollView, Pressable, Text } from 'react-native';
import type { Category } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';

interface CategoryPillsProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (category: Category | 'All') => void;
}

const CATEGORIES: Array<Category | 'All'> = ['All', 'Motivation', 'Wisdom', 'Love', 'Humor', 'Success'];

export function CategoryPills({
  selectedCategory,
  onSelectCategory,
}: CategoryPillsProps) {
  const { theme } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-6 px-4"
      contentContainerStyle={{ gap: 12 }}
    >
      {CATEGORIES.map((category) => {
        const isSelected = category === selectedCategory;
        return (
          <Pressable
            key={category}
            onPress={() => onSelectCategory(category)}
            className="px-6 py-3 rounded-full"
            style={{
              backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
              borderWidth: isSelected ? 0 : 1,
              borderColor: theme.colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text
              className="text-sm font-medium"
              style={{ color: isSelected ? '#fff' : theme.colors.text }}
            >
              {category}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
