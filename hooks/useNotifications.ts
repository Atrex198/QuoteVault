import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const NOTIFICATION_TIME_KEY = '@notification_time';
const NOTIFICATION_ENABLED_KEY = '@notifications_enabled';

// Helper function to get today's quote
async function getTodaysDailyQuote() {
  const today = new Date().toISOString().split('T')[0];

  const { data: dailyQuoteData } = await supabase
    .from('daily_quotes')
    .select(`
      date,
      quote_id,
      quotes (
        id,
        content,
        author,
        category
      )
    `)
    .eq('date', today)
    .single();

  if (!dailyQuoteData) {
    throw new Error('No daily quote found');
  }

  // Return the quote from the joined data
  const quoteData = dailyQuoteData.quotes;
  const quote = Array.isArray(quoteData) ? quoteData[0] : quoteData;
  
  return {
    content: quote.content,
    author: quote.author,
  };
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    enabled: true,
    hour: 9, // Default 9:00 AM
    minute: 0,
  });
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Load saved settings
    loadSettings();

    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
    });

    // Setup notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const [timeStr, enabledStr] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATION_TIME_KEY),
        AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY),
      ]);

      if (timeStr) {
        const [hour, minute] = timeStr.split(':').map(Number);
        setNotificationSettings(prev => ({
          ...prev,
          hour,
          minute,
        }));
      }

      if (enabledStr !== null) {
        setNotificationSettings(prev => ({
          ...prev,
          enabled: enabledStr === 'true',
        }));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const saveSettings = async (settings: NotificationSettings) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(NOTIFICATION_TIME_KEY, `${settings.hour}:${settings.minute}`),
        AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, String(settings.enabled)),
      ]);
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      setPermissionStatus(finalStatus);

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        setPermissionStatus(finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Update with your Expo project ID
      })).data;
      console.log('📱 Push token:', token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  };

  const scheduleDailyNotification = async (hour: number, minute: number) => {
    try {
      // Cancel all existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!notificationSettings.enabled) {
        console.log('Notifications are disabled');
        return;
      }

      // Get today's quote for the notification
      const quote = await getTodaysDailyQuote();

      // Schedule daily notification
      const trigger: Notifications.DailyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '✨ Quote of the Day',
          body: `"${quote.content}" — ${quote.author}`,
          data: { type: 'daily-quote', quoteContent: quote.content, quoteAuthor: quote.author },
          sound: 'default',
        },
        trigger,
      });

      console.log('✅ Daily notification scheduled for', `${hour}:${minute}`, 'ID:', id);
      return id;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  };

  const updateNotificationTime = async (hour: number, minute: number) => {
    const newSettings = { ...notificationSettings, hour, minute };
    await saveSettings(newSettings);
    
    if (newSettings.enabled) {
      await scheduleDailyNotification(hour, minute);
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    const newSettings = { ...notificationSettings, enabled };
    await saveSettings(newSettings);

    if (enabled) {
      await scheduleDailyNotification(newSettings.hour, newSettings.minute);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🔕 Notifications disabled');
    }
  };

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    return status === 'granted';
  };

  const sendTestNotification = async () => {
    try {
      // Get today's quote for the test notification
      const quote = await getTodaysDailyQuote();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✨ Quote of the Day',
          body: `"${quote.content}" — ${quote.author}`,
          data: { type: 'test', quoteContent: quote.content, quoteAuthor: quote.author },
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });
      console.log('Test notification scheduled');
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  return {
    expoPushToken,
    notificationSettings,
    permissionStatus,
    updateNotificationTime,
    toggleNotifications,
    requestPermissions,
    sendTestNotification,
    scheduleDailyNotification,
  };
}
