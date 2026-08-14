import { useEffect, useState } from "react";
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
import "./CheckListModal.scss";

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

const TOTAL_SCORE_GRADE = 100;

const defaultOption = (order_index = 1) => ({
  option_text: "",
  order_index,
});

const defaultQuestion = (order_index = 1) => ({
  question_text: "",
  question_type: "multiple_choice",
  order_index,
  options: [
    { option_text: "", order_index: 1 },
    { option_text: "", order_index: 2 },
    { option_text: "", order_index: 3 },
  ],
});

const defaultSection = (order_index = 1) => ({
  title: "",
  order_index,
  score_grade: "",
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
    is: (t) => t === "multiple_choice" || t === "checkboxes",
    then: (s) => s.of(optionSchema).min(1, "At least one option is required"),
    otherwise: (s) => s.nullable(),
  }),
});

const sectionSchema = yup.object({
  title: yup.string().required("Section title is required"),
  order_index: yup.number(),
  score_grade: yup
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
      `Total section grade must not exceed ${TOTAL_SCORE_GRADE}%`,
      (sections) => {
        const total = (sections ?? []).reduce(
          (acc, s) => acc + (Number(s.score_grade) || 0),
          0,
        );
        return total <= TOTAL_SCORE_GRADE;
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

const QuestionTypeSelect = ({ value, onChange, disabled }) => {
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
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${sIdx}.questions.${qIdx}.options`,
  });

  if (qType === "paragraph") return null;

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
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `sections.${sIdx}.questions`,
  });

  const watchedSections = useWatch({ control, name: "sections" }) ?? [];

  const errS = errors?.sections?.[sIdx];

  const otherSectionsTotal = watchedSections.reduce((acc, s, idx) => {
    if (idx === sIdx) return acc;
    return acc + (Number(s?.score_grade) || 0);
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
        className={`clm__input-wrap${errS?.score_grade ? " clm__input-wrap--error" : ""}${disabled ? " clm__input-wrap--disabled" : ""}`}>
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
              control._formValues?.sections?.[sIdx]?.score_grade !== "" &&
              control._formValues?.sections?.[sIdx]?.score_grade != null
                ? `${control._formValues.sections[sIdx].score_grade}%`
                : "—"
            }
            disabled
            readOnly
          />
        ) : (
          <Controller
            control={control}
            name={`sections.${sIdx}.score_grade`}
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
      {errS?.score_grade && (
        <p className="clm__error">
          <ReportProblemIcon />
          {errS.score_grade.message}
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
      const mapped = {
        name: rowData.name ?? "",
        sections: (rowData.sections ?? []).map((sec, si) => ({
          title: sec.title ?? "",
          order_index: sec.order_index ?? si + 1,
          score_grade:
            sec.score_grade !== undefined && sec.score_grade !== null
              ? String(sec.score_grade)
              : "",
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
        })),
      };
      reset(mapped);
    }
  }, [rowData, open, selectedId, reset]);

  const buildPayload = (form) => ({
    name: form.name,
    sections: form.sections.map((sec, si) => ({
      title: sec.title,
      order_index: si + 1,
      score_grade: Number(sec.score_grade),
      questions: sec.questions.map((q, qi) => {
        const base = {
          question_text: q.question_text,
          question_type: q.question_type,
          order_index: qi + 1,
        };
        if (q.question_type !== "paragraph") {
          base.options = (q.options ?? []).map((o, oi) => ({
            option_text: o.option_text,
            order_index: oi + 1,
            ...(q.question_type === "multiple_choice" && {
              score_rating: o.score_rating ?? null,
            }),
          }));
        }
        return base;
      }),
    })),
  });

  const onSubmit = async (form) => {
    try {
      const payload = buildPayload(form);
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
      const detail = err?.data?.errors?.[0]?.detail;
      window.__snackbar__?.enqueueSnackbar(
        detail ?? "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
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
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
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

              {errors.sections?.message && (
                <p className="clm__error" style={{ marginTop: 6 }}>
                  <ReportProblemIcon />
                  {errors.sections.message}
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
                    onClick={handleSubmit(onSubmit)}
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
