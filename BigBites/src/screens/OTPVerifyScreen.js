import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

export default function OTPVerifyScreen({ route, navigation }) {
  const { phoneNumber, confirmationResult } = route.params;
  const dispatch = useDispatch();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [activeOTPIndex, setActiveOTPIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  
  const inputRefs = useRef([]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.substring(text.length - 1); // Ensure only 1 char
    setOtp(newOtp);

    // Auto-advance
    if (text && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }, index) => {
    if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }

    setIsLoading(true);
    try {
      let token = 'mock-jwt-token-xyz-987';
      let user = { uid: 'mock-uid-123', phoneNumber };

      if (confirmationResult && typeof confirmationResult.confirm === 'function') {
        // Real Firebase Flow
        const result = await confirmationResult.confirm(otpCode);
        user = result.user;
        token = await result.user.getIdToken();
      } else {
        // Simulated Flow (since dummy keys fail Firebase confirmationResult)
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Let's pretend '123456' is the correct mock OTP
        if (otpCode !== '123456') {
          throw new Error('auth/invalid-verification-code');
        }
      }

      // Store token
      await AsyncStorage.setItem('@auth_token', token);
      
      // Update Redux
      dispatch(setCredentials({ user, token }));
      
      setIsLoading(false);
      // Navigate to Home
      // RootNavigator handles this automatically since isAuthenticated becomes true

    } catch (error) {
      setIsLoading(false);
      if (error.message.includes('invalid-verification-code')) {
        Alert.alert('Wrong OTP', 'The OTP you entered is incorrect. Please try again.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
      console.error(error);
    }
  };

  const handleResend = () => {
    // In a real app, you would call signInWithPhoneNumber again here
    setCountdown(60);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0].focus();
    // Simulate sending
    Alert.alert('OTP Sent', `A new OTP has been sent to ${phoneNumber}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6"
      >
        <View className="flex-row items-center mt-2 mb-8">
          <TouchableOpacity 
            className="w-10 h-10 bg-surface rounded-full items-center justify-center border border-border"
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={COLORS.text} size={20} />
          </TouchableOpacity>
        </View>

        <View className="mb-8">
          <Text className="text-text font-bold text-3xl mb-2">Verify Details</Text>
          <Text className="text-textMuted text-base mb-1">We've sent a 6-digit OTP to</Text>
          <View className="flex-row items-center">
            <Text className="text-text font-bold text-base">{phoneNumber}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} className="ml-2">
              <Text className="text-primary font-bold text-sm">Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* OTP Input Boxes */}
        <View className="flex-row justify-between mb-8">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              className={`w-12 h-14 rounded-xl text-center text-text font-bold text-xl bg-surface border shadow-sm ${
                activeOTPIndex === index ? 'border-primary' : 'border-border'
              }`}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setActiveOTPIndex(index)}
              onBlur={() => setActiveOTPIndex(-1)}
            />
          ))}
        </View>
        
        {/* Helper message for simulated flow */}
        <Text className="text-primary/70 text-xs text-center mb-6">
          Hint: Use '123456' for the mock testing environment.
        </Text>

        <TouchableOpacity 
          className={`h-14 rounded-xl items-center justify-center shadow-md ${otp.join('').length === 6 ? 'bg-primary' : 'bg-primary/50'}`}
          disabled={otp.join('').length !== 6 || isLoading}
          onPress={handleVerifyOTP}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text className="text-white font-bold text-lg">Verify OTP</Text>
          )}
        </TouchableOpacity>
        
        <View className="flex-row justify-center items-center mt-6">
          <Text className="text-textMuted text-sm mr-1">Didn't receive the OTP?</Text>
          {countdown > 0 ? (
            <Text className="text-text font-bold text-sm">Resend in {countdown}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text className="text-primary font-bold text-sm">Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
