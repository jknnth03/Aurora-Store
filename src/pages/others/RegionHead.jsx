import { useState } from "react";
import GroupsIcon from "@mui/icons-material/Groups";
import Chip from "@mui/material/Chip";
import PageContainer from "../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../reusable-components/table-pagination/TablePagination";
import { TableSearchField } from "../../reusable-components/table-search/TableSearch";
import useDebounce from "../../hooks/useDebounce";
import {
  getChipName,
  useChipColors,
  CHIP_SX,
} from "../../components/accountmenu/ChipColorPickerDialog";
import "./RegionHead.scss";
import { useGetRegionHeadsQuery } from "../../features/api/others/regionHeadApi";

const buildColumns = () => [
  {
    key: "name",
    label: "Region Name",
    sortable: true,
    render: (val) => val ?? "—",
  },
  {
    key: "region_head",
    label: "Region Head",
    sortable: true,
    render: (val) => val?.full_name ?? "—",
  },
  {
    key: "areas",
    label: "No. of Areas",
    sortable: false,
    render: (val) => val?.length ?? 0,
  },
  {
    key: "areas",
    label: "No. of Stores",
    sortable: false,
    render: (val) =>
      val?.reduce((acc, area) => acc + (area.store?.length ?? 0), 0) ?? 0,
  },
  {
    key: "status",
    label: "Status",
    sortable: false,
    render: () => {
      const chipId = "chip-active";
      return (
        <Chip
          label={getChipName(chipId)}
          size="small"
          sx={{
            ...CHIP_SX,
            backgroundColor: `var(--${chipId}-bg)`,
            color: `var(--${chipId}-text)`,
          }}
        />
      );
    },
  },
];

const RegionHead = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  useChipColors();

  const { data, isFetching, error } = useGetRegionHeadsQuery();

  const is404 = error?.status === 404;
  const allData = data?.data?.data ?? [];

  const filtered = allData.filter((row) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      row.name?.toLowerCase().includes(q) ||
      row.region_head?.full_name?.toLowerCase().includes(q)
    );
  });

  const sorted = sortBy
    ? [...filtered].sort((a, b) => {
        const aVal =
          sortBy === "region_head"
            ? (a.region_head?.full_name ?? "")
            : (a[sortBy] ?? "");
        const bVal =
          sortBy === "region_head"
            ? (b.region_head?.full_name ?? "")
            : (b[sortBy] ?? "");
        return sortOrder === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      })
    : filtered;

  const total = sorted.length;
  const paginated = sorted.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };
  const handleRowsPerPage = (val) => {
    setRowsPerPage(val);
    setPage(1);
  };
  const handleSearch = (val) => {
    setSearch(val || "");
    setPage(1);
  };

  return (
    <PageContainer
      title="Region Head"
      titleIcon={<GroupsIcon />}
      isEmpty={!isFetching && (paginated.length === 0 || is404)}
      actions={
        <TableSearchField
          value={search}
          onChange={handleSearch}
          placeholder="Search region heads..."
        />
      }
      pagination={
        <TablePagination
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={handleRowsPerPage}
        />
      }>
      <UniversalTable
        columns={buildColumns()}
        data={paginated}
        isLoading={isFetching}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
    </PageContainer>
  );
};

export default RegionHead;
