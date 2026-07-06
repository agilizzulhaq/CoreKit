import { useState, useEffect, useMemo } from "react";
import { uploadDocument, numberPages, API_URL } from "../../api";
import * as pdfjsLib from "pdfjs-dist";

const STYLE_OPTIONS = [
  { value: "arabic", label: "1, 2, 3, ..." },
  { value: "roman_lower", label: "i, ii, iii, ..." },
  { value: "roman_upper", label: "I, II, III, ..." },
  { value: "alpha_lower", label: "a, b, c, ..." },
  { value: "alpha_upper", label: "A, B, C, ..." },
];

const POSITION_OPTIONS = [
  { value: "bottom_right", label: "Bottom Right" },
  { value: "bottom_center", label: "Bottom Center" },
  { value: "bottom_left", label: "Bottom Left" },
  { value: "top_right", label: "Top Right" },
  { value: "top_center", label: "Top Center" },
  { value: "top_left", label: "Top Left" },
];

// --- Helper format angka, mirror dari logika backend (engine/main.py) ---
function toRoman(n) {
  if (n <= 0) return String(n);
  const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syb = [
    "M",
    "CM",
    "D",
    "CD",
    "C",
    "XC",
    "L",
    "XL",
    "X",
    "IX",
    "V",
    "IV",
    "I",
  ];
  let roman = "";
  let i = 0;
  while (n > 0) {
    while (n >= val[i]) {
      roman += syb[i];
      n -= val[i];
    }
    i++;
  }
  return roman;
}

