import { useRef, useState, useEffect } from "react";
import { uploadDocument, protectDocuments, API_URL } from "../../api";
import * as pdfjsLib from "pdfjs-dist";

export default function PasswordProtectionWorkspace({
  files,
  setFiles,
  closeModal,
}) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fileData, setFileData] = useState({});

  useEffect(() => {
    let isMounted = true;

    files.forEach((file) => {
      if (!fileData[file.name]) {
        const sizeKB = file.size / 1024;
        const sizeStr =
          sizeKB > 1024
            ? `${(sizeKB / 1024).toFixed(2)} MB`
            : `${sizeKB.toFixed(2)} KB`;

        setFileData((prev) => ({
          ...prev,
          [file.name]: {
            thumbnail: null,
            tooltip: `${sizeStr} - Menghitung hal...`,
          },
        }));

        const renderThumbnail = async () => {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer })
              .promise;
            const totalPages = pdf.numPages;

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

            if (!isMounted) return;

            setFileData((prev) => ({
              ...prev,
              [file.name]: {
                ...prev[file.name],
                thumbnail: canvas.toDataURL("image/png"),
                tooltip: `${sizeStr} - ${totalPages} pages`,
              },
            }));
          } catch (err) {
            console.error("Gagal render thumbnail:", file.name, err);
            if (!isMounted) return;
            setFileData((prev) => ({
              ...prev,
              [file.name]: {
                ...prev[file.name],
                tooltip: `${sizeStr} - ? pages`,
              },
            }));
          }
        };

        renderThumbnail();
      }
    });

    return () => {
      isMounted = false;
    };
  }, [files]);

  const handleAddMoreFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = null;
  };

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    setTimeout(() => {
      if (e.target) {
        e.target.style.opacity = "0.3";
        e.target.style.transform = "scale(0.95)";
      }
    }, 0);
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = (e) => {
    if (e.target) {
      e.target.style.opacity = "1";
      e.target.style.transform = "scale(1)";
    }
    if (
      dragItem.current !== null &&
      dragOverItem.current !== null &&
      dragItem.current !== dragOverItem.current
    ) {
      const copyListItems = [...files];
      const dragItemContent = copyListItems[dragItem.current];
      copyListItems.splice(dragItem.current, 1);
      copyListItems.splice(dragOverItem.current, 0, dragItemContent);
      setFiles(copyListItems);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    if (files.length === 1) closeModal();
  };

  const triggerDownload = (url, filename) => {
    const link = document.createElement("a");
    link.href = `${url}?filename=${encodeURIComponent(filename)}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleProtectAction = async () => {
    if (files.length < 1) {
      alert("Harap pilih minimal 1 file PDF untuk diberi password.");
      return;
    }
    if (!password) {
      alert("Password tidak boleh kosong.");
      return;
    }
    if (password !== confirmPassword) {
      alert("Konfirmasi password tidak cocok. Periksa kembali.");
      return;
    }

    setIsProcessing(true);
    try {
      const fileEntries = [];
      for (const file of files) {
        const uploadRes = await uploadDocument(file, file.password);
        const actualDocId = uploadRes.engineState?.doc_id;
        if (!actualDocId) {
          throw new Error(
            `Gagal mendapatkan doc_id dari server untuk file: ${file.name}`,
          );
        }
        fileEntries.push({ doc_id: actualDocId, filename: file.name });
      }

      const result = await protectDocuments(fileEntries, password);

      if (result.mode === "zip") {
        triggerDownload(
          `${API_URL}/doc/download_zip/${result.zip_id}`,
          result.filename,
        );
      } else {
        triggerDownload(
          `${API_URL}/doc/download_blob/${result.blob_id}`,
          result.filename,
        );
      }
    } catch (error) {
      console.error(error);
      alert(
        error.message ||
          "Terjadi kesalahan sistem saat memberikan password pada PDF.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const passwordMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="merge-workspace-layout">
      <div className="merge-preview-area">
        <div className="merge-grid">
          {files.map((file, index) => {
            const currentData = fileData[file.name];

            return (
              <div
                key={`${file.name}-${index}`}
                className="merge-item"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                style={{ transition: "all 0.2s ease", position: "relative" }}
              >
                <div className="merge-item-tooltip">
                  {currentData ? currentData.tooltip : "Membaca data..."}
                </div>

                <button
                  className="btn-remove-item"
                  onClick={() => handleRemoveFile(index)}
                  title="Remove file"
                  style={{ zIndex: 10, position: "absolute" }}
                >
                  ✕
                </button>

                <div className="merge-item-thumbnail">
                  <div className="preview-overlay"></div>
                  {currentData && currentData.thumbnail ? (
                    <img
                      src={currentData.thumbnail}
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
            );
          })}

          <div className="merge-add-more">
            <input
              type="file"
              accept="application/pdf"
              multiple
              id="add-more-protect"
              onChange={handleAddMoreFiles}
              style={{ display: "none" }}
            />
            <label htmlFor="add-more-protect" className="btn-add-circle">
              <img
                src="/assets/plus.svg"
                alt="Add More"
                className="icon-plus-center"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="merge-action-sidebar">
        <h2>Password Protection</h2>
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
          Semua file yang dipilih akan diberi password yang sama. Simpan
          password ini baik-baik — dokumen tidak dapat dibuka tanpanya.
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label htmlFor="protect-password">Password:</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "0 8px",
            }}
          >
            <input
              id="protect-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              style={{
                border: "none",
                outline: "none",
                flexGrow: 1,
                padding: "10px 4px",
                fontSize: "14px",
                background: "transparent",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "13px",
                fontWeight: "600",
                padding: "4px 6px",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: "8px" }}>
          <label htmlFor="protect-password-confirm">Konfirmasi Password:</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--surface)",
              border: passwordMismatch
                ? "1px solid var(--danger)"
                : "1px solid var(--border)",
              borderRadius: "6px",
              padding: "0 8px",
            }}
          >
            <input
              id="protect-password-confirm"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password"
              style={{
                border: "none",
                outline: "none",
                flexGrow: 1,
                padding: "10px 4px",
                fontSize: "14px",
                background: "transparent",
                color: "var(--text-primary)",
                width: "100%",
              }}
            />
          </div>
          {passwordMismatch && (
            <span
              className="form-text-muted"
              style={{
                color: "var(--danger)",
                display: "block",
                marginTop: "6px",
              }}
            >
              Password tidak cocok
            </span>
          )}
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
          {files.length} file akan diberi password
        </div>

        <button
          className="btn-action-big"
          onClick={handleProtectAction}
          disabled={
            isProcessing ||
            files.length < 1 ||
            !password ||
            password !== confirmPassword
          }
        >
          {isProcessing ? "Processing..." : "Protect PDF"}
          {!isProcessing && (
            <img
              src="/assets/arrow-right-circle.svg"
              alt="Protect"
              className="icon-merge-btn"
            />
          )}
        </button>
      </div>
    </div>
  );
}
