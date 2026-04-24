import { apiSlice } from "../../../app/apiSlice";

const regionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRegions: builder.query({
      query: ({
        status = "active",
        search = "",
        page = 1,
        per_page = 10,
      } = {}) => ({
        url: "/region",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Region"],
    }),
    getRegionById: builder.query({
      query: (id) => ({
        url: `/region/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Region", id }],
    }),
    createRegion: builder.mutation({
      query: (body) => ({
        url: "/region",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Region"]),
    }),
    updateRegion: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/region/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Region"]),
    }),
    archiveRegion: builder.mutation({
      query: (id) => ({
        url: `/region/${id}/toggle_archived`,
        method: "PATCH",
      }),
      invalidatesTags: ["Region"],
    }),
  }),
});

export const {
  useGetRegionsQuery,
  useGetRegionByIdQuery,
  useCreateRegionMutation,
  useUpdateRegionMutation,
  useArchiveRegionMutation,
} = regionApi;
