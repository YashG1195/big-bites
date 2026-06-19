import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  restaurantId: null,
  totalAmount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { item, restaurantId } = action.payload;
      
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        // Handle logic for adding items from a different restaurant
        // For now, clear cart and start fresh for simplicity, or throw error
        state.items = [];
      }
      
      state.restaurantId = restaurantId;
      const existingItem = state.items.find(i => i.id === item.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...item, quantity: 1 });
      }
      
      state.totalAmount += item.price;
    },
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      const existingItemIndex = state.items.findIndex(i => i.id === itemId);
      
      if (existingItemIndex >= 0) {
        const item = state.items[existingItemIndex];
        state.totalAmount -= item.price;
        
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          state.items.splice(existingItemIndex, 1);
        }
      }

      if (state.items.length === 0) {
        state.restaurantId = null;
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.restaurantId = null;
      state.totalAmount = 0;
    },
    replaceCart: (state, action) => {
      const { items, restaurantId, totalAmount } = action.payload;
      state.items = items;
      state.restaurantId = restaurantId;
      state.totalAmount = totalAmount;
    },
  },
});

export const { addToCart, removeFromCart, clearCart, replaceCart } = cartSlice.actions;
export default cartSlice.reducer;
