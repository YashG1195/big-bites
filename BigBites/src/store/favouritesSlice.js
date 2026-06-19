import { apiSlice } from './apiSlice';

const enhancedApi = apiSlice.enhanceEndpoints({ 
  addTagTypes: ['FavouriteRestaurant', 'FavouriteDish'] 
});

export const favouritesApi = enhancedApi.injectEndpoints({
  endpoints: (builder) => ({
    getFavouriteRestaurants: builder.query({
      query: () => '/users/favourites/restaurants',
      providesTags: ['FavouriteRestaurant'],
      transformResponse: (response) => response.data,
    }),
    getFavouriteDishes: builder.query({
      query: () => '/users/favourites/dishes',
      providesTags: ['FavouriteDish'],
      transformResponse: (response) => response.data,
    }),
    toggleFavouriteRestaurant: builder.mutation({
      query: (restaurantId) => ({
        url: `/users/favourites/restaurants/${restaurantId}`,
        method: 'POST',
      }),
      invalidatesTags: ['FavouriteRestaurant'],
      async onQueryStarted(restaurantId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          favouritesApi.util.updateQueryData('getFavouriteRestaurants', undefined, (draft) => {
            const index = draft.findIndex(r => r._id === restaurantId);
            if (index >= 0) {
              draft.splice(index, 1);
            } else {
              draft.push({ _id: restaurantId, isOptimistic: true });
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      }
    }),
    toggleFavouriteDish: builder.mutation({
      query: ({ restaurantId, menuItemId }) => ({
        url: `/users/favourites/dishes`,
        method: 'POST',
        body: { restaurantId, menuItemId },
      }),
      invalidatesTags: ['FavouriteDish'],
      async onQueryStarted({ restaurantId, menuItemId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          favouritesApi.util.updateQueryData('getFavouriteDishes', undefined, (draft) => {
            const groupIndex = draft.findIndex(g => g.restaurantId === restaurantId);
            if (groupIndex >= 0) {
              const dishIndex = draft[groupIndex].dishes.findIndex(d => d.menuItemId === menuItemId);
              if (dishIndex >= 0) {
                draft[groupIndex].dishes.splice(dishIndex, 1);
                if (draft[groupIndex].dishes.length === 0) {
                  draft.splice(groupIndex, 1);
                }
              } else {
                draft[groupIndex].dishes.push({ menuItemId });
              }
            } else {
              draft.push({ restaurantId, dishes: [{ menuItemId }] });
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      }
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetFavouriteRestaurantsQuery,
  useGetFavouriteDishesQuery,
  useToggleFavouriteRestaurantMutation,
  useToggleFavouriteDishMutation,
} = favouritesApi;
