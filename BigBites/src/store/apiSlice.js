import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: async (headers) => {
      try {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }
      } catch (error) {
        console.error('Error fetching token for RTK Query:', error);
      }
      return headers;
    },
  }),
  tagTypes: ['Address'],
  endpoints: (builder) => ({
    getAddresses: builder.query({
      query: () => '/users/addresses',
      providesTags: ['Address'],
      transformResponse: (response) => response.data,
    }),
    addAddress: builder.mutation({
      query: (address) => ({
        url: '/users/addresses',
        method: 'POST',
        body: address,
      }),
      invalidatesTags: ['Address'],
      transformResponse: (response) => response.data,
    }),
    updateAddress: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/users/addresses/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Address'],
      transformResponse: (response) => response.data,
    }),
    deleteAddress: builder.mutation({
      query: (id) => ({
        url: `/users/addresses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Address'],
      transformResponse: (response) => response.data,
    }),
    setDefaultAddress: builder.mutation({
      query: (id) => ({
        url: `/users/addresses/${id}/default`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Address'],
      transformResponse: (response) => response.data,
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} = apiSlice;
