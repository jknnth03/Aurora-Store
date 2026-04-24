import { useState, useRef, useEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import StyleIcon from "@mui/icons-material/Style";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import "./ChipColorPickerDialog.scss";

// ─── Chip definitions ─────────────────────────────────────────────────────────
export const CHIP_VARS = [
  {
    id: "chip-active",
    label: "Active",
    defaultName: "Active",
    cssVar: "--chip-active-bg",
    cssVarText: "--chip-active-text",
    defaultLight: "#e8f5e9",
    defaultDark: "#1b3a1e",
    defaultTextLight: "#2e7d32",
    defaultTextDark: "#66bb6a",
  },
  {
    id: "chip-inactive",
    label: "Inactive",
    defaultName: "Inactive",
    cssVar: "--chip-inactive-bg",
    cssVarText: "--chip-inactive-text",
    defaultLight: "#f5f5f5",
    defaultDark: "#2a2a2a",
    defaultTextLight: "#757575",
    defaultTextDark: "#a0a0a0",
  },
  {
    id: "chip-pending",
    label: "Pending",
    defaultName: "Pending",
    cssVar: "--chip-pending-bg",
    cssVarText: "--chip-pending-text",
    defaultLight: "#fff8e1",
    defaultDark: "#3a2e00",
    defaultTextLight: "#f57f17",
    defaultTextDark: "#ffca28",
  },
  {
    id: "chip-approved",
    label: "Approved",
    defaultName: "Approved",
    cssVar: "--chip-approved-bg",
    cssVarText: "--chip-approved-text",
    defaultLight: "#e3f2fd",
    defaultDark: "#0d2a3a",
    defaultTextLight: "#1565c0",
    defaultTextDark: "#42a5f5",
  },
  {
    id: "chip-rejected",
    label: "Rejected",
    defaultName: "Rejected",
    cssVar: "--chip-rejected-bg",
    cssVarText: "--chip-rejected-text",
    defaultLight: "#ffebee",
    defaultDark: "#3a0d0d",
    defaultTextLight: "#c62828",
    defaultTextDark: "#ef9a9a",
  },
  {
    id: "chip-draft",
    label: "Draft",
    defaultName: "Draft",
    cssVar: "--chip-draft-bg",
    cssVarText: "--chip-draft-text",
    defaultLight: "#f3e5f5",
    defaultDark: "#2a1a2e",
    defaultTextLight: "#6a1b9a",
    defaultTextDark: "#ba68c8",
  },
  {
    id: "chip-processing",
    label: "Processing",
    defaultName: "Processing",
    cssVar: "--chip-processing-bg",
    cssVarText: "--chip-processing-text",
    defaultLight: "#e0f7fa",
    defaultDark: "#003a3a",
    defaultTextLight: "#00695c",
    defaultTextDark: "#4db6ac",
  },
  {
    id: "chip-cancelled",
    label: "Cancelled",
    defaultName: "Cancelled",
    cssVar: "--chip-cancelled-bg",
    cssVarText: "--chip-cancelled-text",
    defaultLight: "#fce4ec",
    defaultDark: "#3a0d1a",
    defaultTextLight: "#880e4f",
    defaultTextDark: "#f48fb1",
  },
  {
    id: "chip-completed",
    label: "Completed",
    defaultName: "Completed",
    cssVar: "--chip-completed-bg",
    cssVarText: "--chip-completed-text",
    defaultLight: "#e8f5e9",
    defaultDark: "#0a2e12",
    defaultTextLight: "#1b5e20",
    defaultTextDark: "#81c784",
  },
  {
    id: "chip-warning",
    label: "Warning",
    defaultName: "Warning",
    cssVar: "--chip-warning-bg",
    cssVarText: "--chip-warning-text",
    defaultLight: "#fff3e0",
    defaultDark: "#3a1e00",
    defaultTextLight: "#e65100",
    defaultTextDark: "#ffb74d",
  },
];

const CHIP_GROUPS = [
  {
    label: "Status",
    ids: [
      "chip-active",
      "chip-inactive",
      "chip-pending",
      "chip-approved",
      "chip-rejected",
    ],
  },
  {
    label: "Workflow",
    ids: [
      "chip-draft",
      "chip-processing",
      "chip-cancelled",
      "chip-completed",
      "chip-warning",
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getIsDark() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

function getDefaultBg(item) {
  return getIsDark() ? item.defaultDark : item.defaultLight;
}

function getDefaultText(item) {
  return getIsDark() ? item.defaultTextDark : item.defaultTextLight;
}

function applyChipColor(item, bg, text) {
  document.documentElement.style.setProperty(item.cssVar, bg);
  document.documentElement.style.setProperty(item.cssVarText, text);
}

// ─── FIX: Self-invoking init so CSS vars are ALWAYS restored on every page load
// regardless of whether the caller remembers to invoke initChipColors().
// This runs once at module import time — before any component mounts.
export function initChipColors() {
  CHIP_VARS.forEach((item) => {
    const bg = localStorage.getItem(`cc_bg_${item.id}`) || getDefaultBg(item);
    const text =
      localStorage.getItem(`cc_text_${item.id}`) || getDefaultText(item);
    document.documentElement.style.setProperty(item.cssVar, bg);
    document.documentElement.style.setProperty(item.cssVarText, text);
  });
}

// Self-invoke at module load time so colors are applied on every page refresh
// even if the consumer forgets to call initChipColors() explicitly.
if (typeof window !== "undefined") {
  // Use requestAnimationFrame to ensure document.documentElement is ready
  // and the data-theme attribute (dark/light) has been set by the app.
  const _applyStoredColors = () => {
    initChipColors();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _applyStoredColors);
  } else {
    // DOM already ready (e.g. script loaded late) — run immediately
    _applyStoredColors();
  }
}

// ─── Notify all listeners that chip colors changed ─────────────────────────
function dispatchChipChange() {
  window.dispatchEvent(new CustomEvent("chipColorsChanged"));
}

export function getChipName(id) {
  const item = CHIP_VARS.find((c) => c.id === id);
  if (!item) return id;
  return localStorage.getItem(`cc_name_${id}`) || item.defaultName;
}

export function getChipBg(id) {
  const item = CHIP_VARS.find((c) => c.id === id);
  if (!item) return "#e0e0e0";
  return localStorage.getItem(`cc_bg_${id}`) || getDefaultBg(item);
}

export function getChipTextColor(id) {
  const item = CHIP_VARS.find((c) => c.id === id);
  if (!item) return "#333";
  return localStorage.getItem(`cc_text_${id}`) || getDefaultText(item);
}

// Hook — use in any component that renders chip colors.
// Re-renders automatically whenever the Chip Color Picker saves a change.
export function useChipColors() {
  const [, setVersion] = useState(0);
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("chipColorsChanged", handler);
    return () => window.removeEventListener("chipColorsChanged", handler);
  }, []);
}

// ─── Shared Chip sx — import this in any component that renders a MUI Chip
// so font size, weight, height, and font family are always consistent.
export const CHIP_SX = {
  fontWeight: 550,
  fontSize: "0.6rem",
  height: "22px",
  fontFamily: "Poppins, sans-serif",
};

// ─── Color Picker ─────────────────────────────────────────────────────────────
function hsvToRgb(h, s, v) {
  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const m = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ][i % 6];
  return m.map((x) => Math.round(x * 255));
}

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }
  return [h, s, v];
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
    : null;
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

