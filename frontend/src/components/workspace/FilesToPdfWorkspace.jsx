import { useRef, useState, useEffect } from "react";
import { uploadDocument, filesToPdf, API_URL } from "../../api";

export default function FilesToPdfWorkspace({ files, setFiles, closeModal }) {
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
        const uploadRes = await uploadDocument(file, file.password);
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
            style={{
              fontSize: "14px",
              fontWeight: "500",
              color: "var(--text-primary)",
            }}
          >
            Simpan hasil konversi sebagai:
          </label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--surface)",
              border: "1px solid var(--border)",
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
                background: "transparent",
                color: "var(--text-primary)",
              }}
              placeholder="Nama file"
            />
            <span
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                userSelect: "none",
              }}
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
