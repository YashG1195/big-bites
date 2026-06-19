import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, SectionList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeartCrack, ChevronRight, Star } from 'lucide-react-native';
import { useGetFavouriteRestaurantsQuery, useGetFavouriteDishesQuery } from '../store/favouritesSlice';
import FavouriteButton from '../components/FavouriteButton';

export default function FavouritesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('restaurants'); // 'restaurants' | 'dishes'

  const { data: restaurants, isLoading: loadingRestaurants } = useGetFavouriteRestaurantsQuery();
  const { data: dishesGroups, isLoading: loadingDishes } = useGetFavouriteDishesQuery();

  const renderEmpty = (title, message) => (
    <View className="flex-1 justify-center items-center py-20 px-8">
      <HeartCrack size={64} color="#D1D5DB" className="mb-4" />
      <Text className="text-xl font-bold text-gray-800 mb-2">{title}</Text>
      <Text className="text-gray-500 text-center mb-6">{message}</Text>
      <TouchableOpacity 
        className="bg-[#FF6B35] px-6 py-3 rounded-full"
        onPress={() => navigation.navigate('Home')}
      >
        <Text className="text-white font-bold">Browse restaurants</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRestaurant = ({ item }) => (
    <TouchableOpacity 
      className="bg-white rounded-xl mb-4 overflow-hidden border border-gray-100 shadow-sm mx-2"
      style={{ width: '46%' }}
      onPress={() => navigation.navigate('RestaurantDetail', { id: item._id })}
    >
      <View className="relative w-full h-32">
        <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
        <View className="absolute top-2 right-2">
          <FavouriteButton type="restaurant" restaurantId={item._id} initialState={true} size={16} />
        </View>
      </View>
      <View className="p-3">
        <Text className="font-bold text-gray-800" numberOfLines={1}>{item.name}</Text>
        <View className="flex-row items-center mt-1">
          <Star color="#10B981" size={12} fill="#10B981" />
          <Text className="text-xs text-gray-600 ml-1">{item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDish = ({ item, section }) => (
    <View className="flex-row p-4 border-b border-gray-100 bg-white items-center">
      <View className="flex-1 pr-4">
        <View className="flex-row items-center mb-1">
          <View className={`w-3 h-3 border flex items-center justify-center mr-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
            <View className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
          </View>
          <Text className="text-gray-800 font-bold text-base">{item.name}</Text>
        </View>
        <Text className="text-gray-800 font-medium text-sm mb-1">₹{item.price}</Text>
      </View>
      <View className="flex-row items-center">
        <FavouriteButton 
          type="dish" 
          restaurantId={section.restaurantId} 
          menuItemId={item.menuItemId} 
          initialState={true} 
          size={18}
        />
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }) => (
    <TouchableOpacity 
      className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex-row justify-between items-center"
      onPress={() => navigation.navigate('RestaurantDetail', { id: section.restaurantId })}
    >
      <Text className="text-gray-800 font-bold text-lg">{section.restaurantName}</Text>
      <ChevronRight size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Text className="text-2xl font-bold text-gray-900 px-4 pt-2 mb-4">Favourites</Text>
      
      {/* Segmented Control */}
      <View className="flex-row px-4 mb-4">
        <View className="flex-row flex-1 bg-gray-100 rounded-lg p-1">
          <TouchableOpacity 
            className={`flex-1 py-2 items-center rounded-md ${activeTab === 'restaurants' ? 'bg-white shadow-sm' : ''}`}
            onPress={() => setActiveTab('restaurants')}
          >
            <Text className={`font-bold ${activeTab === 'restaurants' ? 'text-gray-900' : 'text-gray-500'}`}>Restaurants</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-2 items-center rounded-md ${activeTab === 'dishes' ? 'bg-white shadow-sm' : ''}`}
            onPress={() => setActiveTab('dishes')}
          >
            <Text className={`font-bold ${activeTab === 'dishes' ? 'text-gray-900' : 'text-gray-500'}`}>Dishes</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1 bg-gray-50">
        {activeTab === 'restaurants' ? (
          loadingRestaurants ? <ActivityIndicator size="large" color="#FF6B35" className="mt-10" /> :
          <FlatList
            data={restaurants || []}
            keyExtractor={item => item._id}
            renderItem={renderRestaurant}
            numColumns={2}
            contentContainerStyle={{ padding: 8 }}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 4 }}
            ListEmptyComponent={renderEmpty('No favourite restaurants', 'You haven\'t added any restaurants to your favourites yet.')}
          />
        ) : (
          loadingDishes ? <ActivityIndicator size="large" color="#FF6B35" className="mt-10" /> :
          <SectionList
            sections={dishesGroups || []}
            keyExtractor={(item, index) => item.menuItemId + index}
            renderItem={renderDish}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={{ paddingBottom: 20 }}
            stickySectionHeadersEnabled={true}
            ListEmptyComponent={renderEmpty('No favourite dishes', 'You haven\'t added any dishes to your favourites yet.')}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
