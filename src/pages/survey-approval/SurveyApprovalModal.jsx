import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import {
  useApproveSurveyMutation,
  useRejectSurveyMutation,
} from "../../features/api/survey-approval/surveyApprovalApi";
import "./SurveyApprovalModal.scss";

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

const ViewField = ({ label, value }) => (
  <div className="sm__field">
    <div className="sm__input-wrap sm__input-wrap--disabled">
      <label className="sm__label">{label}</label>
      <span className="sm__text-value">{value ?? "—"}</span>
    </div>
  </div>
);

const getWeekSuffix = (week) => {
  if (week === 1) return "1st";
  if (week === 2) return "2nd";
  if (week === 3) return "3rd";
  return `${week}th`;
};

const parseApprovalReason = (raw) => {
  if (!raw) return "—";
  try {
    const parsed = JSON.parse(raw);
    return parsed?.reason ?? raw;
  } catch {
    return raw;
  }
};

const RejectConfirmDialog = ({ open, onClose, onConfirm, isRejecting }) => {
  const [remarks, setRemarks] = useState("");

  const handleConfirm = () => onConfirm(remarks);

  const handleClose = () => {
    setRemarks("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        handleClose();
      }}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "sm__paper" }}>
      <div className="sm__header sm__header--reject">
        <div className="sm__header-title sm__header-title--reject">
          <HighlightOffIcon className="sm__header-icon sm__header-icon--reject" />
          <span>Reject Survey</span>
        </div>
        <IconButton
          className="sm__close"
          onClick={handleClose}
          size="small"
          disabled={isRejecting}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="sm__content">
        <div className="sm__group">
          <p className="sm__group-label">Confirmation</p>
          <p className="sm__confirm-text">
            Are you sure you want to reject this survey? Please provide your
            remarks below.
          </p>
        </div>

        <div className="sm__group">
          <p className="sm__group-label">
            Remarks <span className="sm__required">*</span>
          </p>
          <div className="sm__field sm__field--full">
            <div className="sm__textarea-wrap">
              <textarea
                className="sm__textarea"
                rows={4}
                placeholder="Enter rejection remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={isRejecting}
              />
            </div>
          </div>
        </div>

        <div className="sm__footer">
          <button
            className="sm__cancel-btn"
            onClick={handleClose}
            disabled={isRejecting}>
            Cancel
          </button>
          <button
            className="sm__reject-btn"
            onClick={handleConfirm}
            disabled={isRejecting || !remarks.trim()}>
            <HighlightOffIcon fontSize="small" />
            {isRejecting ? "Rejecting..." : "Confirm Reject"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SurveyApprovalModal = ({ open, onClose, onActionSuccess, rowData }) => {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const [approveSurvey, { isLoading: isApproving }] =
    useApproveSurveyMutation();
  const [rejectSurvey, { isLoading: isRejecting }] = useRejectSurveyMutation();

  const storeChecklist = rowData?.store_checklist?.[0];
  const checklistObj = storeChecklist?.checklist;
  const weeklyRecords = storeChecklist?.weekly_record || [];
  const area = rowData?.area;
  const storeName = rowData?.name;

  const pendingRecord = weeklyRecords.find(
    (wr) =>
      wr.status?.toLowerCase() === "for approval" ||
      wr.status?.toLowerCase() === "for_approval" ||
      wr.status === "For Approval" ||
      wr.status?.toLowerCase() === "pending",
  );
  const activeRecord = pendingRecord || weeklyRecords[0];

  const displayedChecklistName =
    (typeof checklistObj === "object" ? checklistObj?.name : checklistObj) ||
    "—";
  const displayedStore = storeName || "—";
  const displayedArea = area?.name || "—";
  const displayedMonth = activeRecord?.month
    ? MONTHS[activeRecord.month - 1]
    : "—";
  const displayedWeek = activeRecord?.week
    ? getWeekSuffix(activeRecord.week)
    : "—";

  const submittedDate =
    activeRecord?.created_at || activeRecord?.create_at
      ? new Date(
          activeRecord.created_at || activeRecord.create_at,
        ).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        })
      : "—";

  const approvalReason = parseApprovalReason(activeRecord?.for_approval_reason);

  const isPending =
    activeRecord?.status?.toLowerCase() === "for approval" ||
    activeRecord?.status?.toLowerCase() === "for_approval" ||
    activeRecord?.status === "For Approval" ||
    activeRecord?.status?.toLowerCase() === "pending";

  const isLoading = isApproving || isRejecting;
  const approvalId = activeRecord?.id;

  const handleApprove = async () => {
    if (!approvalId) return;
    try {
      await approveSurvey(approvalId).unwrap();
      window.__snackbar__?.enqueueSnackbar("Survey approved successfully.", {
        variant: "success",
      });
      onActionSuccess();
    } catch (err) {
      const detail = err?.data?.errors?.[0]?.detail;
      window.__snackbar__?.enqueueSnackbar(
        detail ?? "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
  };

  const handleRejectConfirm = async (remarks) => {
    if (!approvalId) return;
    try {
      await rejectSurvey({ id: approvalId, remarks }).unwrap();
      window.__snackbar__?.enqueueSnackbar("Survey rejected successfully.", {
        variant: "success",
      });
      setRejectDialogOpen(false);
      onActionSuccess();
    } catch (err) {
      const detail = err?.data?.errors?.[0]?.detail;
      window.__snackbar__?.enqueueSnackbar(
        detail ?? "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason === "backdropClick") return;
          onClose();
        }}
        disableEscapeKeyDown
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: "sm__paper" }}>
        <div className="sm__header">
          <div className="sm__header-title">
            <AssignmentTurnedInIcon className="sm__header-icon" />
            <span>Survey Details</span>
          </div>
          <IconButton className="sm__close" onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <DialogContent className="sm__content">
          <div className="sm__group">
            <p className="sm__group-label">Survey Information</p>
            <div className="sm__stack">
              <ViewField label="Checklist" value={displayedChecklistName} />
              <ViewField label="Store" value={displayedStore} />
              <ViewField label="Area" value={displayedArea} />
              <ViewField label="Month" value={displayedMonth} />
              <ViewField label="Week" value={displayedWeek} />
              <ViewField label="Submitted Date" value={submittedDate} />
            </div>
          </div>

          <div className="sm__group">
            <p className="sm__group-label">Approval Request Reason</p>
            <ViewField label="Reason" value={approvalReason} />
          </div>

          {isPending && (
            <div className="sm__footer">
              <button
                className="sm__reject-btn"
                onClick={() => setRejectDialogOpen(true)}
                disabled={isLoading}>
                <HighlightOffIcon fontSize="small" />
                Reject
              </button>
              <button
                className="sm__approve-btn"
                onClick={handleApprove}
                disabled={isLoading}>
                <CheckCircleOutlineIcon fontSize="small" />
                {isApproving ? "Approving..." : "Approve"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RejectConfirmDialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        onConfirm={handleRejectConfirm}
        isRejecting={isRejecting}
      />
    </>
  );
};

export default SurveyApprovalModal;
