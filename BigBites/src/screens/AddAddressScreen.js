import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, { Marker } from 'react-native-maps';
import { GOOGLE_PLACES_API_KEY } from '@env';
import useAddresses from '../hooks/useAddresses';
import { COLORS } from '../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Home, Briefcase, Map as MapIcon } from 'lucide-react-native';

export default function AddAddressScreen() {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [location, setLocation] = useState(null);
  const [label, setLabel] = useState('Other');
  const [flatNo, setFlatNo] = useState('');
  
  const mapRef = useRef(null);
  const navigation = useNavigation();
  const { addAddress, isAdding, addresses } = useAddresses();

  const handlePlaceSelect = (data, details = null) => {
    if (!details) return;
    
    const lat = details.geometry.location.lat;
    const lng = details.geometry.location.lng;
    
    setSelectedPlace({
      formattedAddress: details.formatted_address,
      placeId: data.place_id,
    });
    
    setLocation({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    });
  };

  const handleDragEnd = (e) => {
    setLocation({
      ...location,
      latitude: e.nativeEvent.coordinate.latitude,
      longitude: e.nativeEvent.coordinate.longitude,
    });
  };

  const handleSave = async () => {
    if (!selectedPlace || !location) return;

    // Check for duplicate
    const isDuplicate = addresses.some(
      (addr) =>
        Math.abs(addr.lat - location.latitude) < 0.0001 &&
        Math.abs(addr.lng - location.longitude) < 0.0001
    );

    if (isDuplicate) {
      Alert.alert('Duplicate Address', 'A very similar address is already saved.');
      return;
    }

    try {
      await addAddress({
        label,
        formattedAddress: selectedPlace.formattedAddress,
        lat: location.latitude,
        lng: location.longitude,
        placeId: selectedPlace.placeId,
        flatNo,
      }).unwrap();
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save address.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, padding: 16 }}>
        {!selectedPlace && (
          <Text className="text-xl font-bold mb-4 text-gray-800">Where to?</Text>
        )}
        
        {/* Google Places Autocomplete */}
        <View style={{ flex: selectedPlace ? 0 : 1, zIndex: 1, marginBottom: 16 }}>
          <GooglePlacesAutocomplete
            placeholder="Search for your location"
            fetchDetails={true}
            onPress={handlePlaceSelect}
            query={{
              key: GOOGLE_PLACES_API_KEY,
              language: 'en',
            }}
            onFail={(error) => Alert.alert('Network Error', 'Please check your internet connection.')}
            styles={{
              container: { flex: 0 },
              textInputContainer: {
                backgroundColor: '#fff',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingHorizontal: 8,
              },
              textInput: {
                height: 48,
                color: COLORS.text,
                fontSize: 16,
              },
              listView: {
                backgroundColor: '#fff',
                borderRadius: 8,
                marginTop: 8,
                elevation: 3,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
              },
            }}
          />
        </View>

        {selectedPlace && location && (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Map Preview */}
            <View className="rounded-xl overflow-hidden mb-6 shadow-sm border border-gray-200">
              <MapView
                ref={mapRef}
                style={{ height: 200, width: '100%' }}
                initialRegion={location}
              >
                <Marker
                  coordinate={location}
                  draggable
                  onDragEnd={handleDragEnd}
                >
                  <MapPin color="#FF6B35" fill="#FF6B35" size={32} />
                </Marker>
              </MapView>
              <View className="bg-white p-3 border-t border-gray-100">
                <Text className="text-xs text-gray-500 mb-1">DRAG PIN TO FINE TUNE</Text>
                <Text className="text-sm font-medium text-gray-800" numberOfLines={2}>
                  {selectedPlace.formattedAddress}
                </Text>
              </View>
            </View>

            {/* Additional Details Form */}
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
              <Text className="text-sm font-bold text-gray-800 mb-3">Save as</Text>
              <View className="flex-row gap-3 mb-5">
                {[
                  { id: 'Home', icon: Home },
                  { id: 'Work', icon: Briefcase },
                  { id: 'Other', icon: MapIcon }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = label === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setLabel(item.id)}
                      className={`flex-row items-center px-4 py-2 rounded-full border ${
                        isSelected 
                          ? 'bg-[#FF6B35]/10 border-[#FF6B35]' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Icon size={16} color={isSelected ? '#FF6B35' : '#6b7280'} />
                      <Text className={`ml-2 text-sm ${
                        isSelected ? 'text-[#FF6B35] font-medium' : 'text-gray-600'
                      }`}>
                        {item.id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text className="text-sm font-bold text-gray-800 mb-2">Flat / House no / Landmark</Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800"
                placeholder="E.g. Apartment 4B, near Central Park"
                value={flatNo}
                onChangeText={setFlatNo}
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              className="bg-[#FF6B35] rounded-xl py-4 items-center mb-8 shadow-sm"
              onPress={handleSave}
              disabled={isAdding}
            >
              {isAdding ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-white font-bold text-lg">Save Address</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
