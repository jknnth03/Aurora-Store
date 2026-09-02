import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import DescriptionIcon from "@mui/icons-material/Description";
import AddIcon from "@mui/icons-material/Add";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  TableSearchField,
  ArchivedButton,
} from "../../../reusable-components/table-search/TableSearch";
import {
  useGetGuidelinesQuery,
  useArchiveGuidelineMutation,
} from "../../../features/api/masterlist/guidelinesApi";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import GuidelinesModal from "./GuidelinesModal";
import GuidelineFileDialog from "./GuidelineFileDialog";
import "./Guidelines.scss";
import {
  getChipName,
  useChipColors,
  CHIP_SX,
} from "../../../components/accountmenu/ChipColorPickerDialog";

const buildColumns = (isArchived, onViewFile) => [
  {
    key: "title",
    label: "Title",
    sortable: true,
    render: (val) => val ?? "—",
  },
  {
    key: "file_url",
    label: "View Guideline",
    sortable: false,
    render: (val, row) =>
      val ? (
        <div className="guidelines__view-cell">
          <IconButton
            size="small"
            className="guidelines__view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewFile(row);
            }}>
            <RemoveRedEyeIcon fontSize="small" />
          </IconButton>
        </div>
      ) : (
        "—"
      ),
  },
  {
    key: "applies_to_all",
    label: "Applies To",
    sortable: false,
    render: (val, row) =>
      val ? "All Checklists" : `${row?.checklists?.length ?? 0} Checklist(s)`,
  },
  {
    key: "is_in_use",
    label: "In Use",
    sortable: false,
    render: (val) => {
      const chipId = val ? "chip-active" : "chip-inactive";
      return (
        <Chip
          label={val ? "Yes" : "No"}
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

const Guidelines = () => {
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
  const [selectedRow, setSelectedRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toArchive, setToArchive] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [toRestore, setToRestore] = useState(null);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [fileToView, setFileToView] = useState(null);

  const handleViewFile = (row) => {
    setFileToView(row);
    setFileDialogOpen(true);
  };

  useChipColors();

  const currentStatus = showArchived ? "inactive" : "active";

  const { data, isFetching, error } = useGetGuidelinesQuery({
    status: currentStatus,
    search: debouncedSearch,
    page,
    per_page: rowsPerPage,
  });
  const [archiveGuideline, { isLoading: isArchiving }] =
    useArchiveGuidelineMutation();

  const is404 = error?.status === 404;
  const tableData = data?.data ?? [];
  const total = data?.total ?? tableData.length;

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
    setSelectedRow(null);
    setModalOpen(true);
  };
  const handleRowClick = (row) => {
    setSelectedRow(row);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  const handleArchiveClick = (row) => {
    setToArchive(row);
    setConfirmOpen(true);
  };
  const handleConfirmArchive = async () => {
    try {
      await archiveGuideline(toArchive.id).unwrap();
      window.__snackbar__?.enqueueSnackbar("Guideline archived successfully.", {
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
      await archiveGuideline(toRestore.id).unwrap();
      window.__snackbar__?.enqueueSnackbar("Guideline restored successfully.", {
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
        title="Guidelines"
        titleIcon={<DescriptionIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add Guideline"
            shortLabel="Add Gl.."
            tooltip="Click this button to add a new guideline"
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
              placeholder="Search guidelines..."
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
          columns={buildColumns(showArchived, handleViewFile)}
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

      <GuidelinesModal
        open={modalOpen}
        onClose={handleClose}
        selectedRow={selectedRow}
      />

      <GuidelineFileDialog
        open={fileDialogOpen}
        onClose={() => {
          setFileDialogOpen(false);
          setFileToView(null);
        }}
        fileUrl={fileToView?.file_url}
        filename={fileToView?.filename}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        title="Archive Guideline"
        message={`Are you sure you want to archive guideline "${toArchive?.title}"? This action will set the guideline as inactive.`}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        isLoading={isArchiving}
        title="Restore Guideline"
        message={`Are you sure you want to restore guideline "${toRestore?.title}"? This will set it back to active.`}
      />
    </>
  );
};

export default Guidelines;
