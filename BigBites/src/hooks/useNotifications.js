import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

// Lazy-load messaging — not available in Expo Go, only in dev client / production builds
let messaging = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (e) {
  console.log('[FCM] @react-native-firebase/messaging not available (Expo Go). Notifications disabled.');
}

/**
 * useNotifications
 *
 * Sets up FCM on app launch:
 *  1. Requests permission (iOS explicit, Android implicit).
 *  2. Gets the FCM token and POSTs it to our backend.
 *  3. Sets up foreground, background, and notification-tap handlers.
 *
 * Gracefully no-ops if running in Expo Go (where native Firebase modules aren't linked).
 */
const useNotifications = ({ onForegroundMessage, onNotificationTap } = {}) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const unsubscribeRef = useRef(null);

  // Background message handler — registered at module level
  useEffect(() => {
    if (!messaging) return;
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[FCM] Background message:', remoteMessage);
    });
  }, []);

  useEffect(() => {
    if (!messaging || !isAuthenticated) return;

    let cancelled = false;

    const setup = async () => {
      try {
        // 1. Request permissions
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.warn('[FCM] Notification permission denied.');
          return;
        }

        // 2. Get token
        const fcmToken = await messaging().getToken();
        console.log('[FCM] Token:', fcmToken?.slice(0, 20) + '...');

        if (!cancelled && fcmToken) {
          await api.post('/users/fcm-token', { fcmToken });
        }

        // 3. Foreground listener
        unsubscribeRef.current = messaging().onMessage(async (remoteMessage) => {
          if (onForegroundMessage) onForegroundMessage(remoteMessage);
        });

        // 4. Background-state tap
        messaging().onNotificationOpenedApp((remoteMessage) => {
          if (onNotificationTap) onNotificationTap(remoteMessage);
        });

        // 5. Quit-state tap
        const initialMessage = await messaging().getInitialNotification();
        if (initialMessage) {
          setTimeout(() => {
            if (onNotificationTap) onNotificationTap(initialMessage);
          }, 1000);
        }
      } catch (error) {
        console.error('[FCM] Setup error:', error.message);
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [isAuthenticated]);
};

export default useNotifications;
