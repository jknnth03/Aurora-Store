import { apiSlice } from "../../../app/apiSlice";

const checklistApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChecklists: builder.query({
      query: ({
        status = "active",
        search = "",
        page = 1,
        per_page = 10,
      } = {}) => ({
        url: "/checklist",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Checklist"],
    }),
    getChecklistById: builder.query({
      query: (id) => ({
        url: `/checklist/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Checklist", id }],
    }),
    createChecklist: builder.mutation({
      query: (body) => ({
        url: "/checklist",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Checklist"]),
    }),
    updateChecklist: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/checklist/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Checklist"]),
    }),
    archiveChecklist: builder.mutation({
      query: (id) => ({
        url: `/checklist/${id}/toggle_archived`,
        method: "PATCH",
      }),
      invalidatesTags: ["Checklist"],
    }),
  }),
});

export const {
  useGetChecklistsQuery,
  useGetChecklistByIdQuery,
  useCreateChecklistMutation,
  useUpdateChecklistMutation,
  useArchiveChecklistMutation,
} = checklistApi;
