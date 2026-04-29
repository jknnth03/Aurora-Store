import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import UniversalButton, {
  ConfirmButton,
  BackButton,
} from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetStoreChecklistByIdQuery,
  useCreateStoreChecklistMutation,
  useUpdateStoreChecklistMutation,
} from "../../../features/api/masterlist/storeChecklistApi";
import { useGetStoresQuery } from "../../../features/api/masterlist/storesApi";
import { useGetChecklistsQuery } from "../../../features/api/masterlist/checklistApi";
import "./StoreChecklistModal.scss";

const addSchema = yup.object({
  store_id: yup.string().required("Store is required"),
  checklist_id: yup.string().required("Checklist is required"),
});

const editSchema = yup.object({
  store_id: yup.string().required("Store is required"),
  checklist_id: yup.string().required("Checklist is required"),
});

const SkeletonLoader = () => (
  <div className="scm__skeleton-wrap">
    {[50, 75, 60].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="scm__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

const StoreAutocomplete = ({
  value,
  onChange,
  onSelectOption,
  error,
  disabled = false,
  displayValue,
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const { data, isFetching } = useGetStoresQuery({ status: "active" });
  const allOptions = data?.data?.data ?? [];
  const options = search
    ? allOptions.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allOptions;
  const selected =
    allOptions.find((s) => String(s.id) === String(value)) ?? null;

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

  if (disabled) {
    return (
      <div className="scm__field">
        <div className="scm__input-wrap scm__input-wrap--disabled">
          <label className="scm__label">Store</label>
          <input
            type="text"
            value={selected?.name ?? displayValue ?? "—"}
            disabled
            readOnly
          />
        </div>
      </div>
    );
  }

  const handleSelect = (store) => {
    onChange(String(store.id));
    onSelectOption?.(store);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className={`scm__ac${error ? " scm__ac--error" : ""}`} ref={wrapRef}>
      <label className="scm__label">
        Store <span className="scm__required">*</span>
      </label>
      <div className="scm__ac-box" onClick={() => setOpen((p) => !p)}>
        {open ? (
          <div className="scm__ac-search-wrap">
            <SearchIcon
              sx={{ fontSize: "0.9rem", flexShrink: 0, color: "inherit" }}
            />
            <input
              autoFocus
              type="text"
              placeholder="Search store..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="scm__ac-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <span
            className={
              selected || displayValue ? "scm__ac-value" : "scm__ac-placeholder"
            }>
            {selected ? selected.name : displayValue || "Select store..."}
          </span>
        )}
        <span className="scm__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>
      {open && (
        <div className="scm__ac-dropdown">
          <div className="scm__ac-options">
            {isFetching ? (
              <p className="scm__ac-empty">Loading...</p>
            ) : options.length === 0 ? (
              <p className="scm__ac-empty">No stores found</p>
            ) : (
              options.map((s) => (
                <div
                  key={s.id}
                  className={`scm__ac-option${String(value) === String(s.id) ? " scm__ac-option--selected" : ""}`}
                  onClick={() => handleSelect(s)}>
                  {s.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ChecklistAutocomplete = ({
  value,
  onChange,
  onSelectOption,
  error,
  disabled = false,
  displayValue,
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const { data, isFetching } = useGetChecklistsQuery({ status: "active" });
  const allOptions = data?.data?.data ?? [];
  const options = search
    ? allOptions.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allOptions;
  const selected =
    allOptions.find((c) => String(c.id) === String(value)) ?? null;

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

  if (disabled) {
    return (
      <div className="scm__field">
        <div className="scm__input-wrap scm__input-wrap--disabled">
          <label className="scm__label">Checklist</label>
          <input
            type="text"
            value={selected?.name ?? displayValue ?? "—"}
            disabled
            readOnly
          />
        </div>
      </div>
    );
  }

  const handleSelect = (checklist) => {
    onChange(String(checklist.id));
    onSelectOption?.(checklist);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className={`scm__ac${error ? " scm__ac--error" : ""}`} ref={wrapRef}>
      <label className="scm__label">
        Checklist <span className="scm__required">*</span>
      </label>
      <div className="scm__ac-box" onClick={() => setOpen((p) => !p)}>
        {open ? (
          <div className="scm__ac-search-wrap">
            <SearchIcon
              sx={{ fontSize: "0.9rem", flexShrink: 0, color: "inherit" }}
            />
            <input
              autoFocus
              type="text"
              placeholder="Search checklist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="scm__ac-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <span
            className={
              selected || displayValue ? "scm__ac-value" : "scm__ac-placeholder"
            }>
            {selected ? selected.name : displayValue || "Select checklist..."}
          </span>
        )}
        <span className="scm__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>
      {open && (
        <div className="scm__ac-dropdown">
          <div className="scm__ac-options">
            {isFetching ? (
              <p className="scm__ac-empty">Loading...</p>
            ) : options.length === 0 ? (
              <p className="scm__ac-empty">No checklists found</p>
            ) : (
              options.map((c) => (
                <div
                  key={c.id}
                  className={`scm__ac-option${String(value) === String(c.id) ? " scm__ac-option--selected" : ""}`}
                  onClick={() => handleSelect(c)}>
                  {c.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ViewField = ({ label, value }) => (
  <div className="scm__field">
    <div className="scm__input-wrap scm__input-wrap--disabled">
      <label className="scm__label">{label}</label>
      <input type="text" value={value ?? "—"} disabled readOnly />
    </div>
  </div>
);

const StoreChecklistModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedChecklist, setSelectedChecklist] = useState(null);

  const { data: checklistDetail, isFetching: checklistLoading } =
    useGetStoreChecklistByIdQuery(selectedId, {
      skip: !selectedId || !open,
    });
  const rowData = checklistDetail?.data ?? null;

  const [createStoreChecklist, { isLoading: isCreating }] =
    useCreateStoreChecklistMutation();
  const [updateStoreChecklist, { isLoading: isUpdating }] =
    useUpdateStoreChecklistMutation();
  const isLoading = isCreating || isUpdating;

  const currentSchema = mode === "add" ? addSchema : editSchema;

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(currentSchema),
    defaultValues: { store_id: "", checklist_id: "" },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      setSelectedStore(null);
      setSelectedChecklist(null);
      if (!selectedId) {
        reset({ store_id: "", checklist_id: "" });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (rowData && open && selectedId) {
      reset({
        store_id: String(rowData.store?.id ?? ""),
        checklist_id: String(rowData.checklist?.id ?? ""),
      });
      setSelectedStore(rowData.store ?? null);
      setSelectedChecklist(rowData.checklist ?? null);
    }
  }, [rowData, open, selectedId, reset]);

  const onSubmit = async (form) => {
    try {
      const payload = {
        store_id: Number(form.store_id),
        checklist_id: Number(form.checklist_id),
        store_name: selectedStore?.name ?? rowData?.store?.name ?? "",
        checklist_name:
          selectedChecklist?.name ?? rowData?.checklist?.name ?? "",
      };

      if (mode === "edit") {
        await updateStoreChecklist({ id: selectedId, ...payload }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Store checklist updated successfully.",
          { variant: "success" },
        );
      } else {
        await createStoreChecklist(payload).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Store checklist created successfully.",
          { variant: "success" },
        );
      }
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      const apiError = err?.data?.errors?.[0]?.detail;
      window.__snackbar__?.enqueueSnackbar(
        apiError ?? "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
  };

  const headerIcon = {
    add: <AssignmentIcon className="scm__header-icon" />,
    view: <RemoveRedEyeIcon className="scm__header-icon" />,
    edit: <EditIcon className="scm__header-icon" />,
  };
  const headerTitle = {
    add: "Add Store Checklist",
    view: "View Store Checklist",
    edit: "Edit Store Checklist",
  };
  const isView = mode === "view";

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "scm__paper" }}>
      <div className="scm__header">
        <div className="scm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="scm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="scm__content">
        {checklistLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="scm__group">
              <p className="scm__group-label">Store Checklist Details</p>
              <div className="scm__stack">
                <ViewField label="Code" value={rowData?.code} />
                <ViewField label="Store" value={rowData?.store?.name} />
                <ViewField label="Checklist" value={rowData?.checklist?.name} />
              </div>
            </div>

            <div className="scm__footer">
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
            <div className="scm__group">
              <p className="scm__group-label">Store Checklist Details</p>
              <div className="scm__stack">
                <Controller
                  name="store_id"
                  control={control}
                  render={({ field }) => (
                    <StoreAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                      onSelectOption={(store) => setSelectedStore(store)}
                      error={!!errors.store_id}
                      displayValue={
                        selectedId ? rowData?.store?.name : undefined
                      }
                    />
                  )}
                />
                {errors.store_id && (
                  <p className="scm__error" style={{ marginTop: 6 }}>
                    <ReportProblemIcon />
                    {errors.store_id?.message}
                  </p>
                )}

                <Controller
                  name="checklist_id"
                  control={control}
                  render={({ field }) => (
                    <ChecklistAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                      onSelectOption={(checklist) =>
                        setSelectedChecklist(checklist)
                      }
                      error={!!errors.checklist_id}
                      displayValue={
                        selectedId ? rowData?.checklist?.name : undefined
                      }
                    />
                  )}
                />
                {errors.checklist_id && (
                  <p className="scm__error" style={{ marginTop: 6 }}>
                    <ReportProblemIcon />
                    {errors.checklist_id?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="scm__footer">
              {selectedId && <BackButton onClick={() => setMode("view")} />}
              <ConfirmButton
                label={
                  isLoading ? "Saving..." : mode === "edit" ? "Update" : "Save"
                }
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
              />
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StoreChecklistModal;
