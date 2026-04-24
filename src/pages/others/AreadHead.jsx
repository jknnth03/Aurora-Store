import { useState } from "react";
import PersonIcon from "@mui/icons-material/Person";
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
import "./AreaHead.scss";
import { useGetAreaHeadsQuery } from "../../features/api/others/areaHeadApi";

const buildColumns = () => [
  {
    key: "name",
    label: "Area Name",
    sortable: true,
    render: (val) => val ?? "—",
  },
  {
    key: "region",
    label: "Region",
    sortable: true,
    render: (val) => val?.name ?? "—",
  },
  {
    key: "area_head",
    label: "Area Head",
    sortable: true,
    render: (val) => val?.full_name ?? "—",
  },
  {
    key: "store",
    label: "No. of Stores",
    sortable: false,
    render: (val) => val?.length ?? 0,
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

const AreaHead = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  useChipColors();

  const { data, isFetching, error } = useGetAreaHeadsQuery();

  const is404 = error?.status === 404;
  const allData = data?.data?.data ?? [];

  const filtered = allData.filter((row) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      row.name?.toLowerCase().includes(q) ||
      row.region?.name?.toLowerCase().includes(q) ||
      row.area_head?.full_name?.toLowerCase().includes(q)
    );
  });

  const sorted = sortBy
    ? [...filtered].sort((a, b) => {
        const aVal =
          sortBy === "region"
            ? (a.region?.name ?? "")
            : sortBy === "area_head"
              ? (a.area_head?.full_name ?? "")
              : (a[sortBy] ?? "");
        const bVal =
          sortBy === "region"
            ? (b.region?.name ?? "")
            : sortBy === "area_head"
              ? (b.area_head?.full_name ?? "")
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
      title="Area Head"
      titleIcon={<PersonIcon />}
      isEmpty={!isFetching && (paginated.length === 0 || is404)}
      actions={
        <TableSearchField
          value={search}
          onChange={handleSearch}
          placeholder="Search area heads..."
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

export default AreaHead;
