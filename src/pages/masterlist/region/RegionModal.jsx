import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Autocomplete from "@mui/material/Autocomplete";
import CloseIcon from "@mui/icons-material/Close";
import PublicIcon from "@mui/icons-material/Public";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import UniversalButton, {
  ConfirmButton,
  BackButton,
} from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetRegionByIdQuery,
  useCreateRegionMutation,
  useUpdateRegionMutation,
} from "../../../features/api/masterlist/regionApi";
import { useGetUsersQuery } from "../../../features/api/usermanagement/userApi";
import "./RegionModal.scss";

const schema = yup.object({
  name: yup.string().required("Region name is required").trim(),
  region_head_id: yup
    .number()
    .typeError("Region head is required")
    .required("Region head is required")
    .min(1, "Region head is required"),
});

const SkeletonLoader = () => (
  <div className="rm__skeleton-wrap">
    {[60, 75].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="rm__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

const ViewField = ({ label, value }) => (
  <div className="rm__field">
    <div className="rm__input-wrap rm__input-wrap--disabled">
      <label className="rm__label">{label}</label>
      <input type="text" value={value ?? "—"} disabled readOnly />
    </div>
  </div>
);

const RegionModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [regionHeadOpen, setRegionHeadOpen] = useState(false);

  const { data: regionDetail, isFetching: regionLoading } =
    useGetRegionByIdQuery(selectedId, {
      skip: !selectedId || !open,
    });
  const rowData = regionDetail?.data ?? null;

  const { data: regionHeadsData, isFetching: regionHeadsLoading } =
    useGetUsersQuery(
      { role_id: 5 },
      { skip: !regionHeadOpen },
    );

  const regionHeadOptions = Array.isArray(regionHeadsData?.data?.data)
    ? regionHeadsData.data.data
    : Array.isArray(regionHeadsData?.data)
      ? regionHeadsData.data
      : [];

  const [createRegion, { isLoading: isCreating }] = useCreateRegionMutation();
  const [updateRegion, { isLoading: isUpdating }] = useUpdateRegionMutation();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: "", region_head_id: "" },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      setRegionHeadOpen(false);
      if (!selectedId) {
        reset({ name: "", region_head_id: "" });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (rowData && open && selectedId) {
      reset({
        name: rowData.name ?? "",
        region_head_id: rowData.region_head?.id ?? "",
      });
    }
  }, [rowData, open, selectedId, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateRegion({ id: selectedId, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Region updated successfully.", {
          variant: "success",
        });
      } else {
        await createRegion(form).unwrap();
        window.__snackbar__?.enqueueSnackbar("Region created successfully.", {
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
    add: <PublicIcon className="rm__header-icon" />,
    view: <RemoveRedEyeIcon className="rm__header-icon" />,
    edit: <EditIcon className="rm__header-icon" />,
  };
  const headerTitle = {
    add: "Add Region",
    view: "View Region",
    edit: "Edit Region",
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
      PaperProps={{ className: "rm__paper" }}>
      <div className="rm__header">
        <div className="rm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="rm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="rm__content">
        {regionLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="rm__group">
              <p className="rm__group-label">Region Details</p>
              <div className="rm__stack">
                <ViewField label="Region Name" value={rowData?.name} />
                <ViewField
                  label="Region Head"
                  value={rowData?.region_head?.full_name}
                />
              </div>
            </div>

            <div className="rm__footer">
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
            <div className="rm__group">
              <p className="rm__group-label">Region Details</p>
              <div className="rm__stack">
                <div className="rm__field">
                  <div
                    className={`rm__input-wrap${errors.name ? " rm__input-wrap--error" : ""}`}>
                    <label className="rm__label">
                      Region Name <span className="rm__required">*</span>
                    </label>
                    <input
                      type="text"
                      {...register("name")}
                      autoComplete="off"
                    />
                  </div>
                  {errors.name && (
                    <p className="rm__error">
                      <ReportProblemIcon />
                      {errors.name?.message}
                    </p>
                  )}
                </div>

                <div className="rm__field">
                  <Controller
                    name="region_head_id"
                    control={control}
                    render={({ field }) => {
                      const mergedRegionHeadOptions = [
                        ...(rowData?.region_head
                          ? regionHeadOptions.some(
                              (o) => o.id === rowData.region_head.id,
                            )
                            ? []
                            : [rowData.region_head]
                          : []),
                        ...regionHeadOptions,
                      ];
                      const selectedRegionHead =
                        mergedRegionHeadOptions.find(
                          (opt) => opt.id === field.value,
                        ) ?? null;

                      return (
                        <Autocomplete
                          options={mergedRegionHeadOptions}
                          loading={regionHeadsLoading}
                          getOptionLabel={(opt) => opt?.full_name ?? ""}
                          isOptionEqualToValue={(opt, val) =>
                            opt.id === val?.id
                          }
                          value={selectedRegionHead}
                          onChange={(_, selected) =>
                            field.onChange(selected?.id ?? "")
                          }
                          onOpen={() => setRegionHeadOpen(true)}
                          renderInput={(params) => (
                            <div
                              ref={params.InputProps.ref}
                              className={`rm__input-wrap${errors.region_head_id ? " rm__input-wrap--error" : ""}`}>
                              <label className="rm__label">
                                Region Head{" "}
                                <span className="rm__required">*</span>
                              </label>
                              <input
                                {...params.inputProps}
                                autoComplete="off"
                                placeholder={
                                  regionHeadsLoading ? "Loading..." : "Search..."
                                }
                              />
                            </div>
                          )}
                          slotProps={{
                            paper: { className: "rm__autocomplete-paper" },
                          }}
                        />
                      );
                    }}
                  />
                  {errors.region_head_id && (
                    <p className="rm__error">
                      <ReportProblemIcon />
                      {errors.region_head_id?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rm__footer">
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

export default RegionModal;