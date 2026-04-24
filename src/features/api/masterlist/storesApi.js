import { apiSlice } from "../../../app/apiSlice";

const storeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStores: builder.query({
      query: ({
        status = "active",
        search = "",
        page = 1,
        per_page = 10,
      } = {}) => ({
        url: "/store",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Store"],
    }),
    getStoreById: builder.query({
      query: (id) => ({
        url: `/store/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Store", id }],
    }),
    createStore: builder.mutation({
      query: (body) => ({
        url: "/store",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Store"]),
    }),
    updateStore: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/store/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Store"]),
    }),
    archiveStore: builder.mutation({
      query: (id) => ({
        url: `/store/${id}/toggle_archived`,
        method: "PATCH",
      }),
      invalidatesTags: ["Store"],
    }),
  }),
});

export const {
  useGetStoresQuery,
  useGetStoreByIdQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useArchiveStoreMutation,
} = storeApi;
