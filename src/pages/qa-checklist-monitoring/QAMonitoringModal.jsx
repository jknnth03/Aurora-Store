import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useGetQaChecklistByIdQuery } from "../../features/api/qa-checklist/qaChecklistApi";
import QAMonitoringReportDialog from "./QAMonitoringReportDialog";
import StartCheckingDialog from "../qa-checklist/StartCheckingDialog";
import "../qa-checklist/QAChecklistModal.scss";

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

const WEEK_LABELS = ["1st", "2nd", "3rd", "4th"];

export const StatusChip = ({ status }) => {
  const map = {
    done: { label: "Done", cls: "chip--done" },
    pending: { label: "Pending", cls: "chip--pending" },
    overdue: { label: "Overdue", cls: "chip--overdue" },
    completed: { label: "Done", cls: "chip--done" },
    approved: { label: "Pending", cls: "chip--pending" },
    "for approval": { label: "Waiting for Approval", cls: "chip--pending" },
    rejected: { label: "Rejected", cls: "chip--overdue" },
    previous_month_incomplete: {
      label: "Previous Month Incomplete",
      cls: "chip--incomplete",
    },
    checklist_not_yet_created: {
      label: "Checklist Not Yet Created",
      cls: "chip--not-created",
    },
  };

  const key = status?.toLowerCase?.() ?? "";
  const config = map[key] ?? { label: "", cls: "chip--default" };

  const maxLength = 13;
  const isTruncated = config.label.length > maxLength;
  const displayLabel = isTruncated
    ? `${config.label.slice(0, maxLength)}...`
    : config.label;

  if (!config.label) return null;

  return (
    <Tooltip title={isTruncated ? config.label : ""} placement="top" arrow>
      <span className={`qa-cm__chip ${config.cls}`}>{displayLabel}</span>
    </Tooltip>
  );
};

const isAutoGraded = (entry) => {
  if (!entry) return false;
  const grade = parseFloat(entry.weekly_grade);
  const hasNoRecord = !entry.start_time && !entry.end_time;
  return grade === 100 && hasNoRecord;
};

const getApproverRemarks = (entry) => {
  if (entry?.approver_remarks) return entry.approver_remarks;
  if (!entry?.for_approval_reason) return "";
  try {
    const parsed = JSON.parse(entry.for_approval_reason);
    return parsed.reason || "";
  } catch {
    return "";
  }
};

const getFallbackStatus = (weekNumber, month, year, allowableDays) => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const isPastMonth =
    year < currentYear || (year === currentYear && month < currentMonth);

  if (!isPastMonth) return "Pending";

  if (allowableDays != null) {
    const lastDayOfMonth = new Date(year, month, 0);
    const deadlineDate = new Date(lastDayOfMonth);
    deadlineDate.setDate(deadlineDate.getDate() + allowableDays);
    if (now <= deadlineDate) return "Pending";
  }

  return "Overdue";
};

const AutoGradedBadge = () => (
  <Tooltip
    title="This week was automatically graded based on grade rules"
    placement="top"
    arrow>
    <span className="qa-cm__auto-badge">
      <AutoAwesomeIcon sx={{ fontSize: 11 }} />
      Auto-graded
    </span>
  </Tooltip>
);

const RowActionMenu = ({
  entry,
  onShowChecklist,
  onShowReport,
  isPreviousWeekDone,
}) => {
  const [anchor, setAnchor] = useState(null);
  const status = entry?.status?.toLowerCase?.();

  const isDone = status === "completed" || status === "done";

  if (isAutoGraded(entry)) {
    return <AutoGradedBadge />;
  }

  if (!isPreviousWeekDone) {
    return <span className="qa-cm__no-action"></span>;
  }

  if (!isDone) {
    return <span className="qa-cm__no-action"></span>;
  }

  return (
    <div className="qa-cm__actions-cell">
      <IconButton
        size="small"
        className="qa-cm__icon-btn qa-cm__icon-btn--dots"
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}>
        <MoreHorizIcon sx={{ fontSize: 18 }} />
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ className: "qa-cm__menu-paper" }}>
        <MenuItem
          className="qa-cm__menu-item"
          onClick={() => {
            setAnchor(null);
            onShowChecklist?.(entry);
          }}>
          <ChecklistIcon className="qa-cm__menu-icon" />
          Show Checklist
        </MenuItem>

        <MenuItem
          className="qa-cm__menu-item"
          onClick={() => {
            setAnchor(null);
            onShowReport?.(entry);
          }}>
          <AssessmentIcon className="qa-cm__menu-icon" />
          Show Report
        </MenuItem>
      </Menu>
    </div>
  );
};

