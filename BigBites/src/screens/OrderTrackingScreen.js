import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { io } from 'socket.io-client';
import { ArrowLeft, Phone, MapPin, Navigation, Bike } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { API_URL } from '../constants/api';

const { width } = Dimensions.get('window');

const RESTAURANT_LOC = { latitude: 28.5355, longitude: 77.3910 };
const USER_LOC = { latitude: 28.5455, longitude: 77.4010 };
const INITIAL_RIDER_LOC = { latitude: 28.5385, longitude: 77.3950 };

const STEPS = [
  'Order Placed',
  'Accepted',
  'Being Prepared',
  'Out for Delivery',
  'Delivered'
];

export default function OrderTrackingScreen({ navigation }) {
  const mapRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const socketRef = useRef(null);
  
  const [currentStep, setCurrentStep] = useState(3); // 0-indexed, 3 = 'Out for Delivery'
  const [eta, setEta] = useState(15); // minutes

  useEffect(() => {
    // 1. Map Auto-fit to bounds
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.fitToCoordinates([RESTAURANT_LOC, USER_LOC, INITIAL_RIDER_LOC], {
          edgePadding: { top: 50, right: 50, bottom: 400, left: 50 }, // Bottom padding for the fixed sheet
          animated: true,
        });
      }, 1000);
    }

    // 2. Initialize Socket.IO connection
    // We use API_URL (ignoring the /api/v1 path to get the root domain)
    const socketUrl = new URL(API_URL).origin;
    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
    });

    socketRef.current.on('rider:location', (data) => {
      const { latitude, longitude } = data;
      // Update marker without triggering React state re-render
      if (riderMarkerRef.current && riderMarkerRef.current.animateMarkerToCoordinate) {
        riderMarkerRef.current.animateMarkerToCoordinate({ latitude, longitude }, 1000);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <View className="flex-1 bg-background">
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          ...INITIAL_RIDER_LOC,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        userInterfaceStyle="dark" // If supporting iOS 13+ dark maps
      >
        <Marker coordinate={RESTAURANT_LOC} title="Restaurant">
          <View className="w-8 h-8 bg-black rounded-full items-center justify-center border-2 border-white shadow">
            <MapPin color="white" size={16} />
          </View>
        </Marker>

        <Marker coordinate={USER_LOC} title="Delivery Address">
          <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center border-2 border-white shadow">
            <Navigation color="white" size={16} />
          </View>
        </Marker>

        <Marker 
          ref={riderMarkerRef} 
          coordinate={INITIAL_RIDER_LOC} 
          title="Rider"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View className="w-10 h-10 bg-primary rounded-full items-center justify-center border-2 border-white shadow-lg">
            <Bike color="white" size={20} />
          </View>
        </Marker>

        {/* Route Polyline mock */}
        <Polyline 
          coordinates={[RESTAURANT_LOC, INITIAL_RIDER_LOC, USER_LOC]}
          strokeColor={COLORS.primary}
          strokeWidth={4}
          lineDashPattern={[5, 5]}
        />
      </MapView>

      {/* Floating Back Button */}
      <SafeAreaView className="absolute top-0 left-0 right-0 px-4 pointer-events-box-none">
        <TouchableOpacity 
          className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg mt-2"
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft color={COLORS.black} size={24} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Fixed Bottom Sheet */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <View className="p-6">
          
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-text font-bold text-2xl">Arriving in {eta} mins</Text>
              <Text className="text-textMuted text-sm mt-1">Your order is on the way</Text>
            </View>
            <View className="w-14 h-14 bg-primary/20 rounded-full items-center justify-center">
              <Text className="text-primary font-bold text-xl">{eta}</Text>
              <Text className="text-primary text-[10px] font-bold">MINS</Text>
            </View>
          </View>

          {/* Progress Tracker */}
          <View className="mb-6">
            {STEPS.map((step, index) => {
              const isCompleted = index <= currentStep;
              const isCurrent = index === currentStep;
              const isLast = index === STEPS.length - 1;
              
              return (
                <View key={step} className="flex-row items-start">
                  <View className="items-center mr-4">
                    <View className={`w-4 h-4 rounded-full border-2 ${
                      isCompleted ? 'bg-primary border-primary' : 'bg-transparent border-border'
                    }`} />
                    {!isLast && (
                      <View className={`w-[2px] h-6 ${
                        index < currentStep ? 'bg-primary' : 'bg-border'
                      }`} />
                    )}
                  </View>
                  <Text className={`text-base font-medium -mt-1 ${
                    isCurrent ? 'text-primary font-bold' : isCompleted ? 'text-text' : 'text-textMuted'
                  }`}>
                    {step}
                  </Text>
                </View>
              );
            })}
          </View>

          <View className="h-[1px] w-full bg-border mb-4" />

          {/* Rider Info & Action */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-gray-700 rounded-full items-center justify-center border border-border mr-3">
                <Text className="text-white text-lg font-bold">AS</Text>
              </View>
              <View>
                <Text className="text-text font-bold text-base">Ajay Sharma</Text>
                <Text className="text-textMuted text-sm">Vaccinated Delivery Partner</Text>
              </View>
            </View>
            
            <TouchableOpacity className="w-12 h-12 bg-green-500/20 rounded-full items-center justify-center border border-green-500/30">
              <Phone color="#22c55e" size={20} fill="#22c55e" />
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </View>
  );
}