const ColorPicker = ({ color, position, onChange, onClose }) => {
  const canvasRef = useRef(null);
  const popupRef = useRef(null);
  const dragging = useRef(false);

  const [hsv, setHsv] = useState(() => {
    const rgb = hexToRgb(color);
    return rgb ? rgbToHsv(...rgb) : [0, 1, 1];
  });
  const [hexVal, setHexVal] = useState(color);

  const getHex = (h, s, v) => {
    const [r, g, b] = hsvToRgb(h, s, v);
    return rgbToHex(r, g, b);
  };

  const drawCanvas = useCallback((h) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width,
      ht = canvas.height;
    const wGrad = ctx.createLinearGradient(0, 0, w, 0);
    wGrad.addColorStop(0, "#fff");
    wGrad.addColorStop(1, `hsl(${h},100%,50%)`);
    ctx.fillStyle = wGrad;
    ctx.fillRect(0, 0, w, ht);
    const bGrad = ctx.createLinearGradient(0, 0, 0, ht);
    bGrad.addColorStop(0, "rgba(0,0,0,0)");
    bGrad.addColorStop(1, "#000");
    ctx.fillStyle = bGrad;
    ctx.fillRect(0, 0, w, ht);
  }, []);

  useEffect(() => {
    drawCanvas(hsv[0]);
  }, [hsv[0], drawCanvas]);

  useEffect(() => {
    const handle = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", handle), 0);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const handleCanvasMove = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height));
    setHsv((prev) => {
      const next = [prev[0], x / rect.width, 1 - y / rect.height];
      const hex = getHex(...next);
      setHexVal(hex);
      onChange(hex);
      return next;
    });
  }, []); // eslint-disable-line

  const vpW = window.innerWidth,
    vpH = window.innerHeight;
  let left = position.left,
    top = position.top;
  if (left + 228 > vpW - 8) left = vpW - 236;
  if (top + 270 > vpH - 8) top = position.top - 276;
  if (left < 8) left = 8;

  const cursorX = hsv[1] * 196;
  const cursorY = (1 - hsv[2]) * 140;
  const previewHex = getHex(...hsv);

  return (
    <div
      ref={popupRef}
      className="ccp-popup"
      style={{ position: "fixed", left, top, zIndex: 9999 }}
      onMouseDown={(e) => e.stopPropagation()}>
      <div className="ccp-sb-wrap">
        <canvas
          ref={canvasRef}
          width={196}
          height={140}
          className="ccp-canvas"
          onMouseDown={(e) => {
            dragging.current = true;
            handleCanvasMove(e.clientX, e.clientY);
          }}
          onMouseMove={(e) => {
            if (dragging.current) handleCanvasMove(e.clientX, e.clientY);
          }}
          onMouseUp={() => {
            dragging.current = false;
          }}
          onMouseLeave={() => {
            dragging.current = false;
          }}
          onTouchStart={(e) =>
            handleCanvasMove(e.touches[0].clientX, e.touches[0].clientY)
          }
          onTouchMove={(e) =>
            handleCanvasMove(e.touches[0].clientX, e.touches[0].clientY)
          }
        />
        <div className="ccp-cursor" style={{ left: cursorX, top: cursorY }} />
      </div>

      <input
        type="range"
        className="ccp-hue"
        min={0}
        max={360}
        step={1}
        value={Math.round(hsv[0])}
        onChange={(e) => {
          const newH = parseFloat(e.target.value);
          drawCanvas(newH);
          setHsv((prev) => {
            const next = [newH, prev[1], prev[2]];
            const hex = getHex(...next);
            setHexVal(hex);
            onChange(hex);
            return next;
          });
        }}
      />

      <div className="ccp-hex-row">
        <div className="ccp-hex-preview" style={{ background: previewHex }} />
        <input
          className="ccp-hex-input"
          value={hexVal}
          maxLength={7}
          onChange={(e) => {
            setHexVal(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
              const rgb = hexToRgb(e.target.value);
              if (rgb) {
                const newHsv = rgbToHsv(...rgb);
                setHsv(newHsv);
                drawCanvas(newHsv[0]);
                onChange(e.target.value);
              }
            }
          }}
        />
        <button className="ccp-done-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
};

