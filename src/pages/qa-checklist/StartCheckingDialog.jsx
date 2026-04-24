import { useState, useRef, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AttachmentIcon from "@mui/icons-material/Attachment";
import {
  useGetQaChecklistByIdQuery,
  useAnswerChecklistMutation,
  useReSurveyMutation,
} from "../../features/api/qa-checklist/qaChecklistApi";
import { useGetChecklistByIdQuery } from "../../features/api/masterlist/checklistApi";
import "./StartCheckingDialog.scss";
import { useGetUsersQuery } from "../../features/api/usermanagement/userApi";

const isPass = (compliance) => compliance === "1";
const needsRemarks = (compliance) => compliance === "2" || compliance === "3";

const RequiredMark = () => (
  <span className="scd__required" aria-hidden="true">
    {" "}
    *
  </span>
);

const SkeletonBlock = () => (
  <div className="scd__skeleton-wrap">
    {[70, 50, 85, 60, 40, 75].map((w, i) => (
      <span
        key={i}
        className="ut__skeleton"
        style={{
          width: `${w}%`,
          height: 18,
          borderRadius: 6,
          display: "block",
        }}
      />
    ))}
  </div>
);

const AttachmentPreviewDialog = ({ open, onClose, url, name }) => {
  const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name ?? "");
  const isPdf = /\.pdf$/i.test(name ?? "");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "scd__preview-paper" }}>
      <div className="scd__preview-header">
        <div className="scd__preview-title">
          <AttachmentIcon sx={{ fontSize: "1rem" }} />
          <span>{name || "Attachment"}</span>
        </div>
        <IconButton size="small" className="scd__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
      <DialogContent className="scd__preview-content">
        {isImage ? (
          <img src={url} alt={name} className="scd__preview-img" />
        ) : isPdf ? (
          <iframe src={url} title={name} className="scd__preview-iframe" />
        ) : (
          <div className="scd__preview-fallback">
            <AttachmentIcon sx={{ fontSize: "2.5rem", opacity: 0.4 }} />
            <p>Preview not available for this file type.</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="scd__preview-link">
              Open file
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const AttachmentCell = ({ value, onChange, disabled, viewUrl, viewName }) => {
  const fileRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onChange(file);
    e.target.value = "";
  };

  if (disabled) {
    if (viewUrl) {
      return (
        <>
          <div className="scd__attach-cell">
            <div className="scd__attach-preview">
              <Tooltip title={viewName || "View attachment"} placement="top">
                <span className="scd__attach-name scd__attach-name--view">
                  {viewName || "attachment"}
                </span>
              </Tooltip>
              <Tooltip title="View file" placement="top">
                <IconButton
                  size="small"
                  className="scd__attach-view-btn"
                  onClick={() => setPreviewOpen(true)}>
                  <VisibilityIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          <AttachmentPreviewDialog
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            url={viewUrl}
            name={viewName}
          />
        </>
      );
    }
    return (
      <div className="scd__attach-cell">
        <span className="scd__compliance-dash">—</span>
      </div>
    );
  }

  return (
    <div className="scd__attach-cell">
      <input
        type="file"
        ref={fileRef}
        style={{ display: "none" }}
        accept="image/*,application/pdf"
        onChange={handleFileChange}
      />
      {value ? (
        <div className="scd__attach-preview">
          <Tooltip title={value.name} placement="top">
            <span className="scd__attach-name">{value.name}</span>
          </Tooltip>
          <Tooltip title="Remove">
            <IconButton
              size="small"
              className="scd__attach-remove"
              onClick={() => onChange(null)}>
              <DeleteOutlineIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
        </div>
      ) : (
        <Tooltip title="Attach file" placement="top">
          <button
            type="button"
            className="scd__attach-btn"
            onClick={() => fileRef.current?.click()}>
            <AttachFileIcon sx={{ fontSize: 14 }} />
            <span>No file</span>
          </button>
        </Tooltip>
      )}
    </div>
  );
};

const StaffAutocomplete = ({
  value,
  onChange,
  disabled,
  users,
  isFetchingUsers,
  onOpen,
  hasError,
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const getLabel = (u) => u?.full_name ?? u?.name ?? u?.username ?? "";
  const selected = Array.isArray(value) ? value : [];

  const options = search
    ? users.filter((u) =>
        getLabel(u).toLowerCase().includes(search.toLowerCase()),
      )
    : users;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setOpen((p) => !p);
    if (!open) onOpen?.();
  };

  const handleToggle = (user) => {
    const exists = selected.some((s) => s.id === user.id);
    const next = exists
      ? selected.filter((s) => s.id !== user.id)
      : [...selected, user];
    onChange(next);
  };

  const handleRemove = (userId) => {
    onChange(selected.filter((s) => s.id !== userId));
  };

  if (disabled) {
    return (
      <div className="scd__ac scd__ac--disabled">
        <div className="scd__ac-box scd__ac-box--multi">
          {selected.length > 0 ? (
            <div className="scd__ac-tags">
              {selected.map((u) => (
                <span key={u.id} className="scd__ac-tag">
                  {getLabel(u)}
                </span>
              ))}
            </div>
          ) : (
            <span className="scd__ac-value">—</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`scd__ac${hasError ? " scd__ac--error" : ""}`}
      ref={wrapRef}>
      <div className="scd__ac-box scd__ac-box--multi" onClick={handleOpen}>
        <div className="scd__ac-tags-wrap">
          {selected.length > 0 ? (
            <div className="scd__ac-tags">
              {selected.map((u) => (
                <span key={u.id} className="scd__ac-tag">
                  {getLabel(u)}
                  <button
                    type="button"
                    className="scd__ac-tag-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(u.id);
                    }}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className="scd__ac-placeholder">Select staff on duty...</span>
          )}
        </div>
        <span className="scd__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>
      {open && (
        <div className="scd__ac-dropdown">
          <div className="scd__ac-search-wrap scd__ac-search-wrap--inside">
            <SearchIcon sx={{ fontSize: "0.9rem", flexShrink: 0 }} />
            <input
              autoFocus
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="scd__ac-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="scd__ac-options">
            {isFetchingUsers ? (
              <p className="scd__ac-empty">Loading...</p>
            ) : options.length === 0 ? (
              <p className="scd__ac-empty">No staff found</p>
            ) : (
              options.map((u) => {
                const isSelected = selected.some((s) => s.id === u.id);
                return (
                  <div
                    key={u.id}
                    className={`scd__ac-option${isSelected ? " scd__ac-option--selected" : ""}`}
                    onClick={() => handleToggle(u)}>
                    <span className="scd__ac-option-check">
                      {isSelected ? "✓" : ""}
                    </span>
                    {getLabel(u)}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StartCheckingDialog = ({
  open,
  onClose,
  storeId,
  month,
  year,
  week,
  storeChecklistId,
  weeklyRecordId,
  checklistId,
  isReSurvey,
  isViewMode = false,
  viewData = null,
}) => {
  const { data, isFetching } = useGetQaChecklistByIdQuery(
    { id: storeId, month, year, week, store_checklist_id: storeChecklistId },
    {
      skip: !open || !storeId || !storeChecklistId,
      refetchOnMountOrArgChange: true,
    },
  );

  const [answerChecklist, { isLoading: isSubmittingAnswer }] =
    useAnswerChecklistMutation();
  const [reSurvey, { isLoading: isSubmittingReSurvey }] = useReSurveyMutation();
  const isSubmitting = isSubmittingAnswer || isSubmittingReSurvey;

  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);
  const { data: usersData, isFetching: isFetchingUsers } = useGetUsersQuery(
    { status: "active", pagination: "none" },
    { skip: !staffDropdownOpen },
  );

  const storeData = data?.data ?? null;
  const storeChecklist = storeData?.store_checklist?.[0] ?? null;

  const { data: checklistData, isFetching: isFetchingChecklist } =
    useGetChecklistByIdQuery(checklistId, { skip: !checklistId || !open });

  const sections = checklistData?.data?.sections ?? [];

  const [answers, setAnswers] = useState({});
  const [others, setOthers] = useState({
    start_time: "",
    end_time: "",
    store_visit: "",
    expired: "",
    condemned: "",
    staff_on_duty: [],
    good_points: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const intervalRef = useRef(null);
  const getNow = () => new Date().toTimeString().slice(0, 5);

  useEffect(() => {
    if (!open) {
      clearInterval(intervalRef.current);
      return;
    }

    if (isViewMode && viewData) {
      const auditTrail = viewData?.audit_trail?.[0]?.new_data ?? null;
      const meta = auditTrail?.inspection_metadata ?? null;
      const snapshot = auditTrail?.checklist_snapshot ?? null;

      const rebuiltAnswers = {};
      snapshot?.sections?.forEach((section) => {
        section?.questions?.forEach((q) => {
          if (q.response) {
            rebuiltAnswers[q.id] = {
              compliance: q.response.answer_text ?? q.response.answer ?? "",
              remarks: q.response.remarks ?? "",
              attachment: null,
              attachmentUrl: q.response.attachment?.file_url ?? null,
              attachmentName: q.response.attachment?.original_name ?? null,
            };
          }
        });
      });
      setAnswers(rebuiltAnswers);

      const rawDuties = meta?.store_duties ?? [];
      const staffArray = Array.isArray(rawDuties)
        ? rawDuties
        : [rawDuties].filter(Boolean);

      setOthers({
        start_time: viewData?.start_time ?? "",
        end_time: viewData?.end_time ?? "",
        store_visit:
          meta?.store_visit === "1" || meta?.store_visit === 1 ? "Yes" : "No",
        expired:
          meta?.expired === "1" || meta?.expired === 1
            ? "with expired items"
            : "without expired items",
        condemned:
          meta?.condemned === "1" || meta?.condemned === 1
            ? "with condemned items"
            : "without condemned items",
        staff_on_duty: staffArray,
        good_points: meta?.good_points ?? "",
        notes: meta?.notes ?? "",
      });
    } else {
      setOthers((p) => ({ ...p, start_time: getNow(), end_time: getNow() }));
      intervalRef.current = setInterval(() => {
        setOthers((p) => ({ ...p, end_time: getNow() }));
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [open, isViewMode, viewData]);

  const users = Array.isArray(usersData?.data?.data)
    ? usersData.data.data
    : Array.isArray(usersData?.data)
      ? usersData.data
      : Array.isArray(usersData?.result)
        ? usersData.result
        : [];

  const setCompliance = (qId, val) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        compliance: val,
        ...(isPass(val) ? { remarks: "", attachment: null } : {}),
      },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`compliance_${qId}`];
      delete next[`remarks_${qId}`];
      return next;
    });
  };

  const setRemarks = (qId, val) => {
    setAnswers((prev) => ({ ...prev, [qId]: { ...prev[qId], remarks: val } }));
    if (val.trim()) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[`remarks_${qId}`];
        return n;
      });
    }
  };

  const setAttachment = (qId, file) =>
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], attachment: file },
    }));

  const validate = () => {
    const newErrors = {};

    sections.forEach((section) => {
      section.questions.forEach((q) => {
        const ans = answers[q.id] ?? {};
        const compliance = ans.compliance ?? "";
        if (!compliance) newErrors[`compliance_${q.id}`] = "Required";
        if (needsRemarks(compliance) && !ans.remarks?.trim())
          newErrors[`remarks_${q.id}`] = "Required";
      });
    });

    if (!others.store_visit) newErrors["store_visit"] = "Required";
    if (!others.expired) newErrors["expired"] = "Required";
    if (!others.condemned) newErrors["condemned"] = "Required";
    if (
      !Array.isArray(others.staff_on_duty) ||
      others.staff_on_duty.length === 0
    )
      newErrors["staff_on_duty"] = "Required";
    if (!others.good_points?.trim()) newErrors["good_points"] = "Required";
    if (!others.notes?.trim()) newErrors["notes"] = "Required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setAnswers({});
    setErrors({});
    setOthers({
      start_time: "",
      end_time: "",
      store_visit: "",
      expired: "",
      condemned: "",
      staff_on_duty: [],
      good_points: "",
      notes: "",
    });
    onClose();
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.append("start_time", others.start_time ?? "");
    formData.append("end_time", others.end_time ?? "");
    formData.append("store_id", storeId);
    formData.append("checklist_id", checklistData?.data?.id ?? "");
    formData.append("store_checklist_id", storeChecklistId ?? "");
    formData.append("code", storeChecklist?.code ?? "");
    formData.append("status", "Completed");
    formData.append("late_survey", 0);

    sections.forEach((section, sIdx) => {
      formData.append(`section[${sIdx}][section_id]`, section.id);
      formData.append(
        `section[${sIdx}][section_order_index]`,
        section.order_index,
      );
      formData.append(`section[${sIdx}][category_id]`, section.category_id);
    });

    let rIdx = 0;
    sections.forEach((section) => {
      section.questions.forEach((q) => {
        const ans = answers[q.id] ?? {};
        formData.append(`responses[${rIdx}][section_id]`, section.id);
        formData.append(`responses[${rIdx}][question_id]`, q.id);
        formData.append(
          `responses[${rIdx}][question_order_index]`,
          q.order_index,
        );
        formData.append(`responses[${rIdx}][question_text]`, q.question_text);
        formData.append(`responses[${rIdx}][question_type]`, q.question_type);
        formData.append(`responses[${rIdx}][answer]`, ans.compliance ?? "");
        formData.append(
          `responses[${rIdx}][answer_text]`,
          ans.compliance ?? "",
        );
        formData.append(`responses[${rIdx}][remarks]`, ans.remarks ?? "");
        if (ans.attachment)
          formData.append(`responses[${rIdx}][attachment]`, ans.attachment);
        rIdx++;
      });
    });

    formData.append("store_visit", others.store_visit === "Yes" ? 1 : 0);
    formData.append("expired", others.expired === "with expired items" ? 1 : 0);
    formData.append(
      "condemned",
      others.condemned === "with condemned items" ? 1 : 0,
    );
    formData.append("good_points", others.good_points ?? "");
    formData.append("notes", others.notes ?? "");

    const staffList = Array.isArray(others.staff_on_duty)
      ? others.staff_on_duty
      : [];
    staffList.forEach((staff, idx) => {
      formData.append(`store_duty_id[${idx}]`, staff.id);
    });

    return formData;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const formData = buildFormData();
    try {
      if (isReSurvey) {
        await reSurvey({ id: weeklyRecordId, formData }).unwrap();
      } else {
        await answerChecklist(formData).unwrap();
      }
      setSnackbar({
        open: true,
        message: "Checking completed! Check the report for details.",
      });
      handleClose();
    } catch (err) {
      console.error("Submit failed:", err?.data?.errors ?? err);
    }
  };

  const handleSnackbarClose = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ open: false, message: "" });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason === "backdropClick") return;
          handleClose();
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: `scd__paper${isViewMode ? " scd__paper--view" : ""}`,
        }}>
        <div className="scd__header">
          <div className="scd__header-title">
            <ChecklistIcon className="scd__header-icon" />
            <span>{isViewMode ? "View Checklist" : "Start Checking"}</span>
          </div>
          <IconButton size="small" className="scd__close" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <DialogContent className="scd__content">
          {isFetching ? (
            <SkeletonBlock />
          ) : !storeData ? (
            <p className="scd__empty">No checklist data found.</p>
          ) : (
            <>
              <div className="scd__name-row">
                <span className="scd__name-value">
                  {storeData.name} — {storeChecklist?.checklist ?? ""}
                </span>
              </div>
              {!storeChecklist ? (
                <p className="scd__empty">No store checklist found.</p>
              ) : (
                <div className="scd__sections">
                  <div className="scd__section">
                    <div className="scd__section-header">
                      <span className="scd__section-title">
                        {storeChecklist.checklist}
                      </span>
                    </div>
                    <div className="scd__table-scroll">
                      <table className="scd__table">
                        <thead>
                          <tr className="scd__thead-row">
                            <th className="scd__th scd__th--item">Item</th>
                            <th className="scd__th scd__th--compliance">
                              Compliance{!isViewMode && <RequiredMark />}
                            </th>
                            <th className="scd__th scd__th--remarks">
                              Remarks
                              {!isViewMode && (
                                <span className="scd__th-hint">
                                  {" "}
                                  (required if 2 or 3)
                                </span>
                              )}
                            </th>
                            <th className="scd__th scd__th--attachment">
                              Attachment
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {isFetchingChecklist ? (
                            <tr>
                              <td colSpan={4}>
                                <SkeletonBlock />
                              </td>
                            </tr>
                          ) : sections.length === 0 ? (
                            <tr>
                              <td colSpan={4}>
                                <em className="scd__empty">
                                  No questions found.
                                </em>
                              </td>
                            </tr>
                          ) : (
                            sections.flatMap((section) =>
                              section.questions.map((q, qIdx) => {
                                const compliance =
                                  answers[q.id]?.compliance ?? "";
                                const pass = isPass(compliance);
                                const remarksRequired =
                                  needsRemarks(compliance);
                                const complianceError =
                                  errors[`compliance_${q.id}`];
                                const remarksError = errors[`remarks_${q.id}`];

                                return (
                                  <tr key={q.id} className="scd__tr">
                                    <td className="scd__td scd__td--item">
                                      {qIdx + 1}. {q.question_text}
                                    </td>
                                    <td className="scd__td scd__td--compliance">
                                      <div
                                        className={`scd__radio-box${isViewMode ? " scd__radio-box--readonly" : ""}${complianceError ? " scd__radio-box--error" : ""}`}>
                                        {q.options.map((opt) => (
                                          <label
                                            key={opt.id}
                                            className={`scd__radio-item${isViewMode ? " scd__radio-item--readonly" : ""}`}>
                                            <input
                                              type="radio"
                                              name={`compliance_${q.id}`}
                                              value={opt.option_text}
                                              checked={
                                                compliance === opt.option_text
                                              }
                                              onChange={() =>
                                                !isViewMode &&
                                                setCompliance(
                                                  q.id,
                                                  opt.option_text,
                                                )
                                              }
                                              className="scd__radio-input"
                                              readOnly={isViewMode}
                                            />
                                            <span className="scd__radio-circle" />
                                            <span className="scd__radio-text">
                                              {opt.option_text}
                                            </span>
                                          </label>
                                        ))}
                                      </div>
                                      {complianceError && (
                                        <span className="scd__field-error">
                                          {complianceError}
                                        </span>
                                      )}
                                    </td>
                                    <td className="scd__td scd__td--remarks">
                                      <textarea
                                        className={`scd__textarea-input${isViewMode || pass ? " scd__textarea-input--readonly" : ""}${remarksError ? " scd__textarea-input--error" : ""}`}
                                        placeholder={
                                          pass
                                            ? "N/A"
                                            : remarksRequired
                                              ? "Required — enter your remarks"
                                              : "Enter your response"
                                        }
                                        value={answers[q.id]?.remarks ?? ""}
                                        onChange={(e) =>
                                          !isViewMode &&
                                          !pass &&
                                          setRemarks(q.id, e.target.value)
                                        }
                                        rows={2}
                                        readOnly={isViewMode || pass}
                                      />
                                      {remarksError && (
                                        <span className="scd__field-error">
                                          {remarksError}
                                        </span>
                                      )}
                                    </td>
                                    <td className="scd__td scd__td--attachment">
                                      <AttachmentCell
                                        value={
                                          answers[q.id]?.attachment ?? null
                                        }
                                        onChange={(file) =>
                                          !isViewMode &&
                                          setAttachment(q.id, file)
                                        }
                                        disabled={isViewMode || pass}
                                        viewUrl={
                                          answers[q.id]?.attachmentUrl ?? null
                                        }
                                        viewName={
                                          answers[q.id]?.attachmentName ?? null
                                        }
                                      />
                                    </td>
                                  </tr>
                                );
                              }),
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div className="scd__others">
                <div className="scd__others-header">
                  <span>Others</span>
                </div>
                <div className="scd__others-body">
                  <div className="scd__field">
                    <span className="scd__field-label">Start Time</span>
                    <input
                      type="time"
                      className="scd__time-input"
                      value={others.start_time}
                      readOnly
                      onChange={() => {}}
                    />
                  </div>

                  <div className="scd__field">
                    <span className="scd__field-label">End Time</span>
                    <input
                      type="time"
                      className="scd__time-input"
                      value={others.end_time}
                      readOnly
                      onChange={() => {}}
                    />
                  </div>

                  <div className="scd__field">
                    <span className="scd__field-label">
                      Store Visit{!isViewMode && <RequiredMark />}
                    </span>
                    <div
                      className={`scd__radio-box${isViewMode ? " scd__radio-box--readonly" : ""}${errors.store_visit ? " scd__radio-box--error" : ""}`}>
                      {["Yes", "No"].map((opt) => (
                        <label
                          key={opt}
                          className={`scd__radio-item${isViewMode ? " scd__radio-item--readonly" : ""}`}>
                          <input
                            type="radio"
                            name="store_visit"
                            value={opt}
                            checked={others.store_visit === opt}
                            onChange={() => {
                              if (!isViewMode) {
                                setOthers((p) => ({
                                  ...p,
                                  store_visit: opt,
                                }));
                                setErrors((p) => {
                                  const n = { ...p };
                                  delete n.store_visit;
                                  return n;
                                });
                              }
                            }}
                            className="scd__radio-input"
                            readOnly={isViewMode}
                          />
                          <span className="scd__radio-circle" />
                          <span className="scd__radio-text">{opt}</span>
                        </label>
                      ))}
                    </div>
                    {errors.store_visit && (
                      <span className="scd__field-error">
                        {errors.store_visit}
                      </span>
                    )}
                  </div>

                  <div className="scd__field">
                    <span className="scd__field-label">
                      Expired{!isViewMode && <RequiredMark />}
                    </span>
                    <div
                      className={`scd__radio-box${isViewMode ? " scd__radio-box--readonly" : ""}${errors.expired ? " scd__radio-box--error" : ""}`}>
                      {["without expired items", "with expired items"].map(
                        (opt) => (
                          <label
                            key={opt}
                            className={`scd__radio-item${isViewMode ? " scd__radio-item--readonly" : ""}`}>
                            <input
                              type="radio"
                              name="expired"
                              value={opt}
                              checked={others.expired === opt}
                              onChange={() => {
                                if (!isViewMode) {
                                  setOthers((p) => ({ ...p, expired: opt }));
                                  setErrors((p) => {
                                    const n = { ...p };
                                    delete n.expired;
                                    return n;
                                  });
                                }
                              }}
                              className="scd__radio-input"
                              readOnly={isViewMode}
                            />
                            <span className="scd__radio-circle" />
                            <span className="scd__radio-text">{opt}</span>
                          </label>
                        ),
                      )}
                    </div>
                    {errors.expired && (
                      <span className="scd__field-error">{errors.expired}</span>
                    )}
                  </div>

                  <div className="scd__field">
                    <span className="scd__field-label">
                      Condemned{!isViewMode && <RequiredMark />}
                    </span>
                    <div
                      className={`scd__radio-box${isViewMode ? " scd__radio-box--readonly" : ""}${errors.condemned ? " scd__radio-box--error" : ""}`}>
                      {["without condemned items", "with condemned items"].map(
                        (opt) => (
                          <label
                            key={opt}
                            className={`scd__radio-item${isViewMode ? " scd__radio-item--readonly" : ""}`}>
                            <input
                              type="radio"
                              name="condemned"
                              value={opt}
                              checked={others.condemned === opt}
                              onChange={() => {
                                if (!isViewMode) {
                                  setOthers((p) => ({
                                    ...p,
                                    condemned: opt,
                                  }));
                                  setErrors((p) => {
                                    const n = { ...p };
                                    delete n.condemned;
                                    return n;
                                  });
                                }
                              }}
                              className="scd__radio-input"
                              readOnly={isViewMode}
                            />
                            <span className="scd__radio-circle" />
                            <span className="scd__radio-text">{opt}</span>
                          </label>
                        ),
                      )}
                    </div>
                    {errors.condemned && (
                      <span className="scd__field-error">
                        {errors.condemned}
                      </span>
                    )}
                  </div>

                  <div className="scd__field">
                    <span className="scd__field-label">
                      Staff on Duty{!isViewMode && <RequiredMark />}
                    </span>
                    <StaffAutocomplete
                      value={others.staff_on_duty}
                      onChange={(staffUsers) => {
                        if (!isViewMode) {
                          setOthers((p) => ({
                            ...p,
                            staff_on_duty: staffUsers,
                          }));
                          if (staffUsers.length > 0) {
                            setErrors((p) => {
                              const n = { ...p };
                              delete n.staff_on_duty;
                              return n;
                            });
                          }
                        }
                      }}
                      disabled={isViewMode}
                      users={users}
                      isFetchingUsers={isFetchingUsers}
                      onOpen={() => setStaffDropdownOpen(true)}
                      hasError={!!errors.staff_on_duty}
                    />
                    {errors.staff_on_duty && (
                      <span className="scd__field-error">
                        {errors.staff_on_duty}
                      </span>
                    )}
                  </div>

                  <div className="scd__field">
                    <span className="scd__field-label">
                      Good Points{!isViewMode && <RequiredMark />}
                    </span>
                    <textarea
                      className={`scd__textarea-input${isViewMode ? " scd__textarea-input--readonly" : ""}${errors.good_points ? " scd__textarea-input--error" : ""}`}
                      placeholder="Enter good points observed"
                      value={others.good_points}
                      onChange={(e) => {
                        if (!isViewMode) {
                          setOthers((p) => ({
                            ...p,
                            good_points: e.target.value,
                          }));
                          if (e.target.value.trim())
                            setErrors((p) => {
                              const n = { ...p };
                              delete n.good_points;
                              return n;
                            });
                        }
                      }}
                      rows={3}
                      readOnly={isViewMode}
                    />
                    {errors.good_points && (
                      <span className="scd__field-error">
                        {errors.good_points}
                      </span>
                    )}
                  </div>

                  <div className="scd__field">
                    <span className="scd__field-label">
                      Notes{!isViewMode && <RequiredMark />}
                    </span>
                    <textarea
                      className={`scd__textarea-input${isViewMode ? " scd__textarea-input--readonly" : ""}${errors.notes ? " scd__textarea-input--error" : ""}`}
                      placeholder="Enter additional notes"
                      value={others.notes}
                      onChange={(e) => {
                        if (!isViewMode) {
                          setOthers((p) => ({ ...p, notes: e.target.value }));
                          if (e.target.value.trim())
                            setErrors((p) => {
                              const n = { ...p };
                              delete n.notes;
                              return n;
                            });
                        }
                      }}
                      rows={3}
                      readOnly={isViewMode}
                    />
                    {errors.notes && (
                      <span className="scd__field-error">{errors.notes}</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>

        <DialogActions className="scd__footer">
          <Button
            variant="text"
            onClick={handleClose}
            disabled={isSubmitting}
            className="scd__btn-close">
            CLOSE
          </Button>
          {!isViewMode && (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting || isFetching || isFetchingChecklist}
              className="scd__btn-submit">
              {isSubmitting ? "Submitting..." : "DONE CHECKING"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <MuiAlert
          onClose={handleSnackbarClose}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default StartCheckingDialog;
