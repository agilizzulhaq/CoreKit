import { useState, useRef } from "react";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import Workspace from "./components/Workspace";

function App() {
  const [activeScreen, setActiveScreen] = useState("home");
  const [activeMenu, setActiveMenu] = useState("home");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [statusMsg, setStatusMsg] = useState(
    "All rights reserved © LUNPIA 2026",
  );

  const [activeModal, setActiveModal] = useState(null);
  const [featureFiles, setFeatureFiles] = useState([]);

  // REFS for hidden file inputs to trigger file selection dialogs
  const filesToPdfInputRef = useRef(null);
  const rotateFileInputRef = useRef(null);
  const splitFileInputRef = useRef(null);
  const mergeFileInputRef = useRef(null);
  const compressFileInputRef = useRef(null);
  const numberingFileInputRef = useRef(null);
  const protectFileInputRef = useRef(null);
  const lockFileInputRef = useRef(null);
  const signFileInputRef = useRef(null);

  // Functions to trigger file input clicks for each feature
  const triggerFilesToPdfUpload = () => {
    if (filesToPdfInputRef.current) filesToPdfInputRef.current.click();
  };

  const triggerRotateUpload = () => {
    if (rotateFileInputRef.current) rotateFileInputRef.current.click();
  };

  const triggerSplitUpload = () => {
    if (splitFileInputRef.current) splitFileInputRef.current.click();
  };

  const triggerMergeUpload = () => {
    if (mergeFileInputRef.current) mergeFileInputRef.current.click();
  };

  const triggerCompressUpload = () => {
    if (compressFileInputRef.current) compressFileInputRef.current.click();
  };

  const triggerNumberingUpload = () => {
    if (numberingFileInputRef.current) numberingFileInputRef.current.click();
  };

  const triggerProtectUpload = () => {
    if (protectFileInputRef.current) protectFileInputRef.current.click();
  };

  const triggerLockUpload = () => {
    if (lockFileInputRef.current) lockFileInputRef.current.click();
  };

  const triggerSignUpload = () => {
    if (signFileInputRef.current) signFileInputRef.current.click();
  };

  // Handlers for file input changes to set the selected files and open the corresponding workspace modal
  const handleFilesToPdfChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFeatureFiles(files);
      setActiveModal("filesToPdf");
      setStatusMsg(`Memilih ${files.length} file untuk dikonversi ke PDF`);
    }
    e.target.value = null;
  };

  const handleRotateFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFeatureFiles(files);
      setActiveModal("rotate");
      setStatusMsg(`Memilih ${files[0].name} untuk diputar`);
    }
    e.target.value = null;
  };

  const handleSplitFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFeatureFiles(files);
      setActiveModal("split");
      setStatusMsg(`Memilih ${files[0].name} untuk dipisahkan`);
    }
    e.target.value = null;
  };

  const handleMergeFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFeatureFiles(files);
      setActiveModal("merge");
      setStatusMsg(`Memilih ${files.length} file untuk digabungkan`);
    }
    e.target.value = null;
  };

  const handleCompressFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFeatureFiles(files);
      setActiveModal("compress");
      setStatusMsg(`Memilih ${files[0].name} untuk dikompres`);
    }
    e.target.value = null;
  };

  const handleNumberingFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFeatureFiles(files);
      setActiveModal("numbering");
      setStatusMsg(`Memilih ${files[0].name} untuk diberi nomor halaman`);
    }
    e.target.value = null;
  };

  const handleProtectFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFeatureFiles(files);
      setActiveModal("protect");
      setStatusMsg(`Memilih ${files.length} file untuk diberi password`);
    }
    e.target.value = null;
  };

  const handleLockFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFeatureFiles(files);
      setActiveModal("lock");
      setStatusMsg(`Memilih ${files.length} file untuk dikunci`);
    }
    e.target.value = null;
  };

  const handleSignFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFeatureFiles(files);
      setActiveModal("sign");
      setStatusMsg(`Memilih ${files[0].name} untuk ditandatangani`);
    }
    e.target.value = null;
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

  return (
    <>
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
