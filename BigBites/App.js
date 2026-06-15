import React, { useRef, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider, useSelector } from 'react-redux';
import { store } from './src/store';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import useNotifications from './src/hooks/useNotifications';
import InAppToast from './src/components/InAppToast';

/**
 * Inner component that has access to Redux state and the navigation ref.
 * Keeps App.js clean — notification logic lives here.
 */
const AppContent = ({ navigationRef }) => {
  const [foregroundNotification, setForegroundNotification] = useState(null);

  // Navigate to OrderTracking when a notification is tapped
  const handleNotificationTap = useCallback((data) => {
    if (data?.orderId && navigationRef.current) {
      navigationRef.current.navigate('OrderTracking', { orderId: data.orderId });
    }
  }, []);

  // Show in-app toast for foreground messages
  const handleForegroundMessage = useCallback((remoteMessage) => {
    setForegroundNotification(remoteMessage);
  }, []);

  // Initialize FCM (runs once after login)
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

export default function App() {
  const navigationRef = useRef(null);

  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <AppContent navigationRef={navigationRef} />
      </NavigationContainer>
    </Provider>
  );
}
