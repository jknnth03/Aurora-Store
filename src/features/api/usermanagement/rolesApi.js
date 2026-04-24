import { apiSlice } from "../../../app/apiSlice";

const rolesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: ({
        status = "active",
        search = "",
        page = 1,
        per_page = 10,
      } = {}) => ({
        url: "/role",
        params: { status, search, page, per_page },
      }),
      providesTags: ["Roles"],
    }),
    getAllRoles: builder.query({
      query: () => ({
        url: "/role",
        params: { status: "active", per_page: 9999 },
      }),
      providesTags: ["Roles"],
    }),
    getRoleById: builder.query({
      query: (id) => ({
        url: `/role/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Roles", id }],
    }),
    createRole: builder.mutation({
      query: (body) => ({
        url: "/role",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Roles"]),
    }),
    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/role/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["Roles"]),
    }),
    archiveRole: builder.mutation({
      query: (id) => ({
        url: `/role/${id}/toggle_archived`,
        method: "PATCH",
      }),
      invalidatesTags: ["Roles"],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetAllRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useArchiveRoleMutation,
} = rolesApi;
