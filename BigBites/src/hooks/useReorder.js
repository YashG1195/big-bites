import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { replaceCart } from '../store/slices/cartSlice';
import api from '../services/api';

export default function useReorder(bottomSheetRef) {
  const [reorderingId, setReorderingId] = useState(null);
  const [reorderData, setReorderData] = useState(null);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const processReorder = useCallback(async (orderId) => {
    setReorderingId(orderId);
    setReorderData(null);

    try {
      const response = await api.post(`/orders/${orderId}/reorder`);
      const data = response.data;

      if (!data.restaurantOpen) {
        Alert.alert(
          'Restaurant Unavailable',
          'This restaurant is currently closed or no longer available on the platform.'
        );
        setReorderingId(null);
        return;
      }

      if (data.available.length === 0 && data.priceChanged.length === 0) {
        Alert.alert(
          'Items Unavailable',
          'None of these items are available right now.'
        );
        setReorderingId(null);
        return;
      }

      const hasChanges = data.unavailable.length > 0 || data.priceChanged.length > 0;

      if (!hasChanges) {
        // Fast path: everything is available at same price
        const totalAmount = data.available.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        dispatch(replaceCart({
          items: data.available.map(item => ({
            id: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          restaurantId: data.restaurantId,
          totalAmount
        }));
        
        navigation.navigate('Cart');
      } else {
        // Show bottom sheet
        setReorderData(data);
        bottomSheetRef.current?.expand();
      }
    } catch (error) {
      console.error('Reorder error:', error);
      Alert.alert(
        'Network Error',
        'Could not check reorder availability. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => processReorder(orderId) }
        ]
      );
    } finally {
      setReorderingId(null);
    }
  }, [navigation, dispatch, bottomSheetRef]);

  const continueToCart = useCallback(() => {
    if (!reorderData) return;
    
    // We only add available + priceChanged items
    const cartItems = [];
    let totalAmount = 0;

    reorderData.available.forEach(item => {
      cartItems.push({
        id: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      });
      totalAmount += item.price * item.quantity;
    });

    reorderData.priceChanged.forEach(item => {
      cartItems.push({
        id: item.menuItemId,
        name: item.name,
        price: item.newPrice, // Use new price
        quantity: item.quantity
      });
      totalAmount += item.newPrice * item.quantity;
    });

    dispatch(replaceCart({
      items: cartItems,
      restaurantId: reorderData.restaurantId,
      totalAmount
    }));

    bottomSheetRef.current?.close();
    navigation.navigate('Cart');
  }, [reorderData, dispatch, navigation, bottomSheetRef]);

  return {
    reorderingId,
    reorderData,
    processReorder,
    continueToCart
  };
}
