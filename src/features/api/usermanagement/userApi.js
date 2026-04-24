import { apiSlice } from "../../../app/apiSlice";

const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: ({
        status = "active",
        search = "",
        page = 1,
        per_page = 10,
        role_id,
      } = {}) => ({
        url: "/users",
        params: {
          status,
          search,
          page,
          per_page,
          ...(role_id ? { role_id } : {}),
        },
      }),
      providesTags: ["Users"],
    }),
    getUserById: builder.query({
      query: (id) => ({
        url: `/users/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Users", id }],
    }),
    createUser: builder.mutation({
      query: (body) => ({
        url: "/users",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Users"]),
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) =>
        error ? [] : ["Users", { type: "Users", id }],
    }),
    archiveUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}/toggle_archived`,
        method: "PATCH",
      }),
      invalidatesTags: ["Users"],
    }),
    getActiveOneCharging: builder.query({
      query: ({ search = "" } = {}) => ({
        url: "/one_charging",
        params: { status: "active", search },
      }),
      providesTags: ["OneCharging"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useArchiveUserMutation,
  useGetActiveOneChargingQuery,
} = userApi;
