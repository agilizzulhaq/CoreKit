import { useState, useEffect } from "react";
import { uploadDocument, splitDocument, API_URL } from "../../api";
import * as pdfjsLib from "pdfjs-dist";

export default function SplitWorkspace({ files, closeModal }) {
  const [pageThumbnails, setPageThumbnails] = useState([]);
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [splitMode, setSplitMode] = useState("custom"); // "custom" | "fixed"
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [rangeCount, setRangeCount] = useState(2);
  const [isProcessing, setIsProcessing] = useState(false);

  const file = files[0];
  const totalPages = pageThumbnails.length;

  useEffect(() => {
    let isMounted = true;
    if (!file) return;

    setPageThumbnails([]);
    setSelectedPages(new Set());
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

  const togglePage = (pageNumber) => {
    if (splitMode !== "custom") return;
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) next.delete(pageNumber);
      else next.add(pageNumber);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedPages(new Set(pageThumbnails.map((p) => p.pageNumber)));
  };

  const handleClearSelection = () => {
    setSelectedPages(new Set());
  };

  const safeRangeCount = Math.max(
    1,
    Math.min(rangeCount || 1, totalPages || 1),
  );
  const pagesPerFile =
    totalPages > 0 ? Math.ceil(totalPages / safeRangeCount) : 0;
  const fileCount = pagesPerFile > 0 ? Math.ceil(totalPages / pagesPerFile) : 0;

  const groupForPage = (pageNumber) => {
    if (pagesPerFile === 0) return 1;
    return Math.floor((pageNumber - 1) / pagesPerFile) + 1;
  };

  const triggerDownload = (url, filename) => {
    const link = document.createElement("a");
    link.href = `${url}?filename=${encodeURIComponent(filename)}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSplitAction = async () => {
    if (splitMode === "custom" && selectedPages.size === 0) {
      alert("Pilih minimal 1 halaman untuk digabung menjadi PDF baru.");
      return;
    }
    if (splitMode === "fixed" && pagesPerFile < 1) {
      alert("Jumlah pembagian tidak valid.");
      return;
    }

    setIsProcessing(true);
    try {
      const uploadRes = await uploadDocument(file, file.password);
      const docId = uploadRes.engineState?.doc_id;
      if (!docId) throw new Error("Gagal mendapatkan doc_id dari server.");

      if (splitMode === "custom") {
        const pagesStr = [...selectedPages].sort((a, b) => a - b).join(",");
        const result = await splitDocument(docId, "custom", pagesStr);
        triggerDownload(
          `${API_URL}/doc/download/${result.doc_id}`,
          result.filename,
        );
      } else {
        const result = await splitDocument(docId, "fixed", "", pagesPerFile);
        if (result.zip_id) {
          triggerDownload(
            `${API_URL}/doc/download_zip/${result.zip_id}`,
            result.filename,
          );
        } else {
          triggerDownload(
            `${API_URL}/doc/download/${result.doc_id}`,
            result.filename,
          );
        }
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan sistem saat memisahkan PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="merge-workspace-layout">
      <div className="merge-preview-area">
        <div className="merge-grid">
          {pageThumbnails.map(({ pageNumber, thumbnail }) => {
            const isSelected = selectedPages.has(pageNumber);

            return (
              <div
                key={pageNumber}
                className={`merge-item rotate-item ${
                  splitMode === "custom" && isSelected ? "selected" : ""
                } ${splitMode === "fixed" ? "has-rotation" : ""}`}
                onClick={() => togglePage(pageNumber)}
              >
                {splitMode === "custom" ? (
                  <div
                    className={`rotate-select-badge ${
                      isSelected ? "checked" : ""
                    }`}
                  >
                    {isSelected ? "✓" : pageNumber}
                  </div>
                ) : (
                  <div className="rotate-select-badge">{pageNumber}</div>
                )}

                {splitMode === "fixed" && pagesPerFile > 0 && (
                  <div className="rotate-angle-badge">
                    File {groupForPage(pageNumber)}
                  </div>
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

      <div className="merge-action-sidebar">
        <h2>Split PDF</h2>

        <div className="radio-group" style={{ marginBottom: "16px" }}>
          <label>
            <input
              type="radio"
              name="split-mode"
              checked={splitMode === "custom"}
              onChange={() => setSplitMode("custom")}
            />
            <span>
              <strong>Custom Range</strong> — pilih halaman mana saja untuk
              digabung menjadi satu PDF baru
            </span>
          </label>
          <label>
            <input
              type="radio"
              name="split-mode"
              checked={splitMode === "fixed"}
              onChange={() => setSplitMode("fixed")}
            />
            <span>
              <strong>Fixed Split</strong> — bagi dokumen menjadi beberapa
              bagian dengan jumlah yang sama
            </span>
          </label>
        </div>

        {splitMode === "custom" ? (
          <>
            <div className="merge-info-alert">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0078d7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Klik halaman untuk memilih mana saja yang akan digabung menjadi 1
              file PDF baru.
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={handleSelectAll}
              >
                Pilih Semua
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={handleClearSelection}
              >
                Batal Pilih
              </button>
            </div>

            <div className="sidebar-spacer" style={{ flexGrow: 1 }}></div>

            <div
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginBottom: "12px",
                textAlign: "center",
              }}
            >
              {selectedPages.size} halaman terpilih
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                marginBottom: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <label
                htmlFor="split-range-input"
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "var(--text-primary)",
                }}
              >
                Split into page ranges of
              </label>
              <input
                id="split-range-input"
                type="number"
                min={1}
                max={totalPages || 1}
                value={rangeCount}
                onChange={(e) => setRangeCount(Number(e.target.value))}
                className="form-control"
              />
            </div>

            <div className="merge-info-alert">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0078d7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              {totalPages > 0 ? (
                <span>
                  This PDF will be split into files of {pagesPerFile} pages.{" "}
                  {fileCount} PDFs will be created.
                </span>
              ) : (
                <span>Memuat jumlah halaman...</span>
              )}
            </div>

            <div className="sidebar-spacer" style={{ flexGrow: 1 }}></div>
          </>
        )}

        <button
          className="btn-action-big"
          onClick={handleSplitAction}
          disabled={
            isProcessing ||
            (splitMode === "custom" && selectedPages.size === 0) ||
            (splitMode === "fixed" && totalPages === 0)
          }
        >
          {isProcessing ? "Processing..." : "Split PDF"}
          {!isProcessing && (
            <img
              src="/assets/arrow-right-circle.svg"
              alt="Split"
              className="icon-merge-btn"
            />
          )}
        </button>
      </div>
    </div>
  );
}
