import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import NotesIcon from "@mui/icons-material/Notes";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import UniversalButton, {
  ConfirmButton,
  BackButton,
} from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetChecklistByIdQuery,
  useCreateChecklistMutation,
  useUpdateChecklistMutation,
} from "../../../features/api/masterlist/checklistApi";
import { useGetScoreRatingsQuery } from "../../../features/api/masterlist/scoreRatingApi";
import "./CheckListModal.scss";

console.log("[CheckListModal] LOADED v4 - options from score rating");

const QUESTION_TYPES = [
  {
    value: "multiple_choice",
    label: "Multiple Choice",
    icon: <RadioButtonCheckedIcon sx={{ fontSize: "14px" }} />,
  },
  {
    value: "checkboxes",
    label: "Checkboxes",
    icon: <CheckBoxIcon sx={{ fontSize: "14px" }} />,
  },
  {
    value: "paragraph",
    label: "Paragraph",
    icon: <NotesIcon sx={{ fontSize: "14px" }} />,
  },
];

// When true, the question type dropdown is disabled (Multiple Choice only).
// Set to false to bring back the type picker.
const LOCK_QUESTION_TYPE = true;

const TOTAL_SCORE_GRADE = 100;

const defaultOption = (order_index = 1) => ({
  option_text: "",
  order_index,
});

const defaultQuestion = (order_index = 1) => ({
  question_text: "",
  question_type: "multiple_choice",
  order_index,
  options: [],
});

const defaultSection = (order_index = 1) => ({
  title: "",
  order_index,
  percentage: "",
  questions: [defaultQuestion(1)],
});

const optionSchema = yup.object({
  option_text: yup.string().required("Option text is required"),
  order_index: yup.number(),
});

const questionSchema = yup.object({
  question_text: yup.string().required("Question is required"),
  question_type: yup.string().required(),
  order_index: yup.number(),
  options: yup.array().when("question_type", {
    is: (t) => t === "checkboxes",
    then: (s) => s.of(optionSchema).min(1, "At least one option is required"),
    otherwise: (s) => s.nullable(),
  }),
});

const sectionSchema = yup.object({
  title: yup.string().required("Section title is required"),
  order_index: yup.number(),
  percentage: yup
    .string()
    .required("Section grade is required")
    .matches(/^\d+$/, "Numbers only"),
  questions: yup
    .array()
    .of(questionSchema)
    .min(1, "At least one question is required"),
});

const schema = yup.object({
  name: yup.string().required("Checklist name is required"),
  sections: yup
    .array()
    .of(sectionSchema)
    .min(1, "At least one section is required")
    .test(
      "total-score-grade",
      `Total section grade must equal exactly ${TOTAL_SCORE_GRADE}%`,
      (sections) => {
        const total = (sections ?? []).reduce(
          (acc, s) => acc + (Number(s.percentage) || 0),
          0,
        );
        return total === TOTAL_SCORE_GRADE;
      },
    ),
});

