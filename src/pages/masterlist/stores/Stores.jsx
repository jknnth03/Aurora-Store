import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import StoreIcon from "@mui/icons-material/Store";
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
  useGetStoresQuery,
  useArchiveStoreMutation,
} from "../../../features/api/masterlist/storesApi";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import StoresModal from "./StoresModal";
import "./Stores.scss";
import {
  getChipName,
  useChipColors,
  CHIP_SX,
} from "../../../components/accountmenu/ChipColorPickerDialog";

const buildColumns = (isArchived) => [
  {
    key: "code",
    label: "Code",
    sortable: true,
    render: (val) => val ?? "—",
  },
  {
    key: "name",
    label: "Store Name",
    sortable: true,
    render: (val) => val ?? "—",
  },
  {
    key: "region",
    label: "Region",
    sortable: false,
    render: (val) => val?.name ?? "—",
  },
  {
    key: "area",
    label: "Area",
    sortable: false,
    render: (val) => val?.name ?? "—",
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

const Stores = () => {
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

  const { data, isFetching, error } = useGetStoresQuery({
    status: currentStatus,
    search: debouncedSearch,
    page,
    per_page: rowsPerPage,
  });
  const [archiveStore, { isLoading: isArchiving }] = useArchiveStoreMutation();

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
      await archiveStore(toArchive.id).unwrap();
      window.__snackbar__?.enqueueSnackbar("Store archived successfully.", {
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
      await archiveStore(toRestore.id).unwrap();
      window.__snackbar__?.enqueueSnackbar("Store restored successfully.", {
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
        title="Stores"
        titleIcon={<StoreIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add Store"
            shortLabel="Add St.."
            tooltip="Click this button to add a new store"
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
              placeholder="Search stores..."
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

      <StoresModal
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
        title="Archive Store"
        message={`Are you sure you want to archive "${toArchive?.name}"? This action will set the store as inactive.`}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        isLoading={isArchiving}
        title="Restore Store"
        message={`Are you sure you want to restore "${toRestore?.name}"? This will set it back to active.`}
      />
    </>
  );
};

export default Stores;
