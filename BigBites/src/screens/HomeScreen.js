import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurants } from '../store/slices/restaurantsSlice';
import { MapPin, ChevronDown, Search, Star, Clock, Utensils, Pizza, Coffee, Beef } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const CATEGORIES = [
  { id: '1', name: 'Biryani', icon: Beef },
  { id: '2', name: 'Pizza', icon: Pizza },
  { id: '3', name: 'Burger', icon: Utensils },
  { id: '4', name: 'Chinese', icon: Utensils },
  { id: '5', name: 'Desserts', icon: Coffee },
];

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { list: restaurants, isLoading } = useSelector((state) => state.restaurants);

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  const renderCategory = ({ item }) => {
    const IconComponent = item.icon;
    return (
      <TouchableOpacity className="items-center mr-4 mt-4">
        <View className="w-16 h-16 bg-surface rounded-full items-center justify-center border border-border shadow-sm">
          <IconComponent color={COLORS.primary} size={28} />
        </View>
        <Text className="text-textMuted text-xs font-medium mt-2">{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderRestaurantSkeleton = () => (
    <View className="bg-surface rounded-2xl mb-4 overflow-hidden border border-border">
      <View className="w-full h-48 bg-border animate-pulse" />
      <View className="p-4">
        <View className="w-3/4 h-5 bg-border rounded animate-pulse mb-3" />
        <View className="flex-row items-center space-x-2 mb-2">
          <View className="w-10 h-4 bg-border rounded animate-pulse" />
          <View className="w-20 h-4 bg-border rounded animate-pulse" />
        </View>
        <View className="w-1/2 h-4 bg-border rounded animate-pulse" />
      </View>
    </View>
  );

  const renderRestaurantCard = ({ item }) => (
    <TouchableOpacity 
      className="bg-surface rounded-2xl mb-4 overflow-hidden border border-border"
      activeOpacity={0.9}
      onPress={() => navigation.navigate('RestaurantDetail', { id: item.id })}
    >
      <View className="relative w-full h-48">
        <Image 
          source={{ uri: item.image }} 
          className="w-full h-full"
          resizeMode="cover"
        />
        {item.discount && (
          <View className="absolute top-3 left-0 bg-primary px-3 py-1 rounded-r-lg shadow-md">
            <Text className="text-white font-bold text-xs">{item.discount}</Text>
          </View>
        )}
      </View>

      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-text font-bold text-lg flex-1 mr-2">{item.name}</Text>
          <View className="flex-row items-center bg-green-700 px-2 py-1 rounded">
            <Text className="text-white font-bold text-xs mr-1">{item.rating}</Text>
            <Star color="white" size={10} fill="white" />
          </View>
        </View>

        <View className="flex-row items-center mb-2">
          <Clock color={COLORS.textMuted} size={14} />
          <Text className="text-textMuted text-xs ml-1">{item.deliveryTime}</Text>
          <Text className="text-textMuted text-xs mx-2">•</Text>
          <Text className="text-textMuted text-xs">Min {item.minOrder}</Text>
        </View>

        <Text className="text-textMuted text-xs" numberOfLines={1}>
          {item.cuisines.join(', ')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View className="pb-4">
      {/* Top Bar: Location & Search */}
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <View className="flex-row items-center flex-1">
          <MapPin color={COLORS.primary} size={24} />
          <View className="ml-2 flex-1">
            <View className="flex-row items-center">
              <Text className="text-text font-bold text-lg mr-1">Home</Text>
              <ChevronDown color={COLORS.text} size={20} />
            </View>
            <Text className="text-textMuted text-xs" numberOfLines={1}>123 Main Street, New York, NY</Text>
          </View>
        </View>
        <View className="w-10 h-10 bg-surface rounded-full items-center justify-center">
          <Text className="text-lg">👤</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 py-3 mb-2">
        <Search color={COLORS.primary} size={20} />
        <TextInput 
          placeholder="Restaurant name or dish..."
          placeholderTextColor={COLORS.textMuted}
          className="flex-1 ml-3 text-text font-medium"
        />
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        contentContainerStyle={{ paddingRight: 20, paddingBottom: 10 }}
      />
      
      <Text className="text-text font-bold text-xl mt-6 mb-4">Top Restaurants</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background px-4">
      <FlatList
        data={isLoading ? [1, 2, 3, 4] : restaurants}
        keyExtractor={(item, index) => isLoading ? index.toString() : item.id}
        renderItem={isLoading ? renderRestaurantSkeleton : renderRestaurantCard}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        getItemLayout={(data, index) => (
          { length: 280, offset: 280 * index, index } // 280 is approx card height + margin
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}
