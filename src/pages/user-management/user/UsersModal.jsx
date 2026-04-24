import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { addSchema } from "./UserModalSchema";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import {
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetActiveOneChargingQuery,
} from "../../../features/api/usermanagement/userApi";
import { useGetAllRolesQuery } from "../../../features/api/usermanagement/rolesApi";
import "./UsersModal.scss";

const GENDER_OPTIONS = ["male", "female"];

const FIELD_GROUPS = [
  {
    label: "Personal Information",
    fields: [
      { name: "first_name", label: "First Name", required: true, half: true },
      {
        name: "middle_name",
        label: "Middle Name",
        required: false,
        half: true,
      },
      { name: "last_name", label: "Last Name", required: true, half: true },
      { name: "suffix", label: "Suffix", required: false, half: true },
      {
        name: "mobile_number",
        label: "Mobile Number",
        required: false,
        half: true,
      },
    ],
  },
  {
    label: "Employment Details",
    fields: [
      { name: "employee_id", label: "Employee ID", required: true, half: true },
    ],
  },
  {
    label: "Account Credentials",
    fields: [
      { name: "username", label: "Username", required: true, half: true },
    ],
  },
];

const EDIT_FIELD_GROUPS = [
  {
    label: "Personal Information",
    fields: [
      { name: "first_name", label: "First Name", required: true, half: true },
      {
        name: "middle_name",
        label: "Middle Name",
        required: false,
        half: true,
      },
      { name: "last_name", label: "Last Name", required: true, half: true },
      { name: "suffix", label: "Suffix", required: false, half: true },
      {
        name: "mobile_number",
        label: "Mobile Number",
        required: false,
        half: true,
      },
    ],
  },
  {
    label: "Account Credentials",
    fields: [
      { name: "username", label: "Username", required: true, half: true },
    ],
  },
];

