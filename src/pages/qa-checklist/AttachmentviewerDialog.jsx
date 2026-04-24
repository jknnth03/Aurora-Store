import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import "./AttachmentViewerDialog.scss";

const AttachmentViewerDialog = ({ open, onClose, attachment }) => {
  const isImage = attachment?.url?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i);
  const isPdf = attachment?.url?.match(/\.pdf(\?.*)?$/i);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "avd__paper" }}
    >
      <div className="avd__header">
        <div className="avd__header-left">
          <AttachFileIcon className="avd__header-icon" />
          <span className="avd__header-title">{attachment?.name ?? "Attachment"}</span>
        </div>
        <IconButton size="small" className="avd__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="avd__content">
        {!attachment?.url ? (
          <div className="avd__empty">
            <p>No attachment to display.</p>
          </div>
        ) : isImage ? (
          <div className="avd__image-wrapper">
            <img
              src={attachment.url}
              alt={attachment.name}
              className="avd__image"
            />
          </div>
        ) : isPdf ? (
          <iframe
            src={attachment.url}
            className="avd__iframe"
            title={attachment.name}
          />
        ) : (
          <div className="avd__unsupported">
            <p>Preview not available for this file type.</p>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="avd__download-link"
            >
              Download {attachment.name}
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentViewerDialog;