import { useState, useRef } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import Workspace from "./components/Workspace";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

function App() {
  const [activeScreen, setActiveScreen] = useState("home");
  const [activeMenu, setActiveMenu] = useState("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [statusMsg, setStatusMsg] = useState(
    "All rights reserved © LUNPIA 2026",
  );

  const [activeModal, setActiveModal] = useState(null);
  const [featureFiles, setFeatureFiles] = useState([]);

  // State untuk Pop Up Input Password PDF
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    file: null,
    resolve: null,
    error: false,
  });
  const [promptPasswordInput, setPromptPasswordInput] = useState("");

  // State untuk Modal Peringatan (Alert) Custom
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error", // "error" | "lock"
    resolve: null,
  });

  // REFS for hidden file inputs
  const filesToPdfInputRef = useRef(null);
  const rotateFileInputRef = useRef(null);
  const splitFileInputRef = useRef(null);
  const mergeFileInputRef = useRef(null);
  const compressFileInputRef = useRef(null);
  const numberingFileInputRef = useRef(null);
  const protectFileInputRef = useRef(null);
  const lockFileInputRef = useRef(null);
  const signFileInputRef = useRef(null);

  // Functions to trigger file input clicks
  const triggerFilesToPdfUpload = () => filesToPdfInputRef.current?.click();
  const triggerRotateUpload = () => rotateFileInputRef.current?.click();
  const triggerSplitUpload = () => splitFileInputRef.current?.click();
  const triggerMergeUpload = () => mergeFileInputRef.current?.click();
  const triggerCompressUpload = () => compressFileInputRef.current?.click();
  const triggerNumberingUpload = () => numberingFileInputRef.current?.click();
  const triggerProtectUpload = () => protectFileInputRef.current?.click();
  const triggerLockUpload = () => lockFileInputRef.current?.click();
  const triggerSignUpload = () => signFileInputRef.current?.click();

  // Membuka modal input password sebagai Promise yang akan ditunggu oleh fungsi validasi
  const requestPassword = (file, isError = false) => {
    setPromptPasswordInput("");
    return new Promise((resolve) => {
      setPasswordModal({ isOpen: true, file, resolve, error: isError });
    });
  };

  // Menampilkan modal peringatan custom sebagai Promise (agar antrean file tertahan sampai user klik "Mengerti")
  const showAlert = (title, message, type = "error") => {
    return new Promise((resolve) => {
      setAlertModal({ isOpen: true, title, message, type, resolve });
    });
  };

  // Fungsi Inti Interseptor Validasi PDF
  const validatePdf = async (file) => {
    if (file.type !== "application/pdf") return file; // Lewati jika bukan PDF

    let arrayBuffer = await file.arrayBuffer();
    let password = "";
    let pdfDoc = null;
    let isError = false;

    // Loop untuk mencoba membuka PDF
    while (true) {
      try {
        // Penting: Buat salinan buffer. pdf.js akan "memakan" buffer (detach) jika gagal,
        // sehingga percobaan kedua (saat salah password) butuh buffer yang baru.
        const bufferCopy = arrayBuffer.slice(0);

        const loadingTask = pdfjsLib.getDocument({
          data: bufferCopy,
          password,
        });
        pdfDoc = await loadingTask.promise;
        setPasswordModal((prev) => ({ ...prev, isOpen: false })); // Tutup modal jika sukses
        break;
      } catch (err) {
        if (err.name === "PasswordException") {
          // Jika butuh password, tampilkan modal
          const pwd = await requestPassword(file, isError);
          if (pwd === null) {
            setPasswordModal((prev) => ({ ...prev, isOpen: false }));
            return null; // Pengguna menekan Lewati File
          }
          password = pwd;
          isError = true; // Set error true untuk percobaan berikutnya jika masih salah
        } else {
          console.error("Error opening PDF", err);
          setPasswordModal((prev) => ({ ...prev, isOpen: false }));
          await showAlert(
            "Gagal Membaca File",
            `Struktur dokumen "${file.name}" rusak atau tidak dapat dibaca oleh sistem.`,
            "error",
          );
          return null;
        }
      }
    }

    // Pengecekan status Lock / Permissions
    const perms = await pdfDoc.getPermissions();
    // Bit 8 pada privileges PDF.js merepresentasikan hak "MODIFY_CONTENTS"
    if (perms !== null && !perms.includes(8)) {
      await showAlert(
        "Akses Ditolak!",
        `Dokumen "${file.name}" terlock dan dikunci oleh pemiliknya. Anda tidak memiliki izin untuk mengubah isi dokumen ini.`,
        "lock",
      );
      return null;
    }

    // Jika file menggunakan password, simpan agar backend juga bisa mengaksesnya nanti
    if (password) {
      file.password = password;
    }

    return file;
  };

  // Fungsi pemrosesan antrean file secara terpusat
  const processFiles = async (files, featureName, statusActionName) => {
    const validFiles = [];
    for (const file of files) {
      const validated = await validatePdf(file);
      if (validated) {
        validFiles.push(validated);
      }
    }

    if (validFiles.length > 0) {
      setFeatureFiles(validFiles);
      setActiveModal(featureName);
      setStatusMsg(
        `Memilih ${validFiles.length} file untuk ${statusActionName}`,
      );
    }
  };

  // Handlers yang dialihkan menggunakan processFiles
  const handleFilesToPdfChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0)
      await processFiles(files, "filesToPdf", "dikonversi ke PDF");
    if (e.target) e.target.value = null;
  };

  const handleRotateFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) await processFiles(files, "rotate", "diputar");
    if (e.target) e.target.value = null;
  };

  const handleSplitFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) await processFiles(files, "split", "dipisahkan");
    if (e.target) e.target.value = null;
  };

  const handleMergeFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) await processFiles(files, "merge", "digabungkan");
    if (e.target) e.target.value = null;
  };

  const handleCompressFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) await processFiles(files, "compress", "dikompres");
    if (e.target) e.target.value = null;
  };

  const handleNumberingFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0)
      await processFiles(files, "numbering", "diberi nomor halaman");
    if (e.target) e.target.value = null;
  };

  const handleProtectFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0)
      await processFiles(files, "protect", "diberi password");
    if (e.target) e.target.value = null;
  };

  const handleLockFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) await processFiles(files, "lock", "dikunci");
    if (e.target) e.target.value = null;
  };

  const handleSignFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) await processFiles(files, "sign", "ditandatangani");
    if (e.target) e.target.value = null;
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setFeatureFiles([]);
    setStatusMsg("All rights reserved © LUNPIA 2026");
  };

  const openQrGenerator = () => {
    setFeatureFiles([]);
    setActiveModal("qrGenerator");
    setStatusMsg("Membuat QR Code");
  };

  const openQrScanner = () => {
    setFeatureFiles([]);
    setActiveModal("qrScanner");
    setStatusMsg("Memindai QR Code");
  };

  return (
    <>
      {/* MODAL POP UP KECIL UNTUK ALERT CUSTOM (Peringatan & Locked) */}
      {alertModal.isOpen && (
        <div className="workspace-feature-overlay" style={{ zIndex: 10000 }}>
          <div
            className="workspace-feature-modal"
            style={{
              maxWidth: "380px",
              height: "auto",
              padding: "24px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            {alertModal.type === "lock" ? (
              <svg
                width="54"
                height="54"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--danger)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: "16px" }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            ) : (
              <svg
                width="54"
                height="54"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--danger)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginBottom: "16px" }}
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            )}

            <h3
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "var(--text-primary)",
              }}
            >
              {alertModal.title}
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                marginBottom: "24px",
                lineHeight: "1.5",
              }}
            >
              {alertModal.message}
            </p>

            <button
              className="btn btn-primary"
              onClick={() => {
                if (alertModal.resolve) alertModal.resolve();
                setAlertModal((prev) => ({ ...prev, isOpen: false }));
              }}
              style={{ width: "100%", padding: "10px" }}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* MODAL POP UP KECIL UNTUK PASSWORD */}
      {passwordModal.isOpen && (
        <div className="workspace-feature-overlay" style={{ zIndex: 9999 }}>
          <div
            className="workspace-feature-modal"
            style={{
              maxWidth: "380px",
              height: "auto",
              padding: "24px",
              borderRadius: "12px",
              textAlign: "left",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: "var(--text-primary)",
              }}
            >
              File Terenkripsi
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "14px",
                marginBottom: "16px",
                lineHeight: "1.5",
              }}
            >
              Dokumen <strong>{passwordModal.file?.name}</strong> dilindungi
              oleh password. Masukkan password untuk membukanya.
            </p>

            {passwordModal.error && (
              <div
                style={{
                  color: "var(--danger)",
                  fontSize: "13px",
                  marginBottom: "12px",
                  fontWeight: "500",
                }}
              >
                Password salah, silakan coba lagi.
              </div>
            )}

            <input
              type="password"
              className="form-control"
              value={promptPasswordInput}
              onChange={(e) => setPromptPasswordInput(e.target.value)}
              style={{
                width: "100%",
                marginBottom: "20px",
                background: "var(--surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
              }}
              placeholder="Masukkan password..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  passwordModal.resolve(promptPasswordInput);
                }
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => passwordModal.resolve(null)}
              >
                Lewati File
              </button>
              <button
                className="btn btn-primary"
                onClick={() => passwordModal.resolve(promptPasswordInput)}
              >
                Buka Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="app-container">
        <Sidebar
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <div id="main-content">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp,.txt"
            multiple
            ref={filesToPdfInputRef}
            onChange={handleFilesToPdfChange}
            style={{ display: "none" }}
          />

          <input
            type="file"
            accept="application/pdf"
            ref={rotateFileInputRef}
            onChange={handleRotateFileChange}
            style={{ display: "none" }}
          />

          <input
            type="file"
            accept="application/pdf"
            ref={splitFileInputRef}
            onChange={handleSplitFileChange}
            style={{ display: "none" }}
          />

          <input
            type="file"
            accept="application/pdf"
            multiple
            ref={mergeFileInputRef}
            onChange={handleMergeFileChange}
            style={{ display: "none" }}
          />

          <input
            type="file"
            accept="application/pdf"
            ref={compressFileInputRef}
            onChange={handleCompressFileChange}
            style={{ display: "none" }}
          />

          <input
            type="file"
            accept="application/pdf"
            ref={numberingFileInputRef}
            onChange={handleNumberingFileChange}
            style={{ display: "none" }}
          />

          <input
            type="file"
            accept="application/pdf"
            multiple
            ref={protectFileInputRef}
            onChange={handleProtectFileChange}
            style={{ display: "none" }}
          />

          <input
            type="file"
            accept="application/pdf"
            multiple
            ref={lockFileInputRef}
            onChange={handleLockFileChange}
            style={{ display: "none" }}
          />

          <input
            type="file"
            accept="application/pdf"
            ref={signFileInputRef}
            onChange={handleSignFileChange}
            style={{ display: "none" }}
          />

          <Home
            activeScreen={activeScreen}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            triggerMergeUpload={triggerMergeUpload}
            triggerFilesToPdfUpload={triggerFilesToPdfUpload}
            triggerRotateUpload={triggerRotateUpload}
            triggerSplitUpload={triggerSplitUpload}
            triggerCompressUpload={triggerCompressUpload}
            triggerNumberingUpload={triggerNumberingUpload}
            triggerProtectUpload={triggerProtectUpload}
            triggerLockUpload={triggerLockUpload}
            triggerSignUpload={triggerSignUpload}
            openQrGenerator={openQrGenerator}
            openQrScanner={openQrScanner}
          />

          <Workspace
            activeModal={activeModal}
            closeModal={handleCloseModal}
            files={featureFiles}
            setFiles={setFeatureFiles}
          />
        </div>
      </div>

      <div id="status-bar">
        <span id="status-msg">{statusMsg}</span>
        <span>Balai Besar POM di Semarang</span>
      </div>
    </>
  );
}

export default App;
