import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  currentOrder: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    updateOrderStatus: (state, action) => {
      const updatedOrder = action.payload;
      
      // Update in orders list
      const index = state.orders.findIndex(o => o._id === updatedOrder._id);
      if (index !== -1) {
        state.orders[index] = { ...state.orders[index], ...updatedOrder };
      }

      // Update current order if it matches
      if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
        state.currentOrder = { ...state.currentOrder, ...updatedOrder };
      }
    },
  },
});

export const { setOrders, setCurrentOrder, updateOrderStatus } = ordersSlice.actions;
export default ordersSlice.reducer;
