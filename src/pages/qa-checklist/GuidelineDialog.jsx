import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import "./GuidelineDialog.scss";

const GuidelineDialog = ({ open, onClose, guideline, isLoading = false }) => {
  const hasGuideline = Boolean(guideline);
  const fileUrl = guideline?.file_url ?? null;
  const isPdf = fileUrl?.toLowerCase?.().endsWith(".pdf");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "gd__paper" }}>
      <div className="gd__header">
        <div className="gd__header-title">
          <MenuBookIcon className="gd__header-icon" />
          <span>{guideline?.title || "Checklist Guideline"}</span>
        </div>
        <IconButton size="small" className="gd__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="gd__content">
        {isLoading ? (
          <div className="gd__skeleton-wrap">
            <Skeleton variant="text" width="60%" height={22} />
            <Skeleton variant="rectangular" width="100%" height="100%" />
          </div>
        ) : !hasGuideline ? (
          <div className="gd__placeholder-wrap">
            <p className="gd__placeholder">
              No guideline available for this checklist.
            </p>
          </div>
        ) : (
          <>
            {guideline.description && (
              <p className="gd__description">{guideline.description}</p>
            )}

            {fileUrl ? (
              isPdf ? (
                <div className="gd__preview">
                  <iframe
                    src={fileUrl}
                    title={guideline.title || "Guideline"}
                    className="gd__preview-frame"
                  />
                </div>
              ) : (
                <div className="gd__preview gd__preview--unsupported">
                  <p className="gd__placeholder">
                    Preview not available for this file type.
                  </p>
                </div>
              )
            ) : (
              <div className="gd__placeholder-wrap">
                <p className="gd__placeholder">No file attached.</p>
              </div>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions className="gd__footer">
        <Button variant="contained" onClick={onClose} className="gd__btn-close">
          GOT IT
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GuidelineDialog;
