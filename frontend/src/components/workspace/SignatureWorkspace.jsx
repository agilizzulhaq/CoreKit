import { useRef, useState, useEffect } from "react";
import { uploadDocument, signDocument, getRenderUrl, API_URL } from "../../api";

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

export default function SignatureWorkspace({ files, closeModal }) {
  const file = files[0];

  const [docId, setDocId] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState("1");
  const [refreshToken, setRefreshToken] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [signatureImage, setSignatureImage] = useState(null);
  const [removeBg, setRemoveBg] = useState(true);
  const [sigBox, setSigBox] = useState({
    normX: 0.35,
    normY: 0.75,
    normW: 0.28,
    normH: 0.12,
  });
  const [appliedCount, setAppliedCount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const dragStateRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    if (!file) return;

    const initDoc = async () => {
      try {
        const uploadRes = await uploadDocument(file);
        if (!isMounted) return;
        const id = uploadRes.engineState?.doc_id;
        const total = uploadRes.engineState?.total_pages;
        if (!id) throw new Error("Gagal mendapatkan doc_id dari server.");
        setDocId(id);
        setTotalPages(total || 1);
      } catch (err) {
        console.error(err);
        alert(err.message || "Gagal membuka dokumen PDF.");
      } finally {
        if (isMounted) setIsLoadingDoc(false);
      }
    };

    initDoc();
    return () => {
      isMounted = false;
    };
  }, [file]);

  useEffect(() => {
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  };

  const goToPage = (num) => {
    const clamped = clamp(num, 1, totalPages || 1);
    setCurrentPage(clamped);
  };

  const handlePageInputCommit = () => {
    const num = parseInt(pageInputValue, 10);
    if (!isNaN(num)) goToPage(num);
    else setPageInputValue(String(currentPage));
  };

  const handleSignatureUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSignatureImage({ dataUrl: reader.result });
      setSigBox({ normX: 0.35, normY: 0.75, normW: 0.28, normH: 0.12 });
    };
    reader.readAsDataURL(uploadedFile);
    e.target.value = null;
  };

  const handleBoxMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    dragStateRef.current = {
      mode: "move",
      startX: e.clientX,
      startY: e.clientY,
      startNormX: sigBox.normX,
      startNormY: sigBox.normY,
      wrapperWidth: wrapperRect.width,
      wrapperHeight: wrapperRect.height,
    };
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    dragStateRef.current = {
      mode: "resize",
      startX: e.clientX,
      startY: e.clientY,
      startNormW: sigBox.normW,
      startNormH: sigBox.normH,
      wrapperWidth: wrapperRect.width,
      wrapperHeight: wrapperRect.height,
    };
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  };

  const handleWindowMouseMove = (e) => {
    const state = dragStateRef.current;
    if (!state) return;
    const dx = (e.clientX - state.startX) / state.wrapperWidth;
    const dy = (e.clientY - state.startY) / state.wrapperHeight;

    if (state.mode === "move") {
      setSigBox((prev) => ({
        ...prev,
        normX: clamp(state.startNormX + dx, 0, 1 - prev.normW),
        normY: clamp(state.startNormY + dy, 0, 1 - prev.normH),
      }));
    } else if (state.mode === "resize") {
      setSigBox((prev) => ({
        ...prev,
        normW: clamp(state.startNormW + dx, 0.03, 1 - prev.normX),
        normH: clamp(state.startNormH + dy, 0.03, 1 - prev.normY),
      }));
    }
  };

  const handleWindowMouseUp = () => {
    dragStateRef.current = null;
    window.removeEventListener("mousemove", handleWindowMouseMove);
    window.removeEventListener("mouseup", handleWindowMouseUp);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSizeSliderChange = (e) => {
    const newNormW = Number(e.target.value) / 100;
    setSigBox((prev) => {
      const aspect = prev.normW > 0 ? prev.normH / prev.normW : 0.4;
      return {
        ...prev,
        normW: newNormW,
        normH: clamp(newNormW * aspect, 0.02, 1 - prev.normY),
      };
    });
  };

  const handleApply = async () => {
    if (!signatureImage) {
      alert("Unggah gambar tanda tangan terlebih dahulu.");
      return;
    }
    if (!docId) return;

    setIsApplying(true);
    try {
      await signDocument(
        docId,
        currentPage - 1,
        signatureImage.dataUrl,
        sigBox.normX,
        sigBox.normY,
        sigBox.normW,
        sigBox.normH,
        removeBg,
      );
      setRefreshToken((t) => t + 1);
      setAppliedCount((c) => c + 1);
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "Terjadi kesalahan sistem saat menerapkan tanda tangan.",
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleFinishDownload = () => {
    if (!docId) return;
    const link = document.createElement("a");
    link.href = `${API_URL}/doc/download/${docId}?filename=${encodeURIComponent(file.name)}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const renderSrc = docId
    ? `${getRenderUrl(docId, currentPage - 1, 1.5)}&t=${refreshToken}`
    : null;

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#fdfdfd",
      }}
    >
      <div className="sign-header">
        <h3>Signature — {file?.name}</h3>
      </div>

      <div className="sign-toolbar">
        <div className="toolbar-center">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            ref={fileInputRef}
            onChange={handleSignatureUpload}
            style={{ display: "none" }}
          />
          <button
            className="btn btn-primary btn-sm-pad"
            onClick={() => fileInputRef.current?.click()}
          >
            {signatureImage ? "Ganti Gambar" : "Unggah Tanda Tangan"}
          </button>

          <div className="tool-divider"></div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.85rem",
              color: "#4b5563",
              cursor: signatureImage ? "pointer" : "not-allowed",
              opacity: signatureImage ? 1 : 0.5,
            }}
          >
            <input
              type="checkbox"
              checked={removeBg}
              disabled={!signatureImage}
              onChange={(e) => setRemoveBg(e.target.checked)}
            />
            Hapus latar belakang putih
          </label>

          {signatureImage && (
            <>
              <div className="tool-divider"></div>
              <span className="toolbar-label">Ukuran</span>
              <input
                id="sign-size-slider"
                type="range"
                min="10"
                max="70"
                value={Math.round(sigBox.normW * 100)}
                onChange={handleSizeSliderChange}
                style={{ width: "100px" }}
              />
            </>
          )}
        </div>

        <div className="page-input-wrapper">
          <button
            className="page-btn"
            onClick={() => goToPage(currentPage - 1)}
            disabled={isLoadingDoc || currentPage <= 1}
            title="Halaman sebelumnya"
          >
            ‹
          </button>
          <input
            id="sign-page-input"
            type="text"
            value={pageInputValue}
            onChange={(e) => setPageInputValue(e.target.value)}
            onBlur={handlePageInputCommit}
            onKeyDown={(e) => e.key === "Enter" && handlePageInputCommit()}
          />
          <span>dari {totalPages || "..."}</span>
          <button
            className="page-btn"
            onClick={() => goToPage(currentPage + 1)}
            disabled={isLoadingDoc || currentPage >= totalPages}
            title="Halaman berikutnya"
          >
            ›
          </button>
        </div>
      </div>

      <div className="sign-workspace" style={{ position: "relative" }}>
        {isLoadingDoc ? (
          <div className="rotate-loading-text">Memuat dokumen PDF...</div>
        ) : (
          <div
            className="sign-pdf-wrapper"
            ref={wrapperRef}
            style={{ height: `${70 * zoomLevel}vh` }}
          >
            {renderSrc && (
              <img
                id="sign-pdf-preview"
                src={renderSrc}
                alt={`Halaman ${currentPage}`}
              />
            )}

            {signatureImage && (
              <div
                className="draggable-sig"
                onMouseDown={handleBoxMouseDown}
                style={{
                  left: `${sigBox.normX * 100}%`,
                  top: `${sigBox.normY * 100}%`,
                  width: `${sigBox.normW * 100}%`,
                  height: `${sigBox.normH * 100}%`,
                }}
              >
                <img
                  src={signatureImage.dataUrl}
                  alt="Tanda Tangan"
                  draggable={false}
                  className={removeBg ? "transparent-preview" : ""}
                  style={{
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                  }}
                />
                <div
                  onMouseDown={handleResizeMouseDown}
                  title="Ubah ukuran"
                  style={{
                    position: "absolute",
                    right: "-7px",
                    bottom: "-7px",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: "var(--primary)",
                    border: "2px solid white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                    cursor: "nwse-resize",
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div className="sign-float-zoom">
          <button
            className="float-btn"
            onClick={() => setZoomLevel((z) => clamp(z - 0.1, 0.5, 2))}
            title="Zoom Out"
          >
            <img src="/assets/zoom-out.svg" alt="Zoom Out" />
          </button>
          <span id="sign-zoom-label">{Math.round(zoomLevel * 100)}%</span>
          <button
            className="float-btn"
            onClick={() => setZoomLevel((z) => clamp(z + 0.1, 0.5, 2))}
            title="Zoom In"
          >
            <img src="/assets/zoom-in.svg" alt="Zoom In" />
          </button>
          <div className="float-divider"></div>
          <button
            className={`float-btn ${isFullscreen ? "active" : ""}`}
            onClick={toggleFullscreen}
            title={isFullscreen ? "Keluar Fullscreen" : "Fullscreen"}
          >
            <img
              src={
                isFullscreen
                  ? "/assets/fullscreen-exit.svg"
                  : "/assets/fullscreen.svg"
              }
              alt="Fullscreen"
            />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 25px",
          background: "#f9fafb",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
          {appliedCount > 0
            ? `${appliedCount} tanda tangan telah diterapkan. Pindah halaman lalu klik "Terapkan" lagi untuk memakai tanda tangan yang sama.`
            : 'Unggah gambar, atur posisi & ukuran, lalu klik "Terapkan ke Halaman Ini".'}
        </span>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={isApplying || isLoadingDoc || !signatureImage}
          >
            {isApplying ? "Menerapkan..." : "Terapkan ke Halaman Ini"}
          </button>
          <button
            className="btn-action-big"
            style={{ padding: "10px 24px", fontSize: "1rem" }}
            onClick={handleFinishDownload}
            disabled={isLoadingDoc || appliedCount === 0}
          >
            Selesai & Unduh PDF
          </button>
        </div>
      </div>
    </div>
  );
}
