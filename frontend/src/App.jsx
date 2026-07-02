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
  const [activeModal, setActiveModal] = useState(null); // 'merge', 'split', dll
  const [featureFiles, setFeatureFiles] = useState([]); // Menyimpan file untuk diproses

  const mergeFileInputRef = useRef(null);

  // Trigger input file khusus untuk Merge (Bisa multiple files)
  const triggerMergeUpload = () => {
    if (mergeFileInputRef.current) mergeFileInputRef.current.click();
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
          {/* Input file khusus Merge (multiple) */}
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
          />

          {/* Workspace sekarang bertindak sebagai Modal Manager untuk tiap fitur */}
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
