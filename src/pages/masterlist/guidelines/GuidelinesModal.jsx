import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CheckIcon from "@mui/icons-material/Check";
import UniversalButton, {
  ConfirmButton,
  BackButton,
} from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useCreateGuidelineMutation,
  useUpdateGuidelineMutation,
} from "../../../features/api/masterlist/guidelinesApi";
import { useGetChecklistsQuery } from "../../../features/api/masterlist/checklistApi";
import GuidelineFileDialog from "./GuidelineFileDialog";
import "./GuidelinesModal.scss";

const schema = yup.object({
  title: yup.string().required("Title is required").trim(),
  is_in_use: yup.boolean(),
  applies_to_all: yup.boolean(),
  checklist_ids: yup.array().when("applies_to_all", {
    is: false,
    then: (s) => s.min(1, "Select at least one checklist"),
    otherwise: (s) => s.notRequired(),
  }),
});

const ViewField = ({ label, value }) => (
  <div className="gm__field">
    <div className="gm__input-wrap gm__input-wrap--disabled">
      <label className="gm__label">{label}</label>
      <input type="text" value={value ?? "—"} disabled readOnly />
    </div>
  </div>
);

const ViewFieldWrap = ({ label, value }) => (
  <div className="gm__field">
    <div className="gm__input-wrap gm__input-wrap--disabled gm__input-wrap--wrap">
      <label className="gm__label">{label}</label>
      <div className="gm__view-text">{value ?? "—"}</div>
    </div>
  </div>
);

