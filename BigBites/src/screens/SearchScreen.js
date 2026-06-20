import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Keyboard, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, X, Star, Clock, MapPin, Check } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import api from '../services/api';

const SearchSkeleton = () => (
  <View className="px-4 mt-4">
    <View className="w-40 h-6 bg-gray-200 rounded animate-pulse mb-4" />
    {[1, 2, 3, 4].map((i) => (
      <View key={i} className="flex-row mb-4 bg-white p-3 rounded-2xl border border-gray-100">
        <View className="flex-1 pr-3 justify-center">
          <View className="w-3/4 h-5 bg-gray-200 rounded animate-pulse mb-2" />
          <View className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2" />
          <View className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
        </View>
        <View className="w-24 h-24 bg-gray-200 rounded-xl animate-pulse" />
      </View>
    ))}
  </View>
);

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    
    Keyboard.dismiss();
    setIsLoading(true);
    setHasSearched(true);
    setResults([]);
    setFilters(null);

    try {
      const res = await api.get(`/search/natural?q=${encodeURIComponent(q)}&lat=28.6139&lng=77.2090`);
      if (res.data?.success) {
        setResults(res.data.data.results || []);
        setFilters(res.data.data.filters || null);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFilterChips = () => {
    if (!filters) return null;
    const chips = [];
    if (filters.cuisine && filters.cuisine.length > 0) chips.push(...filters.cuisine);
    if (filters.isVeg === true) chips.push('Veg');
    if (filters.isVeg === false) chips.push('Non-Veg');
    if (filters.maxPrice) chips.push(`Under ₹${filters.maxPrice}`);
    if (filters.spiceLevel) chips.push(filters.spiceLevel);
    if (filters.minRating) chips.push(`${filters.minRating}+ Stars`);
    if (filters.mealType) chips.push(filters.mealType);

    if (chips.length === 0) return null;

    return (
      <View className="px-4 mt-3 mb-1">
        <Text className="text-gray-500 text-xs mb-2">Filters recognized by AI:</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={chips}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full mr-2 flex-row items-center">
              <Check color={COLORS.primary} size={12} className="mr-1" />
              <Text className="text-primary text-xs font-bold capitalize">{item}</Text>
            </View>
          )}
        />
      </View>
    );
  };

  const renderDishCard = ({ item }) => (
    <TouchableOpacity 
      className="bg-white mx-4 mb-4 rounded-2xl shadow-sm border border-gray-100 flex-row p-3"
      onPress={() => navigation.navigate('RestaurantDetail', { id: item.restaurant.id })}
    >
      <View className="flex-1 pr-3">
        <View className="flex-row items-center mb-1">
          <View className={`w-3 h-3 rounded-sm border ${item.isVeg ? 'border-green-600' : 'border-red-600'} items-center justify-center mr-2`}>
            <View className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
          </View>
          <Text className="text-gray-800 font-bold text-base flex-1" numberOfLines={1}>{item.name}</Text>
        </View>
        <Text className="text-gray-500 text-xs mb-2" numberOfLines={2}>{item.description || item.category}</Text>
        <Text className="text-gray-800 font-bold mb-2">₹{item.price}</Text>
        
        <View className="flex-row items-center">
          <MapPin color={COLORS.textMuted} size={12} />
          <Text className="text-xs text-gray-500 ml-1 mr-3" numberOfLines={1}>{item.restaurant.name}</Text>
          <Star color="#10B981" size={12} />
          <Text className="text-xs text-green-600 font-bold ml-1 mr-3">{item.restaurant.rating}</Text>
          <Clock color={COLORS.textMuted} size={12} />
          <Text className="text-xs text-gray-500 ml-1">{item.restaurant.deliveryTime}m</Text>
        </View>
      </View>
      <View className="w-24 h-24 bg-gray-100 rounded-xl items-center justify-center overflow-hidden border border-gray-200">
        <Text className="text-3xl">🍽️</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header Search Bar */}
      <View className="flex-row items-center bg-white px-4 py-3 border-b border-gray-100 shadow-sm z-10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <ArrowLeft color="#1F2937" size={24} />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
          <Search color={COLORS.textMuted} size={20} />
          <TextInput
            ref={inputRef}
            className="flex-1 ml-2 text-base text-gray-800 h-8"
            placeholder="Try 'healthy veg lunch under ₹200'"
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X color={COLORS.textMuted} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <SearchSkeleton />
      ) : hasSearched ? (
        <>
          {renderFilterChips()}
          {results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item._id}
              renderItem={renderDishCard}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-6xl mb-4">🤷‍♂️</Text>
              <Text className="text-xl font-bold text-gray-800 text-center mb-2">No exact matches</Text>
              <Text className="text-gray-500 text-center">Try describing what you're craving in a different way or check your spelling.</Text>
            </View>
          )}
        </>
      ) : (
        <View className="p-4 mt-2">
          <Text className="text-lg font-bold text-gray-800 mb-4">AI Search Suggestions</Text>
          <View className="flex-row flex-wrap">
            {[
              'healthy veg lunch under ₹200', 
              'spicy chicken near me', 
              'highly rated pizza', 
              'cheap desserts',
              'something sweet'
            ].map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                className="bg-white border border-gray-200 px-4 py-2 rounded-full mr-2 mb-3 shadow-sm flex-row items-center"
                onPress={() => {
                  setQuery(suggestion);
                  handleSearch(suggestion);
                }}
              >
                <Search color={COLORS.primary} size={14} className="mr-2" />
                <Text className="text-gray-700 font-medium">{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
