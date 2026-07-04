// frontend\src\components\Workspace.jsx
import { useRef, useState, useEffect } from "react";
import { mergeDocuments, uploadDocument, filesToPdf, API_URL } from "../api";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function Workspace({
  activeModal,
  closeModal,
  files,
  setFiles,
}) {
  if (!activeModal) return null;

  const renderFeatureWorkspace = () => {
    switch (activeModal) {
      case "filesToPdf": // [BARU]
        return (
          <FilesToPdfWorkspace
            files={files}
            setFiles={setFiles}
            closeModal={closeModal}
          />
        );
      case "merge":
        return (
          <MergeWorkspace
            files={files}
            setFiles={setFiles}
            closeModal={closeModal}
          />
        );
      default:
        return (
          <div className="workspace-empty">
            <h2>Fitur dalam pengembangan</h2>
            <button className="btn btn-primary" onClick={closeModal}>
              Tutup
            </button>
          </div>
        );
    }
  };

  return (
    <div className="workspace-feature-overlay">
      <div className="workspace-feature-modal">
        <button className="btn-close-workspace-right" onClick={closeModal}>
          ✕
        </button>
        {renderFeatureWorkspace()}
      </div>
    </div>
  );
}

// --- SUB-KOMPONEN KHUSUS FITUR FILES TO PDF ---
function FilesToPdfWorkspace({ files, setFiles, closeModal }) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFilename, setOutputFilename] = useState(
    "LUNPIA_Converted_Result",
  );
  const [fileData, setFileData] = useState({});

  useEffect(() => {
    files.forEach((file) => {
      if (!fileData[file.name]) {
        const sizeKB = file.size / 1024;
        const sizeStr =
          sizeKB > 1024
            ? `${(sizeKB / 1024).toFixed(2)} MB`
            : `${sizeKB.toFixed(2)} KB`;

        const isImage = file.type.startsWith("image/");
        const objectUrl = isImage ? URL.createObjectURL(file) : null;
        const typeLabel = isImage ? "Gambar" : "Teks";

        setFileData((prev) => ({
          ...prev,
          [file.name]: {
            url: objectUrl,
            isImage,
            tooltip: `${sizeStr} - ${typeLabel}`,
          },
        }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleConvertAction = async () => {
    if (files.length < 1) {
      alert("Harap pilih minimal 1 file untuk dikonversi.");
      return;
    }
    if (!outputFilename.trim()) {
      alert("Nama file tidak boleh kosong.");
      return;
    }

    setIsProcessing(true);
    try {
      const uploadedFiles = [];
      for (const file of files) {
        const uploadRes = await uploadDocument(file);
        const actualDocId = uploadRes.engineState?.doc_id;
        if (!actualDocId) {
          throw new Error(
            `Gagal mendapatkan doc_id dari server untuk file: ${file.name}`,
          );
        }
        uploadedFiles.push({ path: actualDocId });
      }

      const result = await filesToPdf(uploadedFiles);

      const finalFilename = outputFilename.endsWith(".pdf")
        ? outputFilename
        : `${outputFilename}.pdf`;

      const downloadUrl = `${API_URL}/doc/download/${result.doc_id}?filename=${encodeURIComponent(
        finalFilename,
      )}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan sistem saat konversi ke PDF.");
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
                  {currentData && currentData.isImage ? (
                    <img
                      src={currentData.url}
                      alt={file.name}
                      className="merge-thumb-img"
                    />
                  ) : (
                    <img
                      src="/assets/file-earmark-richtext-fill.svg"
                      alt="Text File"
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
              accept="image/png,image/jpeg,image/webp,image/bmp,.txt"
              multiple
              id="add-more-filestopdf"
              onChange={handleAddMoreFiles}
              style={{ display: "none" }}
            />
            <label htmlFor="add-more-filestopdf" className="btn-add-circle">
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
        <h2>Files to PDF</h2>
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
          Urutan halaman PDF hasil konversi mengikuti urutan file. Drag untuk
          mengatur ulang.
        </div>

        <div className="sidebar-spacer" style={{ flexGrow: 1 }}></div>

        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <label
            htmlFor="output-filename-ftp"
            style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}
          >
            Simpan hasil konversi sebagai:
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: "6px",
              padding: "4px 12px",
            }}
          >
            <input
              id="output-filename-ftp"
              type="text"
              value={outputFilename}
              onChange={(e) => setOutputFilename(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                flexGrow: 1,
                padding: "8px 0",
                fontSize: "14px",
              }}
              placeholder="Nama file"
            />
            <span
              style={{ color: "#666", fontSize: "14px", userSelect: "none" }}
            >
              .pdf
            </span>
          </div>
        </div>

        <button
          className="btn-action-big"
          onClick={handleConvertAction}
          disabled={isProcessing || files.length < 1}
        >
          {isProcessing ? "Processing..." : "Convert to PDF"}
          {!isProcessing && (
            <img
              src="/assets/arrow-right-circle.svg"
              alt="Convert"
              className="icon-merge-btn"
            />
          )}
        </button>
      </div>
    </div>
  );
}

function MergeWorkspace({ files, setFiles, closeModal }) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mergeFilename, setMergeFilename] = useState("LUNPIA_Merged_Result");

  const [fileData, setFileData] = useState({});

  useEffect(() => {
    let isMounted = true;

    files.forEach((file) => {
      if (!fileData[file.name]) {
        const objectUrl = URL.createObjectURL(file);
        const sizeKB = file.size / 1024;
        const sizeStr =
          sizeKB > 1024
            ? `${(sizeKB / 1024).toFixed(2)} MB`
            : `${sizeKB.toFixed(2)} KB`;

        setFileData((prev) => ({
          ...prev,
          [file.name]: {
            url: objectUrl,
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

            // Render dengan resolusi cukup untuk thumbnail, tidak berat
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const ghostNode = document.createElement("div");
    ghostNode.style.width = "100px";
    ghostNode.style.height = "120px";
    ghostNode.style.backgroundColor = "#f3f4f6";
    ghostNode.style.border = "2px dashed #0078d7";
    ghostNode.style.borderRadius = "8px";
    ghostNode.style.display = "flex";
    ghostNode.style.alignItems = "center";
    ghostNode.style.justifyContent = "center";
    ghostNode.style.position = "absolute";
    ghostNode.style.top = "-1000px";

    const img = document.createElement("img");
    img.src = "/assets/file-pdf-fill.svg";
    img.style.width = "50px";
    ghostNode.appendChild(img);

    document.body.appendChild(ghostNode);
    e.dataTransfer.setDragImage(ghostNode, 50, 60);

    setTimeout(() => {
      if (e.target) {
        e.target.style.opacity = "0.3";
        e.target.style.transform = "scale(0.95)";
      }
      document.body.removeChild(ghostNode);
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

  const handleMergeAction = async () => {
    if (files.length < 2) {
      alert("Harap pilih minimal 2 file untuk digabungkan.");
      return;
    }

    if (!mergeFilename.trim()) {
      alert("Nama file tidak boleh kosong.");
      return;
    }

    setIsProcessing(true);
    try {
      const uploadedFiles = [];
      for (const file of files) {
        const uploadRes = await uploadDocument(file);
        const actualDocId = uploadRes.engineState?.doc_id;

        if (!actualDocId) {
          throw new Error(
            `Gagal mendapatkan doc_id dari server untuk file: ${file.name}`,
          );
        }
        uploadedFiles.push({ path: actualDocId });
      }

      const result = await mergeDocuments(uploadedFiles);

      const finalFilename = mergeFilename.endsWith(".pdf")
        ? mergeFilename
        : `${mergeFilename}.pdf`;

      const downloadUrl = `${API_URL}/doc/download/${result.doc_id}?filename=${encodeURIComponent(
        finalFilename,
      )}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();

      // alert("PDF berhasil digabungkan dan sedang diunduh!");
    } catch (error) {
      console.error(error);
      alert(
        error.message || "Terjadi kesalahan sistem saat menggabungkan PDF.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="merge-workspace-layout">
      {/* Konten Kiri (Grid Preview) */}
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
                  style={{ zIndex: 10, position: "absolute" }} // PERBAIKAN: z-index agar tombol "x" ada di depan iframe
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
            {/* Sisa kode Add More dan Sidebar tetap sama ... */}
            <input
              type="file"
              accept="application/pdf"
              multiple
              id="add-more-merge"
              onChange={handleAddMoreFiles}
              style={{ display: "none" }}
            />
            <label htmlFor="add-more-merge" className="btn-add-circle">
              <img
                src="/assets/plus.svg"
                alt="Add More"
                className="icon-plus-center"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Konten Kanan (Sidebar Aksi) */}
      <div className="merge-action-sidebar">
        <h2>Merge PDF</h2>
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
          Untuk mengubah urutan berkas PDF, drag dan drop berkas ke posisi yang diinginkan.
        </div>

        <div className="sidebar-spacer" style={{ flexGrow: 1 }}></div>

        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <label
            htmlFor="output-filename"
            style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}
          >
            Simpan hasil merge sebagai:
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#fff",
              border: "1px solid #ccc",
              borderRadius: "6px",
              padding: "4px 12px",
            }}
          >
            <input
              id="output-filename"
              type="text"
              value={mergeFilename}
              onChange={(e) => setMergeFilename(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                flexGrow: 1,
                padding: "8px 0",
                fontSize: "14px",
              }}
              placeholder="Nama file"
            />
            <span
              style={{ color: "#666", fontSize: "14px", userSelect: "none" }}
            >
              .pdf
            </span>
          </div>
        </div>

        <button
          className="btn-action-big"
          onClick={handleMergeAction}
          disabled={isProcessing || files.length < 2}
        >
          {isProcessing ? "Processing..." : "Merge PDF"}
          {!isProcessing && (
            <img
              src="/assets/arrow-right-circle.svg"
              alt="Merge"
              className="icon-merge-btn"
            />
          )}
        </button>
      </div>
    </div>
  );
}
