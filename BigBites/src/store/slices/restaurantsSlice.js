import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock data for initial development
const MOCK_RESTAURANTS = [
  {
    id: '1',
    name: 'Biryani Blues',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&q=80',
    rating: 4.2,
    deliveryTime: '30-40 min',
    minOrder: '₹150',
    discount: '50% OFF up to ₹100',
    cuisines: ['Biryani', 'Mughlai'],
  },
  {
    id: '2',
    name: 'Pizza Hut',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80',
    rating: 4.0,
    deliveryTime: '45-50 min',
    minOrder: '₹200',
    discount: 'Flat ₹125 OFF',
    cuisines: ['Pizzas', 'Italian'],
  },
  {
    id: '3',
    name: 'Burger King',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
    rating: 4.3,
    deliveryTime: '25-35 min',
    minOrder: '₹100',
    discount: null,
    cuisines: ['Burgers', 'American'],
  },
  {
    id: '4',
    name: 'Kwality Wall\'s',
    image: 'https://images.unsplash.com/photo-1557142046-c704a3adf8af?w=500&q=80',
    rating: 4.6,
    deliveryTime: '15-25 min',
    minOrder: '₹99',
    discount: '20% OFF',
    cuisines: ['Ice Cream', 'Desserts'],
  }
];

export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async () => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_RESTAURANTS);
      }, 1500); // 1.5s delay to show skeletons
    });
  }
);

const initialState = {
  list: [],
  selectedRestaurant: null,
  isLoading: false,
  error: null,
};

const restaurantsSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    setRestaurants: (state, action) => {
      state.list = action.payload;
    },
    setSelectedRestaurant: (state, action) => {
      state.selectedRestaurant = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurants.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.isLoading = false;
        state.list = action.payload;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      });
  },
});

export const { setRestaurants, setSelectedRestaurant } = restaurantsSlice.actions;
export default restaurantsSlice.reducer;
