import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import TabNavigator from './TabNavigator';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import PhoneEntryScreen from '../screens/PhoneEntryScreen';
import OTPVerifyScreen from '../screens/OTPVerifyScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import SavedAddressesScreen from '../screens/SavedAddressesScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import SupportChatScreen from '../screens/SupportChatScreen';

import { View, Text } from 'react-native';
import { COLORS } from '../constants/colors';

const Stack = createStackNavigator();

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
          <Stack.Screen name="AddAddress" component={AddAddressScreen} options={{ title: 'Add Address', headerBackTitle: 'Back' }} />
          <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} options={{ title: 'Saved Addresses', headerBackTitle: 'Back' }} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'Your Orders', headerBackTitle: 'Back' }} />
          <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="SupportChat" component={SupportChatScreen} options={{ headerShown: false }} />
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
