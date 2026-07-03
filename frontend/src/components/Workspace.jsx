import { useRef, useState, useEffect } from "react";
import { mergeDocuments, uploadDocument, API_URL } from "../api";

export default function Workspace({
  activeModal,
  closeModal,
  files,
  setFiles,
}) {
  if (!activeModal) return null;

  const renderFeatureWorkspace = () => {
    switch (activeModal) {
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

// --- SUB-KOMPONEN KHUSUS FITUR MERGE ---
function MergeWorkspace({ files, setFiles, closeModal }) {
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // State untuk menyimpan URL blob dan Metadata (Size & Pages)
  const [fileData, setFileData] = useState({});

  useEffect(() => {
    let isMounted = true;

    files.forEach((file) => {
      // Jika file belum ada di state fileData, kita proses
      if (!fileData[file.name]) {
        const objectUrl = URL.createObjectURL(file);
        const sizeKB = file.size / 1024;
        const sizeStr =
          sizeKB > 1024
            ? `${(sizeKB / 1024).toFixed(2)} MB`
            : `${sizeKB.toFixed(2)} KB`;

        // Set state awal: URL siap (agar preview muncul), teks tooltip "Menghitung..."
        setFileData((prev) => ({
          ...prev,
          [file.name]: {
            url: objectUrl,
            tooltip: `${sizeStr} - Menghitung hal...`,
          },
        }));

        // Kalkulasi halaman (Mencoba mencari pola regex di binary PDF)
        const reader = new FileReader();
        reader.onload = (e) => {
          if (!isMounted) return;
          const content = e.target.result;

          // Cari pola Count halaman (beberapa pola umum)
          const countMatch = content.match(/\/Count\s+(\d+)/);
          let pages = "?"; // Default jika terkompresi

          if (countMatch && countMatch[1]) {
            pages = countMatch[1];
          } else {
            // Coba hitung jumlah objek Type /Page (jika tidak terkompresi)
            const typeMatch = content.match(/\/Type\s*\/Page[\s>\/]/g);
            if (typeMatch) pages = typeMatch.length;
          }

          // Update tooltip dengan hasil final
          setFileData((prev) => ({
            ...prev,
            [file.name]: {
              ...prev[file.name],
              tooltip: `${sizeStr} - ${pages} pages`,
            },
          }));
        };

        // Jika file terlalu besar, cukup baca 100KB pertama agar tidak lag
        const slice = file.size > 102400 ? file.slice(0, 102400) : file;
        reader.readAsBinaryString(slice);
      }
    });

    return () => {
      isMounted = false;
      // Catatan: Kita tidak me-revoke URL di sini untuk mencegah bug layar abu-abu
      // saat React 18 Strict Mode melakukan unmount-remount beruntun saat drag & drop.
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
    setTimeout(() => {
      if (e.target) e.target.classList.add("dragging");
    }, 0);
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = (e) => {
    if (e.target) e.target.classList.remove("dragging");
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

    setIsProcessing(true);
    try {
      // 1. Upload semua file biner satu per satu ke server
      const uploadedFiles = [];
      for (const file of files) {
        const uploadRes = await uploadDocument(file);

        // Ambil doc_id dari engineState yang diberikan Gateway
        const actualDocId = uploadRes.engineState?.doc_id;

        if (!actualDocId) {
          throw new Error(
            `Gagal mendapatkan doc_id dari server untuk file: ${file.name}`,
          );
        }

        // Kita "mengakali" api.js dengan memasukkan doc_id ke dalam kunci path
        uploadedFiles.push({ path: actualDocId });
      }

      // 2. Eksekusi merge dengan array of paths dari server
      const result = await mergeDocuments(uploadedFiles);

      const savePath = window.prompt(
        "Simpan hasil merge sebagai:",
        "LUNPIA_Merged_Result.pdf",
      );
      if (!savePath) return;

      const downloadUrl = `${API_URL}/doc/download/${result.doc_id}?filename=${encodeURIComponent(savePath)}`;

      // Membuat elemen <a> secara tidak kasat mata untuk men-trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      link.remove(); // Hapus elemen setelah diklik agar DOM tetap bersih

      alert(
        "PDF berhasil digabungkan dan sedang diunduh ke folder Downloads Anda!",
      );
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
                // Key menggunakan kombinasi name dan index agar React merender ulang iframe
                // dengan bersih saat urutannya berubah, menghindari iframe crash (abu-abu).
                key={`${file.name}-${index}`}
                className="merge-item"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* Tooltip Comment Size & Pages */}
                <div className="merge-item-tooltip">
                  {currentData ? currentData.tooltip : "Membaca data..."}
                </div>

                <button
                  className="btn-remove-item"
                  onClick={() => handleRemoveFile(index)}
                  title="Remove file"
                >
                  ✕
                </button>

                <div className="merge-item-thumbnail">
                  <div className="preview-overlay"></div>
                  {currentData && currentData.url ? (
                    <iframe
                      src={`${currentData.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                      className="pdf-iframe-preview"
                      title={file.name}
                      scrolling="no"
                      frameBorder="0"
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
              id="add-more-merge"
              onChange={handleAddMoreFiles}
              style={{ display: "none" }}
            />
            {/* Menggunakan aset SVG yang Anda sediakan */}
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
          To change the order of your PDFs, drag and drop the files as you want.
        </div>

        <div className="sidebar-spacer"></div>

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
