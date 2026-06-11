import { useState, useRef, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import SignatureDialog from "./SignatureDialog";
import AttachmentViewerDialog from "./AttachmentViewerDialog";
import ViewSignatureDialog from "./ViewSignatureDialog";
import "./QAReportDialog.scss";
import {
  useAddSignatureMutation,
  useViewSignatureQuery,
} from "../../features/api/qa-checklist/qaChecklistApi";

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

const isRefusedPath = (path) =>
  path === "true" ||
  path === true ||
  (typeof path === "string" && path.toLowerCase() === "refused to sign");

const AttachmentThumbnail = ({ att, onClick }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const filename = att?.url ? att.url.split("/").pop() : null;
  const apiUrl = filename
    ? `${BASE_URL}/attachments/view?filename=${encodeURIComponent(filename)}`
    : null;

  const isImage = filename?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i);

  useEffect(() => {
    if (!apiUrl) {
      setIsLoading(false);
      return;
    }

    let objectUrl = null;

    const fetchThumb = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const token = getToken();
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const response = await fetch(apiUrl, { headers });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThumb();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [apiUrl]);

  return (
    <div
      className="qar__thumb"
      onClick={() => onClick(att)}
      title={att?.name ?? filename ?? "Attachment"}>
      {isLoading ? (
        <div className="qar__thumb-loading">
          <CircularProgress size={18} sx={{ color: "#e87722" }} />
        </div>
      ) : isError || !blobUrl ? (
        <div className="qar__thumb-error">
          <span className="qar__thumb-filename">
            {att?.name ?? filename ?? "File"}
          </span>
        </div>
      ) : isImage ? (
        <img
          src={blobUrl}
          alt={att?.name ?? filename}
          className="qar__thumb-img"
        />
      ) : (
        <div className="qar__thumb-file">
          <span className="qar__thumb-filename">
            {att?.name ?? filename ?? "File"}
          </span>
        </div>
      )}
    </div>
  );
};

const QAReportDialog = ({
  open,
  onClose,
  entry,
  storeName,
  onSignatureComplete,
}) => {
  const [downloadType, setDownloadType] = useState("PDF");
  const [isDownloading, setIsDownloading] = useState(false);
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerAttachment, setViewerAttachment] = useState(null);
  const [viewSignatureOpen, setViewSignatureOpen] = useState(false);
  const [isRefused, setIsRefused] = useState(false);
  const [isRefusing, setIsRefusing] = useState(false);
  const [isDialogLoading, setIsDialogLoading] = useState(false);
  const [forceShowSig, setForceShowSig] = useState(false);

  const [addSignature] = useAddSignatureMutation();

  const printableRef = useRef(null);
  const currentEntryId = entry?.id;

  const existingPath = entry?.attachment_path ?? null;
  const hasAttachmentPath = !!existingPath && !isRefusedPath(existingPath);

  const { data: signatureData, refetch: refetchSignature } =
    useViewSignatureQuery(currentEntryId, {
      skip: !currentEntryId || !open || (!hasAttachmentPath && !forceShowSig),
    });

  const signatureUrl = signatureData?.signature_url ?? null;

  useEffect(() => {
    if (open && currentEntryId) {
      setIsRefused(isRefusedPath(existingPath));
      setIsDownloading(false);
      setForceShowSig(false);
      setIsDialogLoading(true);
      const timer = setTimeout(() => setIsDialogLoading(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open, currentEntryId]);

  const auditTrail = entry?.audit_trail?.[0];
  const reportData = auditTrail?.new_data;
  const meta = reportData?.inspection_metadata;
  const snapshot = reportData?.checklist_snapshot;
  const gradeSummary = reportData?.grade_summary;

  const startTime = entry?.start_time;
  const endTime = entry?.end_time;

  const isSigned = !isRefused && !!signatureUrl;
  const canExport = isSigned || isRefused;
  const hasData = !!reportData;
  const isLoadingData = !currentEntryId || !hasData;
  const isSignatureLocked = isSigned || isRefused;

  const formatTime = (timeStr) => {
    if (!timeStr) return "—";
    const [h, m] = timeStr.split(":");
    const date = new Date();
    date.setHours(+h, +m);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTimeDiff = () => {
    if (!startTime || !endTime) return "—";
    const [sh, sm, ss] = startTime.split(":").map(Number);
    const [eh, em, es] = endTime.split(":").map(Number);
    const startSec = sh * 3600 + sm * 60 + (ss || 0);
    const endSec = eh * 3600 + em * 60 + (es || 0);
    const diff = endSec - startSec;
    if (diff <= 0) return "—";
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return mins > 0 ? `${mins} minute${mins > 1 ? "s" : ""}` : `${secs}s`;
  };

  const inspectionDate = meta?.inspection_date
    ? formatDate(meta.inspection_date)
    : "—";

  const remarks = (snapshot?.sections ?? []).flatMap((sec) =>
    (sec.questions ?? [])
      .filter((q) => q.response?.remarks)
      .map((q) => ({
        section: sec.title,
        question: q.question_text,
        remarks: q.response.remarks,
        deduction: q.grade ? q.grade.earned_points - q.grade.max_points : null,
      })),
  );

  const attachments = (snapshot?.sections ?? []).flatMap((sec) =>
    (sec.questions ?? [])
      .filter((q) => q.response?.attachment?.file_url)
      .map((q) => ({
        name:
          q.response.attachment.original_name ??
          q.response.attachment.file_name,
        url: q.response.attachment.file_url,
      })),
  );

  const staffNames =
    (meta?.store_duties ?? []).map((d) => d.full_name).join(", ") || "—";
  const qaName = meta?.inspector?.full_name ?? "—";

  const totalGrade =
    gradeSummary?.percentage != null
      ? `${parseFloat(gradeSummary.percentage).toFixed(2)}%`
      : entry?.weekly_grade
        ? `${parseFloat(entry.weekly_grade).toFixed(2)}%`
        : "—";

  const totalEarned =
    gradeSummary?.total_score != null ? gradeSummary.total_score : null;
  const totalMax =
    gradeSummary?.max_score != null ? gradeSummary.max_score : null;

  const handleViewAttachment = (att) => {
    setViewerAttachment(att);
    setViewerOpen(true);
  };

  const handleSignatureSaved = () => {
    setForceShowSig(true);
    refetchSignature();
    onSignatureComplete?.();
  };

  const handleRefuseToSign = async () => {
    if (!currentEntryId || isRefused || isSigned) return;
    setIsRefusing(true);
    try {
      const formData = new FormData();
      formData.append("_method", "PATCH");
      formData.append("signature", "true");
      await addSignature({ entryId: currentEntryId, formData }).unwrap();
      setIsRefused(true);
      onSignatureComplete?.();
    } catch (err) {
      console.error("Refuse to sign failed:", err);
    } finally {
      setIsRefusing(false);
    }
  };

  const buildPrintHTML = (sigDataUrl = null) => {
    const sectionsHTML = (snapshot?.sections ?? [])
      .map((sec) => {
        const ep = sec.grade?.earned_points ?? 0;
        const mp = sec.grade?.max_points ?? 0;
        const pct =
          sec.grade?.percentage != null
            ? parseFloat(sec.grade.percentage).toFixed(2)
            : "0.00";
        return `<tr><td style="font-weight:500;">${sec.title}</td><td>${ep} / ${mp}</td><td>${pct}%</td></tr>`;
      })
      .join("");
    const totalEarnedVal = gradeSummary?.total_score ?? 0;
    const totalMaxVal = gradeSummary?.max_score ?? 0;
    const remarksHTML =
      remarks.length === 0
        ? `<p class="empty">No remarks.</p>`
        : (snapshot?.sections ?? [])
            .map((sec) => {
              const secRemarks = remarks.filter((r) => r.section === sec.title);
              if (secRemarks.length === 0) return "";
              const items = secRemarks
                .map((r) => {
                  const ded =
                    r.deduction != null && r.deduction < 0
                      ? ` <strong style="color:#e05252;">(${r.deduction.toFixed(2)})</strong>`
                      : "";
                  return `<p class="remark-item">${r.remarks}${ded}</p>`;
                })
                .join("");
              return `<p class="section-label">• ${sec.title}</p>${items}`;
            })
            .join("");
    const sigImgHTML = sigDataUrl
      ? `<img src="${sigDataUrl}" alt="signature" style="max-height:48px;max-width:160px;display:block;margin:0 auto 4px;" />`
      : isRefused
        ? `<p style="font-size:11px;color:#e05252;font-style:italic;margin-bottom:4px;">Refused to sign</p>`
        : `<div style="height:48px;"></div>`;
    return `<!DOCTYPE html><html><head><title>QA Report</title><style>*{margin:0;padding:0;box-sizing:border-box;}html,body{font-family:'Poppins',Arial,sans-serif;font-size:12px;color:#1a1a2e;background:white;width:210mm;}body{padding:16mm 18mm;}h2{font-size:13px;font-weight:600;margin:16px 0 6px;border-bottom:2px solid #e87722;padding-bottom:3px;color:#1a1a2e;}.details-grid{display:grid;grid-template-columns:140px 1fr;gap:5px 12px;margin-bottom:10px;}.label{font-weight:600;color:#444;}table{width:100%;border-collapse:collapse;margin-top:6px;}th{background:#fef3e8;text-align:left;padding:7px 10px;font-size:11px;border:1px solid #ddd;color:#1a1a2e;}td{padding:5px 10px;border:1px solid #ddd;font-size:11px;vertical-align:top;}.total-row td{font-weight:700;background:#fef3e8;}.section-label{font-weight:600;margin-top:8px;margin-bottom:3px;color:#e87722;}.remark-item{margin-left:16px;margin-bottom:5px;color:#333;}.notes-text{margin-top:4px;color:#333;white-space:pre-wrap;line-height:1.5;}.empty{color:#999;font-style:italic;}.signature-area{margin-top:32px;display:flex;gap:60px;}.sig-box{border-top:1px solid #1a1a2e;width:200px;text-align:center;padding-top:6px;font-size:11px;}@media print{html,body{width:210mm;}body{padding:12mm 15mm;}@page{margin:0;size:A4 portrait;}}</style></head><body><h2>Report Summary</h2><div class="details-grid"><span class="label">Date:</span><span>${inspectionDate}</span><span class="label">Time In:</span><span>${formatTime(startTime)}</span><span class="label">Time Out:</span><span>${formatTime(endTime)}</span><span class="label">Time Summary:</span><span>${getTimeDiff()}</span><span class="label">Area:</span><span>${meta?.area?.name ?? "—"}</span><span class="label">Staff on Duty:</span><span>${staffNames}</span><span class="label">QA Name:</span><span>${qaName}</span></div><h2>Score Summary</h2><table><thead><tr><th>Section</th><th>Score</th><th>Percentage</th></tr></thead><tbody>${sectionsHTML}<tr class="total-row"><td>Total</td><td>${totalEarnedVal} / ${totalMaxVal}</td><td>${totalGrade}</td></tr></tbody></table><h2>Remarks</h2>${remarksHTML}<h2>Good Points</h2><p class="notes-text">${meta?.good_points || '<span class="empty">No good points noted.</span>'}</p><h2>Additional Notes</h2><p class="notes-text">${meta?.notes || '<span class="empty">No notes.</span>'}</p><div class="signature-area"><div class="sig-box">${sigImgHTML}${meta?.store_duties?.[0]?.full_name ?? storeName ?? "—"}<br/>Store Representative</div><div class="sig-box"><div style="height:52px;"></div>${qaName}<br/>QA Inspector</div></div></body></html>`;
  };

  const handleDownload = async () => {
    if (!hasData || !canExport) return;
    setIsDownloading(true);
    try {
      if (downloadType === "PDF") {
        const [{ default: jsPDF }, { default: html2canvas }] =
          await Promise.all([import("jspdf"), import("html2canvas")]);
        const iframe = document.createElement("iframe");
        iframe.style.cssText =
          "position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px;opacity:0;pointer-events:none;";
        document.body.appendChild(iframe);
        iframe.contentDocument.open();
        iframe.contentDocument.write(buildPrintHTML(signatureUrl));
        iframe.contentDocument.close();
        await new Promise((r) => setTimeout(r, 900));
        const canvas = await html2canvas(iframe.contentDocument.body, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: 794,
        });
        document.body.removeChild(iframe);
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        const iw = pw;
        const ih = (canvas.height * iw) / canvas.width;
        let hl = ih;
        let pos = 0;
        pdf.addImage(imgData, "PNG", 0, pos, iw, ih);
        hl -= ph;
        while (hl > 0) {
          pos = hl - ih;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, pos, iw, ih);
          hl -= ph;
        }
        pdf.save(
          `QA_Report_${storeName ?? "report"}_Week${entry?.week ?? ""}.pdf`.replace(
            /\s+/g,
            "_",
          ),
        );
      } else {
        const { utils, writeFile } = await import("xlsx");
        const details = [
          ["QA Report Summary"],
          [],
          ["Store", storeName ?? "—"],
          ["Week", entry?.week ?? "—"],
          ["Inspection Date", inspectionDate],
          ["Time In", formatTime(startTime)],
          ["Time Out", formatTime(endTime)],
          ["Time Summary", getTimeDiff()],
          ["Area", meta?.area?.name ?? "—"],
          ["Staff on Duty", staffNames],
          ["QA Name", qaName],
          [],
          ["Score Summary"],
          ["Section", "Score", "Percentage"],
          ...(snapshot?.sections ?? []).map((s) => [
            s.title,
            `${s.grade?.earned_points ?? 0} / ${s.grade?.max_points ?? 0}`,
            `${s.grade?.percentage != null ? parseFloat(s.grade.percentage).toFixed(2) : "0.00"}%`,
          ]),
          [
            "Total",
            `${gradeSummary?.total_score ?? 0} / ${gradeSummary?.max_score ?? 0}`,
            totalGrade,
          ],
          [],
          ["Remarks"],
          ["Section", "Question", "Remarks", "Deduction"],
          ...remarks.map((r) => [
            r.section,
            r.question,
            r.remarks,
            r.deduction != null ? r.deduction.toFixed(2) : "",
          ]),
          [],
          ["Good Points", meta?.good_points ?? "—"],
          ["Additional Notes", meta?.notes ?? "—"],
        ];
        const ws = utils.aoa_to_sheet(details);
        ws["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 12 }];
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "QA Report");
        writeFile(
          wb,
          `QA_Report_${storeName ?? "report"}_Week${entry?.week ?? ""}.xlsx`.replace(
            /\s+/g,
            "_",
          ),
        );
      }
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!hasData || !canExport) return;
    const pw = window.open("", "_blank", "width=900,height=900");
    pw.document.write(buildPrintHTML(signatureUrl));
    pw.document.close();
    pw.focus();
    pw.onload = () => {
      pw.print();
      pw.close();
    };
  };

  const isActuallyDisabled = !hasData || !canExport || isDialogLoading;

  const renderSkeleton = () => (
    <div className="qar__skeleton">
      <div className="qar__skeleton-sidebar">
        <Skeleton variant="text" width="55%" height={14} sx={{ mb: 1.5 }} />
        {[80, 70, 70, 75, 65, 80, 70].map((w, i) => (
          <Skeleton
            key={i}
            variant="text"
            width={`${w}%`}
            height={13}
            sx={{ mb: 0.6 }}
          />
        ))}
        <Skeleton
          variant="text"
          width="50%"
          height={14}
          sx={{ mt: 2.5, mb: 1 }}
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={90}
          sx={{ borderRadius: "10px", mb: 0.8 }}
        />
        <Skeleton
          variant="text"
          width="65%"
          height={13}
          sx={{ mx: "auto", display: "block" }}
        />
      </div>
      <div className="qar__skeleton-main">
        <Skeleton
          variant="rectangular"
          width="100%"
          height={75}
          sx={{ borderRadius: "12px" }}
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={55}
          sx={{ borderRadius: "12px" }}
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={55}
          sx={{ borderRadius: "12px" }}
        />
        <div className="qar__skeleton-row">
          <Skeleton
            variant="rectangular"
            width="48%"
            height={110}
            sx={{ borderRadius: "12px" }}
          />
          <Skeleton
            variant="rectangular"
            width="48%"
            height={110}
            sx={{ borderRadius: "12px" }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "qar__paper" }}>
        <div className="qar__header">
          <div className="qar__header-left">
            <AssessmentIcon className="qar__header-icon" />
            <span className="qar__header-title">Report Summary</span>
          </div>
          <IconButton size="small" className="qar__close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <DialogContent className="qar__content">
          {isDialogLoading || isLoadingData ? (
            renderSkeleton()
          ) : !hasData ? (
            <div className="qar__empty-state">
              <AssessmentIcon className="qar__empty-icon" />
              <p>No report data available for this record.</p>
              <p className="qar__empty-sub">
                The weekly record may not have been completed yet.
              </p>
            </div>
          ) : (
            <>
              <div className="qar__printable" ref={printableRef}>
                <div className="qar__body">
                  <div className="qar__sidebar">
                    <div className="qar__sidebar-card">
                      <p className="qar__sidebar-heading">Details</p>
                      <div className="qar__sidebar-details">
                        <p>
                          <span className="qar__detail-label">Date:</span>{" "}
                          <span className="qar__detail-value">
                            {inspectionDate}
                          </span>
                        </p>
                        <p>
                          <span className="qar__detail-label">Time in:</span>{" "}
                          <span className="qar__detail-value">
                            {formatTime(startTime)}
                          </span>
                        </p>
                        <p>
                          <span className="qar__detail-label">Time out:</span>{" "}
                          <span className="qar__detail-value">
                            {formatTime(endTime)}
                          </span>
                        </p>
                        <p>
                          <span className="qar__detail-label">
                            Time Summary:
                          </span>{" "}
                          <span className="qar__detail-value">
                            {getTimeDiff()}
                          </span>
                        </p>
                        <p>
                          <span className="qar__detail-label">Area:</span>{" "}
                          <span className="qar__detail-value">
                            {meta?.area?.name ?? "—"}
                          </span>
                        </p>
                        <p>
                          <span className="qar__detail-label">
                            Staff on duty:
                          </span>{" "}
                          <span className="qar__detail-value">
                            {staffNames}
                          </span>
                        </p>
                        <p>
                          <span className="qar__detail-label">QA Name:</span>{" "}
                          <span className="qar__detail-value">{qaName}</span>
                        </p>
                      </div>
                      <p
                        className="qar__sidebar-heading qar__sidebar-heading--signed"
                        style={{ marginTop: 14 }}>
                        Signed by
                      </p>
                      <div className="qar__signed-area">
                        {isRefused ? (
                          <p className="qar__refused-label">Refused to sign</p>
                        ) : signatureUrl ? (
                          <img
                            src={signatureUrl}
                            alt="signature"
                            className="qar__signature-img"
                          />
                        ) : (
                          <div className="qar__signature-placeholder" />
                        )}
                        <div className="qar__signer-row">
                          <p className="qar__signer-name">
                            {meta?.store_duties?.[0]?.full_name ??
                              storeName ??
                              "—"}
                          </p>
                          {isSigned && (
                            <button
                              className="qar__sig-eye-btn"
                              onClick={() => setViewSignatureOpen(true)}
                              title="View Signature">
                              <VisibilityIcon sx={{ fontSize: 16 }} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="qar__main">
                    <div className="qar__section-box">
                      <span className="qar__box-label">Remarks</span>
                      {remarks.length === 0 ? (
                        <p className="qar__empty">No remarks.</p>
                      ) : (
                        <div className="qar__findings">
                          {(snapshot?.sections ?? []).map((sec, sIdx) => {
                            const secRemarks = remarks.filter(
                              (f) => f.section === sec.title,
                            );
                            if (secRemarks.length === 0) return null;
                            return (
                              <div key={sIdx} className="qar__finding-group">
                                <p className="qar__finding-section">
                                  • {sec.title}
                                </p>
                                {secRemarks.map((f, fIdx) => (
                                  <p key={fIdx} className="qar__finding-item">
                                    {f.remarks}
                                    {f.deduction != null && f.deduction < 0 && (
                                      <span className="qar__deduction">
                                        {" "}
                                        ({f.deduction.toFixed(2)})
                                      </span>
                                    )}
                                  </p>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="qar__section-box">
                      <span className="qar__box-label">Good points</span>
                      <p className="qar__box-text">
                        {meta?.good_points || (
                          <span className="qar__empty">
                            No good points noted.
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="qar__section-box">
                      <span className="qar__box-label">Additional notes</span>
                      <p className="qar__box-text">
                        {meta?.notes || (
                          <span className="qar__empty">No notes.</span>
                        )}
                      </p>
                    </div>

                    <div className="qar__row-boxes">
                      <div className="qar__section-box">
                        <span className="qar__box-label">Score Summary</span>
                        <div className="qar__scores">
                          {(snapshot?.sections ?? []).map((sec, sIdx) => {
                            const ep = sec.grade?.earned_points ?? 0;
                            const mp = sec.grade?.max_points ?? 0;
                            const pct =
                              sec.grade?.percentage != null
                                ? parseFloat(sec.grade.percentage).toFixed(2)
                                : "0.00";
                            return (
                              <div key={sIdx} className="qar__score-row">
                                <span className="qar__score-label">
                                  {sec.title}
                                </span>
                                <span className="qar__score-value">
                                  {ep} / {mp} ({pct}%)
                                </span>
                              </div>
                            );
                          })}
                          <div className="qar__score-divider" />
                          <div className="qar__score-total">
                            <span>
                              Total
                              {totalEarned != null && totalMax != null
                                ? ` — ${totalEarned} / ${totalMax}`
                                : ""}
                            </span>
                            <span>{totalGrade}</span>
                          </div>
                        </div>
                      </div>

                      <div className="qar__section-box">
                        <span className="qar__box-label">Attachment</span>
                        {attachments.length === 0 ? (
                          <div className="qar__no-attachment">
                            <span>No Photo Attachments</span>
                          </div>
                        ) : (
                          <div className="qar__thumb-grid">
                            {attachments.map((att, i) => (
                              <AttachmentThumbnail
                                key={i}
                                att={att}
                                onClick={handleViewAttachment}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="qar__signature-actions">
                {!isSignatureLocked && (
                  <button
                    className="qar__sig-btn qar__sig-btn--add"
                    onClick={() => setSignatureDialogOpen(true)}>
                    Add Signature
                  </button>
                )}
                {!isSignatureLocked && (
                  <button
                    className="qar__sig-btn qar__sig-btn--refuse"
                    onClick={handleRefuseToSign}
                    disabled={isRefusing}>
                    {isRefusing ? (
                      <CircularProgress size={12} sx={{ color: "#e87722" }} />
                    ) : (
                      "Refuse to sign"
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </DialogContent>

        <DialogActions className="qar__footer">
          <div className="qar__footer-left">
            <div className="qar__download-type">
              <label className="qar__download-label">Download Type</label>
              <select
                className="qar__download-select"
                value={downloadType}
                onChange={(e) => setDownloadType(e.target.value)}>
                <option value="PDF">PDF</option>
                <option value="Excel">Excel</option>
              </select>
            </div>
            <IconButton
              className="qar__icon-btn"
              size="small"
              onClick={handleDownload}
              disabled={isActuallyDisabled || isDownloading}
              sx={{
                opacity: isActuallyDisabled ? 0.35 : 1,
                cursor: isActuallyDisabled ? "not-allowed" : "pointer",
                pointerEvents: "auto",
              }}>
              {isDownloading ? (
                <CircularProgress size={16} />
              ) : (
                <DownloadIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
            <button
              className="qar__print-btn"
              onClick={handlePrint}
              disabled={isActuallyDisabled}
              style={{
                opacity: isActuallyDisabled ? 0.35 : 1,
                cursor: isActuallyDisabled ? "not-allowed" : "pointer",
              }}>
              <PrintIcon sx={{ fontSize: 16 }} />
              <span>PRINT</span>
            </button>
          </div>
          <Button variant="text" onClick={onClose} className="qar__btn-close">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <SignatureDialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        entryId={currentEntryId}
        signerName={meta?.store_duties?.[0]?.full_name ?? storeName ?? ""}
        onSignatureSaved={handleSignatureSaved}
      />
      <AttachmentViewerDialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        attachment={viewerAttachment}
      />
      <ViewSignatureDialog
        open={viewSignatureOpen}
        onClose={() => setViewSignatureOpen(false)}
        signatureUrl={signatureUrl}
        signerName={meta?.store_duties?.[0]?.full_name ?? storeName ?? "—"}
      />
    </>
  );
};

export default QAReportDialog;