const SkeletonLoader = () => (
  <div className="clm__skeleton-wrap">
    {[60, 80, 50, 90].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="clm__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

const ViewField = ({ label, value }) => (
  <div className="clm__field">
    <div className="clm__input-wrap clm__input-wrap--disabled">
      <label className="clm__label">{label}</label>
      <input type="text" value={value ?? "—"} disabled readOnly />
    </div>
  </div>
);

const QuestionTypeSelect = ({ value, onChange, disabled, locked }) => {
  const [open, setOpen] = useState(false);
  const current = QUESTION_TYPES.find((t) => t.value === value);

  if (disabled) {
    return (
      <div className="clm__type-badge clm__type-badge--view">
        {current?.icon}
        <span>{current?.label}</span>
      </div>
    );
  }

  // Locked: looks like the dropdown but cannot be opened or changed
  if (locked) {
    return (
      <div className="clm__type-select-wrap">
        <button
          type="button"
          className="clm__type-select-btn"
          disabled
          style={{ cursor: "not-allowed", opacity: 0.7 }}>
          {current?.icon}
          <span>{current?.label}</span>
          <KeyboardArrowDownIcon
            sx={{ fontSize: "16px", marginLeft: "auto", opacity: 0.5 }}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="clm__type-select-wrap">
      <button
        type="button"
        className="clm__type-select-btn"
        onClick={() => setOpen((p) => !p)}>
        {current?.icon}
        <span>{current?.label}</span>
        <KeyboardArrowDownIcon
          sx={{ fontSize: "16px", marginLeft: "auto", opacity: 0.5 }}
        />
      </button>
      {open && (
        <div className="clm__type-dropdown">
          {QUESTION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`clm__type-option${t.value === value ? " clm__type-option--active" : ""}`}
              onClick={() => {
                onChange(t.value);
                setOpen(false);
              }}>
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const OptionsEditor = ({
  control,
  register,
  errors,
  sIdx,
  qIdx,
  qType,
  disabled,
  ratings,
  ratingsLoading,
}) => {
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: `sections.${sIdx}.questions.${qIdx}.options`,
  });

  useEffect(() => {
    if (qType === "checkboxes" && !disabled && fields.length === 0) {
      replace([defaultOption(1), defaultOption(2), defaultOption(3)]);
    }
  }, [qType, disabled, fields.length, replace]);

  if (qType === "paragraph") return null;

  if (qType === "multiple_choice") {
    return (
      <div className="clm__options-wrap">
        <p className="clm__options-label">Options</p>
        {ratingsLoading ? (
          <p className="clm__options-label">Loading options...</p>
        ) : ratings.length === 0 ? (
          <p className="clm__error">
            <ReportProblemIcon />
            No score ratings available
          </p>
        ) : (
          ratings.map((r, oIdx) => (
            <div key={r.id} className="clm__option-row">
              <div className="clm__option-inputs">
                <div className="clm__input-wrap clm__input-wrap--sm clm__input-wrap--disabled">
                  <label className="clm__label">Option {oIdx + 1}</label>
                  <input
                    type="text"
                    value={String(r.score)}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="clm__options-wrap">
      <p className="clm__options-label">Options</p>
      {fields.map((opt, oIdx) => {
        const errOpt =
          errors?.sections?.[sIdx]?.questions?.[qIdx]?.options?.[oIdx];
        return (
          <div key={opt.id} className="clm__option-row">
            <div className="clm__option-inputs">
              <div
                className={`clm__input-wrap clm__input-wrap--sm${errOpt?.option_text ? " clm__input-wrap--error" : ""}${disabled ? " clm__input-wrap--disabled" : ""}`}>
                <label className="clm__label">Option {oIdx + 1}</label>
                {disabled ? (
                  <input
                    type="text"
                    value={opt.option_text ?? "—"}
                    disabled
                    readOnly
                  />
                ) : (
                  <input
                    type="text"
                    {...register(
                      `sections.${sIdx}.questions.${qIdx}.options.${oIdx}.option_text`,
                    )}
                    autoComplete="off"
                    placeholder="Enter option text"
                  />
                )}
              </div>
            </div>

            {!disabled && fields.length > 1 && (
              <Tooltip title="Remove option">
                <IconButton
                  size="small"
                  className="clm__icon-btn clm__icon-btn--danger"
                  onClick={() => remove(oIdx)}>
                  <DeleteOutlineIcon sx={{ fontSize: "16px" }} />
                </IconButton>
              </Tooltip>
            )}
          </div>
        );
      })}

      {!disabled && (
        <button
          type="button"
          className="clm__add-btn clm__add-btn--option"
          onClick={() => append(defaultOption(fields.length + 1))}>
          <AddIcon sx={{ fontSize: "14px" }} />
          Add Option
        </button>
      )}
    </div>
  );
};

const QuestionCard = ({
  control,
  register,
  errors,
  sIdx,
  qIdx,
  onRemove,
  disabled,
  ratings,
  ratingsLoading,
}) => {
  const errQ = errors?.sections?.[sIdx]?.questions?.[qIdx];

  return (
    <div className="clm__question-card">
      <div className="clm__question-header">
        <div className="clm__question-num">Q{qIdx + 1}</div>
        {!disabled && (
          <Tooltip title="Remove question">
            <IconButton
              size="small"
              className="clm__icon-btn clm__icon-btn--danger"
              onClick={onRemove}>
              <DeleteOutlineIcon sx={{ fontSize: "16px" }} />
            </IconButton>
          </Tooltip>
        )}
      </div>

      <div className="clm__question-body">
        <div
          className={`clm__input-wrap${errQ?.question_text ? " clm__input-wrap--error" : ""}${disabled ? " clm__input-wrap--disabled" : ""}`}>
          <label className="clm__label">
            Question{!disabled && <span className="clm__required"> *</span>}
          </label>
          {disabled ? (
            <input
              type="text"
              value={
                control._formValues?.sections?.[sIdx]?.questions?.[qIdx]
                  ?.question_text ?? "—"
              }
              disabled
              readOnly
            />
          ) : (
            <input
              type="text"
              {...register(`sections.${sIdx}.questions.${qIdx}.question_text`)}
              autoComplete="off"
              placeholder="Enter question text"
            />
          )}
        </div>
        {errQ?.question_text && (
          <p className="clm__error">
            <ReportProblemIcon />
            {errQ.question_text.message}
          </p>
        )}

        <Controller
          control={control}
          name={`sections.${sIdx}.questions.${qIdx}.question_type`}
          render={({ field }) => (
            <QuestionTypeSelect
              value={field.value}
              onChange={field.onChange}
              disabled={disabled}
              locked={LOCK_QUESTION_TYPE}
            />
          )}
        />

        <Controller
          control={control}
          name={`sections.${sIdx}.questions.${qIdx}.question_type`}
          render={({ field: { value: qType } }) => (
            <OptionsEditor
              control={control}
              register={register}
              errors={errors}
              sIdx={sIdx}
              qIdx={qIdx}
              qType={qType}
              disabled={disabled}
              ratings={ratings}
              ratingsLoading={ratingsLoading}
            />
          )}
        />
      </div>
    </div>
  );
};

const SectionCard = ({
  control,
  register,
  errors,
  sIdx,
  onRemoveSection,
  disabled,
  totalSections,
  ratings,
  ratingsLoading,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${sIdx}.questions`,
  });

  const watchedSections = useWatch({ control, name: "sections" }) ?? [];

  const errS = errors?.sections?.[sIdx];

  const otherSectionsTotal = watchedSections.reduce((acc, s, idx) => {
    if (idx === sIdx) return acc;
    return acc + (Number(s?.percentage) || 0);
  }, 0);

  const remainingGrade = Math.max(0, TOTAL_SCORE_GRADE - otherSectionsTotal);

  return (
    <div className="clm__section-card">
      <div className="clm__section-header">
        <div className="clm__section-drag">
          <DragIndicatorIcon sx={{ fontSize: "18px", opacity: 0.35 }} />
          <span className="clm__section-label">Section {sIdx + 1}</span>
        </div>
        {!disabled && totalSections > 1 && (
          <Tooltip title="Remove section">
            <IconButton
              size="small"
              className="clm__icon-btn clm__icon-btn--danger"
              onClick={onRemoveSection}>
              <DeleteOutlineIcon sx={{ fontSize: "16px" }} />
            </IconButton>
          </Tooltip>
        )}
      </div>

      <div
        className={`clm__input-wrap${errS?.title ? " clm__input-wrap--error" : ""}${disabled ? " clm__input-wrap--disabled" : ""}`}>
        <label className="clm__label">
          Title{!disabled && <span className="clm__required"> *</span>}
        </label>
        {disabled ? (
          <input
            type="text"
            value={control._formValues?.sections?.[sIdx]?.title ?? "—"}
            disabled
            readOnly
          />
        ) : (
          <input
            type="text"
            {...register(`sections.${sIdx}.title`)}
            autoComplete="off"
            placeholder="e.g. Customer Service"
          />
        )}
      </div>
      {errS?.title && (
        <p className="clm__error">
          <ReportProblemIcon />
          {errS.title.message}
        </p>
      )}

      <div
        className={`clm__input-wrap${errS?.percentage ? " clm__input-wrap--error" : ""}${disabled ? " clm__input-wrap--disabled" : ""}`}>
        <label className="clm__label">
          Section Grade
          {!disabled && <span className="clm__required"> *</span>}
          {!disabled && (
            <span className="clm__label-hint"> (max {remainingGrade}%)</span>
          )}
        </label>
        {disabled ? (
          <input
            type="text"
            value={
              control._formValues?.sections?.[sIdx]?.percentage !== "" &&
              control._formValues?.sections?.[sIdx]?.percentage != null
                ? `${control._formValues.sections[sIdx].percentage}%`
                : "—"
            }
            disabled
            readOnly
          />
        ) : (
          <Controller
            control={control}
            name={`sections.${sIdx}.percentage`}
            render={({ field }) => (
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  inputMode="numeric"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/[^\d]/g, "");
                    if (digitsOnly === "") {
                      field.onChange("");
                      return;
                    }
                    const numeric = Number(digitsOnly);
                    const capped =
                      numeric > remainingGrade ? remainingGrade : numeric;
                    field.onChange(String(capped));
                  }}
                  autoComplete="off"
                  placeholder="e.g. 30"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    paddingRight: "28px",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#888",
                    fontSize: "14px",
                    pointerEvents: "none",
                  }}>
                  %
                </span>
              </div>
            )}
          />
        )}
      </div>
      {errS?.percentage && (
        <p className="clm__error">
          <ReportProblemIcon />
          {errS.percentage.message}
        </p>
      )}

      <div className="clm__questions-list">
        {fields.map((q, qIdx) => (
          <QuestionCard
            key={q.id}
            control={control}
            register={register}
            errors={errors}
            sIdx={sIdx}
            qIdx={qIdx}
            disabled={disabled}
            ratings={ratings}
            ratingsLoading={ratingsLoading}
            onRemove={() => fields.length > 1 && remove(qIdx)}
          />
        ))}
      </div>

      {!disabled && (
        <button
          type="button"
          className="clm__add-btn clm__add-btn--question"
          onClick={() => append(defaultQuestion(fields.length + 1))}>
          <AddIcon sx={{ fontSize: "14px" }} />
          Add Question
        </button>
      )}
    </div>
  );
};

const CheckListModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");

  const { data: checklistDetail, isFetching: checklistLoading } =
    useGetChecklistByIdQuery(selectedId, {
      skip: !selectedId || !open,
    });
  const rowData = checklistDetail?.data ?? null;

  const { data: ratingsData, isFetching: ratingsLoading } =
    useGetScoreRatingsQuery(
      { status: "active", per_page: 100 },
      { skip: !open },
    );

  const ratings = useMemo(() => {
    const list = ratingsData?.data?.data ?? [];
    return [...list].sort((a, b) => Number(a.rating) - Number(b.rating));
  }, [ratingsData]);

  const [createChecklist, { isLoading: isCreating }] =
    useCreateChecklistMutation();
  const [updateChecklist, { isLoading: isUpdating }] =
    useUpdateChecklistMutation();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "",
      sections: [defaultSection(1)],
    },
  });

  const {
    fields: sectionFields,
    append: appendSection,
    remove: removeSection,
  } = useFieldArray({ control, name: "sections" });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      if (!selectedId) {
        reset({ name: "", sections: [defaultSection(1)] });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (rowData && open && selectedId) {
      console.log("[CheckListModal] rowData from API", rowData);

      const mapped = {
        name: rowData.name ?? "",
        sections: (rowData.sections ?? []).map((sec, si) => {
          const grade = sec.percentage ?? sec.score_grade;
          return {
            title: sec.title ?? "",
            order_index: sec.order_index ?? si + 1,
            percentage:
              grade !== undefined && grade !== null ? String(grade) : "",
            questions: (sec.questions ?? []).map((q, qi) => ({
              question_text: q.question_text ?? "",
              question_type: q.question_type ?? "multiple_choice",
              order_index: q.order_index ?? qi + 1,
              options: (q.options ?? []).map((o, oi) => ({
                option_text: o.option_text ?? "",
                order_index: o.order_index ?? oi + 1,
                score_rating: o.score_rating_id ?? null,
              })),
            })),
          };
        }),
      };
      reset(mapped);
    }
  }, [rowData, open, selectedId, reset]);

  const buildPayload = (form) => {
    console.log("[CheckListModal] form values", form);

    return {
      name: form.name,
      sections: form.sections.map((sec, si) => ({
        title: sec.title,
        order_index: si + 1,
        percentage: Number(sec.percentage),
        questions: sec.questions.map((q, qi) => {
          const base = {
            question_text: q.question_text,
            question_type: q.question_type,
            order_index: qi + 1,
          };
          if (q.question_type === "multiple_choice") {
            base.options = ratings.map((r, oi) => ({
              option_text: String(r.score),
              order_index: oi + 1,
              score_rating: r.id,
            }));
          } else if (q.question_type === "checkboxes") {
            base.options = (q.options ?? []).map((o, oi) => ({
              option_text: o.option_text,
              order_index: oi + 1,
            }));
          }
          return base;
        }),
      })),
    };
  };

  const onSubmit = async (form) => {
    try {
      const hasMultipleChoice = form.sections.some((s) =>
        s.questions.some((q) => q.question_type === "multiple_choice"),
      );
      if (hasMultipleChoice && ratings.length === 0) {
        window.__snackbar__?.enqueueSnackbar(
          "No score ratings available for multiple choice options.",
          { variant: "error" },
        );
        return;
      }

      const payload = buildPayload(form);

      console.log("[CheckListModal] PAYLOAD", payload);
      console.log(
        "[CheckListModal] PAYLOAD (json)",
        JSON.stringify(payload, null, 2),
      );
      console.log(
        "[CheckListModal] section percentages",
        payload.sections.map((s) => s.percentage),
        "sum =",
        payload.sections.reduce((a, s) => a + (s.percentage || 0), 0),
      );

      if (mode === "edit") {
        await updateChecklist({ id: selectedId, ...payload }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Checklist updated successfully.",
          {
            variant: "success",
          },
        );
      } else {
        await createChecklist(payload).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Checklist created successfully.",
          {
            variant: "success",
          },
        );
      }
      onClose();
    } catch (err) {
      console.error("[CheckListModal] API ERROR", err);
      const detail = err?.data?.errors?.[0]?.detail;
      window.__snackbar__?.enqueueSnackbar(
        detail ?? "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
  };

  const onInvalid = (errs) => {
    console.warn("[CheckListModal] VALIDATION ERRORS", errs);
  };

  const headerIcon = {
    add: <ChecklistIcon className="clm__header-icon" />,
    view: <RemoveRedEyeIcon className="clm__header-icon" />,
    edit: <EditIcon className="clm__header-icon" />,
  };
  const headerTitle = {
    add: "Add Checklist",
    view: "View Checklist",
    edit: "Edit Checklist",
  };

  const isView = mode === "view";
  const isDisabled = isView;

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "clm__paper" }}>
      <div className="clm__header">
        <div className="clm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="clm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="clm__content">
        {checklistLoading ? (
          <SkeletonLoader />
        ) : (
          <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
            <div className="clm__group">
              <p className="clm__group-label">Checklist Details</p>
              <div className="clm__stack">
                {isView ? (
                  <ViewField label="Name" value={rowData?.name} />
                ) : (
                  <div className="clm__field">
                    <div
                      className={`clm__input-wrap${errors.name ? " clm__input-wrap--error" : ""}`}>
                      <label className="clm__label">
                        Name <span className="clm__required">*</span>
                      </label>
                      <input
                        type="text"
                        {...register("name")}
                        autoComplete="off"
                        placeholder="Enter checklist name"
                      />
                    </div>
                    {errors.name && (
                      <p className="clm__error">
                        <ReportProblemIcon />
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="clm__group">
              <p className="clm__group-label">Sections</p>
              <div className="clm__sections-list">
                {sectionFields.map((sec, sIdx) => (
                  <SectionCard
                    key={sec.id}
                    control={control}
                    register={register}
                    errors={errors}
                    sIdx={sIdx}
                    disabled={isDisabled}
                    totalSections={sectionFields.length}
                    ratings={ratings}
                    ratingsLoading={ratingsLoading}
                    onRemoveSection={() => removeSection(sIdx)}
                  />
                ))}
              </div>

              {!isView && (
                <button
                  type="button"
                  className="clm__add-btn clm__add-btn--section"
                  onClick={() =>
                    appendSection(defaultSection(sectionFields.length + 1))
                  }>
                  <AddIcon sx={{ fontSize: "15px" }} />
                  Add Section
                </button>
              )}

              {(errors.sections?.message || errors.sections?.root?.message) && (
                <p className="clm__error" style={{ marginTop: 6 }}>
                  <ReportProblemIcon />
                  {errors.sections?.message ?? errors.sections?.root?.message}
                </p>
              )}
            </div>

            <div className="clm__footer">
              {isView ? (
                <UniversalButton
                  label="Edit"
                  icon={<EditIcon />}
                  onClick={() => setMode("edit")}
                  modalVariant={true}
                />
              ) : (
                <>
                  {selectedId && <BackButton onClick={() => setMode("view")} />}
                  <ConfirmButton
                    label={
                      isLoading
                        ? "Saving..."
                        : mode === "edit"
                          ? "Update"
                          : "Save"
                    }
                    onClick={handleSubmit(onSubmit, onInvalid)}
                    disabled={isLoading}
                  />
                </>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckListModal;
