import { useState, useEffect } from "react";
import { uploadDocument, rotateDocument, API_URL } from "../../api";
import * as pdfjsLib from "pdfjs-dist";

export default function RotateWorkspace({ files, closeModal }) {
  const [pageThumbnails, setPageThumbnails] = useState([]);
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [pageRotations, setPageRotations] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const file = files[0];

  useEffect(() => {
    let isMounted = true;
    if (!file) return;

    setPageThumbnails([]);
    setSelectedPages(new Set());
    setPageRotations({});
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
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedPages(new Set(pageThumbnails.map((p) => p.pageNumber)));
  };

  const handleClearSelection = () => {
    setSelectedPages(new Set());
  };

  const applyAngleToSelection = (angle) => {
    if (selectedPages.size === 0) {
      alert("Pilih minimal 1 halaman terlebih dahulu.");
      return;
    }
    setPageRotations((prev) => {
      const next = { ...prev };
      selectedPages.forEach((pageNumber) => {
        next[pageNumber] = angle;
      });
      return next;
    });
    setSelectedPages(new Set());
  };

  const clearRotationForSelection = () => {
    if (selectedPages.size === 0) {
      alert("Pilih halaman yang rotasinya ingin dihapus.");
      return;
    }
    setPageRotations((prev) => {
      const next = { ...prev };
      selectedPages.forEach((pageNumber) => {
        delete next[pageNumber];
      });
      return next;
    });
    setSelectedPages(new Set());
  };

  const clearAllRotations = () => {
    setPageRotations({});
    setSelectedPages(new Set());
  };

  const totalAssignedPages = Object.keys(pageRotations).length;

  const handleRotateAction = async () => {
    if (totalAssignedPages === 0) {
      alert("Tetapkan rotasi ke minimal 1 halaman terlebih dahulu.");
      return;
    }

    setIsProcessing(true);
    try {
      const uploadRes = await uploadDocument(file, file.password);
      const docId = uploadRes.engineState?.doc_id;
      if (!docId) {
        throw new Error("Gagal mendapatkan doc_id dari server.");
      }

      const groups = {};
      Object.entries(pageRotations).forEach(([pageNumber, angle]) => {
        if (!groups[angle]) groups[angle] = [];
        groups[angle].push(Number(pageNumber));
      });

      for (const [angle, pages] of Object.entries(groups)) {
        const pagesString = pages.sort((a, b) => a - b).join(",");
        await rotateDocument(docId, pagesString, Number(angle));
      }

      const downloadUrl = `${API_URL}/doc/download/${docId}?filename=${encodeURIComponent(
        file.name,
      )}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan sistem saat memutar halaman.");
    } finally {
      setIsProcessing(false);
    }
  };

  const angleLabel = (angle) => {
    if (angle === 90) return "90°";
    if (angle === 180) return "180°";
    if (angle === -90) return "-90°";
    return `${angle}°`;
  };

  return (
    <div className="merge-workspace-layout">
      <div className="merge-preview-area">
        <div className="merge-grid">
          {pageThumbnails.map(({ pageNumber, thumbnail }) => {
            const isSelected = selectedPages.has(pageNumber);
            const assignedAngle = pageRotations[pageNumber];
            const hasRotation = assignedAngle !== undefined;

            return (
              <div
                key={pageNumber}
                className={`merge-item rotate-item ${isSelected ? "selected" : ""} ${hasRotation ? "has-rotation" : ""}`}
                onClick={() => togglePage(pageNumber)}
              >
                <div
                  className={`rotate-select-badge ${isSelected ? "checked" : ""}`}
                >
                  {isSelected ? "✓" : pageNumber}
                </div>

                {hasRotation && (
                  <div className="rotate-angle-badge">
                    {angleLabel(assignedAngle)}
                  </div>
                )}

                <div className="merge-item-thumbnail">
                  <img
                    src={thumbnail}
                    alt={`Halaman ${pageNumber}`}
                    className="merge-thumb-img rotate-thumb-img"
                    style={{
                      transform: `translate(-50%, -50%) rotate(${assignedAngle || 0}deg)`,
                    }}
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
        <h2>Rotate PDF</h2>
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
          Pilih halaman, lalu klik salah satu sudut untuk menetapkannya. Ulangi
          dengan kombinasi halaman & sudut lain sebelum menekan Rotate PDF.
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
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

        <div style={{ marginBottom: "12px" }}>
          <label
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: "10px",
              display: "block",
            }}
          >
            Terapkan sudut ke {selectedPages.size} halaman terpilih:
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              className="btn btn-primary"
              onClick={() => applyAngleToSelection(90)}
              disabled={selectedPages.size === 0}
            >
              90° Clockwise
            </button>
            <button
              className="btn btn-primary"
              onClick={() => applyAngleToSelection(180)}
              disabled={selectedPages.size === 0}
            >
              180°
            </button>
            <button
              className="btn btn-primary"
              onClick={() => applyAngleToSelection(-90)}
              disabled={selectedPages.size === 0}
            >
              90° Counter-Clockwise
            </button>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          style={{ marginBottom: "8px" }}
          onClick={clearRotationForSelection}
          disabled={selectedPages.size === 0}
        >
          Hapus Rotasi Halaman Terpilih
        </button>

        {totalAssignedPages > 0 && (
          <button
            className="btn btn-secondary"
            style={{ marginBottom: "8px", color: "var(--danger)" }}
            onClick={clearAllRotations}
          >
            Reset Semua Rotasi
          </button>
        )}

        <div className="sidebar-spacer" style={{ flexGrow: 1 }}></div>

        <div
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          {totalAssignedPages} halaman telah ditetapkan rotasinya
        </div>

        <button
          className="btn-action-big"
          onClick={handleRotateAction}
          disabled={isProcessing || totalAssignedPages === 0}
        >
          {isProcessing ? "Processing..." : "Rotate PDF"}
          {!isProcessing && (
            <img
              src="/assets/arrow-right-circle.svg"
              alt="Rotate"
              className="icon-merge-btn"
            />
          )}
        </button>
      </div>
    </div>
  );
}
