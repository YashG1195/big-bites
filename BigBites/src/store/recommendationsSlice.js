import { apiSlice } from './apiSlice';

export const recommendationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRecommendations: builder.query({
      query: () => '/recommendations',
      providesTags: ['Recommendations'],
      transformResponse: (response) => response.data,
    }),
  }),
  overrideExisting: false,
});

export const { useGetRecommendationsQuery } = recommendationsApi;
