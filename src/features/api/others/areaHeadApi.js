import { apiSlice } from "../../../app/apiSlice";

const areaHeadApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAreaHeads: builder.query({
      query: () => ({
        url: "/region_area_head",
        params: { user_type: "area_head" },
      }),
      providesTags: ["AreaHead"],
    }),
  }),
});

export const { useGetAreaHeadsQuery } = areaHeadApi;
