import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import "./AttachmentViewerDialog.scss";

const BASE_URL = (import.meta.env.VITE_AURORA_ENDPOINT || "").replace(
  /\/?$/,
  "",
);

const AttachmentViewerDialog = ({ open, onClose, attachment }) => {
  const filename = attachment?.url ? attachment.url.split("/").pop() : null;

  const resolvedUrl = filename
    ? `${BASE_URL}/attachments/view?filename=${encodeURIComponent(filename)}`
    : null;

  const isImage = filename?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
  const isPdf = filename?.match(/\.pdf$/i);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "avd__paper" }}>
      <div className="avd__header">
        <div className="avd__header-left">
          <AttachFileIcon className="avd__header-icon" />
          <span className="avd__header-title">
            {attachment?.name ?? filename ?? "Attachment"}
          </span>
        </div>
        <IconButton size="small" className="avd__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="avd__content">
        {!resolvedUrl ? (
          <div className="avd__empty">
            <p>No attachment to display.</p>
          </div>
        ) : isImage ? (
          <div className="avd__image-wrapper">
            <img
              src={resolvedUrl}
              alt={attachment?.name ?? filename}
              className="avd__image"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <p style={{ display: "none" }} className="avd__empty">
              Failed to display image.
            </p>
          </div>
        ) : isPdf ? (
          <iframe
            src={resolvedUrl}
            className="avd__iframe"
            title={attachment?.name ?? filename}
          />
        ) : (
          <div className="avd__unsupported">
            <p>Preview not available for this file type.</p>
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="avd__download-link">
              Download {attachment?.name ?? filename}
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentViewerDialog;
