import React, { useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, SectionList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart } from '../store/slices/cartSlice';
import { ArrowLeft, Star, Plus, Minus, Info, Clock } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 250;
const HEADER_MIN_HEIGHT = 90;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const MOCK_MENU = [
  {
    title: 'Starters',
    data: [
      { id: 'm1', name: 'Paneer Tikka', description: 'Soft paneer marinated in rich spices and roasted in tandoor', price: 250, isVeg: true },
      { id: 'm2', name: 'Chicken 65', description: 'Spicy, deep-fried chicken dish originating from Chennai', price: 320, isVeg: false },
    ]
  },
  {
    title: 'Main Course',
    data: [
      { id: 'm3', name: 'Butter Chicken', description: 'Classic creamy chicken curry with a sweet and savory profile', price: 450, isVeg: false },
      { id: 'm4', name: 'Dal Makhani', description: 'Rich black lentils cooked overnight with butter and cream', price: 300, isVeg: true },
      { id: 'm5', name: 'Garlic Naan', description: 'Soft Indian bread topped with garlic and butter', price: 70, isVeg: true },
    ]
  },
  {
    title: 'Desserts',
    data: [
      { id: 'm6', name: 'Gulab Jamun', description: 'Deep fried milk dough balls dipped in sugar syrup', price: 120, isVeg: true },
      { id: 'm7', name: 'Rasmalai', description: 'Soft paneer discs soaked in thickened, sweetened milk', price: 150, isVeg: true },
    ]
  }
];

export default function RestaurantDetailScreen({ route, navigation }) {
  const { id } = route.params || { id: '1' };
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeCategory, setActiveCategory] = useState('Starters');
  
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -HEADER_SCROLL_DISTANCE],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const getCartItemQuantity = (itemId) => {
    const item = cart.items.find((i) => i.id === itemId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = (item) => {
    dispatch(addToCart({ item, restaurantId: id }));
  };

  const handleRemoveFromCart = (itemId) => {
    dispatch(removeFromCart(itemId));
  };

  const renderMenuItem = ({ item }) => {
    const quantity = getCartItemQuantity(item.id);
    
    return (
      <View className="flex-row p-4 border-b border-border bg-surface">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center mb-1">
            <View className={`w-4 h-4 border flex items-center justify-center mr-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
              <View className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
            </View>
            <Text className="text-text font-bold text-lg">{item.name}</Text>
          </View>
          <Text className="text-text font-medium text-base mb-1">₹{item.price}</Text>
          <Text className="text-textMuted text-sm" numberOfLines={2}>{item.description}</Text>
        </View>

        <View className="items-center justify-center w-28">
          {/* Placeholder for item image */}
          <View className="w-full h-24 bg-border rounded-xl mb-3 shadow" />
          
          <View className="absolute bottom-0 bg-white rounded-lg border border-primary overflow-hidden w-24 h-9 shadow">
            {quantity > 0 ? (
              <View className="flex-row items-center justify-between w-full h-full bg-white">
                <TouchableOpacity className="flex-1 items-center justify-center" onPress={() => handleRemoveFromCart(item.id)}>
                  <Minus color={COLORS.primary} size={16} />
                </TouchableOpacity>
                <Text className="text-primary font-bold text-base">{quantity}</Text>
                <TouchableOpacity className="flex-1 items-center justify-center" onPress={() => handleAddToCart(item)}>
                  <Plus color={COLORS.primary} size={16} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity className="flex-1 items-center justify-center bg-white" onPress={() => handleAddToCart(item)}>
                <Text className="text-primary font-bold text-base uppercase">ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View className="bg-background px-4 py-3 border-b border-border">
      <Text className="text-text font-bold text-xl">{title}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Animated Header */}
      <Animated.View 
        className="absolute top-0 left-0 right-0 z-10 bg-surface overflow-hidden"
        style={{ height: HEADER_MAX_HEIGHT, transform: [{ translateY: headerTranslateY }] }}
      >
        <Animated.Image
          source={{ uri: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80' }}
          className="absolute top-0 left-0 right-0 w-full h-full"
          style={{ opacity: imageOpacity }}
        />
        <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/40" />
        
        {/* Back Button & Title Area */}
        <SafeAreaView className="flex-1 justify-between p-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity 
              className="w-10 h-10 bg-white/30 rounded-full items-center justify-center backdrop-blur-md"
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft color="#FFFFFF" size={24} />
            </TouchableOpacity>
          </View>

          <Animated.View style={{ opacity: imageOpacity }}>
            <Text className="text-white font-bold text-3xl mb-1">Biryani Blues</Text>
            <View className="flex-row items-center mb-2">
              <Star color="#FFD700" size={16} fill="#FFD700" />
              <Text className="text-white font-bold text-sm ml-1">4.2 (10k+ ratings)</Text>
              <Text className="text-white text-sm ml-2">• Biryani, Mughlai</Text>
            </View>
            <View className="flex-row items-center">
              <View className="bg-white/20 px-2 py-1 rounded flex-row items-center mr-2">
                <Clock color="#FFFFFF" size={12} />
                <Text className="text-white text-xs ml-1 font-medium">30-40 min</Text>
              </View>
              <View className="bg-white/20 px-2 py-1 rounded">
                <Text className="text-white text-xs font-medium">Delivery: ₹40</Text>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>

      {/* Sticky Header that appears when scrolled up */}
      <View className="absolute top-0 left-0 right-0 z-20 h-24 bg-surface pt-10 px-4 flex-row items-center border-b border-border opacity-0">
         {/* This is a visual trick, usually done with Animated.View opacity mapping */}
      </View>

      {/* Menu List */}
      <Animated.SectionList
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT }}
        sections={MOCK_MENU}
        keyExtractor={(item) => item.id}
        renderItem={renderMenuItem}
        renderSectionHeader={renderSectionHeader}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        stickySectionHeadersEnabled={true}
      />

      {/* Sticky Bottom Cart Bar */}
      {cart.items.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border shadow-lg pb-8">
          <TouchableOpacity 
            className="bg-primary rounded-xl flex-row items-center justify-between px-4 py-3"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Cart' })}
          >
            <View>
              <Text className="text-white font-bold text-sm">
                {cart.items.reduce((acc, item) => acc + item.quantity, 0)} ITEMS | ₹{cart.totalAmount}
              </Text>
              <Text className="text-white/80 text-xs">Extra charges may apply</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-white font-bold text-base mr-2">View Cart</Text>
              <View className="w-6 h-6 bg-white/20 rounded-full items-center justify-center">
                 <Text className="text-white font-bold">→</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
