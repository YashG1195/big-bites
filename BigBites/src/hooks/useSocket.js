import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { API_URL } from '../constants/api';

export const useSocket = () => {
  const socketRef = useRef(null);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!token) return;

    // Use API_URL origin to avoid /api/v1 path
    const socketUrl = new URL(API_URL).origin;
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token,
      },
    });

    socketRef.current.on('connect', () => {
      console.log('useSocket connected:', socketRef.current.id);
    });

    socketRef.current.on('disconnect', () => {
      console.log('useSocket disconnected');
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connect_error:', err.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  const joinOrderRoom = (orderId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_order_room', orderId);
    }
  };

  const onOrderStatus = (callback) => {
    if (!socketRef.current) return () => {};
    
    socketRef.current.on('order:status_update', callback);
    return () => socketRef.current.off('order:status_update', callback);
  };

  const onRiderLocation = (callback) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on('rider:location', callback);
    return () => socketRef.current.off('rider:location', callback);
  };

  return {
    socket: socketRef.current,
    joinOrderRoom,
    onOrderStatus,
    onRiderLocation,
  };
};
