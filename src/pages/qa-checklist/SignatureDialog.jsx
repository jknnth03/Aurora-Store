import { useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import DrawIcon from "@mui/icons-material/Draw";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckIcon from "@mui/icons-material/Check";
import SignatureCanvas from "react-signature-canvas";
import { useAddSignatureMutation } from "../../features/api/qa-checklist/qaChecklistApi";
import "./SignatureDialog.scss";

const SignatureDialog = ({
  open,
  onClose,
  entryId,
  signerName,
  onSignatureSaved, // now called with (newAttachmentPath) from API response
}) => {
  const sigCanvas = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [addSignature, { isLoading }] = useAddSignatureMutation();

  const clearCanvas = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleSubmit = async () => {
    if (sigCanvas.current?.isEmpty() || !entryId) return;
    const dataURL = sigCanvas.current?.toDataURL("image/png");
    const blob = await (await fetch(dataURL)).blob();
    const formData = new FormData();
    formData.append("signature", blob, "signature.png");
    formData.append("entry_id", entryId);

    try {
      const result = await addSignature({ entryId, formData }).unwrap();
      // Pass the new attachment_path back so parent can update without reload
      if (onSignatureSaved)
        onSignatureSaved(result?.data?.attachment_path ?? null);
      onClose();
    } catch (err) {
      console.error("Failed to submit signature:", err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "sig__paper" }}>
      <div className="sig__header">
        <div className="sig__header-left">
          <DrawIcon className="sig__header-icon" />
          <span className="sig__header-title">Add Signature</span>
        </div>
        <IconButton size="small" className="sig__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="sig__content">
        <p className="sig__instruction">
          Sign inside the box below using your mouse or finger.
        </p>
        <div className="sig__canvas-wrapper">
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              width: 560,
              height: 220,
              className: "sig__canvas",
              style: { touchAction: "none", width: "100%", height: "auto" },
            }}
            onEnd={() => setIsEmpty(sigCanvas.current?.isEmpty() ?? true)}
          />
          <span className="sig__canvas-label">{signerName || "Signature"}</span>
          <button
            className="sig__clear-btn"
            onClick={clearCanvas}
            type="button">
            <DeleteOutlineIcon sx={{ fontSize: 16 }} />
            <span>Clear</span>
          </button>
        </div>
        <p className="sig__signer-name">{signerName}</p>
      </DialogContent>

      <DialogActions className="sig__footer">
        <button className="sig__btn sig__btn--cancel" onClick={onClose}>
          Cancel
        </button>
        <button
          className="sig__btn sig__btn--submit"
          onClick={handleSubmit}
          disabled={isEmpty || isLoading}
          type="button">
          {isLoading ? (
            <CircularProgress size={14} sx={{ color: "#fff" }} />
          ) : (
            <>
              <CheckIcon sx={{ fontSize: 15 }} />
              <span>Submit Signature</span>
            </>
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default SignatureDialog;
