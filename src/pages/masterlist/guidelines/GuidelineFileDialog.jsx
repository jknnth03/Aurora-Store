import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionIcon from "@mui/icons-material/Description";
import "./GuidelineFileDialog.scss";

const GuidelineFileDialog = ({ open, onClose, fileUrl, filename }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "gfd__paper" }}>
      <div className="gfd__header">
        <div className="gfd__header-title">
          <DescriptionIcon className="gfd__header-icon" />
          <span>{filename ?? "Guideline File"}</span>
        </div>
        <IconButton className="gfd__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="gfd__content">
        {fileUrl ? (
          <iframe
            src={fileUrl}
            title={filename ?? "Guideline File"}
            className="gfd__frame"
          />
        ) : (
          <p className="gfd__empty">No file available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GuidelineFileDialog;
