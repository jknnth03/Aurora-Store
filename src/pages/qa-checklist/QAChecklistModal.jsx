import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Skeleton from "@mui/material/Skeleton";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  useGetQaChecklistByIdQuery,
  useForApprovalMutation,
  useSkipWeekMutation,
} from "../../features/api/qa-checklist/qaChecklistApi";
import QAReportDialog from "./QAReportDialog";
import ConfirmDialog from "../../reusable-components/comfirm-dialog/ConfirmDialog";
import "./QAChecklistModal.scss";
import StartCheckingDialog from "./StartCheckingDialog";

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

const generateConfirmCode = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const buildCaptchaChars = (code) => {
  return code.split("").map((char) => {
    const rotate = Math.floor(Math.random() * 36) - 18;
    const translateY = Math.floor(Math.random() * 14) - 7;
    const scale = (0.88 + Math.random() * 0.3).toFixed(2);
    return {
      char,
      style: {
        transform: `rotate(${rotate}deg) translateY(${translateY}px) scale(${scale})`,
      },
    };
  });
};

export const StatusChip = ({ status }) => {
  const map = {
    done: { label: "Done", cls: "chip--done" },
    pending: { label: "Pending", cls: "chip--pending" },
    overdue: { label: "Overdue", cls: "chip--overdue" },
    completed: { label: "Done", cls: "chip--done" },
    approved: { label: "Pending", cls: "chip--pending" },
    "for approval": { label: "Waiting for Approval", cls: "chip--pending" },
    rejected: { label: "Rejected", cls: "chip--overdue" },
    skipped: { label: "Skipped", cls: "chip--incomplete" },
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
  const status = entry?.status?.toLowerCase?.();
  if (status === "skipped") return "";
  if (entry?.approver_remarks) return entry.approver_remarks;
  if (!entry?.for_approval_reason) return "";
  try {
    const parsed = JSON.parse(entry.for_approval_reason);
    return parsed.reason || "";
  } catch {
    return "";
  }
};

const getSkipRemarks = (entry) => {
  const status = entry?.status?.toLowerCase?.();
  if (status !== "skipped") return "";
  if (entry?.skip_reason) return entry.skip_reason;
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
  onStartChecking,
  onForApproval,
  onShowChecklist,
  onShowReport,
  onSkip,
  isPreviousWeekDone,
}) => {
  const [anchor, setAnchor] = useState(null);
  const status = entry?.status?.toLowerCase?.();

  const isDone = status === "completed" || status === "done";
  const isPending = status === "pending" || status === "approved";
  const isOverdue = status === "overdue";
  const isRejected = status === "rejected";

  if (isAutoGraded(entry)) {
    return <AutoGradedBadge />;
  }

  if (!isPreviousWeekDone) {
    return <span className="qa-cm__no-action"></span>;
  }

  if (!isDone && !isPending && !isOverdue && !isRejected) {
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
        {isPending && (
          <MenuItem
            className="qa-cm__menu-item"
            onClick={() => {
              setAnchor(null);
              onStartChecking?.(entry);
            }}>
            <PlayArrowIcon className="qa-cm__menu-icon" />
            Start Checking
          </MenuItem>
        )}

        {(isOverdue || isRejected) && (
          <MenuItem
            className="qa-cm__menu-item"
            onClick={() => {
              setAnchor(null);
              onForApproval?.(entry);
            }}>
            <TaskAltIcon className="qa-cm__menu-icon" />
            For Approval
          </MenuItem>
        )}

        {isDone && (
          <MenuItem
            className="qa-cm__menu-item"
            onClick={() => {
              setAnchor(null);
              onShowChecklist?.(entry);
            }}>
            <ChecklistIcon className="qa-cm__menu-icon" />
            Show Checklist
          </MenuItem>
        )}

        {isDone && (
          <MenuItem
            className="qa-cm__menu-item"
            onClick={() => {
              setAnchor(null);
              onShowReport?.(entry);
            }}>
            <AssessmentIcon className="qa-cm__menu-icon" />
            Show Report
          </MenuItem>
        )}

        {isPending && (
          <MenuItem
            className="qa-cm__menu-item"
            onClick={() => {
              setAnchor(null);
              onSkip?.(entry);
            }}>
            <SkipNextIcon className="qa-cm__menu-icon" />
            Skip This Week
          </MenuItem>
        )}
      </Menu>
    </div>
  );
};

