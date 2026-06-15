import React, { useRef, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { NavigationContainer } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import RootNavigator from './src/navigation/RootNavigator';
import useNotifications from './src/hooks/useNotifications';
import InAppToast from './src/components/InAppToast';
import SentryErrorBoundary from './src/components/SentryErrorBoundary';

// ─── Initialize Sentry as early as possible ───────────────────────────────────
// DSN is pulled from the EAS/Expo env variable (set in eas.json > env)
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  // Only send events in production — keep local dev console clean
  enabled: process.env.NODE_ENV === 'production',
  // Attach JS stack traces to all events
  attachStacktrace: true,
  // Track navigation changes automatically
  integrations: [
    Sentry.mobileReplayIntegration(),
  ],
  tracesSampleRate: 0.2,   // 20% of transactions for performance monitoring
  profilesSampleRate: 0.1, // 10% of traces for profiling
  environment: process.env.NODE_ENV || 'development',
});

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
    // SentryErrorBoundary catches render errors and reports them to Sentry
    <SentryErrorBoundary>
      <Provider store={store}>
        <NavigationContainer
          ref={navigationRef}
          // Notify Sentry when the active route changes (screen tracking)
          onReady={() => {
            Sentry.setTag('initial_screen', navigationRef.current?.getCurrentRoute()?.name);
          }}
          onStateChange={() => {
            const route = navigationRef.current?.getCurrentRoute();
            if (route) {
              Sentry.setTag('active_screen', route.name);
            }
          }}
        >
          <AppContent navigationRef={navigationRef} />
        </NavigationContainer>
      </Provider>
    </SentryErrorBoundary>
  );
}

// Wrap with Sentry.wrap for automatic crash reporting and session tracking
export default Sentry.wrap(App);
