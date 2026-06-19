import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { COLORS } from '../constants/colors';
import useAddresses from '../hooks/useAddresses';
import { MapPin, Home, Briefcase, Map as MapIcon, ChevronRight } from 'lucide-react-native';

const getLabelIcon = (label) => {
  switch (label) {
    case 'Home': return <Home size={20} color="#FF6B35" />;
    case 'Work': return <Briefcase size={20} color="#FF6B35" />;
    default: return <MapIcon size={20} color="#FF6B35" />;
  }
};

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const cart = useSelector((state) => state.cart);
  const { defaultAddress, isLoading } = useAddresses();

  const handlePlaceOrder = () => {
    // Implement order placement logic
    console.log('Placing order with address:', defaultAddress);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        
        <Text className="text-lg font-bold text-gray-800 mb-3">Delivery Address</Text>
        
        {isLoading ? (
          <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 justify-center items-center h-24">
            <ActivityIndicator color="#FF6B35" />
          </View>
        ) : defaultAddress ? (
          <TouchableOpacity
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex-row items-center"
            onPress={() => navigation.navigate('SavedAddresses', { selectMode: true })}
            activeOpacity={0.7}
          >
            <View className="bg-[#FF6B35]/10 p-2 rounded-full mr-3">
              {getLabelIcon(defaultAddress.label)}
            </View>
            <View className="flex-1">
              <Text className="font-bold text-gray-800">{defaultAddress.label}</Text>
              <Text className="text-gray-600 text-sm" numberOfLines={2}>
                {defaultAddress.formattedAddress}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('SavedAddresses', { selectMode: true })}>
              <Text className="text-[#FF6B35] font-bold text-sm ml-2">Change</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-white p-4 rounded-xl shadow-sm border border-dashed border-[#FF6B35] flex-row items-center justify-center py-6"
            onPress={() => navigation.navigate('AddAddress')}
          >
            <MapPin size={24} color="#FF6B35" />
            <Text className="text-[#FF6B35] font-bold text-base ml-2">Add Delivery Address</Text>
          </TouchableOpacity>
        )}

        <Text className="text-lg font-bold text-gray-800 mt-6 mb-3">Order Summary</Text>
        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          {cart.items.map((item, index) => (
            <View key={item.id} className={`flex-row justify-between items-center ${index !== cart.items.length - 1 ? 'border-b border-gray-100 pb-3 mb-3' : ''}`}>
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">{item.name}</Text>
                <Text className="text-gray-500 text-xs">Qty: {item.quantity}</Text>
              </View>
              <Text className="text-gray-800 font-medium">₹{item.price * item.quantity}</Text>
            </View>
          ))}
          
          <View className="border-t border-gray-200 mt-4 pt-4 flex-row justify-between">
            <Text className="font-bold text-gray-800">Total to pay</Text>
            <Text className="font-bold text-gray-800 text-lg">₹{cart.totalAmount}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Bar */}
      <View className="p-4 bg-white border-t border-gray-200 flex-row items-center justify-between">
        <View>
          <Text className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total</Text>
          <Text className="text-xl font-bold text-gray-800">₹{cart.totalAmount}</Text>
        </View>
        
        <TouchableOpacity
          className={`px-8 py-3 rounded-xl flex-row items-center shadow-sm ${defaultAddress && cart.items.length > 0 ? 'bg-[#FF6B35]' : 'bg-gray-300'}`}
          onPress={handlePlaceOrder}
          disabled={!defaultAddress || cart.items.length === 0}
        >
          <Text className="text-white font-bold text-lg mr-2">Place Order</Text>
          <ChevronRight size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