const ForApprovalDialog = ({ open, entry, onClose, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [forApproval, { isLoading }] = useForApprovalMutation();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please enter a valid reason.");
      return;
    }
    try {
      await forApproval({ id: entry?.id, reason: reason.trim() }).unwrap();
      setReason("");
      setError("");
      onClose();
      onSuccess?.("Approval request submitted successfully.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className="qa-approval">
      <DialogTitle className="qa-approval__title">
        Survey Approval
        <IconButton
          size="small"
          onClick={handleClose}
          className="qa-approval__close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="qa-approval__content">
        <p className="qa-approval__label">Enter a valid reason</p>
        <TextField
          multiline
          rows={4}
          fullWidth
          placeholder="Reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError("");
          }}
          error={Boolean(error)}
          helperText={error}
          variant="outlined"
          className="qa-approval__field"
        />
      </DialogContent>

      <DialogActions className="qa-approval__footer">
        <Button
          variant="text"
          onClick={handleClose}
          disabled={isLoading}
          className="qa-approval__btn-close">
          CLOSE
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading}
          className="qa-approval__btn-submit">
          {isLoading ? "Submitting..." : "SUBMIT"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const QAChecklistModal = ({
  open,
  rowData,
  month,
  year,
  onClose,
  allowableDays,
}) => {
  const [approvalEntry, setApprovalEntry] = useState(null);
  const [checklistEntry, setChecklistEntry] = useState(null);
  const [reportEntry, setReportEntry] = useState(null);
  const [startCheckingEntry, setStartCheckingEntry] = useState(null);

  const [skipEntry, setSkipEntry] = useState(null);
  const [skipReason, setSkipReason] = useState("");
  const [skipReasonError, setSkipReasonError] = useState("");

  const [skipCodeDialogOpen, setSkipCodeDialogOpen] = useState(false);
  const [skipGeneratedCode, setSkipGeneratedCode] = useState("");
  const [skipCaptchaChars, setSkipCaptchaChars] = useState([]);
  const [skipTypedCode, setSkipTypedCode] = useState("");
  const [skipCodeError, setSkipCodeError] = useState("");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [skipWeek, { isLoading: isSkipping }] = useSkipWeekMutation();

  const storeId = rowData?.id;
  const storeChecklistId = rowData?.store_checklist?.[0]?.id;
  const checklistId = rowData?.store_checklist?.[0]?.checklist?.id;
  const storeName =
    rowData?.code && rowData?.name
      ? `${rowData.code} - ${rowData.name}`
      : (rowData?.name ?? "");

  const { data, isFetching, refetch } = useGetQaChecklistByIdQuery(
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
      isPreviousWeekDone =
        prevStatus === "done" ||
        prevStatus === "completed" ||
        prevStatus === "skipped";
    }
    return { ...row, isPreviousWeekDone };
  });

  const hasAnyRemarks = rowsWithPrevStatus.some((row) =>
    Boolean(getApproverRemarks(row.entry)),
  );

  const hasAnySkipRemarks = rowsWithPrevStatus.some((row) =>
    Boolean(getSkipRemarks(row.entry)),
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

  const isApprovedEntry =
    startCheckingEntry?.status?.toLowerCase() === "approved";

  const handleCloseSnackbar = () => setSnackbar((p) => ({ ...p, open: false }));

  const handleSignatureComplete = () => {
    refetch();
    if (reportEntry) {
      const freshWeeklyRecord =
        data?.data?.store_checklist?.[0]?.weekly_record ?? [];
      const freshEntry = freshWeeklyRecord.find(
        (r) => r.week === reportEntry.week,
      );
      if (freshEntry) {
        setReportEntry(freshEntry);
      }
    }
  };

  const handleShowReport = (entry) => {
    const freshWeeklyRecord =
      data?.data?.store_checklist?.[0]?.weekly_record ?? [];
    const freshEntry = freshWeeklyRecord.find((r) => r.week === entry.week);
    setReportEntry(freshEntry ?? entry);
  };

  const resetSkipFlow = () => {
    setSkipEntry(null);
    setSkipReason("");
    setSkipReasonError("");
    setSkipCodeDialogOpen(false);
    setSkipGeneratedCode("");
    setSkipCaptchaChars([]);
    setSkipTypedCode("");
    setSkipCodeError("");
  };

  const handleSkipReasonClose = () => {
    resetSkipFlow();
  };

  const handleSkipReasonConfirm = () => {
    if (!skipReason.trim()) {
      setSkipReasonError("Please enter a valid reason.");
      return;
    }
    const code = generateConfirmCode();
    setSkipGeneratedCode(code);
    setSkipCaptchaChars(buildCaptchaChars(code));
    setSkipTypedCode("");
    setSkipCodeError("");
    setSkipCodeDialogOpen(true);
  };

  const handleSkipCodeRefresh = () => {
    const code = generateConfirmCode();
    setSkipGeneratedCode(code);
    setSkipCaptchaChars(buildCaptchaChars(code));
    setSkipTypedCode("");
    setSkipCodeError("");
  };

  const handleSkipCodeClose = () => {
    setSkipCodeDialogOpen(false);
    setSkipGeneratedCode("");
    setSkipCaptchaChars([]);
    setSkipTypedCode("");
    setSkipCodeError("");
  };

  const handleSkipCodeConfirm = async () => {
    if (skipTypedCode.trim() !== skipGeneratedCode) {
      setSkipCodeError("Code does not match. Please try again.");
      return;
    }
    try {
      await skipWeek({
        store_checklist_id: storeChecklistId,
        weekly_record_id: skipEntry?.id,
        week: skipEntry?.week,
        month,
        year,
        reason: skipReason.trim(),
        confirm: true,
        confirm_code: skipGeneratedCode,
      }).unwrap();
      resetSkipFlow();
      refetch();
      setSnackbar({
        open: true,
        message: "Week skipped successfully.",
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Something went wrong while skipping this week.",
        severity: "error",
      });
    }
  };

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
                {hasAnySkipRemarks && (
                  <th className="qa-cm__th">Skipped Remarks</th>
                )}
                <th className="qa-cm__th qa-cm__th--right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching
                ? WEEK_LABELS.map((lbl) => (
                    <tr key={lbl} className="qa-cm__tr">
                      {Array.from({
                        length:
                          6 +
                          (hasAnyRemarks ? 1 : 0) +
                          (hasAnySkipRemarks ? 1 : 0),
                      }).map((_, i) => (
                        <td key={i} className="qa-cm__td">
                          <Skeleton variant="text" width="70%" height={20} />
                        </td>
                      ))}
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
                        {hasAnySkipRemarks && (
                          <td className="qa-cm__td">
                            <span className="qa-cm__remarks">
                              {getSkipRemarks(entry)}
                            </span>
                          </td>
                        )}
                        <td className="qa-cm__td qa-cm__td--right">
                          <RowActionMenu
                            entry={entry}
                            onStartChecking={(e) => setStartCheckingEntry(e)}
                            onForApproval={setApprovalEntry}
                            onShowChecklist={setChecklistEntry}
                            onShowReport={handleShowReport}
                            onSkip={setSkipEntry}
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

      <ForApprovalDialog
        open={Boolean(approvalEntry)}
        entry={approvalEntry}
        onClose={() => setApprovalEntry(null)}
        onSuccess={(msg) =>
          setSnackbar({ open: true, message: msg, severity: "success" })
        }
      />

      <StartCheckingDialog
        open={Boolean(startCheckingEntry)}
        onClose={() => setStartCheckingEntry(null)}
        storeId={storeId}
        month={month}
        year={year}
        week={startCheckingEntry?.week}
        storeChecklistId={storeChecklistId}
        weeklyRecordId={startCheckingEntry?.id}
        checklistId={checklistId}
        isReSurvey={isApprovedEntry}
        isViewMode={false}
      />

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

      <QAReportDialog
        open={Boolean(reportEntry)}
        onClose={() => setReportEntry(null)}
        entry={reportEntry}
        storeName={storeName}
        onSignatureComplete={handleSignatureComplete}
      />

      <ConfirmDialog
        open={Boolean(skipEntry) && !skipCodeDialogOpen}
        onClose={handleSkipReasonClose}
        onConfirm={handleSkipReasonConfirm}
        title="Skip this week?"
        message={`This will mark week ${skipEntry?.week ?? ""} as skipped for ${storeName}. This action cannot be undone.`}
        confirmLabel="Continue"
        cancelLabel="Cancel"
        confirmDisabled={!skipReason.trim()}>
        <TextField
          multiline
          rows={3}
          fullWidth
          placeholder="Remarks"
          value={skipReason}
          onChange={(e) => {
            setSkipReason(e.target.value);
            if (skipReasonError) setSkipReasonError("");
          }}
          error={Boolean(skipReasonError)}
          helperText={skipReasonError}
          variant="outlined"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={skipCodeDialogOpen}
        onClose={handleSkipCodeClose}
        onConfirm={handleSkipCodeConfirm}
        title="Confirm skip"
        message={`Type the code below to confirm skipping week ${skipEntry?.week ?? ""}.`}
        confirmLabel="Skip Week"
        cancelLabel="Cancel"
        isLoading={isSkipping}
        confirmDisabled={!skipTypedCode.trim()}>
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 8,
            width: "100%",
            marginBottom: 10,
          }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              height: 64,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid #d0d0d0",
              background: "#ffffff",
              boxSizing: "border-box",
              overflow: "hidden",
            }}>
            {skipCaptchaChars.map((c, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "1.7rem",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  userSelect: "none",
                  lineHeight: 1,
                  ...c.style,
                }}>
                {c.char}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSkipCodeRefresh}
            style={{
              flexShrink: 0,
              width: 44,
              height: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #d0d0d0",
              borderRadius: 8,
              background: "#ffffff",
              color: "#6b6b6b",
              cursor: "pointer",
              padding: 0,
            }}>
            <RefreshIcon fontSize="small" />
          </button>
        </div>
        <p
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "0.78rem",
            color: "#6b6b6b",
            margin: "0 0 6px",
            textAlign: "left",
            width: "100%",
          }}>
          Type the code above
        </p>
        <TextField
          fullWidth
          placeholder="Enter the code"
          value={skipTypedCode}
          onChange={(e) => {
            setSkipTypedCode(e.target.value);
            if (skipCodeError) setSkipCodeError("");
          }}
          error={Boolean(skipCodeError)}
          helperText={skipCodeError}
          variant="outlined"
        />
      </ConfirmDialog>

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

export default QAChecklistModal;