const SkeletonLoader = () => (
  <div className="um__skeleton-wrap">
    {[40, 60, 40, 60, 80, 50, 70, 55, 65].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
  </div>
);

const GenderSelect = ({ value, onChange, error, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const displayValue = value
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : null;

  if (disabled) {
    return (
      <div className="um__field">
        <div className="um__input-wrap um__input-wrap--disabled">
          <label className="um__label">Gender</label>
          <input type="text" value={displayValue ?? "—"} disabled readOnly />
        </div>
      </div>
    );
  }

  return (
    <div className={`um__ac${error ? " um__ac--error" : ""}`} ref={wrapRef}>
      <label className="um__label">
        Gender<span className="um__required">*</span>
      </label>
      <div className="um__ac-box" onClick={() => setOpen((p) => !p)}>
        <span className={displayValue ? "um__ac-value" : "um__ac-placeholder"}>
          {displayValue || "Select gender..."}
        </span>
        <span className="um__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>
      {open && (
        <div className="um__ac-dropdown">
          <div className="um__ac-options">
            {GENDER_OPTIONS.map((g) => (
              <div
                key={g}
                className={`um__ac-option${value === g ? " um__ac-option--selected" : ""}`}
                onClick={() => handleSelect(g)}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RoleAutocomplete = ({ value, onChange, error, displayValue }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const { data, isFetching } = useGetAllRolesQuery();
  const allOptions = data?.data?.data ?? [];
  const options = search
    ? allOptions.filter((r) =>
        r.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allOptions;
  const selected = allOptions.find((r) => r.id === value) ?? null;

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

  const handleSelect = (role) => {
    onChange(role.id);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className={`um__ac${error ? " um__ac--error" : ""}`} ref={wrapRef}>
      <label className="um__label">
        Role<span className="um__required">*</span>
      </label>
      <div className="um__ac-box" onClick={() => setOpen((p) => !p)}>
        {open ? (
          <div className="um__ac-search-wrap">
            <SearchIcon
              sx={{ fontSize: "0.9rem", flexShrink: 0, color: "inherit" }}
            />
            <input
              autoFocus
              type="text"
              placeholder="Search role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="um__ac-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <span
            className={
              selected || displayValue ? "um__ac-value" : "um__ac-placeholder"
            }>
            {selected ? selected.name : displayValue || "Select role..."}
          </span>
        )}
        <span className="um__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>
      {open && (
        <div className="um__ac-dropdown">
          <div className="um__ac-options">
            {isFetching ? (
              <p className="um__ac-empty">Loading...</p>
            ) : options.length === 0 ? (
              <p className="um__ac-empty">No roles found</p>
            ) : (
              options.map((r) => (
                <div
                  key={r.id}
                  className={`um__ac-option${value === r.id ? " um__ac-option--selected" : ""}`}
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

const OneChargingAutocomplete = ({ value, onChange, error, displayValue }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const { data, isFetching } = useGetActiveOneChargingQuery({ search });
  const allOptions = data?.data?.data ?? [];
  const selected = allOptions.find((o) => o.id === value) ?? null;

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

  const handleSelect = (option) => {
    onChange(option.id);
    setSearch("");
    setOpen(false);
  };

  const displayLabel = selected
    ? `${selected.name} - ${selected.department_name}`
    : displayValue || null;

  return (
    <div className={`um__ac${error ? " um__ac--error" : ""}`} ref={wrapRef}>
      <label className="um__label">
        One Charging<span className="um__required">*</span>
      </label>
      <div className="um__ac-box" onClick={() => setOpen((p) => !p)}>
        {open ? (
          <div className="um__ac-search-wrap">
            <SearchIcon
              sx={{ fontSize: "0.9rem", flexShrink: 0, color: "inherit" }}
            />
            <input
              autoFocus
              type="text"
              placeholder="Search one charging..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="um__ac-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <span
            className={displayLabel ? "um__ac-value" : "um__ac-placeholder"}>
            {displayLabel || "Select one charging..."}
          </span>
        )}
        <span className="um__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>
      {open && (
        <div className="um__ac-dropdown">
          <div className="um__ac-options">
            {isFetching ? (
              <p className="um__ac-empty">Loading...</p>
            ) : allOptions.length === 0 ? (
              <p className="um__ac-empty">No results found</p>
            ) : (
              allOptions.map((o) => (
                <div
                  key={o.id}
                  className={`um__ac-option${value === o.id ? " um__ac-option--selected" : ""}`}
                  onClick={() => handleSelect(o)}>
                  <span>{o.name}</span>
                  <small
                    style={{
                      color: "var(--text-muted, #888)",
                      fontSize: "0.75rem",
                    }}>
                    {" - "}
                    {o.department_name}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ViewField = ({ label, value, half }) => (
  <div className={half ? "um__col-half" : "um__col-full"}>
    <div className="um__field">
      <div className="um__input-wrap um__input-wrap--disabled">
        <label className="um__label">{label}</label>
        <input type="text" value={value ?? "—"} disabled readOnly />
      </div>
    </div>
  </div>
);

const FormField = ({
  name,
  label,
  required,
  type = "text",
  register,
  errors,
  showPass,
  onTogglePass,
}) => {
  const isPassword = type === "password";
  const hasError = !!errors[name];

  return (
    <div className="um__field">
      <div
        className={`um__input-wrap${hasError ? " um__input-wrap--error" : ""}`}>
        <label className="um__label">
          {label}
          {required && <span className="um__required">*</span>}
        </label>
        <input
          type={isPassword ? (showPass ? "text" : "password") : "text"}
          {...register(name)}
          autoComplete={isPassword ? "new-password" : "off"}
        />
        {isPassword && (
          <button
            type="button"
            className="um__toggle-pass"
            onClick={onTogglePass}>
            {showPass ? (
              <RemoveRedEyeIcon fontSize="small" />
            ) : (
              <VisibilityOffOutlinedIcon fontSize="small" />
            )}
          </button>
        )}
      </div>
      {hasError && (
        <p className="um__error">
          <ReportProblemIcon />
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
};

const UsersModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [showPass, setShowPass] = useState(false);

  const { data: userDetail, isFetching: userLoading } = useGetUserByIdQuery(
    selectedId,
    { skip: !selectedId || !open },
  );
  const rowData = userDetail?.data ?? null;

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(addSchema),
    defaultValues: {
      role_id: "",
      employee_id: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      suffix: "",
      mobile_number: "",
      gender: "",
      one_charging_id: "",
      username: "",
    },
  });

  useEffect(() => {
    if (open) {
      setShowPass(false);
      setMode(selectedId ? "view" : "add");
      if (!selectedId) {
        reset({
          role_id: "",
          employee_id: "",
          first_name: "",
          middle_name: "",
          last_name: "",
          suffix: "",
          mobile_number: "",
          gender: "",
          one_charging_id: "",
          username: "",
        });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (rowData && open && selectedId) {
      const employeeId =
        rowData.id_prefix && rowData.id_no
          ? `${rowData.id_prefix}-${rowData.id_no}`
          : "";
      reset({
        role_id: rowData.role?.id ?? "",
        employee_id: employeeId,
        first_name: rowData.first_name ?? "",
        middle_name: rowData.middle_name ?? "",
        last_name: rowData.last_name ?? "",
        suffix: rowData.suffix ?? "",
        mobile_number: rowData.mobile_number ?? "",
        gender: rowData.gender ?? "",
        one_charging_id: rowData.one_charging?.id ?? "",
        username: rowData.username ?? "",
      });
    }
  }, [rowData, open, selectedId, reset]);

  const onSubmit = async (form) => {
    try {
      const payload = {
        role_id: form.role_id,
        username: form.username,
        personal_info: {
          id_prefix: form.employee_id.split("-")[0],
          id_no: form.employee_id.split("-")[1],
          first_name: form.first_name,
          middle_name: form.middle_name,
          last_name: form.last_name,
          suffix: form.suffix,
          mobile_number: form.mobile_number,
          gender: form.gender,
          one_charging_id: form.one_charging_id,
        },
      };
      await createUser(payload).unwrap();
      window.__snackbar__?.enqueueSnackbar("User created successfully.", {
        variant: "success",
      });
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
  };

  const onUpdate = async (form) => {
    try {
      const payload = {
        id: selectedId,
        username: form.username,
        role_id: form.role_id,
        personal_info: {
          mobile_number: form.mobile_number,
          one_charging_id: form.one_charging_id,
        },
      };
      await updateUser(payload).unwrap();
      window.__snackbar__?.enqueueSnackbar("User updated successfully.", {
        variant: "success",
      });
      onClose();
    } catch (err) {
      console.error("Update failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
  };

  const handleEditClick = () => setMode("edit");

  const handleBackToView = () => {
    if (rowData) {
      const employeeId =
        rowData.id_prefix && rowData.id_no
          ? `${rowData.id_prefix}-${rowData.id_no}`
          : "";
      reset({
        role_id: rowData.role?.id ?? "",
        employee_id: employeeId,
        first_name: rowData.first_name ?? "",
        middle_name: rowData.middle_name ?? "",
        last_name: rowData.last_name ?? "",
        suffix: rowData.suffix ?? "",
        mobile_number: rowData.mobile_number ?? "",
        gender: rowData.gender ?? "",
        one_charging_id: rowData.one_charging?.id ?? "",
        username: rowData.username ?? "",
      });
    }
    setMode("view");
  };

  const headerIcon = {
    add: <PersonAddIcon className="um__header-icon" />,
    view: <RemoveRedEyeIcon className="um__header-icon" />,
    edit: <EditIcon className="um__header-icon" />,
  };
  const headerTitle = { add: "Add User", view: "View User", edit: "Edit User" };

  const isView = mode === "view";
  const isEdit = mode === "edit";

  const viewEmployeeId =
    rowData?.id_prefix && rowData?.id_no
      ? `${rowData.id_prefix}-${rowData.id_no}`
      : "—";

  const renderFooter = () => {
    if (userLoading) return null;

    if (isView) {
      return (
        <div className="um__footer">
          <button
            type="button"
            className="um__edit-footer-btn"
            onClick={handleEditClick}>
            <EditIcon sx={{ fontSize: "0.9rem" }} />
            Edit
          </button>
        </div>
      );
    }

    return (
      <div className="um__footer">
        {isEdit && (
          <button
            type="button"
            className="um__back-btn"
            onClick={handleBackToView}>
            Back
          </button>
        )}
        <button
          type="button"
          className="um__submit-btn"
          onClick={handleSubmit(isEdit ? onUpdate : onSubmit)}
          disabled={isEdit ? isUpdating : isCreating}>
          {isEdit
            ? isUpdating
              ? "Saving..."
              : "Save Changes"
            : isCreating
              ? "Saving..."
              : "Add User"}
        </button>
      </div>
    );
  };

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
      PaperProps={{ className: "um__paper" }}>
      <div className="um__header">
        <div className="um__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <div className="um__header-actions">
          <IconButton className="um__close" onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent className="um__content">
        {userLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="um__group">
              <p className="um__group-label">Personal Information</p>
              <div className="um__grid">
                <ViewField
                  label="First Name"
                  value={rowData?.first_name}
                  half
                />
                <ViewField
                  label="Middle Name"
                  value={rowData?.middle_name}
                  half
                />
                <ViewField label="Last Name" value={rowData?.last_name} half />
                <ViewField label="Suffix" value={rowData?.suffix} half />
                <ViewField
                  label="Mobile Number"
                  value={rowData?.mobile_number}
                  half
                />
                <ViewField
                  label="Gender"
                  value={
                    rowData?.gender
                      ? rowData.gender.charAt(0).toUpperCase() +
                        rowData.gender.slice(1)
                      : null
                  }
                  half
                />
                <ViewField
                  label="One Charging"
                  value={rowData?.one_charging?.name ?? null}
                  half
                />
              </div>
            </div>

            <div className="um__group">
              <p className="um__group-label">Employment Details</p>
              <div className="um__grid">
                <ViewField label="Employee ID" value={viewEmployeeId} half />
              </div>
            </div>

            <div className="um__group">
              <p className="um__group-label">Account Credentials</p>
              <div className="um__grid">
                <ViewField label="Username" value={rowData?.username} half />
              </div>
            </div>

            <div className="um__group">
              <p className="um__group-label">Role</p>
              <div className="um__field">
                <div className="um__input-wrap um__input-wrap--disabled">
                  <label className="um__label">Role</label>
                  <input
                    type="text"
                    value={rowData?.role?.name ?? "—"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {(isEdit ? EDIT_FIELD_GROUPS : FIELD_GROUPS).map((group) => (
              <div key={group.label} className="um__group">
                <p className="um__group-label">{group.label}</p>
                <div className="um__grid">
                  {group.fields.map((f) => (
                    <div
                      key={f.name}
                      className={f.half ? "um__col-half" : "um__col-full"}>
                      <FormField
                        name={f.name}
                        label={f.label}
                        required={f.required}
                        type={f.type || "text"}
                        register={register}
                        errors={errors}
                        showPass={showPass}
                        onTogglePass={() => setShowPass((p) => !p)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="um__group">
              <p className="um__group-label">Gender</p>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <GenderSelect
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.gender}
                    disabled={isEdit}
                  />
                )}
              />
              {!isEdit && errors.gender && (
                <p className="um__error" style={{ marginTop: 6 }}>
                  <ReportProblemIcon />
                  {errors.gender?.message}
                </p>
              )}
            </div>

            <div className="um__group">
              <p className="um__group-label">One Charging</p>
              <Controller
                name="one_charging_id"
                control={control}
                render={({ field }) => (
                  <OneChargingAutocomplete
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.one_charging_id}
                    displayValue={rowData?.one_charging?.name ?? null}
                  />
                )}
              />
              {errors.one_charging_id && (
                <p className="um__error" style={{ marginTop: 6 }}>
                  <ReportProblemIcon />
                  {errors.one_charging_id?.message}
                </p>
              )}
            </div>

            <div className="um__group">
              <p className="um__group-label">Role</p>
              <Controller
                name="role_id"
                control={control}
                render={({ field }) => (
                  <RoleAutocomplete
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.role_id}
                    displayValue={rowData?.role?.name}
                  />
                )}
              />
              {errors.role_id && (
                <p className="um__error" style={{ marginTop: 6 }}>
                  <ReportProblemIcon />
                  {errors.role_id?.message}
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>

      {renderFooter()}
    </Dialog>
  );
};

export default UsersModal;
