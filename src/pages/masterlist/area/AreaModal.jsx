import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Autocomplete from "@mui/material/Autocomplete";
import CloseIcon from "@mui/icons-material/Close";
import MapIcon from "@mui/icons-material/Map";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import UniversalButton, {
  ConfirmButton,
  BackButton,
} from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetAreaByIdQuery,
  useCreateAreaMutation,
  useUpdateAreaMutation,
} from "../../../features/api/masterlist/areaApi";
import { useGetUsersQuery } from "../../../features/api/usermanagement/userApi";
import { useGetRegionsQuery } from "../../../features/api/masterlist/regionApi";
import "./AreaModal.scss";

const schema = yup.object({
  name: yup.string().required("Area name is required").trim(),
  region_id: yup
    .number()
    .typeError("Region is required")
    .required("Region is required")
    .min(1, "Region is required"),
  area_head_id: yup
    .number()
    .typeError("Area head is required")
    .required("Area head is required")
    .min(1, "Area head is required"),
});

const SkeletonLoader = () => (
  <div className="am__skeleton-wrap">
    {[60, 75, 50].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="am__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

const ViewField = ({ label, value }) => (
  <div className="am__field">
    <div className="am__input-wrap am__input-wrap--disabled">
      <label className="am__label">{label}</label>
      <input type="text" value={value ?? "—"} disabled readOnly />
    </div>
  </div>
);

const AreaModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [areaHeadOpen, setAreaHeadOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);

  const { data: areaDetail, isFetching: areaLoading } = useGetAreaByIdQuery(
    selectedId,
    { skip: !selectedId || !open },
  );
  const rowData = areaDetail?.data ?? null;

  const { data: areaHeadsData, isFetching: areaHeadsLoading } = useGetUsersQuery(
    { role_id: 4 },
    { skip: !areaHeadOpen },
  );

  const { data: regionsData, isFetching: regionsLoading } = useGetRegionsQuery(
    undefined,
    { skip: !regionOpen },
  );

  const areaHeadOptions = Array.isArray(areaHeadsData?.data?.data)
    ? areaHeadsData.data.data
    : Array.isArray(areaHeadsData?.data)
      ? areaHeadsData.data
      : [];

  const regionOptions = Array.isArray(regionsData?.data?.data)
    ? regionsData.data.data
    : Array.isArray(regionsData?.data)
      ? regionsData.data
      : Array.isArray(regionsData)
        ? regionsData
        : [];

  const [createArea, { isLoading: isCreating }] = useCreateAreaMutation();
  const [updateArea, { isLoading: isUpdating }] = useUpdateAreaMutation();
  const isLoading = isCreating || isUpdating;

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: "", region_id: "", area_head_id: "" },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      setAreaHeadOpen(false);
      setRegionOpen(false);
      if (!selectedId) {
        reset({ name: "", region_id: "", area_head_id: "" });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (rowData && open && selectedId) {
      reset({
        name: rowData.name ?? "",
        region_id: rowData.region?.id ?? "",
        area_head_id: rowData.area_head?.id ?? "",
      });
    }
  }, [rowData, open, selectedId, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateArea({ id: selectedId, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Area updated successfully.", {
          variant: "success",
        });
      } else {
        await createArea(form).unwrap();
        window.__snackbar__?.enqueueSnackbar("Area created successfully.", {
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
    add: <MapIcon className="am__header-icon" />,
    view: <RemoveRedEyeIcon className="am__header-icon" />,
    edit: <EditIcon className="am__header-icon" />,
  };
  const headerTitle = {
    add: "Add Area",
    view: "View Area",
    edit: "Edit Area",
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
      PaperProps={{ className: "am__paper" }}>
      <div className="am__header">
        <div className="am__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="am__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="am__content">
        {areaLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="am__group">
              <p className="am__group-label">Area Details</p>
              <div className="am__stack">
                <ViewField label="Area Name" value={rowData?.name} />
                <ViewField label="Region" value={rowData?.region?.name} />
                <ViewField
                  label="Area Head"
                  value={rowData?.area_head?.full_name}
                />
              </div>
            </div>

            <div className="am__footer">
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
            <div className="am__group">
              <p className="am__group-label">Area Details</p>
              <div className="am__stack">
                <div className="am__field">
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => (
                      <div
                        className={`am__input-wrap${errors.name ? " am__input-wrap--error" : ""}`}>
                        <label className="am__label">
                          Area Name <span className="am__required">*</span>
                        </label>
                        <input type="text" {...field} autoComplete="off" />
                      </div>
                    )}
                  />
                  {errors.name && (
                    <p className="am__error">
                      <ReportProblemIcon />
                      {errors.name?.message}
                    </p>
                  )}
                </div>

                <div className="am__field">
                  <Controller
                    name="region_id"
                    control={control}
                    render={({ field }) => {
                      const mergedRegionOptions = [
                        ...(rowData?.region
                          ? regionOptions.some(
                              (o) => o.id === rowData.region.id,
                            )
                            ? []
                            : [rowData.region]
                          : []),
                        ...regionOptions,
                      ];
                      const selectedRegion =
                        mergedRegionOptions.find(
                          (opt) => opt.id === field.value,
                        ) ?? null;

                      return (
                        <Autocomplete
                          options={mergedRegionOptions}
                          loading={regionsLoading}
                          getOptionLabel={(opt) => opt?.name ?? ""}
                          isOptionEqualToValue={(opt, val) =>
                            opt.id === val?.id
                          }
                          value={selectedRegion}
                          onChange={(_, selected) =>
                            field.onChange(selected?.id ?? "")
                          }
                          onOpen={() => setRegionOpen(true)}
                          renderInput={(params) => (
                            <div
                              ref={params.InputProps.ref}
                              className={`am__input-wrap${errors.region_id ? " am__input-wrap--error" : ""}`}>
                              <label className="am__label">
                                Region <span className="am__required">*</span>
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
                            paper: { className: "am__autocomplete-paper" },
                          }}
                        />
                      );
                    }}
                  />
                  {errors.region_id && (
                    <p className="am__error">
                      <ReportProblemIcon />
                      {errors.region_id?.message}
                    </p>
                  )}
                </div>

                <div className="am__field">
                  <Controller
                    name="area_head_id"
                    control={control}
                    render={({ field }) => {
                      const mergedAreaHeadOptions = [
                        ...(rowData?.area_head
                          ? areaHeadOptions.some(
                              (o) => o.id === rowData.area_head.id,
                            )
                            ? []
                            : [rowData.area_head]
                          : []),
                        ...areaHeadOptions,
                      ];
                      const selectedAreaHead =
                        mergedAreaHeadOptions.find(
                          (opt) => opt.id === field.value,
                        ) ?? null;

                      return (
                        <Autocomplete
                          options={mergedAreaHeadOptions}
                          loading={areaHeadsLoading}
                          getOptionLabel={(opt) => opt?.full_name ?? ""}
                          isOptionEqualToValue={(opt, val) =>
                            opt.id === val?.id
                          }
                          value={selectedAreaHead}
                          onChange={(_, selected) =>
                            field.onChange(selected?.id ?? "")
                          }
                          onOpen={() => setAreaHeadOpen(true)}
                          renderInput={(params) => (
                            <div
                              ref={params.InputProps.ref}
                              className={`am__input-wrap${errors.area_head_id ? " am__input-wrap--error" : ""}`}>
                              <label className="am__label">
                                Area Head{" "}
                                <span className="am__required">*</span>
                              </label>
                              <input
                                {...params.inputProps}
                                autoComplete="off"
                                placeholder={
                                  areaHeadsLoading ? "Loading..." : "Search..."
                                }
                              />
                            </div>
                          )}
                          slotProps={{
                            paper: { className: "am__autocomplete-paper" },
                          }}
                        />
                      );
                    }}
                  />
                  {errors.area_head_id && (
                    <p className="am__error">
                      <ReportProblemIcon />
                      {errors.area_head_id?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="am__footer">
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

export default AreaModal;