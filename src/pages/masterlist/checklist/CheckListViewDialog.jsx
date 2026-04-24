import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import { useGetChecklistByIdQuery } from "../../../features/api/masterlist/checklistApi";
import "./CheckList.scss";

const SkeletonBlock = () => (
  <div className="clv__skeleton-wrap">
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

const CheckListViewDialog = ({ open, onClose, selectedId }) => {
  const { data, isFetching } = useGetChecklistByIdQuery(selectedId, {
    skip: !selectedId || !open,
  });

  const checklist = data?.data ?? null;

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "clv__paper" }}>
      <div className="clv__header">
        <div className="clv__header-title">
          <ChecklistIcon className="clv__header-icon" />
          <span>View Checklist</span>
        </div>
        <IconButton size="small" className="clv__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="clv__content">
        {isFetching ? (
          <SkeletonBlock />
        ) : !checklist ? (
          <p className="clv__empty">No checklist data found.</p>
        ) : (
          <>
            <div className="clv__name-row">
              <span className="clv__name-value">{checklist.name}</span>
            </div>

            {(checklist.sections ?? []).length === 0 ? (
              <p className="clv__empty">No sections added yet.</p>
            ) : (
              <div className="clv__sections">
                {(checklist.sections ?? []).map((sec, sIdx) => (
                  <div key={sec.id ?? sIdx} className="clv__section">
                    <div className="clv__section-header">
                      <span className="clv__section-title">
                        {sec.title}
                        {sec.category
                          ? ` - Category: ${sec.category?.name ?? sec.category}`
                          : ""}
                      </span>
                    </div>

                    {(sec.questions ?? []).length === 0 ? (
                      <p className="clv__no-questions">
                        No questions in this section.
                      </p>
                    ) : (
                      <div className="clv__table-scroll">
                        <table className="clv__table">
                          <thead>
                            <tr className="clv__thead-row">
                              <th className="clv__th clv__th--category">
                                Category
                              </th>
                              <th className="clv__th clv__th--item">Item</th>
                              <th className="clv__th clv__th--compliance">
                                Compliance
                              </th>
                              <th className="clv__th clv__th--remarks">
                                Remarks
                              </th>
                              <th className="clv__th clv__th--attachment">
                                Attachment
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(sec.questions ?? []).map((q, qIdx) => (
                              <tr key={q.id ?? qIdx} className="clv__tr">
                                <td className="clv__td clv__td--category">
                                  {sec.category?.name ?? sec.title}
                                </td>
                                <td className="clv__td clv__td--item">
                                  {qIdx + 1}. {q.question_text}
                                </td>
                                <td className="clv__td clv__td--compliance">
                                  {q.question_type === "paragraph" ? (
                                    <span className="clv__compliance-dash">
                                      —
                                    </span>
                                  ) : (
                                    <div className="clv__options-row">
                                      {(q.options ?? []).map((opt, oIdx) => (
                                        <div
                                          key={opt.id ?? oIdx}
                                          className="clv__radio-item">
                                          <span className="clv__radio-circle" />
                                          <span className="clv__radio-text">
                                            {opt.option_text}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                                <td className="clv__td clv__td--remarks">
                                  <div className="clv__remarks-box">
                                    <span className="clv__remarks-placeholder">
                                      Enter your response
                                    </span>
                                  </div>
                                </td>
                                <td className="clv__td clv__td--attachment">
                                  <div className="clv__attach-display">
                                    <svg
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="clv__attach-icon">
                                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                                    </svg>
                                    <span className="clv__attach-text">
                                      No file
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="clv__others">
              <div className="clv__others-header">
                <span>Others</span>
              </div>
              <div className="clv__others-body">
                {[
                  { label: "Store Visit", options: ["Yes", "No"] },
                  {
                    label: "Expired",
                    options: ["without expired items", "with expired items"],
                  },
                  {
                    label: "Condemned",
                    options: [
                      "without condemned items",
                      "with condemned items",
                    ],
                  },
                ].map((field) => (
                  <div key={field.label} className="clv__field">
                    <span className="clv__field-label">{field.label}</span>
                    <div className="clv__radio-box">
                      {field.options.map((opt) => (
                        <div key={opt} className="clv__radio-item">
                          <span className="clv__radio-circle" />
                          <span className="clv__radio-text">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="clv__field">
                  <span className="clv__field-label">Staff on Duty</span>
                  <div className="clv__display-box" />
                </div>

                <div className="clv__field">
                  <span className="clv__field-label">Good Points</span>
                  <div className="clv__display-box clv__display-box--tall" />
                </div>

                <div className="clv__field">
                  <span className="clv__field-label">Notes</span>
                  <div className="clv__display-box clv__display-box--tall" />
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckListViewDialog;
