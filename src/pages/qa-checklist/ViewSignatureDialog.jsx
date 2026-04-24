import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import DrawIcon from "@mui/icons-material/Draw";
import "./ViewSignatureDialog.scss";

const ViewSignatureDialog = ({ open, onClose, signatureUrl, signerName }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "vsig__paper" }}>
      <div className="vsig__header">
        <div className="vsig__header-left">
          <DrawIcon className="vsig__header-icon" />
          <span className="vsig__header-title">View Signature</span>
        </div>
        <IconButton size="small" className="vsig__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
      <DialogContent className="vsig__content">
        <div className="vsig__sig-wrapper">
          {signatureUrl ? (
            <img src={signatureUrl} alt="signature" className="vsig__sig-img" />
          ) : (
            <p className="vsig__empty">No signature available.</p>
          )}
        </div>
        <div className="vsig__sig-line">
          <span className="vsig__signer-name">{signerName}</span>
          <span className="vsig__signer-role">Store Representative</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewSignatureDialog;
