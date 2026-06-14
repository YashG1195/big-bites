import { io } from 'socket.io-client';
import { updateOrderStatus } from '../slices/ordersSlice';
import { API_URL } from '../../constants/api';

let socket;

export const socketMiddleware = (store) => (next) => (action) => {
  // Wait for login to initialize socket
  if (action.type === 'auth/setCredentials') {
    const { token } = action.payload;

    if (socket) {
      socket.disconnect();
    }

    const socketUrl = new URL(API_URL).origin;
    socket = io(socketUrl, {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('Redux socketMiddleware connected');
    });

    // Automatically listen to order status updates globally and dispatch to Redux
    socket.on('order:status_update', (updatedOrder) => {
      console.log('Socket received order update via middleware:', updatedOrder.status);
      store.dispatch(updateOrderStatus(updatedOrder));
    });
  }

  // Handle logout
  if (action.type === 'auth/logout') {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }

  // Option to let components tell middleware to join a room
  if (action.type === 'socket/joinOrderRoom') {
    if (socket) {
      socket.emit('join_order_room', action.payload);
    }
  }

  return next(action);
};
