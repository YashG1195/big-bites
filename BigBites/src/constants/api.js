// Use your computer's local IP address or a hosted backend URL
const DEV_BASE_URL = 'http://localhost:3000/api/v1';
const PROD_BASE_URL = 'https://api.bigbites.com/api/v1';

export const API_URL = __DEV__ ? DEV_BASE_URL : PROD_BASE_URL;

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    verify: '/auth/verify',
  },
  restaurants: {
    list: '/restaurants',
    detail: (id) => `/restaurants/${id}`,
  },
  orders: {
    create: '/orders',
    track: (id) => `/orders/${id}/track`,
  },
  payments: {
    createOrder: '/payments/create-order',
  }
};
