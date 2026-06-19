import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, HeadphonesIcon, CheckCircle } from 'lucide-react-native';
import useSupportChat from '../hooks/useSupportChat';

export default function SupportChatScreen({ route, navigation }) {
  const { orderId } = route.params || {};
  const { messages, isLoading, error, sendMessage, requestHuman } = useSupportChat(orderId);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const renderActionCard = (action) => {
    if (action === 'refund_initiated') {
      return (
        <View className="bg-green-50 border border-green-200 rounded-xl p-3 mt-2 flex-row items-center">
          <CheckCircle color="#10B981" size={20} className="mr-2" />
          <Text className="text-green-800 font-medium flex-1">Refund initiated — pending review.</Text>
        </View>
      );
    }
    if (action === 'escalated' || action === 'escalated_due_to_abuse') {
      return (
        <View className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-2 flex-row items-center">
          <HeadphonesIcon color="#3B82F6" size={20} className="mr-2" />
          <Text className="text-blue-800 font-medium flex-1">A human agent will contact you within 24 hours.</Text>
        </View>
      );
    }
    return null;
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';

    return (
      <View className={`w-full px-4 mb-4 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}>
        <View style={{ maxWidth: '80%' }}>
          <View className={`p-3 rounded-2xl ${
            isUser ? 'bg-[#FF6B35] rounded-tr-none' : 'bg-white border border-gray-100 shadow-sm rounded-tl-none'
          }`}>
            <Text className={`${isUser ? 'text-white' : 'text-gray-800'} text-base leading-6`}>
              {item.content}
            </Text>
          </View>
          {item.action && renderActionCard(item.action)}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <ArrowLeft color="#1F2937" size={24} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold text-gray-900">Support</Text>
            {orderId && <Text className="text-xs text-gray-500">Order #{orderId.slice(-6).toUpperCase()}</Text>}
          </View>
        </View>
        <TouchableOpacity 
          className="bg-blue-50 px-3 py-1.5 rounded-full flex-row items-center"
          onPress={requestHuman}
        >
          <HeadphonesIcon color="#3B82F6" size={14} className="mr-1" />
          <Text className="text-blue-600 font-bold text-xs">Talk to human</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView 
        className="flex-1 bg-gray-50" 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 10 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {isLoading && (
          <View className="flex-row items-center bg-white border border-gray-100 shadow-sm p-3 rounded-2xl rounded-tl-none self-start ml-4 mb-4">
             <Text className="text-gray-500 font-medium">Assistant is typing...</Text>
          </View>
        )}

        {error && (
          <View className="px-4 py-2 mb-2 items-center">
            <Text className="text-red-500 text-sm">{error}</Text>
          </View>
        )}

        {/* Input Area */}
        <View className="px-4 py-3 bg-white border-t border-gray-100 flex-row items-end pb-6">
          <View className="flex-1 bg-gray-100 rounded-3xl min-h-[48px] max-h-32 justify-center px-4 py-2 mr-2">
            <TextInput
              className="text-base text-gray-800"
              placeholder="Type your message..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={inputText}
              onChangeText={setInputText}
            />
          </View>
          <TouchableOpacity 
            className={`w-12 h-12 rounded-full items-center justify-center ${inputText.trim() ? 'bg-[#FF6B35]' : 'bg-gray-200'}`}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Send color={inputText.trim() ? '#FFF' : '#9CA3AF'} size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
