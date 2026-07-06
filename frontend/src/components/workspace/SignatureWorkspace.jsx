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

  // signatureImage now also stores the natural aspect ratio (height / width)
  const [signatureImage, setSignatureImage] = useState(null);
  const [removeBg, setRemoveBg] = useState(false);
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
        const uploadRes = await uploadDocument(file, file.password);
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
      const probeImg = new Image();
      probeImg.onload = () => {
        const aspect =
          probeImg.naturalWidth > 0
            ? probeImg.naturalHeight / probeImg.naturalWidth
            : 1.0;

        setSignatureImage({ dataUrl: reader.result, aspect });
        setRemoveBg(false);

        // Ambil rasio dari kontainer PDF (Lebar / Tinggi)
        let containerRatio = 1;
        if (wrapperRef.current) {
          const rect = wrapperRef.current.getBoundingClientRect();
          if (rect.height > 0) {
            containerRatio = rect.width / rect.height;
          }
        }

        // Definisikan lebar default kotak (misal 25% dari lebar halaman)
        const defaultW = 0.25;

        // KALKULASI BARU: Kalikan dengan containerRatio agar tidak gepeng di awal
        const defaultH = clamp(defaultW * aspect * containerRatio, 0.02, 0.9);

        // Hitung koordinat X dan Y agar posisi kotak berada tepat di tengah halaman
        const centerX = (1 - defaultW) / 2;
        const centerY = (1 - defaultH) / 2;

        setSigBox({
          normX: centerX,
          normY: centerY,
          normW: defaultW,
          normH: defaultH,
        });
      };
      probeImg.src = reader.result;
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
      const aspect = signatureImage?.aspect || 0.4;
      const rawDelta = Math.abs(dx) >= Math.abs(dy) ? dx : dy;

      setSigBox((prev) => {
        let newNormW = clamp(state.startNormW + rawDelta, 0.03, 1 - prev.normX);
        let newNormH = clamp(
          (newNormW * state.wrapperWidth * aspect) / state.wrapperHeight,
          0.02,
          1 - prev.normY,
        );
        newNormW = clamp(
          (newNormH * state.wrapperHeight) / (aspect * state.wrapperWidth),
          0.03,
          1 - prev.normX,
        );
        return { ...prev, normW: newNormW, normH: newNormH };
      });
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
  }, []);

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
    <div className="merge-workspace-layout" ref={containerRef}>
      <div className="merge-preview-area sign-preview-area">
        <div className="sign-preview-topbar">
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

        <div className="sign-preview-canvas">
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
                      border: "2px solid var(--surface)",
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
      </div>

      {/* --- SIDEBAR AREA --- */}
      <div className="merge-action-sidebar">
        <h2>Signature</h2>
        <p className="sign-file-name">{file?.name}</p>

        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          ref={fileInputRef}
          onChange={handleSignatureUpload}
          style={{ display: "none" }}
        />

        <button
          type="button"
          className="btn-upload-sign"
          onClick={() => fileInputRef.current?.click()}
        >
          <img src="/assets/vector-pen.svg" alt="" className="dropzone-icon" />
          <span>
            {signatureImage ? "Ganti Tanda Tangan" : "Unggah Tanda Tangan"}
          </span>
        </button>

        <button
          type="button"
          className={`btn-toggle-bg ${removeBg ? "is-active" : ""}`}
          disabled={!signatureImage}
          onClick={() => setRemoveBg((v) => !v)}
        >
          {removeBg ? "Kembalikan Tanda Tangan" : "Hapus Latar Belakang Putih"}
        </button>

        {/* Tombol Terapkan: Diberikan marginTop 12px agar ada jarak dengan tombol/teks di atasnya */}
        <button
          className="btn btn-primary"
          style={{ padding: "12px", marginTop: "12px", width: "100%" }}
          onClick={handleApply}
          disabled={isApplying || isLoadingDoc || !signatureImage}
        >
          {isApplying ? "Menerapkan..." : "Terapkan ke Halaman Ini"}
        </button>

        <div className="sidebar-spacer"></div>

        {/* Tombol Download dipindahkan ke sini (Tepat di bawah tombol Terapkan) */}
        <button
          className="btn-download-float"
          style={{
            position: "static",
            width: "100%",
            marginTop: "12px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={handleFinishDownload}
          disabled={isLoadingDoc || appliedCount === 0}
          title="Selesai & Unduh PDF"
        >
          Selesai & Unduh PDF
          <img
            src="/assets/arrow-right-circle.svg"
            alt=""
            className="icon-merge-btn"
            style={{ marginLeft: "8px" }}
          />
        </button>
      </div>
    </div>
  );
}
