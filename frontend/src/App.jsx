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

  // State baru untuk fitur spesifik
  const [activeModal, setActiveModal] = useState(null);
  const [featureFiles, setFeatureFiles] = useState([]);

  const mergeFileInputRef = useRef(null);
  const filesToPdfInputRef = useRef(null);

  // Trigger input file khusus untuk Merge (Bisa multiple files)
  const triggerMergeUpload = () => {
    if (mergeFileInputRef.current) mergeFileInputRef.current.click();
  };

  const triggerFilesToPdfUpload = () => {
    if (filesToPdfInputRef.current) filesToPdfInputRef.current.click();
  };

  const handleMergeFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFeatureFiles(files);
      setActiveModal("merge");
      setStatusMsg(`Memilih ${files.length} file untuk digabungkan`);
    }
    e.target.value = null; // Reset input
  };

  const handleFilesToPdfChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFeatureFiles(files);
      setActiveModal("filesToPdf");
      setStatusMsg(`Memilih ${files.length} file untuk dikonversi ke PDF`);
    }
    e.target.value = null;
  };

  const handleCloseModal = () => {
    setActiveModal(null);
    setFeatureFiles([]);
    setStatusMsg("All rights reserved © LUNPIA 2026");
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
            multiple
            ref={mergeFileInputRef}
            onChange={handleMergeFileChange}
            style={{ display: "none" }}
          />

          <Home
            activeScreen={activeScreen}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            triggerMergeUpload={triggerMergeUpload}
            triggerFilesToPdfUpload={triggerFilesToPdfUpload}
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
