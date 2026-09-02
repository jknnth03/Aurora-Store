import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import "./ExportDialog.scss";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= currentYear - 5; y -= 1) {
    years.push(y);
  }
  return years;
};

const ExportDialog = ({
  open,
  onClose,
  onExport,
  areaOptions = [],
  isExporting = false,
  title = "Export QA Checklist Report",
}) => {
  const [areaId, setAreaId] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [errors, setErrors] = useState({});

  const yearOptions = getYearOptions();

  const handleClose = () => {
    setAreaId("");
    setMonth("");
    setYear("");
    setErrors({});
    onClose?.();
  };

  const handleAreaChange = (e) => {
    setAreaId(e.target.value);
    setErrors((prev) => ({ ...prev, areaId: undefined }));
  };

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
    setErrors((prev) => ({ ...prev, month: undefined }));
  };

  const handleYearChange = (e) => {
    setYear(e.target.value);
    setErrors((prev) => ({ ...prev, year: undefined }));
  };

  const handleExport = () => {
    const newErrors = {};

    if (!areaId) newErrors.areaId = "Area is required";
    if (!month) newErrors.month = "Month is required";
    if (!year) newErrors.year = "Year is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onExport?.({
      area_id: Number(areaId),
      month: Number(month),
      year: Number(year),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      classes={{ paper: "export-dialog" }}>
      <div className="export-dialog__header">
        <div className="export-dialog__title">
          <FileDownloadOutlinedIcon className="export-dialog__title-icon" />
          <span>{title}</span>
        </div>
        <IconButton
          className="export-dialog__close-btn"
          onClick={handleClose}
          size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="export-dialog__content">
        <div className="export-dialog__field">
          <label className="export-dialog__label">
            Area <span className="export-dialog__required">*</span>
          </label>
          <select
            className={`export-dialog__input ${
              errors.areaId ? "export-dialog__input--error" : ""
            }`}
            value={areaId}
            onChange={handleAreaChange}>
            <option value="">Select Area</option>
            {areaOptions.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
          </select>
          {errors.areaId && (
            <span className="export-dialog__error-text">{errors.areaId}</span>
          )}
        </div>

        <div className="export-dialog__field">
          <label className="export-dialog__label">
            Month <span className="export-dialog__required">*</span>
          </label>
          <select
            className={`export-dialog__input ${
              errors.month ? "export-dialog__input--error" : ""
            }`}
            value={month}
            onChange={handleMonthChange}>
            <option value="">Select Month</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          {errors.month && (
            <span className="export-dialog__error-text">{errors.month}</span>
          )}
        </div>

        <div className="export-dialog__field">
          <label className="export-dialog__label">
            Year <span className="export-dialog__required">*</span>
          </label>
          <select
            className={`export-dialog__input ${
              errors.year ? "export-dialog__input--error" : ""
            }`}
            value={year}
            onChange={handleYearChange}>
            <option value="">Select Year</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {errors.year && (
            <span className="export-dialog__error-text">{errors.year}</span>
          )}
        </div>

        <div className="export-dialog__footer">
          <Button className="export-dialog__cancel-btn" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="export-dialog__export-btn"
            variant="contained"
            disableElevation
            disabled={isExporting}
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleExport}>
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
