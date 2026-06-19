import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { ScrollView } from 'react-native-gesture-handler';
import { ShoppingBag, ChevronRight } from 'lucide-react-native';
import OrderHistoryCard from '../components/OrderHistoryCard';
import useReorder from '../hooks/useReorder';
import api from '../services/api';
import { COLORS } from '../constants/colors';

export default function OrderHistoryScreen() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const bottomSheetRef = useRef(null);
  const { reorderingId, reorderData, processReorder, continueToCart } = useReorder(bottomSheetRef);

  const fetchOrders = async (pageNum = 1) => {
    if (isLoading || (!hasMore && pageNum > 1)) return;
    
    setIsLoading(true);
    try {
      const response = await api.get(`/orders/my?page=${pageNum}&limit=10`);
      const { data, pagination } = response.data;
      
      if (pageNum === 1) {
        setOrders(data);
      } else {
        setOrders(prev => [...prev, ...data]);
      }
      
      setHasMore(pageNum < pagination.pages);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handleEndReached = () => {
    if (hasMore && !isLoading) {
      fetchOrders(page + 1);
    }
  };

  // Bottom Sheet backdrop
  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <FlatList
        data={orders}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <OrderHistoryCard 
            order={item} 
            onReorder={processReorder} 
            isReordering={reorderingId === item._id} 
          />
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading && (
            <View className="flex-1 justify-center items-center py-20">
              <ShoppingBag size={64} color="#D1D5DB" className="mb-4" />
              <Text className="text-xl font-bold text-gray-800 mb-2">No Orders Yet</Text>
              <Text className="text-gray-500 text-center px-8">
                Looks like you haven't placed any orders. Your past orders will appear here.
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isLoading ? <ActivityIndicator size="large" color="#FF6B35" style={{ margin: 20 }} /> : null
        }
      />

      {/* Reorder Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['60%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.sheetContainer}>
          {reorderData && (
            <>
              <Text className="text-xl font-bold text-gray-800 mb-2">Reorder Summary</Text>
              <Text className="text-gray-500 mb-4">Some items have changed since your last order.</Text>
              
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                
                {/* Available Items */}
                {reorderData.available.length > 0 && (
                  <View className="mb-4">
                    <Text className="font-bold text-gray-800 mb-2 uppercase text-xs tracking-wider">Available</Text>
                    {reorderData.available.map(item => (
                      <View key={item.menuItemId} className="flex-row justify-between items-center py-2 border-b border-gray-100">
                        <Text className="text-gray-800 flex-1">{item.quantity} x {item.name}</Text>
                        <Text className="text-gray-800 font-medium">₹{item.price * item.quantity}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Price Changed Items */}
                {reorderData.priceChanged.length > 0 && (
                  <View className="mb-4">
                    <Text className="font-bold text-[#F59E0B] mb-2 uppercase text-xs tracking-wider">Price Updated</Text>
                    {reorderData.priceChanged.map(item => (
                      <View key={item.menuItemId} className="py-2 border-b border-gray-100">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-gray-800 flex-1">{item.quantity} x {item.name}</Text>
                          <Text className="text-gray-800 font-medium">₹{item.newPrice * item.quantity}</Text>
                        </View>
                        <Text className="text-gray-400 text-xs mt-1 line-through">Old price: ₹{item.price}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Unavailable Items */}
                {reorderData.unavailable.length > 0 && (
                  <View className="mb-6">
                    <Text className="font-bold text-red-500 mb-2 uppercase text-xs tracking-wider">No Longer Available</Text>
                    {reorderData.unavailable.map(item => (
                      <View key={item.menuItemId} className="flex-row justify-between items-center py-2 border-b border-gray-100 opacity-50">
                        <Text className="text-gray-500 flex-1">{item.name}</Text>
                        <Text className="text-gray-400 text-xs uppercase">Removed</Text>
                      </View>
                    ))}
                  </View>
                )}

              </ScrollView>

              <TouchableOpacity
                className="bg-[#FF6B35] rounded-xl py-4 flex-row justify-center items-center mt-4 shadow-sm"
                onPress={continueToCart}
              >
                <Text className="text-white font-bold text-lg mr-2">Continue to Cart</Text>
                <ChevronRight size={20} color="#FFF" />
              </TouchableOpacity>
            </>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    padding: 24,
    paddingBottom: 40,
  },
});
