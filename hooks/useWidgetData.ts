import { useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { useDailyQuote } from './useDailyQuote';
import type { Quote } from '@/types';

const WIDGET_DATA_PATH = `${FileSystem.documentDirectory}widget-data.json`;

interface WidgetData {
  content: string;
  author: string;
  category: string;
  lastUpdated: string;
}

/**
 * Hook to manage widget data
 * Stores daily quote data in a file that can be accessed by native widgets
 */
export function useWidgetData() {
  const { data: dailyQuote } = useDailyQuote();

  useEffect(() => {
    if (dailyQuote) {
      updateWidgetData(dailyQuote);
    }
  }, [dailyQuote]);

  const updateWidgetData = async (quote: Quote) => {
    try {
      const widgetData: WidgetData = {
        content: quote.content,
        author: quote.author,
        category: quote.category || 'Inspiration',
        lastUpdated: new Date().toISOString(),
      };

      await FileSystem.writeAsStringAsync(
        WIDGET_DATA_PATH,
        JSON.stringify(widgetData)
      );
      
      console.log('✅ Widget data updated:', WIDGET_DATA_PATH);
      
      // Trigger native widget update on Android
      if (Platform.OS === 'android') {
        try {
          const { sendBroadcast } = require('react-native').NativeModules;
          if (sendBroadcast) {
            // Broadcast intent to update widget
            const intent = {
              action: 'com.quotevault.app.UPDATE_WIDGET',
            };
            // Note: This requires a native module, but widget will update on next system refresh
            console.log('📱 Widget will update on next system refresh');
          }
        } catch (error) {
          console.log('Widget update broadcast not available, widget will update on next refresh');
        }
      }
    } catch (error) {
      console.error('Failed to update widget data:', error);
    }
  };

  const getWidgetData = async (): Promise<WidgetData | null> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(WIDGET_DATA_PATH);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(WIDGET_DATA_PATH);
        return JSON.parse(content);
      }
      return null;
    } catch (error) {
      console.error('Failed to read widget data:', error);
      return null;
    }
  };

  return {
    updateWidgetData,
    getWidgetData,
  };
}
