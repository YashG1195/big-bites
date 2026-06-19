import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import { useToggleFavouriteRestaurantMutation, useToggleFavouriteDishMutation } from '../store/favouritesSlice';

export default function FavouriteButton({ 
  type = 'restaurant', 
  restaurantId, 
  menuItemId, 
  initialState = false, 
  size = 22,
  containerStyle = "bg-white rounded-full p-1.5 shadow-sm border border-gray-100"
}) {
  const [isFavourited, setIsFavourited] = useState(initialState);
  const [toggleRestaurant] = useToggleFavouriteRestaurantMutation();
  const [toggleDish] = useToggleFavouriteDishMutation();
  const scale = useSharedValue(1);
  const isProcessing = useRef(false);

  // Sync if prop changes externally
  useEffect(() => {
    setIsFavourited(initialState);
  }, [initialState]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  const handlePress = useCallback(async () => {
    if (isProcessing.current) return; // Debounce rapid taps
    isProcessing.current = true;

    // Optimistic UI update
    const previousState = isFavourited;
    setIsFavourited(!previousState);

    // Animation: scale 1 -> 1.3 -> 1
    scale.value = withSequence(
      withSpring(1.3, { damping: 2, stiffness: 80 }),
      withSpring(1, { damping: 2, stiffness: 80 })
    );

    try {
      if (type === 'restaurant') {
        await toggleRestaurant(restaurantId).unwrap();
      } else {
        await toggleDish({ restaurantId, menuItemId }).unwrap();
      }
    } catch (error) {
      console.error('Favourite toggle failed:', error);
      // Revert on failure
      setIsFavourited(previousState);
    } finally {
      // Small timeout before accepting next tap
      setTimeout(() => {
        isProcessing.current = false;
      }, 300);
    }
  }, [isFavourited, type, restaurantId, menuItemId, toggleRestaurant, toggleDish, scale]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Animated.View style={animatedStyle}>
        <View className={containerStyle}>
          <Heart 
            size={size} 
            color={isFavourited ? '#FF6B35' : '#9CA3AF'} 
            fill={isFavourited ? '#FF6B35' : 'transparent'} 
          />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}
