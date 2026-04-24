import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import PublicIcon from "@mui/icons-material/Public";
import AddIcon from "@mui/icons-material/Add";
import Chip from "@mui/material/Chip";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  TableSearchField,
  ArchivedButton,
} from "../../../reusable-components/table-search/TableSearch";
import {
  useGetRegionsQuery,
  useArchiveRegionMutation,
} from "../../../features/api/masterlist/regionApi";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import RegionModal from "./RegionModal";
import "./Region.scss";
import {
  getChipName,
  useChipColors,
  CHIP_SX,
} from "../../../components/accountmenu/ChipColorPickerDialog";

const buildColumns = (isArchived) => [
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
    key: "status",
    label: "Status",
    sortable: false,
    render: () => {
      const chipId = isArchived ? "chip-inactive" : "chip-active";
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

const Region = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [queryParams, setQueryParams, , resetAfterArchive, resetAfterRestore] =
    useRememberQueryParams();
  const showArchived = queryParams.status === "inactive";
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toArchive, setToArchive] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [toRestore, setToRestore] = useState(null);

  useChipColors();

  const currentStatus = showArchived ? "inactive" : "active";

  const { data, isFetching, error } = useGetRegionsQuery({
    status: currentStatus,
    search: debouncedSearch,
    page,
    per_page: rowsPerPage,
  });
  const [archiveRegion, { isLoading: isArchiving }] =
    useArchiveRegionMutation();

  const is404 = error?.status === 404;
  const tableData = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;

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
    setQueryParams({ search: val || null }, { retain: true });
    setPage(1);
  };

  const handleAdd = () => {
    setSelectedId(null);
    setModalOpen(true);
  };
  const handleRowClick = (row) => {
    setSelectedId(row.id);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setSelectedId(null);
  };

  const handleArchiveClick = (row) => {
    setToArchive(row);
    setConfirmOpen(true);
  };
  const handleConfirmArchive = async () => {
    try {
      await archiveRegion(toArchive.id).unwrap();
      window.__snackbar__?.enqueueSnackbar("Region archived successfully.", {
        variant: "success",
      });
      setConfirmOpen(false);
      setToArchive(null);
      resetAfterArchive();
    } catch (err) {
      console.error("Archive failed:", err);
    }
  };

  const handleRestoreClick = (row) => {
    setToRestore(row);
    setRestoreConfirmOpen(true);
  };
  const handleConfirmRestore = async () => {
    try {
      await archiveRegion(toRestore.id).unwrap();
      window.__snackbar__?.enqueueSnackbar("Region restored successfully.", {
        variant: "success",
      });
      setRestoreConfirmOpen(false);
      setToRestore(null);
      resetAfterRestore();
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  return (
    <>
      <PageContainer
        title="Region"
        titleIcon={<PublicIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add Region"
            shortLabel="Add Rg.."
            tooltip="Click this button to add a new region"
            icon={<AddIcon />}
            onClick={handleAdd}
          />
        }
        actions={
          <>
            <ArchivedButton
              active={showArchived}
              onClick={() => {
                setQueryParams(
                  { status: showArchived ? "active" : "inactive" },
                  { retain: true },
                );
                setPage(1);
              }}
            />
            <TableSearchField
              value={search}
              onChange={handleSearch}
              placeholder="Search regions..."
            />
          </>
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
          columns={buildColumns(showArchived)}
          data={tableData}
          isLoading={isFetching}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={handleRowClick}
          actions={(row) => (
            <RowMenu
              isArchived={showArchived}
              onArchive={() => handleArchiveClick(row)}
              onRestore={() => handleRestoreClick(row)}
            />
          )}
        />
      </PageContainer>

      <RegionModal
        open={modalOpen}
        onClose={handleClose}
        selectedId={selectedId}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        title="Archive Region"
        message={`Are you sure you want to archive region "${toArchive?.name}"? This action will set the region as inactive.`}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        isLoading={isArchiving}
        title="Restore Region"
        message={`Are you sure you want to restore region "${toRestore?.name}"? This will set it back to active.`}
      />
    </>
  );
};

export default Region;
