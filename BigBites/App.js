import React, { useRef, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import useNotifications from './src/hooks/useNotifications';
import InAppToast from './src/components/InAppToast';
import SentryErrorBoundary from './src/components/SentryErrorBoundary';

// ─── Sentry — only init when DSN is present (skips gracefully in local dev) ───
let Sentry = null;
try {
  Sentry = require('@sentry/react-native');
  if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      enabled: process.env.NODE_ENV === 'production',
      attachStacktrace: true,
      tracesSampleRate: 0.2,
      environment: process.env.NODE_ENV || 'development',
    });
  }
} catch (e) {
  // Sentry native module not available in Expo Go — continue without it
  console.log('[Sentry] Skipped (native module not linked):', e.message);
  Sentry = null;
}

// ─── Inner component (has Redux + nav context) ────────────────────────────────
const AppContent = ({ navigationRef }) => {
  const [foregroundNotification, setForegroundNotification] = useState(null);

  const handleNotificationTap = useCallback((data) => {
    if (data?.orderId && navigationRef.current) {
      navigationRef.current.navigate('OrderTracking', { orderId: data.orderId });
    }
  }, []);

  const handleForegroundMessage = useCallback((remoteMessage) => {
    setForegroundNotification(remoteMessage);
  }, []);

  useNotifications({
    onForegroundMessage: handleForegroundMessage,
    onNotificationTap: handleNotificationTap,
  });

  return (
    <>
      <RootNavigator />
      <StatusBar style="light" />
      <InAppToast
        notification={foregroundNotification}
        onPress={(data) => {
          setForegroundNotification(null);
          handleNotificationTap(data);
        }}
      />
    </>
  );
};

// ─── Root component ───────────────────────────────────────────────────────────
function App() {
  const navigationRef = useRef(null);

  return (
    <SentryErrorBoundary>
      <Provider store={store}>
        <NavigationContainer
          ref={navigationRef}
          onStateChange={() => {
            if (Sentry) {
              const route = navigationRef.current?.getCurrentRoute();
              if (route) Sentry.setTag('active_screen', route.name);
            }
          }}
        >
          <AppContent navigationRef={navigationRef} />
        </NavigationContainer>
      </Provider>
    </SentryErrorBoundary>
  );
}

// Wrap with Sentry only if available
export default Sentry ? Sentry.wrap(App) : App;