// ─── Main Dialog ──────────────────────────────────────────────────────────────
const ChipColorPickerDialog = ({ open, onClose }) => {
  const buildState = () => {
    const map = {};
    CHIP_VARS.forEach((item) => {
      map[item.id] = {
        name: localStorage.getItem(`cc_name_${item.id}`) || item.defaultName,
        bg: localStorage.getItem(`cc_bg_${item.id}`) || getDefaultBg(item),
        text:
          localStorage.getItem(`cc_text_${item.id}`) || getDefaultText(item),
      };
    });
    return map;
  };

  const [chips, setChips] = useState(buildState);
  // pickerState: { id, field: 'bg' | 'text', position }
  const [pickerState, setPickerState] = useState(null);

  useEffect(() => {
    if (open) setChips(buildState());
  }, [open]); // eslint-disable-line

  // ─── FIX: Re-apply stored CSS vars whenever the dialog opens.
  // Covers the edge case where theme changes (light ↔ dark) happened while
  // the dialog was closed and defaults shifted.
  useEffect(() => {
    if (open) initChipColors();
  }, [open]);

  const isDefaultChip = (id) => {
    const item = CHIP_VARS.find((c) => c.id === id);
    if (!item) return true;
    const c = chips[id];
    return (
      c.name === item.defaultName &&
      c.bg === getDefaultBg(item) &&
      c.text === getDefaultText(item)
    );
  };

  const handleSwatchClick = (e, id, field) => {
    e.stopPropagation();
    if (pickerState?.id === id && pickerState?.field === field) {
      setPickerState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPickerState({
      id,
      field,
      position: { top: rect.bottom + 6, left: rect.left },
    });
  };

  const handleColorChange = (id, field, hex) => {
    const item = CHIP_VARS.find((c) => c.id === id);
    if (!item) return;
    const cssVar = field === "bg" ? item.cssVar : item.cssVarText;
    document.documentElement.style.setProperty(cssVar, hex);
    localStorage.setItem(`cc_${field}_${id}`, hex);
    setChips((prev) => ({ ...prev, [id]: { ...prev[id], [field]: hex } }));
    dispatchChipChange();
  };

  const handleNameChange = (id, value) => {
    localStorage.setItem(`cc_name_${id}`, value);
    setChips((prev) => ({ ...prev, [id]: { ...prev[id], name: value } }));
    dispatchChipChange();
  };

  const handleReset = (id) => {
    const item = CHIP_VARS.find((c) => c.id === id);
    if (!item) return;
    const defBg = getDefaultBg(item);
    const defText = getDefaultText(item);
    applyChipColor(item, defBg, defText);
    localStorage.removeItem(`cc_bg_${id}`);
    localStorage.removeItem(`cc_text_${id}`);
    localStorage.removeItem(`cc_name_${id}`);
    setChips((prev) => ({
      ...prev,
      [id]: { name: item.defaultName, bg: defBg, text: defText },
    }));
    if (pickerState?.id === id) setPickerState(null);
    dispatchChipChange();
  };

  const handleResetAll = () => {
    CHIP_VARS.forEach((item) => {
      const defBg = getDefaultBg(item);
      const defText = getDefaultText(item);
      applyChipColor(item, defBg, defText);
      localStorage.removeItem(`cc_bg_${item.id}`);
      localStorage.removeItem(`cc_text_${item.id}`);
      localStorage.removeItem(`cc_name_${item.id}`);
    });
    setChips(buildState());
    setPickerState(null);
    dispatchChipChange();
  };

  const handleClose = () => {
    setPickerState(null);
    onClose();
  };

  const activeColor = pickerState
    ? chips[pickerState.id]?.[pickerState.field] || "#ffffff"
    : "#ffffff";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      PaperProps={{ className: "ccd-paper" }}>
      <div className="ccd-header">
        <div className="ccd-title-row">
          <StyleIcon className="ccd-icon" />
          <span className="ccd-title">CC &nbsp;–&nbsp; Chip Color Picker</span>
        </div>
        <div className="ccd-header-actions">
          <button
            className="ccd-reset-all-btn"
            onClick={handleResetAll}
            title="Reset all to default">
            <RestartAltIcon style={{ fontSize: 15 }} />
            Reset All
          </button>
          <IconButton className="ccd-close" onClick={handleClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent
        className="ccd-content"
        onClick={() => setPickerState(null)}>
        {/* Column headers */}
        <div className="ccd-col-header">
          <span className="ccd-col-label-name">Name</span>
          <span className="ccd-col-label-bg">Background</span>
          <span className="ccd-col-label-text">Text Color</span>
          <span className="ccd-col-label-preview">Preview</span>
          <span className="ccd-col-label-reset" />
        </div>

        <div className="ccd-groups">
          {CHIP_GROUPS.map((group) => (
            <div key={group.label} className="ccd-group">
              <div className="ccd-group-label">{group.label}</div>
              <div className="ccd-rows">
                {group.ids.map((id) => {
                  const item = CHIP_VARS.find((c) => c.id === id);
                  if (!item) return null;
                  const c = chips[id] || {};
                  const isBgActive =
                    pickerState?.id === id && pickerState?.field === "bg";
                  const isTextActive =
                    pickerState?.id === id && pickerState?.field === "text";
                  const isModified = !isDefaultChip(id);

                  return (
                    <div
                      key={id}
                      className={`ccd-row ${isBgActive || isTextActive ? "ccd-row--active" : ""}`}
                      onClick={(e) => e.stopPropagation()}>
                      {/* Editable name */}
                      <input
                        className="ccd-name-input"
                        value={c.name || ""}
                        maxLength={24}
                        onChange={(e) => handleNameChange(id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={item.defaultName}
                      />

                      {/* BG swatch */}
                      <div className="ccd-swatch-group">
                        <button
                          className={`ccd-swatch ${isBgActive ? "ccd-swatch--active" : ""}`}
                          style={{ background: c.bg }}
                          onClick={(e) => handleSwatchClick(e, id, "bg")}
                          title="Pick background color"
                        />
                        <span className="ccd-hex-label">{c.bg}</span>
                      </div>

                      {/* Text swatch */}
                      <div className="ccd-swatch-group">
                        <button
                          className={`ccd-swatch ${isTextActive ? "ccd-swatch--active" : ""}`}
                          style={{ background: c.text }}
                          onClick={(e) => handleSwatchClick(e, id, "text")}
                          title="Pick text color"
                        />
                        <span className="ccd-hex-label">{c.text}</span>
                      </div>

                      {/* Live preview chip */}
                      <span
                        className="ccd-preview-chip"
                        style={{ background: c.bg, color: c.text }}>
                        {c.name || item.defaultName}
                      </span>

                      {/* Reset */}
                      <button
                        className={`ccd-reset-btn ${!isModified ? "ccd-reset-btn--hidden" : ""}`}
                        onClick={() => handleReset(id)}
                        title="Reset to default">
                        <RestartAltIcon style={{ fontSize: 13 }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>

      {pickerState && (
        <ColorPicker
          key={`${pickerState.id}-${pickerState.field}`}
          color={activeColor}
          position={pickerState.position}
          onChange={(hex) =>
            handleColorChange(pickerState.id, pickerState.field, hex)
          }
          onClose={() => setPickerState(null)}
        />
      )}
    </Dialog>
  );
};

export default ChipColorPickerDialog;
