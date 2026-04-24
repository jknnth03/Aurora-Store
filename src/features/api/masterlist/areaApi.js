import { apiSlice } from "../../../app/apiSlice";

const areaApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAreas: builder.query({
      query: ({
        status = "active",
        search = "",
        page = 1,
        per_page = 10,
      } = {}) => ({
        url: "/area",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Area"],
    }),
    getAreaById: builder.query({
      query: (id) => ({
        url: `/area/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Area", id }],
    }),
    createArea: builder.mutation({
      query: (body) => ({
        url: "/area",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Area"]),
    }),
    updateArea: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/area/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Area"]),
    }),
    archiveArea: builder.mutation({
      query: (id) => ({
        url: `/area/${id}/toggle_archived`,
        method: "PATCH",
      }),
      invalidatesTags: ["Area"],
    }),
  }),
});

export const {
  useGetAreasQuery,
  useGetAreaByIdQuery,
  useCreateAreaMutation,
  useUpdateAreaMutation,
  useArchiveAreaMutation,
} = areaApi;
