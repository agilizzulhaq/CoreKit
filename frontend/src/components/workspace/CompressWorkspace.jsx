import { useState, useEffect } from "react";
import { uploadDocument, compressDocument, API_URL } from "../../api";
import * as pdfjsLib from "pdfjs-dist";

const COMPRESSION_LEVELS = [
  {
    value: "less",
    title: "Less Compression",
    desc: "High quality, less compression",
  },
  {
    value: "recommended",
    title: "Recommended Compression",
    desc: "Good quality, good compression",
  },
  {
    value: "extreme",
    title: "Extreme Compression",
    desc: "Less quality, high compression",
  },
];

function formatBytes(bytes) {
  if (bytes === 0 || bytes === undefined || bytes === null) return "0 KB";
  const sizeKB = bytes / 1024;
  return sizeKB > 1024
    ? `${(sizeKB / 1024).toFixed(2)} MB`
    : `${sizeKB.toFixed(2)} KB`;
}

export default function CompressWorkspace({ files, closeModal }) {
  const [thumbnail, setThumbnail] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [pageCount, setPageCount] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState("recommended");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultInfo, setResultInfo] = useState(null);

  const file = files[0];

  useEffect(() => {
    let isMounted = true;
    if (!file) return;

    setThumbnail(null);
    setPageCount(null);
    setIsLoadingPreview(true);
    setResultInfo(null);

    const renderPreview = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
          data: arrayBuffer,
          password: file.password || "",
        }).promise;
        if (!isMounted) return;
        setPageCount(pdf.numPages);

        const page = await pdf.getPage(1);
        const baseViewport = page.getViewport({ scale: 1 });
        const targetWidth = 500;
        const scale = targetWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;

        if (isMounted) setThumbnail(canvas.toDataURL("image/png"));
      } catch (err) {
        console.error("Gagal render preview PDF:", err);
      } finally {
        if (isMounted) setIsLoadingPreview(false);
      }
    };

    renderPreview();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const triggerDownload = (url, filename) => {
    const link = document.createElement("a");
    link.href = `${url}?filename=${encodeURIComponent(filename)}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCompressAction = async () => {
    setIsProcessing(true);
    setResultInfo(null);
    try {
      const uploadRes = await uploadDocument(file, file.password);
      const docId = uploadRes.engineState?.doc_id;
      if (!docId) throw new Error("Gagal mendapatkan doc_id dari server.");

      const result = await compressDocument(docId, selectedLevel);

      triggerDownload(
        `${API_URL}/doc/download/${result.doc_id}`,
        result.filename,
      );

      setResultInfo({
        original: result.original_size_bytes,
        compressed: result.compressed_size_bytes,
      });
    } catch (error) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan sistem saat mengompres PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reductionPercent =
    resultInfo && resultInfo.original > 0
      ? Math.max(
          0,
          Math.round((1 - resultInfo.compressed / resultInfo.original) * 100),
        )
      : null;

  return (
    <div className="merge-workspace-layout">
      <div className="merge-preview-area">
        <div className="merge-grid">
          <div className="merge-item">
            <div className="merge-item-tooltip">
              {pageCount !== null
                ? `${formatBytes(file.size)} - ${pageCount} pages`
                : "Membaca data..."}
            </div>

            <div className="merge-item-thumbnail">
              <div className="preview-overlay"></div>
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={file.name}
                  className="merge-thumb-img"
                />
              ) : (
                <img
                  src="/assets/file-pdf-fill.svg"
                  alt="PDF"
                  style={{ width: "60px" }}
                />
              )}
            </div>
            <div className="merge-item-name" title={file.name}>
              {file.name}
            </div>
          </div>

          {isLoadingPreview && (
            <div className="rotate-loading-text">Memuat preview PDF...</div>
          )}
        </div>
      </div>

      <div className="merge-action-sidebar">
        <h2>Compress PDF</h2>

        <label
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--text-primary)",
            marginBottom: "6px",
            display: "block",
          }}
        >
          Compression Level:
        </label>

        <div className="compression-options">
          {COMPRESSION_LEVELS.map((level) => (
            <label
              key={level.value}
              className="compression-card"
              htmlFor={`compress-level-${level.value}`}
              style={{
                background:
                  selectedLevel === level.value
                    ? "rgba(0, 120, 215, 0.1)"
                    : "var(--surface)",
                borderColor:
                  selectedLevel === level.value
                    ? "var(--primary)"
                    : "var(--border)",
              }}
            >
              <input
                type="radio"
                id={`compress-level-${level.value}`}
                name="compression-level"
                checked={selectedLevel === level.value}
                onChange={() => setSelectedLevel(level.value)}
              />
              <div className="cc-content">
                <div
                  className="cc-title"
                  style={{
                    color:
                      selectedLevel === level.value
                        ? "var(--primary)"
                        : "var(--text-primary)",
                  }}
                >
                  {level.title}
                </div>
                <div
                  className="cc-desc"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {level.desc}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="sidebar-spacer" style={{ flexGrow: 1 }}></div>

        {resultInfo && (
          <div
            className="merge-info-alert"
            style={{
              background: "#eafaf0",
              borderColor: "#b7ebc6",
              color: "#1e7e34",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#28a745"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
            <span>
              {formatBytes(resultInfo.original)} →{" "}
              {formatBytes(resultInfo.compressed)}
              {reductionPercent !== null && reductionPercent > 0
                ? ` (lebih kecil ${reductionPercent}%)`
                : ""}
            </span>
          </div>
        )}

        <button
          className="btn-action-big"
          onClick={handleCompressAction}
          disabled={isProcessing || isLoadingPreview}
        >
          {isProcessing ? "Processing..." : "Compress PDF"}
          {!isProcessing && (
            <img
              src="/assets/arrow-right-circle.svg"
              alt="Compress"
              className="icon-merge-btn"
            />
          )}
        </button>
      </div>
    </div>
  );
}
