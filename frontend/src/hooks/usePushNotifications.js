import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import io from 'socket.io-client';
import api from '../utils/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(user) {
  useEffect(() => {
    if (!user || !user._id) return;

    // 1. Setup Push Notifications via Expo Notifications
    async function registerForPushNotificationsAsync() {
      let token;
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (token) {
          await api.post('/api/notifications/push-token', { token });
        }
      } catch (error) {
        console.log('Error registering push token:', error.message);
      }
    }

    registerForPushNotificationsAsync();

    // 2. Setup real-time Socket.io listener for instant foreground alerts
    const socketUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';
    const socket = io(socketUrl, {
      transports: ['websocket'],
      forceNew: true,
    });

    socket.on('connect', () => {
      console.log('Socket.io connected to', socketUrl);
    });

    socket.on(`notification:${user._id}`, async (data) => {
      console.log('Real-time notification received via Socket.io:', data);

      // Trigger local in-app alert via Alert
      Alert.alert('HelaParking Notification', data.message);

      // Trigger local push notification
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'HelaParking',
            body: data.message,
            data: { type: data.type, relatedId: data.relatedId },
          },
          trigger: null,
        });
      } catch (err) {
        console.error('Error scheduling local notification:', err.message);
      }
    });

    // Tap notification handler
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped by user:', response);
    });

    return () => {
      socket.disconnect();
      responseListener.remove();
    };
  }, [user]);
}
