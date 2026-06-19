import React from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import useAddresses from '../hooks/useAddresses';
import { COLORS } from '../constants/colors';
import { Home, Briefcase, Map as MapIcon, Plus, Trash2, CheckCircle } from 'lucide-react-native';

const getLabelIcon = (label) => {
  switch (label) {
    case 'Home': return <Home size={24} color="#FF6B35" />;
    case 'Work': return <Briefcase size={24} color="#FF6B35" />;
    default: return <MapIcon size={24} color="#FF6B35" />;
  }
};

export default function SavedAddressesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const selectMode = route.params?.selectMode || false;

  const { addresses, isLoading, deleteAddress, setDefaultAddress } = useAddresses();

  const handleAddressTap = (item) => {
    if (selectMode) {
      if (!item.isDefault) setDefaultAddress(item._id);
      navigation.goBack();
    } else {
      if (!item.isDefault) setDefaultAddress(item._id);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Address', 'Are you sure you want to remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAddress(id) },
    ]);
  };

  const renderRightActions = (id) => {
    return (
      <TouchableOpacity
        className="bg-red-500 justify-center items-center w-20 mb-4 rounded-r-xl"
        style={{ height: '85%' }} // match the card height
        onPress={() => handleDelete(id)}
      >
        <Trash2 size={24} color="#FFF" />
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    return (
      <Swipeable renderRightActions={() => renderRightActions(item._id)}>
        <TouchableOpacity
          className={`bg-white p-4 mb-4 rounded-xl shadow-sm border flex-row items-center ${item.isDefault ? 'border-[#FF6B35]' : 'border-gray-200'}`}
          onPress={() => handleAddressTap(item)}
          activeOpacity={0.7}
        >
          <View className="bg-[#FF6B35]/10 p-3 rounded-full mr-4">
            {getLabelIcon(item.label)}
          </View>
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="font-bold text-lg text-gray-800">{item.label}</Text>
              {item.isDefault && (
                <View className="bg-[#FF6B35]/10 px-2 py-0.5 rounded ml-2 flex-row items-center">
                  <CheckCircle size={12} color="#FF6B35" className="mr-1" />
                  <Text className="text-[#FF6B35] text-xs font-bold">Default</Text>
                </View>
              )}
            </View>
            <Text className="text-gray-600 text-sm" numberOfLines={2}>
              {item.formattedAddress}
            </Text>
            {item.flatNo ? (
              <Text className="text-gray-500 text-xs mt-1">
                {item.flatNo}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  if (isLoading && addresses.length === 0) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      {addresses.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <MapIcon size={64} color="#D1D5DB" className="mb-4" />
          <Text className="text-xl font-bold text-gray-800 mb-2">No Saved Addresses</Text>
          <Text className="text-gray-500 text-center mb-8 px-8">
            Add your home, work, or other addresses for a faster checkout experience.
          </Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <View className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
        <TouchableOpacity
          className="bg-[#FF6B35] rounded-xl py-4 flex-row justify-center items-center shadow-sm"
          onPress={() => navigation.navigate('AddAddress')}
        >
          <Plus size={24} color="#FFF" />
          <Text className="text-white font-bold text-lg ml-2">Add New Address</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