const QAMonitoringModal = ({
  open,
  rowData,
  month,
  year,
  onClose,
  allowableDays,
}) => {
  const [checklistEntry, setChecklistEntry] = useState(null);
  const [reportEntry, setReportEntry] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const storeId = rowData?.id;
  const storeChecklistId = rowData?.store_checklist?.[0]?.id;
  const checklistId = rowData?.store_checklist?.[0]?.checklist?.id;
  const storeName =
    rowData?.code && rowData?.name
      ? `${rowData.code} - ${rowData.name}`
      : (rowData?.name ?? "");

  const { data, isFetching } = useGetQaChecklistByIdQuery(
    { id: storeId, month, year, store_checklist_id: storeChecklistId },
    {
      skip: !open || !storeId || !storeChecklistId,
      refetchOnMountOrArgChange: true,
    },
  );

  const weeklyMap = {};
  (data?.data?.store_checklist?.[0]?.weekly_record ?? []).forEach((entry) => {
    if (entry.week) weeklyMap[entry.week] = entry;
  });

  const rows = WEEK_LABELS.map((label, idx) => {
    const entry = weeklyMap[idx + 1] ?? null;

    const fallbackEntry = {
      week: idx + 1,
      status: getFallbackStatus(idx + 1, month, year, allowableDays),
      weekly_grade: null,
      start_time: null,
      end_time: null,
      updated_at: null,
      for_approval_reason: null,
      approver_remarks: null,
    };

    return { week: idx + 1, label, entry: entry ?? fallbackEntry };
  });

  const rowsWithPrevStatus = rows.map((row, idx) => {
    let isPreviousWeekDone = true;
    if (idx > 0) {
      const prevEntry = rows[idx - 1].entry;
      const prevStatus = prevEntry?.status?.toLowerCase?.() ?? "";
      isPreviousWeekDone = prevStatus === "done" || prevStatus === "completed";
    }
    return { ...row, isPreviousWeekDone };
  });

  const hasAnyRemarks = rowsWithPrevStatus.some((row) =>
    Boolean(getApproverRemarks(row.entry)),
  );

  const monthLabel = MONTHS[(month ?? 1) - 1];

  const formatDate = (entry) => {
    const status = entry?.status?.toLowerCase();
    if (status !== "completed" && status !== "done") return "";
    const dateStr = entry?.updated_at;
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const handleCloseSnackbar = () => setSnackbar((p) => ({ ...p, open: false }));

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        className="qa-cm"
        PaperProps={{ className: "qa-cm__paper" }}>
        <DialogTitle className="qa-cm__title">
          Checklist for the Month of {monthLabel} {year}
        </DialogTitle>

        <DialogContent className="qa-cm__content">
          <table className="qa-cm__table">
            <thead>
              <tr className="qa-cm__thead-row">
                <th className="qa-cm__th qa-cm__th--sortable">
                  Store <span className="qa-cm__sort-arrow">↓</span>
                </th>
                <th className="qa-cm__th">Grade</th>
                <th className="qa-cm__th">Week</th>
                <th className="qa-cm__th">Done on</th>
                <th className="qa-cm__th">Status</th>
                {hasAnyRemarks && (
                  <th className="qa-cm__th">Approver Remarks</th>
                )}
                <th className="qa-cm__th qa-cm__th--right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching
                ? WEEK_LABELS.map((lbl) => (
                    <tr key={lbl} className="qa-cm__tr">
                      {Array.from({ length: hasAnyRemarks ? 7 : 6 }).map(
                        (_, i) => (
                          <td key={i} className="qa-cm__td">
                            <Skeleton variant="text" width="70%" height={20} />
                          </td>
                        ),
                      )}
                    </tr>
                  ))
                : rowsWithPrevStatus.map(
                    ({ week, label, entry, isPreviousWeekDone }) => (
                      <tr key={week} className="qa-cm__tr">
                        <td className="qa-cm__td">{storeName}</td>
                        <td className="qa-cm__td">
                          {entry?.weekly_grade != null
                            ? `${parseFloat(entry.weekly_grade).toFixed(2)}%`
                            : ""}
                        </td>
                        <td className="qa-cm__td">{label}</td>
                        <td className="qa-cm__td">{formatDate(entry)}</td>
                        <td className="qa-cm__td">
                          <StatusChip status={entry.status} />
                        </td>
                        {hasAnyRemarks && (
                          <td className="qa-cm__td">
                            <span className="qa-cm__remarks">
                              {getApproverRemarks(entry)}
                            </span>
                          </td>
                        )}
                        <td className="qa-cm__td qa-cm__td--right">
                          <RowActionMenu
                            entry={entry}
                            onShowChecklist={setChecklistEntry}
                            onShowReport={setReportEntry}
                            isPreviousWeekDone={isPreviousWeekDone}
                          />
                        </td>
                      </tr>
                    ),
                  )}
            </tbody>
          </table>
        </DialogContent>

        <DialogActions className="qa-cm__footer">
          <Button
            variant="outlined"
            onClick={onClose}
            className="qa-cm__btn-close">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <StartCheckingDialog
        open={Boolean(checklistEntry)}
        onClose={() => setChecklistEntry(null)}
        storeId={storeId}
        month={month}
        year={year}
        week={checklistEntry?.week}
        storeChecklistId={storeChecklistId}
        weeklyRecordId={checklistEntry?.id}
        checklistId={checklistId}
        isReSurvey={false}
        isViewMode={true}
        viewData={checklistEntry}
      />

      <QAMonitoringReportDialog
        open={Boolean(reportEntry)}
        onClose={() => setReportEntry(null)}
        entry={reportEntry}
        storeName={storeName}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontFamily: "Poppins, sans-serif", fontSize: "0.82rem" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default QAMonitoringModal;
