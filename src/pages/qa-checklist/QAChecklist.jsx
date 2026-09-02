import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import PageContainer from "../../reusable-components/page-container/PageContainer";
import QAChecklistTable from "./QAChecklistTable";
import QAChecklistModal, { StatusChip } from "./QAChecklistModal";
import ExportDialog from "./ExportDialog";
import TablePagination from "../../reusable-components/table-pagination/TablePagination";
import { TableDropdownField } from "../../reusable-components/table-search/TableSearch";
import {
  useGetQaChecklistsQuery,
  useLazyExportAreaMonthlyReportQuery,
} from "../../features/api/qa-checklist/qaChecklistApi";
import { useGetRegionsQuery } from "../../features/api/masterlist/regionApi";
import { useGetAreasQuery } from "../../features/api/masterlist/areaApi";
import {
  useGetGradeRulesQuery,
  useGetAllowableDaysQuery,
} from "../../features/api/masterlist/ChecklistsettingsApi";
import "./QAChecklist.scss";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const COMPLETED_STATUSES = ["completed", "done", "skipped"];

const getStoreStatus = (row, month, year, allowableDays) => {
  const storeChecklist = row.store_checklist ?? [];

  if (storeChecklist.length === 0) return "checklist_not_yet_created";

  const sc = storeChecklist[0];
  const createdAt = new Date(sc?.created_at);
  const createdMonth = createdAt.getMonth() + 1;
  const createdYear = createdAt.getFullYear();

  if (year < createdYear || (year === createdYear && month < createdMonth)) {
    return "checklist_not_yet_created";
  }

  if (sc?.has_previous_overdue === true) {
    return "previous_month_incomplete";
  }

  const weeklyRecord = sc?.weekly_record ?? [];

  const completedWeeks = weeklyRecord.filter((w) =>
    COMPLETED_STATUSES.includes(w.status?.toLowerCase()),
  ).length;

  if (completedWeeks >= 4) {
    return "done";
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const isPastMonth =
    year < currentYear || (year === currentYear && month < currentMonth);

  if (isPastMonth && completedWeeks < 4) {
    if (allowableDays != null) {
      const lastDayOfMonth = new Date(year, month, 0);
      const deadlineDate = new Date(lastDayOfMonth);
      deadlineDate.setDate(deadlineDate.getDate() + allowableDays);
      if (now <= deadlineDate) {
        return "pending";
      }
    }
    return "overdue";
  }

  return "pending";
};

const getCompletedWeeks = (row) => {
  const sc = row.store_checklist?.[0];

  if (sc?.has_previous_overdue === true) return 0;

  const records = sc?.weekly_record ?? [];

  const completedCount = records.filter((w) =>
    COMPLETED_STATUSES.includes(w.status?.toLowerCase()),
  ).length;

  return completedCount;
};

const SNACKBAR_MESSAGES = {
  checklist_not_yet_created: "Checklist not yet created.",
  previous_month_incomplete: "Previous month is incomplete.",
};

const columns = (month, year, allowableDays) => [
  {
    key: "store",
    label: "Store",
    sortable: true,
    render: (_, row) =>
      row.code && row.name ? `${row.code} - ${row.name}` : (row.name ?? "—"),
  },
  {
    key: "region",
    label: "Region",
    sortable: true,
    render: (_, row) => row.region?.name ?? "—",
  },
  {
    key: "area",
    label: "Area",
    sortable: true,
    render: (_, row) => row.area?.name ?? "—",
  },
  {
    key: "checklist",
    label: "Checklist",
    sortable: false,
    render: (_, row) => {
      const name = row.store_checklist?.[0]?.checklist?.name ?? "—";
      const maxLength = 40;
      const isTruncated = name.length > maxLength;
      const displayName = isTruncated ? `${name.slice(0, maxLength)}...` : name;

      return isTruncated ? (
        <Tooltip title={name} placement="top" arrow>
          <span style={{ cursor: "default" }}>{displayName}</span>
        </Tooltip>
      ) : (
        <span>{displayName}</span>
      );
    },
  },
  {
    key: "week",
    label: "Week",
    sortable: false,
    render: (_, row) => {
      const completed = getCompletedWeeks(row);
      return <span className="qa-checklist__week-badge">{completed}/4</span>;
    },
  },
  {
    key: "status",
    label: "Status",
    sortable: false,
    render: (_, row) => {
      const status = getStoreStatus(row, month, year, allowableDays);
      return <StatusChip status={status} />;
    },
  },
];

const QAChecklist = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "warning",
  });
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const { data: regionsData } = useGetRegionsQuery({
    status: "active",
    search: "",
    page: 1,
    per_page: 9999,
  });

  const { data: areasData } = useGetAreasQuery(
    {
      status: "active",
      search: "",
      page: 1,
      per_page: 9999,
    },
    { skip: !selectedRegion },
  );

  const { data: allAreasData } = useGetAreasQuery({
    status: "active",
    search: "",
    page: 1,
    per_page: 9999,
  });

  const { data: gradeRulesData } = useGetGradeRulesQuery();
  const { data: allowableDaysData } = useGetAllowableDaysQuery();

  const [triggerExportAreaMonthlyReport, { isFetching: isExporting }] =
    useLazyExportAreaMonthlyReportQuery();

  const capPercentage = gradeRulesData?.data?.[0]?.cap_percentage ?? null;
  const allowableDays = allowableDaysData?.data?.allowable_days ?? null;

  const regionOptions = (regionsData?.data?.data ?? []).map((r) => ({
    value: r.id,
    label: r.name,
  }));

  const areaOptions = (areasData?.data?.data ?? []).map((a) => ({
    value: a.id,
    label: a.name,
  }));

  const exportAreaOptions = (allAreasData?.data?.data ?? []).map((a) => ({
    value: a.id,
    label: a.name,
  }));

  const queryParams = {
    status: "active",
    month,
    year,
    page,
    per_page: rowsPerPage,
    ...(selectedRegion != null && { region: selectedRegion }),
    ...(selectedArea != null && { area: selectedArea }),
  };

  const { data, isFetching, error } = useGetQaChecklistsQuery(queryParams);

  const is404 = error?.status === 404;
  const tableData = is404 ? [] : (data?.data?.data ?? []);
  const total = is404 ? 0 : (data?.data?.total ?? 0);

  const isEmpty = !isFetching && (tableData.length === 0 || is404);

  const handlePrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
    setPage(1);
  };

  const handleNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
    setPage(1);
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleRowsPerPage = (val) => {
    setRowsPerPage(val);
    setPage(1);
  };

  const handleRowClick = (row) => {
    const status = getStoreStatus(row, month, year, allowableDays);

    if (SNACKBAR_MESSAGES[status]) {
      setSnackbar({
        open: true,
        message: SNACKBAR_MESSAGES[status],
        severity: "warning",
      });
      return;
    }

    setSelectedRow(row);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: "", severity: "warning" });
  };

  const handleRegionChange = (val) => {
    setSelectedRegion(val);
    setSelectedArea(null);
    setPage(1);
  };

  const handleAreaChange = (val) => {
    setSelectedArea(val);
    setPage(1);
  };

  const handleOpenExportDialog = () => {
    setExportDialogOpen(true);
  };

  const handleCloseExportDialog = () => {
    setExportDialogOpen(false);
  };

  const handleExport = async ({
    area_id,
    month: exportMonth,
    year: exportYear,
  }) => {
    try {
      const result = await triggerExportAreaMonthlyReport({
        area_id,
        month: exportMonth,
        year: exportYear,
      }).unwrap();

      if (!result?.blob) {
        throw new Error("No file returned");
      }

      const monthLabel = MONTHS[exportMonth - 1];
      const filename =
        result.filename ?? `Area_${area_id}_${monthLabel}_${exportYear}.xlsx`;

      const url = URL.createObjectURL(result.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportDialogOpen(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to export area report.",
        severity: "error",
      });
    }
  };

  const monthLabel = MONTHS[month - 1];

  return (
    <>
      <PageContainer
        isEmpty={isEmpty}
        actions={
          <div className="qa-checklist__actions">
            <div className="qa-checklist__actions-row">
              <div className="qa-checklist__filters">
                <div className="qa-checklist__filters-left">
                  <TableDropdownField
                    value={selectedRegion}
                    onChange={handleRegionChange}
                    options={regionOptions}
                    placeholder="Select Region"
                  />
                  <TableDropdownField
                    value={selectedArea}
                    onChange={handleAreaChange}
                    options={areaOptions}
                    placeholder="Select Area"
                    disabled={!selectedRegion}
                  />
                </div>

                <div className="qa-checklist__month-nav">
                  <IconButton
                    className="qa-checklist__month-arrow"
                    onClick={handlePrev}
                    size="small">
                    <ChevronLeftIcon />
                  </IconButton>
                  <span className="qa-checklist__month-label">
                    QA Dashboard: Month of {monthLabel} {year}
                  </span>
                  <IconButton
                    className="qa-checklist__month-arrow"
                    onClick={handleNext}
                    size="small">
                    <ChevronRightIcon />
                  </IconButton>
                </div>

                <div className="qa-checklist__actions-right">
                  <Button
                    className="qa-checklist__export-btn"
                    startIcon={<FileDownloadOutlinedIcon />}
                    onClick={handleOpenExportDialog}
                    size="small">
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
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
        <QAChecklistTable
          columns={columns(month, year, allowableDays)}
          data={tableData}
          isLoading={isFetching}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={handleRowClick}
        />
      </PageContainer>

      <QAChecklistModal
        open={modalOpen}
        rowData={selectedRow}
        month={month}
        year={year}
        capPercentage={capPercentage}
        allowableDays={allowableDays}
        onClose={handleCloseModal}
      />

      <ExportDialog
        open={exportDialogOpen}
        onClose={handleCloseExportDialog}
        onExport={handleExport}
        areaOptions={exportAreaOptions}
        isExporting={isExporting}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default QAChecklist;
