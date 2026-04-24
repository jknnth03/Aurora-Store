import { useEffect, useRef } from "react";
import CloseIcon from "@mui/icons-material/Close";
import SecurityIcon from "@mui/icons-material/Security";
import "./PermissionsDialog.scss";

const PermissionsDialog = ({ open, onClose, role }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !role) return null;

  const permissions = role.access_permission ?? [];

  return (
    <div
      className="pd__overlay"
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}>
      <div className="pd__paper">
        <div className="rm__header">
          <span className="rm__header-title">
            <SecurityIcon className="rm__header-icon" />
            {role.name}
          </span>
          <button className="pd__close-btn" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="rm__content">
          <p className="rm__group-label">
            {permissions.length} permission{permissions.length !== 1 ? "s" : ""}{" "}
            assigned
          </p>

          {permissions.length === 0 ? (
            <p className="pd__empty">No permissions assigned to this role.</p>
          ) : (
            <div className="pd__grid">
              {permissions.map((perm) => (
                <span key={perm} className="pd__chip">
                  {perm}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rm__footer">
          <button className="rm__cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsDialog;
