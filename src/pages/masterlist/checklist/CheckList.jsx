import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AddIcon from "@mui/icons-material/Add";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  TableSearchField,
  ArchivedButton,
} from "../../../reusable-components/table-search/TableSearch";
import {
  useGetChecklistsQuery,
  useArchiveChecklistMutation,
} from "../../../features/api/masterlist/checklistApi";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import CheckListModal from "./CheckListModal";
import CheckListViewDialog from "./CheckListViewDialog";
import "./CheckList.scss";
import {
  getChipName,
  useChipColors,
  CHIP_SX,
} from "../../../components/accountmenu/ChipColorPickerDialog";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const buildColumns = (isArchived, onViewChecklist) => [
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (val) => val ?? "—",
  },
  {
    key: "created_at",
    label: "Date Created",
    sortable: true,
    render: (val) => formatDate(val),
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
  {
    key: "view_checklist",
    label: "View Checklist",
    sortable: false,
    className: "view-checklist-cell", // Added className for cell styling
    render: (_, row) => (
      <Tooltip title="View Checklist" placement="top">
        <button
          className="checklist__view-btn"
          onClick={(e) => {
            e.stopPropagation();
            onViewChecklist(row);
          }}>
          <RemoveRedEyeIcon sx={{ fontSize: "16px" }} />
        </button>
      </Tooltip>
    ),
  },
];

const CheckList = () => {
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewSelectedId, setViewSelectedId] = useState(null);

  useChipColors();

  const currentStatus = showArchived ? "inactive" : "active";

  const { data, isFetching, error } = useGetChecklistsQuery({
    status: currentStatus,
    search: debouncedSearch,
    page,
    per_page: rowsPerPage,
  });
  const [archiveChecklist, { isLoading: isArchiving }] =
    useArchiveChecklistMutation();

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

  const handleViewChecklist = (row) => {
    setViewSelectedId(row.id);
    setViewDialogOpen(true);
  };
  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setViewSelectedId(null);
  };

  const handleArchiveClick = (row) => {
    setToArchive(row);
    setConfirmOpen(true);
  };
  const handleConfirmArchive = async () => {
    try {
      await archiveChecklist(toArchive.id).unwrap();
      window.__snackbar__?.enqueueSnackbar("Checklist archived successfully.", {
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
      await archiveChecklist(toRestore.id).unwrap();
      window.__snackbar__?.enqueueSnackbar("Checklist restored successfully.", {
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
        title="Checklist"
        titleIcon={<ChecklistIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add Checklist"
            shortLabel="Add"
            tooltip="Click this button to add a new checklist"
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
              placeholder="Search checklists..."
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
          columns={buildColumns(showArchived, handleViewChecklist)}
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

      <CheckListModal
        open={modalOpen}
        onClose={handleClose}
        selectedId={selectedId}
      />

      <CheckListViewDialog
        open={viewDialogOpen}
        onClose={handleViewDialogClose}
        selectedId={viewSelectedId}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        title="Archive Checklist"
        message={`Are you sure you want to archive "${toArchive?.name}"? This action will set the checklist as inactive.`}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        isLoading={isArchiving}
        title="Restore Checklist"
        message={`Are you sure you want to restore "${toRestore?.name}"? This will set it back to active.`}
      />
    </>
  );
};

export default CheckList;
