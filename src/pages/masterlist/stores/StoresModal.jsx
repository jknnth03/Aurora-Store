import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Autocomplete from "@mui/material/Autocomplete";
import CloseIcon from "@mui/icons-material/Close";
import StoreIcon from "@mui/icons-material/Store";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
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
  region_id: yup
    .number()
    .typeError("Region is required")
    .required("Region is required")
    .min(1, "Region is required"),
  area_id: yup
    .number()
    .typeError("Area is required")
    .required("Area is required")
    .min(1, "Area is required"),
});

const editSchema = yup.object({
  name: yup.string().required("Store name is required"),
  region_id: yup
    .number()
    .typeError("Region is required")
    .required("Region is required")
    .min(1, "Region is required"),
  area_id: yup
    .number()
    .typeError("Area is required")
    .required("Area is required")
    .min(1, "Area is required"),
});

const SkeletonLoader = () => (
  <div className="sm__skeleton-wrap">
    {[50, 75, 60].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="sm__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

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
  const [regionOpen, setRegionOpen] = useState(false);
  const [areaOpen, setAreaOpen] = useState(false);

  const { data: storeDetail, isFetching: storeLoading } = useGetStoreByIdQuery(
    selectedId,
    { skip: !selectedId || !open },
  );
  const rowData = storeDetail?.data ?? null;

  const { data: regionsData, isFetching: regionsLoading } = useGetRegionsQuery(
    { status: "active" },
    { skip: !regionOpen },
  );

  const { data: areasData, isFetching: areasLoading } = useGetAreasQuery(
    { status: "active" },
    { skip: !areaOpen },
  );

  const regionOptions = Array.isArray(regionsData?.data?.data)
    ? regionsData.data.data
    : Array.isArray(regionsData?.data)
      ? regionsData.data
      : [];

  const areaOptions = Array.isArray(areasData?.data?.data)
    ? areasData.data.data
    : Array.isArray(areasData?.data)
      ? areasData.data
      : [];

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
      setRegionOpen(false);
      setAreaOpen(false);
      if (!selectedId) {
        reset({ name: "", region_id: "", area_id: "" });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (rowData && open && selectedId) {
      reset({
        name: rowData.name ?? "",
        region_id: rowData.region?.id ?? "",
        area_id: rowData.area?.id ?? "",
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

                <div className="sm__field">
                  <Controller
                    name="region_id"
                    control={control}
                    render={({ field }) => {
                      const mergedRegionOptions = [
                        ...(rowData?.region
                          ? regionOptions.some((o) => o.id === rowData.region.id)
                            ? []
                            : [rowData.region]
                          : []),
                        ...regionOptions,
                      ];
                      const selectedRegion =
                        mergedRegionOptions.find((opt) => opt.id === field.value) ?? null;

                      return (
                        <Autocomplete
                          options={mergedRegionOptions}
                          loading={regionsLoading}
                          getOptionLabel={(opt) => opt?.name ?? ""}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          value={selectedRegion}
                          onChange={(_, selected) =>
                            field.onChange(selected?.id ?? "")
                          }
                          onOpen={() => setRegionOpen(true)}
                          renderInput={(params) => (
                            <div
                              ref={params.InputProps.ref}
                              className={`sm__input-wrap${errors.region_id ? " sm__input-wrap--error" : ""}`}>
                              <label className="sm__label">
                                Region <span className="sm__required">*</span>
                              </label>
                              <input
                                {...params.inputProps}
                                autoComplete="off"
                                placeholder={
                                  regionsLoading ? "Loading..." : "Search..."
                                }
                              />
                            </div>
                          )}
                          slotProps={{
                            paper: { className: "sm__autocomplete-paper" },
                          }}
                        />
                      );
                    }}
                  />
                  {errors.region_id && (
                    <p className="sm__error">
                      <ReportProblemIcon />
                      {errors.region_id?.message}
                    </p>
                  )}
                </div>

                <div className="sm__field">
                  <Controller
                    name="area_id"
                    control={control}
                    render={({ field }) => {
                      const mergedAreaOptions = [
                        ...(rowData?.area
                          ? areaOptions.some((o) => o.id === rowData.area.id)
                            ? []
                            : [rowData.area]
                          : []),
                        ...areaOptions,
                      ];
                      const selectedArea =
                        mergedAreaOptions.find((opt) => opt.id === field.value) ?? null;

                      return (
                        <Autocomplete
                          options={mergedAreaOptions}
                          loading={areasLoading}
                          getOptionLabel={(opt) => opt?.name ?? ""}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          value={selectedArea}
                          onChange={(_, selected) =>
                            field.onChange(selected?.id ?? "")
                          }
                          onOpen={() => setAreaOpen(true)}
                          renderInput={(params) => (
                            <div
                              ref={params.InputProps.ref}
                              className={`sm__input-wrap${errors.area_id ? " sm__input-wrap--error" : ""}`}>
                              <label className="sm__label">
                                Area <span className="sm__required">*</span>
                              </label>
                              <input
                                {...params.inputProps}
                                autoComplete="off"
                                placeholder={
                                  areasLoading ? "Loading..." : "Search..."
                                }
                              />
                            </div>
                          )}
                          slotProps={{
                            paper: { className: "sm__autocomplete-paper" },
                          }}
                        />
                      );
                    }}
                  />
                  {errors.area_id && (
                    <p className="sm__error">
                      <ReportProblemIcon />
                      {errors.area_id?.message}
                    </p>
                  )}
                </div>
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