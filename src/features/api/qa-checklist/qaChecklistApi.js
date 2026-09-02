import { apiSlice } from "../../../app/apiSlice";

const qaChecklistApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getQaChecklists: builder.query({
      query: ({
        status = "active",
        month,
        year,
        page,
        per_page,
        search,
        region,
        area,
      } = {}) => ({
        url: "/quality_assurance",
        params: {
          status,
          month,
          year,
          ...(page && { page }),
          ...(per_page && { per_page }),
          ...(search && { search }),
          ...(region && { region }),
          ...(area && { area }),
        },
      }),
      providesTags: ["QaChecklist"],
    }),

    getQaChecklistById: builder.query({
      query: ({ id, month, year, week, store_checklist_id }) => ({
        url: `/quality_assurance/${id}`,
        params: { month, year, week, store_checklist_id },
      }),
      providesTags: (result, error, { id }) => [{ type: "QaChecklist", id }],
    }),

    getFilteredChecklist: builder.query({
      query: (id) => ({
        url: `/quality_assurance/${id}/filter_week`,
      }),
      providesTags: (result, error, id) => [{ type: "QaChecklist", id }],
    }),

    viewAttachment: builder.query({
      query: (filename) => ({
        url: "/attachment/view",
        params: { filename },
      }),
    }),

    viewSignature: builder.query({
      query: (id) => ({
        url: `/quality_assurance/${id}/view_attachment`,
        responseHandler: async (response) => {
          if (!response.ok) return { signature_url: null };
          const blob = await response.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ signature_url: reader.result });
            reader.onerror = () => resolve({ signature_url: null });
            reader.readAsDataURL(blob);
          });
        },
        cache: "no-cache",
      }),
      keepUnusedDataFor: 0,
      providesTags: (result, error, id) => [{ type: "QaSignature", id }],
    }),

    exportAreaStores: builder.query({
      query: ({ date, area_id }) => ({
        url: "/export/region/area/store_grades",
        params: { date, area_id },
      }),
    }),

    exportAreaPerWeek: builder.query({
      query: ({ week, month, year, area_id }) => ({
        url: "/export/region/area/store_grades/per_week",
        params: { week, month, year, area_id },
      }),
    }),

    exportAreaMonthlyReport: builder.query({
      query: ({ area_id, month, year }) => ({
        url: "/export/region/area/store_grades/monthly_report",
        params: { area_id, month, year },
        responseHandler: async (response) => {
          if (!response.ok) return { blob: null };
          const blob = await response.blob();
          const disposition = response.headers.get("content-disposition");
          const match = disposition?.match(/filename="?([^"]+)"?/);
          const filename = match?.[1] ?? null;
          return { blob, filename };
        },
        cache: "no-cache",
      }),
      keepUnusedDataFor: 0,
    }),

    answerChecklist: builder.mutation({
      query: (body) => ({
        url: "/quality_assurance",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) =>
        error ? [] : ["QaChecklist", "Badge"],
    }),

    reSurvey: builder.mutation({
      queryFn: async ({ id, formData }, _api, _extraOptions, baseQuery) => {
        formData.append("_method", "PATCH");
        const result = await baseQuery({
          url: `/quality_assurance/${id}`,
          method: "POST",
          body: formData,
        });
        return result.error ? { error: result.error } : { data: result.data };
      },
      invalidatesTags: (result, error) =>
        error ? [] : ["QaChecklist", "Badge"],
    }),

    autoSkip: builder.mutation({
      query: (body) => ({
        url: "/quality_assurance/auto_skip",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) =>
        error ? [] : ["QaChecklist", "Badge"],
    }),

    skipWeek: builder.mutation({
      query: (body) => ({
        url: "/quality_assurance/skip_week",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) =>
        error ? [] : ["QaChecklist", "Badge"],
    }),

    downloadAttachments: builder.mutation({
      query: (body) => ({
        url: "/quality_assurance/download/attachments",
        method: "POST",
        body,
      }),
    }),

    addSignature: builder.mutation({
      queryFn: async (
        { entryId, formData },
        _api,
        _extraOptions,
        baseQuery,
      ) => {
        formData.append("_method", "PATCH");
        const result = await baseQuery({
          url: `/quality_assurance/${entryId}/add_signature`,
          method: "POST",
          body: formData,
        });
        return result.error ? { error: result.error } : { data: result.data };
      },
      invalidatesTags: (result, error, { entryId }) =>
        error ? [] : [{ type: "QaSignature", id: entryId }],
    }),

    forApproval: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/quality_assurance/${id}/for_approval`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error) =>
        error ? [] : ["QaChecklist", "Badge"],
    }),
  }),
});

export const {
  useGetQaChecklistsQuery,
  useGetQaChecklistByIdQuery,
  useGetFilteredChecklistQuery,
  useViewAttachmentQuery,
  useViewSignatureQuery,
  useExportAreaStoresQuery,
  useExportAreaPerWeekQuery,
  useExportAreaMonthlyReportQuery,
  useLazyExportAreaMonthlyReportQuery,
  useAnswerChecklistMutation,
  useReSurveyMutation,
  useAutoSkipMutation,
  useSkipWeekMutation,
  useDownloadAttachmentsMutation,
  useAddSignatureMutation,
  useForApprovalMutation,
} = qaChecklistApi;
