import React, { useRef, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { COLORS } from '../constants/colors';
import CartBounce from '../components/CartBounce';
import HomeScreen from '../screens/HomeScreen';
import FavouritesScreen from '../screens/FavouritesScreen';
import { Heart } from 'lucide-react-native';
import { useGetFavouriteRestaurantsQuery, useGetFavouriteDishesQuery } from '../store/favouritesSlice';

const Tab = createBottomTabNavigator();

// Placeholder screens for tabs
const SearchScreen  = () => <View style={styles.placeholder}><Text style={styles.placeholderText}>Search</Text></View>;
const CartScreen    = () => <View style={styles.placeholder}><Text style={styles.placeholderText}>Cart</Text></View>;
const ProfileScreen = () => <View style={styles.placeholder}><Text style={styles.placeholderText}>Profile</Text></View>;

// ─── Animated cart tab icon ────────────────────────────────────────────────────
const CartTabIcon = ({ color, focused }) => {
  const bounceRef = useRef(null);
  const cartItemCount = useSelector((state) => state.cart.items.length);
  const prevCount = useRef(cartItemCount);

  useEffect(() => {
    // Fire bounce only when items are ADDED (count increases)
    if (cartItemCount > prevCount.current) {
      bounceRef.current?.bounce();
    }
    prevCount.current = cartItemCount;
  }, [cartItemCount]);

  return (
    <CartBounce ref={bounceRef}>
      <View style={styles.cartIconContainer}>
        {/* Simple cart emoji icon — swap for any icon library */}
        <Text style={[styles.tabIcon, { color }]}>🛒</Text>
        {cartItemCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {cartItemCount > 9 ? '9+' : cartItemCount}
            </Text>
          </View>
        )}
      </View>
    </CartBounce>
  );
};

// ─── Animated Favourites tab icon ──────────────────────────────────────────────
const FavouritesTabIcon = ({ color, focused }) => {
  const { data: restaurants } = useGetFavouriteRestaurantsQuery();
  const { data: dishes } = useGetFavouriteDishesQuery();

  let count = (restaurants?.length || 0);
  if (dishes) {
    count += dishes.reduce((acc, curr) => acc + curr.dishes.length, 0);
  }

  return (
    <View style={styles.cartIconContainer}>
      <Heart color={color} size={24} fill={focused ? color : 'transparent'} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {count > 9 ? '9+' : count}
          </Text>
        </View>
      )}
    </View>
  );
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>🔍</Text>,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          // Use our animated icon component
          tabBarIcon: ({ color, focused }) => (
            <CartTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Favourites"
        component={FavouritesScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <FavouritesTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={[styles.tabIcon, { color }]}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  placeholderText: {
    color: COLORS.text,
    fontSize: 18,
  },
  tabIcon: {
    fontSize: 22,
  },
  cartIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
