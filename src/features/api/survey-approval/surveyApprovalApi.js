import { apiSlice } from "../../../app/apiSlice";

const surveyApprovalApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSurveyApprovals: builder.query({
      query: ({ month, year } = {}) => ({
        url: "/approver_dashboard",
        params: { month, year },
      }),
      providesTags: ["SurveyApproval"],
    }),
    approveSurvey: builder.mutation({
      query: (id) => ({
        url: `/approver_dashboard/${id}/approved`,
        method: "PATCH",
      }),
      invalidatesTags: ["SurveyApproval", "Badge"],
    }),
    rejectSurvey: builder.mutation({
      query: ({ id, remarks }) => ({
        url: `/approver_dashboard/${id}/rejected`,
        method: "PATCH",
        body: { approver_remarks: remarks },
      }),
      invalidatesTags: ["SurveyApproval", "Badge"],
    }),
  }),
});

export const {
  useGetSurveyApprovalsQuery,
  useApproveSurveyMutation,
  useRejectSurveyMutation,
} = surveyApprovalApi;
