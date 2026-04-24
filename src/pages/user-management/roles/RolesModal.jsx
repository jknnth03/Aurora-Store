import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import UniversalButton, {
  ConfirmButton,
  BackButton,
} from "../../../reusable-components/universalbuttons/UniversalButtons";
import { MODULES } from "../../../config/modules";
import {
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
} from "../../../features/api/usermanagement/rolesApi";
import "./RolesModal.scss";

const schema = yup.object({
  name: yup.string().required("Role name is required"),
  access_permission: yup
    .array()
    .of(yup.string())
    .min(1, "At least one permission is required"),
});

const SKIP = ["LOGIN"];
const filteredModules = Object.entries(MODULES).filter(
  ([key]) => !SKIP.includes(key),
);

const flattenModules = (modules) => {
  const result = [];
  Object.values(modules).forEach((mod) => {
    if (mod.permissionId && !SKIP.includes(mod.permissionId)) {
      result.push({ id: mod.permissionId, label: mod.displayName });
    }
    if (mod.children) {
      Object.values(mod.children).forEach((child) => {
        if (child.permissionId) {
          result.push({ id: child.permissionId, label: child.displayName });
        }
      });
    }
  });
  return result;
};

const ALL_PERMISSIONS = flattenModules(MODULES);

const SkeletonLoader = () => (
  <div className="rm__skeleton-wrap">
    {[50, 75, 60, 80].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="rm__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

const PermissionsAutocomplete = ({
  value = [],
  onChange,
  error,
  disabled = false,
}) => {
  const buildInitialExpanded = () => {
    if (!disabled) return {};
    const init = {};
    filteredModules.forEach(([key, mod]) => {
      if (mod.children) {
        init[key] = true;
      }
    });
    return init;
  };

  const [expanded, setExpanded] = useState(buildInitialExpanded);

  useEffect(() => {
    if (disabled) {
      const init = {};
      filteredModules.forEach(([key, mod]) => {
        if (mod.children) {
          init[key] = true;
        }
      });
      setExpanded(init);
    }
  }, [disabled]);

  const toggleExpand = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  const handleParentToggle = (mod) => {
    if (mod.children) {
      const childIds = Object.values(mod.children).map((c) => c.permissionId);
      const allSelected = childIds.every((id) => value.includes(id));
      if (allSelected) {
        onChange(
          value.filter(
            (id) => !childIds.includes(id) && id !== mod.permissionId,
          ),
        );
      } else {
        const merged = [...new Set([...value, mod.permissionId, ...childIds])];
        onChange(merged);
      }
    } else {
      const already = value.includes(mod.permissionId);
      onChange(
        already
          ? value.filter((id) => id !== mod.permissionId)
          : [...value, mod.permissionId],
      );
    }
  };

  const handleChildToggle = (childId, parentMod) => {
    const already = value.includes(childId);
    let next = already
      ? value.filter((id) => id !== childId)
      : [...value, childId];
    const childIds = Object.values(parentMod.children).map(
      (c) => c.permissionId,
    );
    const allSelected = childIds.every((id) => next.includes(id));
    if (allSelected && !next.includes(parentMod.permissionId)) {
      next = [...next, parentMod.permissionId];
    }
    if (!allSelected && next.includes(parentMod.permissionId)) {
      next = next.filter((id) => id !== parentMod.permissionId);
    }
    onChange(next);
  };

  const getParentState = (mod) => {
    if (!mod.children) return null;
    const childIds = Object.values(mod.children).map((c) => c.permissionId);
    const selectedCount = childIds.filter((id) => value.includes(id)).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === childIds.length) return "all";
    return "indeterminate";
  };

  const allPermIds = filteredModules.flatMap(([, mod]) => {
    const ids = [mod.permissionId];
    if (mod.children)
      ids.push(...Object.values(mod.children).map((c) => c.permissionId));
    return ids;
  });
  const isAllSelected = allPermIds.every((id) => value.includes(id));
  const isIndeterminate =
    !isAllSelected && allPermIds.some((id) => value.includes(id));

  const handleSelectAll = () => {
    if (isAllSelected) onChange([]);
    else onChange([...new Set(allPermIds)]);
  };

  return (
    <div
      className={`rm__ac rm__ac--tree${error ? " rm__ac--error" : ""}${disabled ? " rm__ac--disabled" : ""}`}>
      <label className="rm__label">
        Permissions <span className="rm__required">*</span>
      </label>

      <div className="rm__tree">
        <div
          className={`rm__tree-selectall${disabled ? " rm__tree-selectall--disabled" : ""}`}
          onClick={disabled ? undefined : handleSelectAll}>
          <span
            className={`rm__ac-checkbox${
              isAllSelected
                ? " rm__ac-checkbox--checked"
                : isIndeterminate
                  ? " rm__ac-checkbox--indeterminate"
                  : ""
            }${disabled ? " rm__ac-checkbox--disabled" : ""}`}
          />
          <span className="rm__tree-selectall-label">Select All</span>
        </div>

        {filteredModules.map(([key, mod]) => {
          const parentState = getParentState(mod);
          const hasChildren = !!mod.children;
          const isExpanded = expanded[key] ?? false;

          return (
            <div
              key={key}
              className={`rm__tree-module${disabled ? " rm__tree-module--disabled" : ""}`}>
              <div className="rm__tree-parent">
                <span
                  className={`rm__ac-checkbox${
                    parentState === "all" ||
                    (!hasChildren && value.includes(mod.permissionId))
                      ? " rm__ac-checkbox--checked"
                      : parentState === "indeterminate"
                        ? " rm__ac-checkbox--indeterminate"
                        : ""
                  }${disabled ? " rm__ac-checkbox--disabled" : ""}`}
                  onClick={disabled ? undefined : () => handleParentToggle(mod)}
                />
                <span className="rm__tree-parent-icon">{mod.icon}</span>
                <span
                  className={`rm__tree-parent-label${disabled ? " rm__tree-parent-label--disabled" : ""}`}
                  onClick={
                    disabled ? undefined : () => handleParentToggle(mod)
                  }>
                  {mod.displayName}
                </span>
                {hasChildren && (
                  <span
                    className={`rm__tree-expand${disabled ? " rm__tree-expand--disabled" : ""}`}
                    onClick={disabled ? undefined : () => toggleExpand(key)}>
                    {isExpanded ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                  </span>
                )}
              </div>

              {hasChildren && isExpanded && (
                <div className="rm__tree-children">
                  {Object.entries(mod.children).map(([cKey, child]) => (
                    <div
                      key={cKey}
                      className={`rm__tree-child${value.includes(child.permissionId) ? " rm__tree-child--selected" : ""}${disabled ? " rm__tree-child--disabled" : ""}`}
                      onClick={
                        disabled
                          ? undefined
                          : () => handleChildToggle(child.permissionId, mod)
                      }>
                      <span
                        className={`rm__ac-checkbox${value.includes(child.permissionId) ? " rm__ac-checkbox--checked" : ""}${disabled ? " rm__ac-checkbox--disabled" : ""}`}
                      />
                      <span className="rm__tree-child-icon">{child.icon}</span>
                      <span>{child.displayName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RolesModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const isLoading = isCreating || isUpdating;

  const { data: roleData, isFetching: roleLoading } = useGetRoleByIdQuery(
    selectedId,
    { skip: !selectedId || !open },
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: "", access_permission: [] },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      if (!selectedId) {
        setSelectedRow(null);
        reset({ name: "", access_permission: [] });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (roleData) {
      const data = roleData?.data ?? null;
      setSelectedRow(data);
      reset({
        name: data?.name ?? "",
        access_permission: data?.access_permission ?? [],
      });
    }
  }, [roleData, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateRole({ id: selectedId, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Role updated successfully.", {
          variant: "success",
        });
      } else {
        await createRole(form).unwrap();
        window.__snackbar__?.enqueueSnackbar("Role created successfully.", {
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
    add: <PeopleAltIcon className="rm__header-icon" />,
    view: <RemoveRedEyeIcon className="rm__header-icon" />,
    edit: <EditIcon className="rm__header-icon" />,
  };

  const headerTitle = { add: "Add Role", view: "View Role", edit: "Edit Role" };
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
        {roleLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="rm__group">
              <p className="rm__group-label">Role Details</p>
              <div className="rm__field">
                <div className="rm__input-wrap rm__input-wrap--disabled">
                  <label className="rm__label">Role Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="rm__group">
              <p className="rm__group-label">Permissions</p>
              <PermissionsAutocomplete
                value={selectedRow?.access_permission ?? []}
                onChange={() => {}}
                error={false}
                disabled
              />
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
              <p className="rm__group-label">Role Details</p>
              <div className="rm__field">
                <div
                  className={`rm__input-wrap${errors.name ? " rm__input-wrap--error" : ""}`}>
                  <label className="rm__label">
                    Role Name <span className="rm__required">*</span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="rm__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="rm__group">
              <p className="rm__group-label">Permissions</p>
              <Controller
                name="access_permission"
                control={control}
                render={({ field }) => (
                  <PermissionsAutocomplete
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.access_permission}
                  />
                )}
              />
              {errors.access_permission && (
                <p className="rm__error" style={{ marginTop: 6 }}>
                  <ReportProblemIcon />
                  {errors.access_permission?.message}
                </p>
              )}
            </div>

            <div className="rm__footer">
              {selectedId && <BackButton onClick={() => setMode("view")} />}
              <ConfirmButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Role"
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

export default RolesModal;
