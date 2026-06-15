import { useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { useSelector, useDispatch } from 'react-redux';
import api from '../services/api';

/**
 * useNotifications
 *
 * Sets up FCM on app launch:
 *  1. Requests permission (iOS explicit, Android implicit on API < 33).
 *  2. Gets the FCM token and POSTs it to our backend.
 *  3. Sets up a background message handler.
 *  4. Returns an `onForegroundMessage` registrar and the raw `messaging` instance.
 *
 * Call this hook once, inside a component that is always mounted (e.g. App.js).
 */
const useNotifications = ({ onForegroundMessage, onNotificationTap } = {}) => {
  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const unsubscribeRef = useRef(null);

  // ─── Background / Quit State Handler (must be outside component lifecycle) ────
  // This is registered once at module level. We do it here safely.
  useEffect(() => {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('[FCM] Background message received:', remoteMessage);
      // Background messages are handled by the OS notification tray.
      // Navigation on tap is handled by the notification-open listener below.
    });
  }, []);

  // ─── Foreground & Token Setup ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const setup = async () => {
      try {
        // 1. Request permissions (critical for iOS)
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.warn('[FCM] Notification permission denied.');
          return;
        }

        // 2. Get FCM token
        const fcmToken = await messaging().getToken();
        console.log('[FCM] Device token:', fcmToken);

        if (!cancelled && fcmToken) {
          // 3. Push token to our backend
          await api.post('/users/fcm-token', { fcmToken });
          console.log('[FCM] Token registered with backend.');
        }

        // 4. Foreground message listener
        unsubscribeRef.current = messaging().onMessage(async (remoteMessage) => {
          console.log('[FCM] Foreground message:', remoteMessage);
          if (onForegroundMessage) {
            onForegroundMessage(remoteMessage);
          }
        });

        // 5. Listen for notification open (background state tap)
        messaging().onNotificationOpenedApp((remoteMessage) => {
          console.log('[FCM] Notification opened from background:', remoteMessage);
          if (onNotificationTap) {
            onNotificationTap(remoteMessage);
          }
        });

        // 6. Handle quit-state notification tap
        const initialMessage = await messaging().getInitialNotification();
        if (initialMessage) {
          console.log('[FCM] App opened from quit state via notification:', initialMessage);
          // Small delay to allow navigator to mount
          setTimeout(() => {
            if (onNotificationTap) {
              onNotificationTap(initialMessage);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('[FCM] Setup error:', error.message);
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isAuthenticated]);

  return { messaging };
};

export default useNotifications;
