import { apiSlice } from "../../../app/apiSlice";

const scoreRatingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getScoreRatings: builder.query({
      query: ({
        status = "active",
        search = "",
        page = 1,
        per_page = 10,
      } = {}) => ({
        url: "/rating",
        params: { status, search, page, per_page },
      }),
      providesTags: ["ScoreRating"],
    }),
    getScoreRatingById: builder.query({
      query: (id) => ({
        url: `/rating/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "ScoreRating", id }],
    }),
    createScoreRating: builder.mutation({
      query: (body) => ({
        url: "/rating",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["ScoreRating"]),
    }),
    updateScoreRating: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/rating/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["ScoreRating"]),
    }),
    archiveScoreRating: builder.mutation({
      query: (id) => ({
        url: `/rating/${id}/toggle_archived`,
        method: "PATCH",
      }),
      invalidatesTags: ["ScoreRating"],
    }),
  }),
});

export const {
  useGetScoreRatingsQuery,
  useGetScoreRatingByIdQuery,
  useCreateScoreRatingMutation,
  useUpdateScoreRatingMutation,
  useArchiveScoreRatingMutation,
} = scoreRatingApi;
