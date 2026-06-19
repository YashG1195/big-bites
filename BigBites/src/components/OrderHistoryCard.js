import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RefreshCcw, CheckCircle2, Clock, XCircle, HeadphonesIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const getStatusColor = (status) => {
  switch (status) {
    case 'Delivered': return '#10B981'; // Green
    case 'Cancelled': return '#EF4444'; // Red
    default: return '#F59E0B'; // Orange/Yellow
  }
};

const getStatusIcon = (status, color) => {
  switch (status) {
    case 'Delivered': return <CheckCircle2 size={14} color={color} />;
    case 'Cancelled': return <XCircle size={14} color={color} />;
    default: return <Clock size={14} color={color} />;
  }
};

export default function OrderHistoryCard({ order, onReorder, isReordering }) {
  const navigation = useNavigation();
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const displayItems = order.items.slice(0, 2).map(i => `${i.quantity} x ${i.name}`).join(', ');
  const moreCount = order.items.length - 2;
  const itemsText = moreCount > 0 ? `${displayItems} and ${moreCount} more` : displayItems;

  const statusColor = getStatusColor(order.status);

  return (
    <View className="bg-white p-4 mb-4 rounded-xl shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 pr-2">
          <Text className="text-lg font-bold text-gray-800" numberOfLines={1}>
            {order.restaurantId?.name || 'Unknown Restaurant'}
          </Text>
          <Text className="text-gray-500 text-xs mt-1">{date}</Text>
        </View>
        <Text className="text-lg font-bold text-gray-800">₹{order.totalAmount}</Text>
      </View>

      <View className="mb-4">
        <Text className="text-gray-600 text-sm" numberOfLines={2}>
          {itemsText}
        </Text>
      </View>

      <View className="border-t border-gray-100 pt-3">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
            {getStatusIcon(order.status, statusColor)}
            <Text style={{ color: statusColor, fontWeight: '600', fontSize: 12, marginLeft: 4 }}>
              {order.status}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            className="flex-row items-center py-2"
            onPress={() => navigation.navigate('SupportChat', { orderId: order._id })}
          >
            <HeadphonesIcon color="#6B7280" size={16} className="mr-1.5" />
            <Text className="text-gray-600 font-medium text-sm">Help with this order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center bg-[#FF6B35]/10 px-4 py-2 rounded-full border border-[#FF6B35]/20"
            onPress={() => onReorder(order._id)}
            disabled={isReordering}
          >
            {isReordering ? (
              <ActivityIndicator size="small" color="#FF6B35" />
            ) : (
              <>
                <RefreshCcw size={16} color="#FF6B35" />
                <Text className="text-[#FF6B35] font-bold ml-2 text-sm">Reorder</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
