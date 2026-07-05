import { useRef, useState, useEffect } from "react";
import { uploadDocument, lockDocuments, API_URL } from "../../api";
import * as pdfjsLib from "pdfjs-dist";

const PERMISSION_LIST = [
  { label: "Commenting", allowed: false },
  { label: "Content copying", allowed: true },
  { label: "Content copying for accessibility", allowed: true },
  { label: "Editing file content", allowed: false },
  { label: "Filling form fields", allowed: false },
  { label: "Printing", allowed: true },
  { label: "Saving a copy", allowed: true },
  { label: "Signing", allowed: false },
];

export default function LockDocumentWorkspace({ files, setFiles, closeModal }) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const handleLockAction = async () => {
    if (files.length < 1) {
      alert("Harap pilih minimal 1 file PDF untuk dikunci.");
      return;
    }

    setIsProcessing(true);
    try {
      const fileEntries = [];
      for (const file of files) {
        const uploadRes = await uploadDocument(file);
        const actualDocId = uploadRes.engineState?.doc_id;
        if (!actualDocId) {
          throw new Error(
            `Gagal mendapatkan doc_id dari server untuk file: ${file.name}`,
          );
        }
        fileEntries.push({ doc_id: actualDocId, filename: file.name });
      }

      const result = await lockDocuments(fileEntries);

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
      alert(error.message || "Terjadi kesalahan sistem saat mengunci PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

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
              id="add-more-lock"
              onChange={handleAddMoreFiles}
              style={{ display: "none" }}
            />
            <label htmlFor="add-more-lock" className="btn-add-circle">
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
        <h2>Lock Document</h2>
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
          Dokumen tetap dapat dibuka, namun aksi tertentu akan dibatasi.
        </div>

        {/* <label
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#333",
            marginBottom: "8px",
            display: "block",
          }}
        >
          File Permissions:
        </label>

        <ul className="permission-list" style={{ marginBottom: "8px" }}>
          {PERMISSION_LIST.map((perm) => (
            <li className="permission-item" key={perm.label}>
              <span
                className={`permission-icon ${
                  perm.allowed ? "perm-yes" : "perm-no"
                }`}
              >
                {perm.allowed ? "✓" : "⊘"}
              </span>
              <span
                style={{
                  color: perm.allowed ? "#374151" : "var(--danger)",
                }}
              >
                {perm.label}
              </span>
            </li>
          ))}
        </ul> */}

        <div className="sidebar-spacer" style={{ flexGrow: 1 }}></div>

        <div
          style={{
            fontSize: "13px",
            color: "#6b7280",
            marginBottom: "12px",
            textAlign: "center",
          }}
        >
          {files.length} file akan dikunci
        </div>

        <button
          className="btn-action-big"
          onClick={handleLockAction}
          disabled={isProcessing || files.length < 1}
        >
          {isProcessing ? "Processing..." : "Lock Document"}
          {!isProcessing && (
            <img
              src="/assets/arrow-right-circle.svg"
              alt="Lock"
              className="icon-merge-btn"
            />
          )}
        </button>
      </div>
    </div>
  );
}
