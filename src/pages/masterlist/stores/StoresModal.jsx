import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import StoreIcon from "@mui/icons-material/Store";
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
  useGetStoreByIdQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
} from "../../../features/api/masterlist/storesApi";
import { useGetRegionsQuery } from "../../../features/api/masterlist/regionApi";
import { useGetAreasQuery } from "../../../features/api/masterlist/areaApi";
import "./StoresModal.scss";

const addSchema = yup.object({
  name: yup.string().required("Store name is required"),
  region_id: yup.string().required("Region is required"),
  area_id: yup.string().required("Area is required"),
});

const editSchema = yup.object({
  name: yup.string().required("Store name is required"),
  region_id: yup.string().required("Region is required"),
  area_id: yup.string().required("Area is required"),
});

const SkeletonLoader = () => (
  <div className="sm__skeleton-wrap">
    {[50, 75, 60, 80, 55].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="sm__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

const RegionAutocomplete = ({
  value,
  onChange,
  error,
  disabled = false,
  displayValue,
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const { data, isFetching } = useGetRegionsQuery({ status: "active" });
  const allOptions = data?.data?.data ?? [];
  const options = search
    ? allOptions.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allOptions;
  const selected =
    allOptions.find((r) => String(r.id) === String(value)) ?? null;

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
      <div className="sm__field">
        <div className="sm__input-wrap sm__input-wrap--disabled">
          <label className="sm__label">Region</label>
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

  const handleSelect = (region) => {
    onChange(String(region.id));
    setSearch("");
    setOpen(false);
  };

  return (
    <div className={`sm__ac${error ? " sm__ac--error" : ""}`} ref={wrapRef}>
      <label className="sm__label">
        Region <span className="sm__required">*</span>
      </label>
      <div className="sm__ac-box" onClick={() => setOpen((p) => !p)}>
        {open ? (
          <div className="sm__ac-search-wrap">
            <SearchIcon
              sx={{ fontSize: "0.9rem", flexShrink: 0, color: "inherit" }}
            />
            <input
              autoFocus
              type="text"
              placeholder="Search region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm__ac-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <span
            className={
              selected || displayValue ? "sm__ac-value" : "sm__ac-placeholder"
            }>
            {selected ? selected.name : displayValue || "Select region..."}
          </span>
        )}
        <span className="sm__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>
      {open && (
        <div className="sm__ac-dropdown">
          <div className="sm__ac-options">
            {isFetching ? (
              <p className="sm__ac-empty">Loading...</p>
            ) : options.length === 0 ? (
              <p className="sm__ac-empty">No regions found</p>
            ) : (
              options.map((r) => (
                <div
                  key={r.id}
                  className={`sm__ac-option${String(value) === String(r.id) ? " sm__ac-option--selected" : ""}`}
                  onClick={() => handleSelect(r)}>
                  {r.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AreaAutocomplete = ({
  value,
  onChange,
  error,
  disabled = false,
  displayValue,
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const { data, isFetching } = useGetAreasQuery({ status: "active" });
  const allOptions = data?.data?.data ?? [];
  const options = search
    ? allOptions.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allOptions;
  const selected =
    allOptions.find((a) => String(a.id) === String(value)) ?? null;

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
      <div className="sm__field">
        <div className="sm__input-wrap sm__input-wrap--disabled">
          <label className="sm__label">Area</label>
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

  const handleSelect = (area) => {
    onChange(String(area.id));
    setSearch("");
    setOpen(false);
  };

  return (
    <div className={`sm__ac${error ? " sm__ac--error" : ""}`} ref={wrapRef}>
      <label className="sm__label">
        Area <span className="sm__required">*</span>
      </label>
      <div className="sm__ac-box" onClick={() => setOpen((p) => !p)}>
        {open ? (
          <div className="sm__ac-search-wrap">
            <SearchIcon
              sx={{ fontSize: "0.9rem", flexShrink: 0, color: "inherit" }}
            />
            <input
              autoFocus
              type="text"
              placeholder="Search area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm__ac-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <span
            className={
              selected || displayValue ? "sm__ac-value" : "sm__ac-placeholder"
            }>
            {selected ? selected.name : displayValue || "Select area..."}
          </span>
        )}
        <span className="sm__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>
      {open && (
        <div className="sm__ac-dropdown">
          <div className="sm__ac-options">
            {isFetching ? (
              <p className="sm__ac-empty">Loading...</p>
            ) : options.length === 0 ? (
              <p className="sm__ac-empty">No areas found</p>
            ) : (
              options.map((a) => (
                <div
                  key={a.id}
                  className={`sm__ac-option${String(value) === String(a.id) ? " sm__ac-option--selected" : ""}`}
                  onClick={() => handleSelect(a)}>
                  {a.name}
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
  <div className="sm__field">
    <div className="sm__input-wrap sm__input-wrap--disabled">
      <label className="sm__label">{label}</label>
      <input type="text" value={value ?? "—"} disabled readOnly />
    </div>
  </div>
);

const StoresModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");

  const { data: storeDetail, isFetching: storeLoading } = useGetStoreByIdQuery(
    selectedId,
    { skip: !selectedId || !open },
  );
  const rowData = storeDetail?.data ?? null;

  const [createStore, { isLoading: isCreating }] = useCreateStoreMutation();
  const [updateStore, { isLoading: isUpdating }] = useUpdateStoreMutation();
  const isLoading = isCreating || isUpdating;

  const currentSchema = mode === "add" ? addSchema : editSchema;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(currentSchema),
    defaultValues: { name: "", region_id: "", area_id: "" },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      if (!selectedId) {
        reset({ name: "", region_id: "", area_id: "" });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (rowData && open && selectedId) {
      reset({
        name: rowData.name ?? "",
        region_id: String(rowData.region?.id ?? ""),
        area_id: String(rowData.area?.id ?? ""),
      });
    }
  }, [rowData, open, selectedId, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateStore({ id: selectedId, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Store updated successfully.", {
          variant: "success",
        });
      } else {
        await createStore(form).unwrap();
        window.__snackbar__?.enqueueSnackbar("Store created successfully.", {
          variant: "success",
        });
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
    add: <StoreIcon className="sm__header-icon" />,
    view: <RemoveRedEyeIcon className="sm__header-icon" />,
    edit: <EditIcon className="sm__header-icon" />,
  };
  const headerTitle = {
    add: "Add Store",
    view: "View Store",
    edit: "Edit Store",
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
      PaperProps={{ className: "sm__paper" }}>
      <div className="sm__header">
        <div className="sm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="sm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="sm__content">
        {storeLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="sm__group">
              <p className="sm__group-label">Store Details</p>
              <div className="sm__stack">
                <ViewField label="Store Name" value={rowData?.name} />
                <ViewField label="Region" value={rowData?.region?.name} />
                <ViewField label="Area" value={rowData?.area?.name} />
              </div>
            </div>

            <div className="sm__footer">
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
            <div className="sm__group">
              <p className="sm__group-label">Store Details</p>
              <div className="sm__stack">
                <div className="sm__field">
                  <div
                    className={`sm__input-wrap${errors.name ? " sm__input-wrap--error" : ""}`}>
                    <label className="sm__label">
                      Store Name <span className="sm__required">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("name")}
                      autoComplete="off"
                    />
                  </div>
                  {errors.name && (
                    <p className="sm__error">
                      <ReportProblemIcon />
                      {errors.name?.message}
                    </p>
                  )}
                </div>

                <Controller
                  name="region_id"
                  control={control}
                  render={({ field }) => (
                    <RegionAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                      error={!!errors.region_id}
                      displayValue={rowData?.region?.name}
                    />
                  )}
                />
                {errors.region_id && (
                  <p className="sm__error" style={{ marginTop: 6 }}>
                    <ReportProblemIcon />
                    {errors.region_id?.message}
                  </p>
                )}

                <Controller
                  name="area_id"
                  control={control}
                  render={({ field }) => (
                    <AreaAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                      error={!!errors.area_id}
                      displayValue={rowData?.area?.name}
                    />
                  )}
                />
                {errors.area_id && (
                  <p className="sm__error" style={{ marginTop: 6 }}>
                    <ReportProblemIcon />
                    {errors.area_id?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="sm__footer">
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

export default StoresModal;
