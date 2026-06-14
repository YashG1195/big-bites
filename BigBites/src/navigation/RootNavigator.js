import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import TabNavigator from './TabNavigator';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import PhoneEntryScreen from '../screens/PhoneEntryScreen';
import OTPVerifyScreen from '../screens/OTPVerifyScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';

import { View, Text } from 'react-native';
import { COLORS } from '../constants/colors';

const Stack = createStackNavigator();

// Placeholder screens for stack
const CheckoutScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Checkout</Text></View>;

export default function RootNavigator() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTintColor: COLORS.text,
      }}
    >
      {isAuthenticated ? (
        // App Stack
        <>
          <Stack.Screen 
            name="MainTabs" 
            component={TabNavigator} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
          <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ headerShown: false }} />
        </>
      ) : (
        // Auth Stack
        <>
          <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OTPVerify" component={OTPVerifyScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
}
