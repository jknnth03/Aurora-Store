import { apiSlice } from "../../../app/apiSlice";

const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBadgeCount: builder.query({
      query: () => ({
        url: "/approver_dashboard/badge_count",
        method: "GET",
      }),
      providesTags: ["Badge"],
    }),
  }),
});

export const { useGetBadgeCountQuery } = extendedApi;
