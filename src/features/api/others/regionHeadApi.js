import { apiSlice } from "../../../app/apiSlice";

const regionHeadApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRegionHeads: builder.query({
      query: () => ({
        url: "/region_area_head",
        params: { user_type: "region_head" },
      }),
      providesTags: ["RegionHead"],
    }),
  }),
});

export const { useGetRegionHeadsQuery } = regionHeadApi;
