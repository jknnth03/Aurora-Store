import { apiSlice } from "../../../app/apiSlice";

const checklistSettingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGradeRules: builder.query({
      query: ({
        status = "active",
        search = "",
        page = 1,
        per_page = 10,
      } = {}) => ({
        url: "/grade_rule",
        params: { status, search, page, per_page },
      }),
      providesTags: ["GradeRule"],
    }),
    createGradeRule: builder.mutation({
      query: (body) => ({
        url: "/grade_rule",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["GradeRule"]),
    }),
    updateGradeRule: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/grade_rule/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["GradeRule"]),
    }),

    getAllowableDays: builder.query({
      query: ({
        status = "active",
        search = "",
        page = 1,
        per_page = 10,
      } = {}) => ({
        url: "/allowable_days",
        params: { status, search, page, per_page },
      }),
      providesTags: ["AllowableDays"],
    }),
    createAllowableDays: builder.mutation({
      query: (body) => ({
        url: "/allowable_days",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["AllowableDays"]),
    }),
    updateAllowableDays: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/allowable_days/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error) => (error ? [] : ["AllowableDays"]),
    }),
  }),
});

export const {
  useGetGradeRulesQuery,
  useCreateGradeRuleMutation,
  useUpdateGradeRuleMutation,
  useGetAllowableDaysQuery,
  useCreateAllowableDaysMutation,
  useUpdateAllowableDaysMutation,
} = checklistSettingsApi;