function toAlpha(n) {
  if (n <= 0) return String(n);
  let result = "";
  while (n > 0) {
    n -= 1;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

function formatNumber(num, style) {
  if (style === "roman_lower") return toRoman(num).toLowerCase();
  if (style === "roman_upper") return toRoman(num);
  if (style === "alpha_lower") return toAlpha(num).toLowerCase();
  if (style === "alpha_upper") return toAlpha(num);
  return String(num);
}

function parsePageString(pageStr, maxPages) {
  const target = new Set();
  if (!pageStr || pageStr.trim().toLowerCase() === "all") {
    for (let i = 1; i <= maxPages; i++) target.add(i);
    return target;
  }
  try {
    pageStr.split(",").forEach((part) => {
      part = part.trim();
      if (!part) return;
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((n) => parseInt(n, 10));
        const s = Math.max(1, start);
        const e = Math.min(maxPages, end);
        for (let p = s; p <= e; p++) target.add(p);
      } else {
        const p = parseInt(part, 10);
        if (p >= 1 && p <= maxPages) target.add(p);
      }
    });
  } catch {
    return new Set();
  }
  return target;
}

export default function PageNumberingWorkspace({ files, closeModal }) {
  const [pageThumbnails, setPageThumbnails] = useState([]);
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Form state, mirror NumberingReq di backend ---
  const [pagesInput, setPagesInput] = useState("all");
  const [style, setStyle] = useState("arabic");
  const [position, setPosition] = useState("bottom_right");
  const [startMode, setStartMode] = useState("continue"); // "continue" | "start_at"
  const [startAt, setStartAt] = useState("1");
  const [format, setFormat] = useState("simple"); // "simple" | "full" | "custom"
  const [customPrefix, setCustomPrefix] = useState("");
  const [customDivider, setCustomDivider] = useState("dari");
  const [customSuffix, setCustomSuffix] = useState("");

  const file = files[0];
  const totalPages = pageThumbnails.length;

  useEffect(() => {
    let isMounted = true;
    if (!file) return;

    setPageThumbnails([]);
    setIsLoadingPages(true);

    const renderAllPages = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          password: file.password || "",
        }).promise;
        const total = pdf.numPages;

        for (let i = 1; i <= total; i++) {
          if (!isMounted) return;

          const page = await pdf.getPage(i);
          const baseViewport = page.getViewport({ scale: 1 });
          const targetWidth = 400;
          const scale = targetWidth / baseViewport.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          await page.render({ canvasContext: ctx, viewport }).promise;

          const thumbnail = canvas.toDataURL("image/png");

          if (isMounted) {
            setPageThumbnails((prev) => [
              ...prev,
              { pageNumber: i, thumbnail },
            ]);
          }
        }
      } catch (err) {
        console.error("Gagal render halaman PDF:", err);
      } finally {
        if (isMounted) setIsLoadingPages(false);
      }
    };

    renderAllPages();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // --- Hitung preview label nomor per halaman, live mengikuti form ---
  const targetPages = useMemo(
    () => parsePageString(pagesInput, totalPages),
    [pagesInput, totalPages],
  );

  const previewLabelForPage = (pageNumber) => {
    if (!targetPages.has(pageNumber)) return null;

    const sortedTargets = [...targetPages].sort((a, b) => a - b);
    const seqIdx = sortedTargets.indexOf(pageNumber);

    let currentNum;
    if (startMode === "start_at") {
      const parsedStart = parseInt(startAt, 10);
      currentNum = (isNaN(parsedStart) ? 1 : parsedStart) + seqIdx;
    } else {
      currentNum = pageNumber;
    }

    return formatNumber(currentNum, style);
  };

  const triggerDownload = (url, filename) => {
    const link = document.createElement("a");
    link.href = `${url}?filename=${encodeURIComponent(filename)}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleApplyAction = async () => {
    if (targetPages.size === 0) {
      alert(
        "Halaman yang dipilih tidak valid. Periksa kembali isian 'Pages to Number'.",
      );
      return;
    }

    setIsProcessing(true);
    try {
      const uploadRes = await uploadDocument(file, file.password);
      const docId = uploadRes.engineState?.doc_id;
      if (!docId) throw new Error("Gagal mendapatkan doc_id dari server.");

      const result = await numberPages(docId, {
        format,
        style,
        pages: pagesInput,
        start_mode: startMode,
        start_at: startAt,
        custom_prefix: customPrefix,
        custom_suffix: customSuffix,
        custom_divider: customDivider,
        position,
      });

      triggerDownload(`${API_URL}/doc/download/${docId}`, file.name);
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "Terjadi kesalahan sistem saat menambahkan nomor halaman.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="merge-workspace-layout">
      <div className="merge-preview-area">
        <div className="merge-grid">
          {pageThumbnails.map(({ pageNumber, thumbnail }) => {
            const previewLabel = previewLabelForPage(pageNumber);

            return (
              <div
                key={pageNumber}
                className={`merge-item rotate-item ${previewLabel ? "has-rotation" : ""}`}
              >
                <div className="rotate-select-badge">{pageNumber}</div>

                {previewLabel && (
                  <div className="rotate-angle-badge">No. {previewLabel}</div>
                )}

                <div className="merge-item-thumbnail">
                  <img
                    src={thumbnail}
                    alt={`Halaman ${pageNumber}`}
                    className="merge-thumb-img rotate-thumb-img"
                    style={{ transform: "translate(-50%, -50%)" }}
                  />
                </div>
                <div className="merge-item-name">Halaman {pageNumber}</div>
              </div>
            );
          })}

          {isLoadingPages && (
            <div className="rotate-loading-text">Memuat halaman PDF...</div>
          )}
        </div>
      </div>

      <div className="merge-action-sidebar" style={{ overflowY: "auto" }}>
        <h2>Page Numbering</h2>

        {/* --- Pages to Number --- */}
        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "8px",
              display: "block",
            }}
          >
            Pages to Number (e.g., 1, 3-5 or 'all'):
          </label>
          <input
            type="text"
            className="form-control"
            value={pagesInput}
            style={{
              background: "var(--surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
            onChange={(e) => setPagesInput(e.target.value)}
            placeholder="all"
          />
        </div>

        {/* --- Number Format --- */}
        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "8px",
              display: "block",
            }}
          >
            Number Format:
          </label>
          <select
            className="form-control"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            style={{
              background: "var(--surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            {STYLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* --- Location / Position --- */}
        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "8px",
              display: "block",
            }}
          >
            Location / Position:
          </label>
          <select
            className="form-control"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            style={{
              background: "var(--surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            }}
          >
            {POSITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* --- Page Numbering: Default / Custom at --- */}
        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "8px",
              display: "block",
            }}
          >
            Page Numbering:
          </label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="start-mode"
                checked={startMode === "continue"}
                onChange={() => setStartMode("continue")}
              />
              <span>Default</span>
            </label>
            <label>
              <input
                type="radio"
                name="start-mode"
                checked={startMode === "start_at"}
                onChange={() => setStartMode("start_at")}
              />
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Custom at:
                <input
                  type="text"
                  className="target-input"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  onFocus={() => setStartMode("start_at")}
                  style={{
                    width: "60px",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                  }}
                />
              </span>
            </label>
          </div>
        </div>

        {/* --- Text Layout Format --- */}
        <div style={{ marginBottom: "18px" }}>
          <label
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "8px",
              display: "block",
            }}
          >
            Text Layout Format:
          </label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="text-format"
                checked={format === "simple"}
                onChange={() => setFormat("simple")}
              />
              <span>Default (e.g., 1, 2, 3)</span>
            </label>
            <label>
              <input
                type="radio"
                name="text-format"
                checked={format === "full"}
                onChange={() => setFormat("full")}
              />
              <span>Full (e.g., Halaman 1 dari N halaman)</span>
            </label>
            <label>
              <input
                type="radio"
                name="text-format"
                checked={format === "custom"}
                onChange={() => setFormat("custom")}
              />
              <span>Custom</span>
            </label>
          </div>

          {format === "custom" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "10px",
                flexWrap: "wrap",
              }}
            >
              <input
                type="text"
                className="form-control"
                placeholder="Prefix"
                value={customPrefix}
                onChange={(e) => setCustomPrefix(e.target.value)}
                style={{
                  flex: "1 1 70px",
                  minWidth: 0,
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "#374151",
                  whiteSpace: "nowrap",
                }}
              >
                [ N ]
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="dari"
                value={customDivider}
                onChange={(e) => setCustomDivider(e.target.value)}
                style={{
                  flex: "0 1 60px",
                  minWidth: 0,
                  textAlign: "center",
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "#374151",
                  whiteSpace: "nowrap",
                }}
              >
                [ Total ]
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Suffix"
                value={customSuffix}
                onChange={(e) => setCustomSuffix(e.target.value)}
                style={{
                  flex: "1 1 70px",
                  minWidth: 0,
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                }}
              />
            </div>
          )}
        </div>

        <div className="sidebar-spacer" style={{ flexGrow: 1 }}></div>

        <button
          className="btn-action-big"
          onClick={handleApplyAction}
          disabled={isProcessing || isLoadingPages || targetPages.size === 0}
        >
          {isProcessing ? "Processing..." : "Apply Numbering"}
          {!isProcessing && (
            <img
              src="/assets/arrow-right-circle.svg"
              alt="Apply"
              className="icon-merge-btn"
            />
          )}
        </button>
      </div>
    </div>
  );
}
