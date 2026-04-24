import { useState } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PercentIcon from "@mui/icons-material/Percent";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import {
  useGetGradeRulesQuery,
  useCreateGradeRuleMutation,
  useUpdateGradeRuleMutation,
  useGetAllowableDaysQuery,
  useCreateAllowableDaysMutation,
  useUpdateAllowableDaysMutation,
} from "../../../features/api/masterlist/ChecklistsettingsApi";
import "./CheckListSettings.scss";

const SettingCard = ({
  icon,
  title,
  description,
  fieldLabel,
  fieldType = "number",
  value,
  isEditing,
  isSaving,
  hasData,
  onEdit,
  onCancel,
  onSave,
  onChange,
  draftValue,
  suffix,
}) => {
  return (
    <div className={`cls-card ${isEditing ? "cls-card--editing" : ""}`}>
      <div className="cls-card__header">
        <div className="cls-card__title-group">
          <span className="cls-card__icon">{icon}</span>
          <div>
            <h3 className="cls-card__title">{title}</h3>
            <p className="cls-card__description">{description}</p>
          </div>
        </div>
        <div className="cls-card__actions">
          {isEditing ? (
            <>
              <Tooltip title="Cancel">
                <span>
                  <IconButton
                    size="small"
                    className="cls-card__btn cls-card__btn--cancel"
                    onClick={onCancel}
                    disabled={isSaving}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={hasData ? "Update" : "Create"}>
                <span>
                  <IconButton
                    size="small"
                    className="cls-card__btn cls-card__btn--save"
                    onClick={onSave}
                    disabled={isSaving || draftValue === ""}>
                    {isSaving ? (
                      <CircularProgress size={14} />
                    ) : (
                      <CheckIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Edit">
              <IconButton
                size="small"
                className="cls-card__btn cls-card__btn--edit"
                onClick={onEdit}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="cls-card__body">
        {isEditing ? (
          <div className="cls-card__field-wrap">
            <TextField
              label={fieldLabel}
              type={fieldType}
              value={draftValue}
              onChange={(e) => onChange(e.target.value)}
              variant="outlined"
              size="small"
              autoFocus
              fullWidth
              inputProps={{ min: 0 }}
              className="cls-card__textfield"
            />
            <div className="cls-card__save-hint">
              {hasData
                ? "Updating existing value"
                : "No value set yet — this will create a new entry"}
            </div>
          </div>
        ) : (
          <div className="cls-card__value-wrap">
            {value !== null && value !== undefined ? (
              <div className="cls-card__value">
                <span className="cls-card__value-number">{value}</span>
                {suffix && (
                  <span className="cls-card__value-suffix">{suffix}</span>
                )}
              </div>
            ) : (
              <div className="cls-card__empty">
                <span className="cls-card__empty-text">
                  No value configured
                </span>
                <span className="cls-card__empty-hint">
                  Click the edit icon to set a value
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CheckListSettings = () => {
  const { data: gradeData, isFetching: gradeFetching } =
    useGetGradeRulesQuery();
  const [createGradeRule, { isLoading: creatingGrade }] =
    useCreateGradeRuleMutation();
  const [updateGradeRule, { isLoading: updatingGrade }] =
    useUpdateGradeRuleMutation();

  const gradeRecord = gradeData?.data?.[0] ?? null;
  const [gradeEditing, setGradeEditing] = useState(false);
  const [gradeDraft, setGradeDraft] = useState("");

  const handleGradeEdit = () => {
    setGradeDraft(gradeRecord?.cap_percentage ?? "");
    setGradeEditing(true);
  };
  const handleGradeCancel = () => {
    setGradeEditing(false);
    setGradeDraft("");
  };
  const handleGradeSave = async () => {
    try {
      const payload = { cap_percentage: Number(gradeDraft) };
      if (gradeRecord) {
        await updateGradeRule({ id: gradeRecord.id, ...payload }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Grading updated successfully.", {
          variant: "success",
        });
      } else {
        await createGradeRule(payload).unwrap();
        window.__snackbar__?.enqueueSnackbar("Grading created successfully.", {
          variant: "success",
        });
      }
      setGradeEditing(false);
      setGradeDraft("");
    } catch (err) {
      const detail = err?.data?.errors?.[0]?.detail;
      window.__snackbar__?.enqueueSnackbar(
        detail ?? "Failed to save grading settings.",
        { variant: "error" },
      );
    }
  };

  const { data: daysData, isFetching: daysFetching } =
    useGetAllowableDaysQuery();
  const [createAllowableDays, { isLoading: creatingDays }] =
    useCreateAllowableDaysMutation();
  const [updateAllowableDays, { isLoading: updatingDays }] =
    useUpdateAllowableDaysMutation();

  const daysRecord = daysData?.data ?? null;
  const [daysEditing, setDaysEditing] = useState(false);
  const [daysDraft, setDaysDraft] = useState("");

  const handleDaysEdit = () => {
    setDaysDraft(daysRecord?.allowable_days ?? "");
    setDaysEditing(true);
  };
  const handleDaysCancel = () => {
    setDaysEditing(false);
    setDaysDraft("");
  };
  const handleDaysSave = async () => {
    try {
      const payload = { days: Number(daysDraft) };
      if (daysRecord) {
        await updateAllowableDays({ id: daysRecord.id, ...payload }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Allowable days updated successfully.",
          { variant: "success" },
        );
      } else {
        await createAllowableDays(payload).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Allowable days created successfully.",
          { variant: "success" },
        );
      }
      setDaysEditing(false);
      setDaysDraft("");
    } catch (err) {
      const detail = err?.data?.errors?.[0]?.detail;
      window.__snackbar__?.enqueueSnackbar(
        detail ?? "Failed to save allowable days.",
        { variant: "error" },
      );
    }
  };

  const isLoading = gradeFetching || daysFetching;

  return (
    <PageContainer
      title="Checklist Settings"
      titleIcon={<SettingsIcon />}
      isEmpty={false}>
      <div className="cls-root">
        <p className="cls-root__subtitle">
          Configure system settings based on defined processes and policies.
        </p>

        {isLoading ? (
          <div className="cls-root__loader">
            <CircularProgress size={32} />
          </div>
        ) : (
          <div className="cls-root__grid">
            <SettingCard
              icon={<PercentIcon />}
              title="Grading"
              description="Set the cap percentage used for grading calculation."
              fieldLabel="Cap Percentage"
              fieldType="number"
              value={gradeRecord?.cap_percentage ?? null}
              suffix="%"
              isEditing={gradeEditing}
              isSaving={creatingGrade || updatingGrade}
              hasData={!!gradeRecord}
              onEdit={handleGradeEdit}
              onCancel={handleGradeCancel}
              onSave={handleGradeSave}
              onChange={setGradeDraft}
              draftValue={gradeDraft}
            />

            <SettingCard
              icon={<EventAvailableIcon />}
              title="Allowable Days"
              description="Set the number of days allowed before a checklist becomes overdue."
              fieldLabel="Allowable Days"
              fieldType="number"
              value={daysRecord?.allowable_days ?? null}
              suffix="days"
              isEditing={daysEditing}
              isSaving={creatingDays || updatingDays}
              hasData={!!daysRecord}
              onEdit={handleDaysEdit}
              onCancel={handleDaysCancel}
              onSave={handleDaysSave}
              onChange={setDaysDraft}
              draftValue={daysDraft}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default CheckListSettings;
