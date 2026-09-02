import { apiSlice } from "../../../app/apiSlice";

const guidelinesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGuidelines: builder.query({
      query: ({
        status = "active",
        search = "",
        page = 1,
        per_page = 10,
      } = {}) => ({
        url: "/guideline",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Guideline"],
    }),
    createGuideline: builder.mutation({
      query: (body) => ({
        url: "/guideline",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Guideline"]),
    }),
    updateGuideline: builder.mutation({
      query: ({ id, body }) => ({
        url: `/guideline/${id}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Guideline"]),
    }),
    archiveGuideline: builder.mutation({
      query: (id) => ({
        url: `/guideline/${id}/toggle_archived`,
        method: "PATCH",
      }),
      invalidatesTags: ["Guideline"],
    }),
  }),
});

export const {
  useGetGuidelinesQuery,
  useCreateGuidelineMutation,
  useUpdateGuidelineMutation,
  useArchiveGuidelineMutation,
} = guidelinesApi;
