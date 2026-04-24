import { apiSlice } from "../../../app/apiSlice";

const storeChecklistApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStoreChecklists: builder.query({
      query: ({
        status = "active",
        search = "",
        page = 1,
        per_page = 10,
      } = {}) => ({
        url: "/store_checklist",
        params: { status, search, page, per_page },
      }),
      providesTags: ["StoreChecklist"],
    }),
    getStoreChecklistById: builder.query({
      query: (id) => ({
        url: `/store_checklist/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "StoreChecklist", id }],
    }),
    createStoreChecklist: builder.mutation({
      query: (body) => ({
        url: "/store_checklist",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["StoreChecklist"]),
    }),
    updateStoreChecklist: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/store_checklist/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["StoreChecklist"]),
    }),
    archiveStoreChecklist: builder.mutation({
      query: (id) => ({
        url: `/store_checklist/${id}/toggle_archived`,
        method: "PATCH",
      }),
      invalidatesTags: ["StoreChecklist"],
    }),
  }),
});

export const {
  useGetStoreChecklistsQuery,
  useGetStoreChecklistByIdQuery,
  useCreateStoreChecklistMutation,
  useUpdateStoreChecklistMutation,
  useArchiveStoreChecklistMutation,
} = storeChecklistApi;