const ChecklistMultiSelect = ({
  options = [],
  value = [],
  onChange,
  error,
  isLoading = false,
  onFirstClick,
}) => {
  const toggle = (id) => {
    const next = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    onChange(next);
  };

  const allSelected =
    options.length > 0 && options.every((o) => value.includes(o.id));

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.id));
    }
  };

  return (
    <div className="gm__field" onClick={onFirstClick}>
      <div
        className={`gm__multiselect${error ? " gm__multiselect--error" : ""}`}>
        <label className="gm__label">
          Checklists <span className="gm__required">*</span>
        </label>
        {!isLoading && options.length > 0 && (
          <div className="gm__multiselect-toolbar">
            <button
              type="button"
              className="gm__select-all-btn"
              onClick={handleSelectAll}>
              {allSelected ? "Deselect All" : "Select All"}
            </button>
            <span className="gm__selected-count">
              {value.length}/{options.length} selected
            </span>
          </div>
        )}
        <div className="gm__multiselect-body">
          {isLoading ? (
            <p className="gm__multiselect-empty">Loading...</p>
          ) : options.length === 0 ? (
            <p className="gm__multiselect-empty">Click to load options.</p>
          ) : (
            options.map((opt) => {
              const selected = value.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`gm__option${selected ? " gm__option--selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(opt.id);
                  }}>
                  <span className="gm__option-check">
                    {selected && <CheckIcon />}
                  </span>
                  <span className="gm__option-label">{opt.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
      {error && (
        <p className="gm__error">
          <ReportProblemIcon />
          {error}
        </p>
      )}
    </div>
  );
};

const GuidelinesModal = ({ open, onClose, selectedRow = null }) => {
  const [mode, setMode] = useState("add");
  const [checklistsOpen, setChecklistsOpen] = useState(false);
  const [fileError, setFileError] = useState("");
  const [fileDialogOpen, setFileDialogOpen] = useState(false);

  const rowData = selectedRow;
  const selectedId = selectedRow?.id ?? null;

  const { data: checklistsData, isFetching: checklistsLoading } =
    useGetChecklistsQuery(
      { status: "active", per_page: 100 },
      { skip: !checklistsOpen },
    );

  const checklistOptions = Array.isArray(checklistsData?.data?.data)
    ? checklistsData.data.data
    : Array.isArray(checklistsData?.data)
      ? checklistsData.data
      : [];

  const [createGuideline, { isLoading: isCreating }] =
    useCreateGuidelineMutation();
  const [updateGuideline, { isLoading: isUpdating }] =
    useUpdateGuidelineMutation();
  const isLoading = isCreating || isUpdating;

  const {
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: "",
      is_in_use: true,
      applies_to_all: false,
      checklist_ids: [],
    },
  });

  const appliesToAll = watch("applies_to_all");

  useEffect(() => {
    if (open) {
      setMode(selectedRow ? "view" : "add");
      setChecklistsOpen(false);
      setFileError("");
      setFileDialogOpen(false);
      if (selectedRow) {
        reset({
          title: selectedRow.title ?? "",
          is_in_use: !!selectedRow.is_in_use,
          applies_to_all: !!selectedRow.applies_to_all,
          checklist_ids: selectedRow.checklists?.map((c) => c.id) ?? [],
        });
      } else {
        reset({
          title: "",
          is_in_use: true,
          applies_to_all: false,
          checklist_ids: [],
        });
      }
    }
  }, [open, selectedRow, reset]);

  const [file, setFile] = useState(null);

  useEffect(() => {
    if (open) setFile(null);
  }, [open, selectedRow]);

  const onSubmit = async (form) => {
    if (mode === "add" && !file) {
      setFileError("File is required");
      return;
    }
    setFileError("");

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("is_in_use", form.is_in_use);
      formData.append("applies_to_all", form.applies_to_all);
      if (file) formData.append("file", file);
      if (!form.applies_to_all) {
        form.checklist_ids.forEach((id) =>
          formData.append("checklist_ids[]", id),
        );
      }

      if (mode === "edit") {
        formData.append("_method", "PATCH");
        await updateGuideline({ id: selectedId, body: formData }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Guideline updated successfully.",
          {
            variant: "success",
          },
        );
      } else {
        await createGuideline(formData).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Guideline created successfully.",
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
    add: <DescriptionIcon className="gm__header-icon" />,
    view: <RemoveRedEyeIcon className="gm__header-icon" />,
    edit: <EditIcon className="gm__header-icon" />,
  };
  const headerTitle = {
    add: "Add Guideline",
    view: "View Guideline",
    edit: "Edit Guideline",
  };
  const isView = mode === "view";

  return (
    <>
      <Dialog
        open={open}
        onClose={(e, reason) => {
          if (reason === "backdropClick") return;
          onClose();
        }}
        disableEscapeKeyDown
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: "gm__paper" }}>
        <div className="gm__header">
          <div className="gm__header-title">
            {headerIcon[mode]}
            <span>{headerTitle[mode]}</span>
          </div>
          <IconButton className="gm__close" onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <DialogContent className="gm__content">
          {isView ? (
            <>
              <div className="gm__group">
                <p className="gm__group-label">Guideline Details</p>
                <div className="gm__stack">
                  <ViewField label="Title" value={rowData?.title} />
                  <div className="gm__field">
                    <div className="gm__input-wrap gm__input-wrap--disabled">
                      <label className="gm__label">File</label>
                      {rowData?.file_url ? (
                        <button
                          type="button"
                          onClick={() => setFileDialogOpen(true)}
                          className="gm__file-link">
                          <AttachFileIcon fontSize="small" />
                          {rowData?.filename ?? "View File"}
                        </button>
                      ) : (
                        <input type="text" value="—" disabled readOnly />
                      )}
                    </div>
                  </div>
                  <ViewFieldWrap
                    label="Applies To"
                    value={
                      rowData?.applies_to_all
                        ? "All Checklists"
                        : (rowData?.checklists?.map((c) => c.name).join(", ") ??
                          "—")
                    }
                  />
                  <ViewField
                    label="In Use"
                    value={rowData?.is_in_use ? "Yes" : "No"}
                  />
                </div>
              </div>

              <div className="gm__footer">
                <UniversalButton
                  label="Edit"
                  icon={<EditIcon />}
                  onClick={() => setMode("edit")}
                  modalVariant={true}
                />
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="gm__group">
                <p className="gm__group-label">Guideline Details</p>
                <div className="gm__stack">
                  <div className="gm__field">
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <div
                          className={`gm__input-wrap${errors.title ? " gm__input-wrap--error" : ""}`}>
                          <label className="gm__label">
                            Title <span className="gm__required">*</span>
                          </label>
                          <input type="text" {...field} autoComplete="off" />
                        </div>
                      )}
                    />
                    {errors.title && (
                      <p className="gm__error">
                        <ReportProblemIcon />
                        {errors.title?.message}
                      </p>
                    )}
                  </div>

                  {!appliesToAll && (
                    <Controller
                      name="checklist_ids"
                      control={control}
                      render={({ field }) => {
                        const mergedChecklistOptions = [
                          ...(rowData?.checklists
                            ? rowData.checklists.filter(
                                (c) =>
                                  !checklistOptions.some((o) => o.id === c.id),
                              )
                            : []),
                          ...checklistOptions,
                        ];

                        return (
                          <ChecklistMultiSelect
                            options={mergedChecklistOptions}
                            value={field.value}
                            onChange={field.onChange}
                            error={errors.checklist_ids?.message}
                            isLoading={checklistsLoading}
                            onFirstClick={() => setChecklistsOpen(true)}
                          />
                        );
                      }}
                    />
                  )}

                  <div className="gm__field">
                    <div
                      className={`gm__input-wrap gm__input-wrap--file${fileError ? " gm__input-wrap--error" : ""}`}>
                      <label className="gm__label">
                        File{" "}
                        {mode === "add" && (
                          <span className="gm__required">*</span>
                        )}
                      </label>
                      <input
                        type="file"
                        onChange={(e) => {
                          setFile(e.target.files?.[0] ?? null);
                          setFileError("");
                        }}
                      />
                    </div>
                    {fileError && (
                      <p className="gm__error">
                        <ReportProblemIcon />
                        {fileError}
                      </p>
                    )}
                    {!file && rowData?.file_url && (
                      <button
                        type="button"
                        onClick={() => setFileDialogOpen(true)}
                        className="gm__file-current">
                        <AttachFileIcon fontSize="small" />
                        {rowData?.filename ?? "Current file"}
                      </button>
                    )}
                  </div>

                  <div className="gm__switch-row">
                    <Controller
                      name="applies_to_all"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              className="gm__switch"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          }
                          label="Applies to all checklists"
                          className="gm__switch-label"
                        />
                      )}
                    />
                    <Controller
                      name="is_in_use"
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={
                            <Switch
                              className="gm__switch"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          }
                          label="In use"
                          className="gm__switch-label"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="gm__footer">
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
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <GuidelineFileDialog
        open={fileDialogOpen}
        onClose={() => setFileDialogOpen(false)}
        fileUrl={rowData?.file_url}
        filename={rowData?.filename}
      />
    </>
  );
};

export default GuidelinesModal;
