import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import "./AttachmentViewerDialog.scss";

const BASE_URL = (import.meta.env.VITE_AURORA_ENDPOINT || "").replace(
  /\/?$/,
  "",
);

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("access_token") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("access_token") ||
  null;

const AttachmentViewerDialog = ({ open, onClose, attachment }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const filename = attachment?.url ? attachment.url.split("/").pop() : null;

  const apiUrl = filename
    ? `${BASE_URL}/attachments/view?filename=${encodeURIComponent(filename)}`
    : null;

  const isImage = filename?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);
  const isPdf = filename?.match(/\.pdf$/i);

  useEffect(() => {
    if (!open || !apiUrl) {
      setBlobUrl(null);
      setIsError(false);
      return;
    }

    let objectUrl = null;

    const fetchFile = async () => {
      setIsLoading(true);
      setIsError(false);
      setBlobUrl(null);

      try {
        const token = getToken();
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(apiUrl, { headers });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err) {
        console.error("Failed to load attachment:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFile();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, apiUrl]);

  // cleanup blob on close
  useEffect(() => {
    if (!open && blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
  }, [open]);

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
        {!filename ? (
          <div className="avd__empty">
            <p>No attachment to display.</p>
          </div>
        ) : isLoading ? (
          <div className="avd__loading">
            <CircularProgress size={32} />
            <p>Loading attachment...</p>
          </div>
        ) : isError ? (
          <div className="avd__empty">
            <p>Failed to load attachment. Please try again.</p>
          </div>
        ) : blobUrl && isImage ? (
          <div className="avd__image-wrapper">
            <img
              src={blobUrl}
              alt={attachment?.name ?? filename}
              className="avd__image"
            />
          </div>
        ) : blobUrl && isPdf ? (
          <iframe
            src={blobUrl}
            className="avd__iframe"
            title={attachment?.name ?? filename}
          />
        ) : blobUrl ? (
          <div className="avd__unsupported">
            <p>Preview not available for this file type.</p>
            <a
              href={blobUrl}
              download={attachment?.name ?? filename}
              className="avd__download-link">
              Download {attachment?.name ?? filename}
            </a>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default AttachmentViewerDialog;
