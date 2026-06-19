import { useState, useCallback } from 'react';
import api from '../services/api';

export default function useSupportChat(orderId) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I am the Big Bites support assistant. How can I help you with your order today?',
      id: 'initial_msg'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    // Add user message to local state immediately
    const userMsg = { role: 'user', content: text, id: Date.now().toString() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      // Format history (ignoring action fields or IDs) for the backend
      // Actually, the initial message is just UI flair, but sending it is fine.
      const historyToSend = messages.map(m => ({ role: m.role, content: m.content })).concat([
        { role: 'user', content: text }
      ]);

      const response = await api.post('/support/chat', {
        orderId,
        message: text, // The backend gets it from conversationHistory anyway
        conversationHistory: historyToSend
      });

      if (response.data?.success) {
        const { reply, action } = response.data.data;
        
        // Add AI message to state
        setMessages((prev) => [
          ...prev, 
          { 
            role: 'assistant', 
            content: reply, 
            id: (Date.now() + 1).toString(),
            action: action
          }
        ]);
        
        return { success: true, action };
      } else {
        throw new Error('Support chat failed');
      }
    } catch (err) {
      console.error('Support chat error:', err);
      setError('Something went wrong, please try again.');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, [messages, orderId]);

  const requestHuman = useCallback(async () => {
    return sendMessage("I need to speak to a human agent, please escalate this conversation.");
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    requestHuman
  };
}
