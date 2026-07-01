import { useState, useRef } from "react";
import { uploadDocument, closeDocumentApi } from "./api";
import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import Workspace from "./components/Workspace";

function App() {
  const [activeScreen, setActiveScreen] = useState("home");
  const [activeMenu, setActiveMenu] = useState("home"); // key indikator sidebar: home | doc-conversion | pdf-tools | qr-code
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [statusMsg, setStatusMsg] = useState(
    "All rights reserved © LUNPIA 2026",
  );
  const [docDetails, setDocDetails] = useState(null);

  const fileInputRef = useRef(null);

  const triggerFileUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatusMsg("⏳ Memproses dokumen...");

    try {
      const result = await uploadDocument(file);
      if (result.engineState && result.engineState.doc_id) {
        setDocDetails(result.engineState);
        setStatusMsg(
          `${result.engineState.filename} | Total: ${result.engineState.total_pages} Pages`,
        );
        setActiveScreen("workspace");
        setActiveMenu("pdf-tools"); // sinkronkan indikator sidebar ke PDF Tools
      }
    } catch (error) {
      setStatusMsg("❌ Gagal terhubung ke sistem.");
      console.error(error);
    }

    e.target.value = null;
  };

  const closeDocument = async () => {
    if (docDetails) {
      try {
        await closeDocumentApi(docDetails.doc_id);
      } catch (e) {
        console.error(e);
      }
    }
    setDocDetails(null);
    setActiveScreen("home");
    setActiveMenu("home"); // kembalikan indikator sidebar ke Home
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
          docDetails={docDetails}
        />

        <div id="main-content">
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <Home
            activeScreen={activeScreen}
            triggerFileUpload={triggerFileUpload}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />

          <Workspace
            activeScreen={activeScreen}
            docDetails={docDetails}
            triggerFileUpload={triggerFileUpload}
            closeDocument={closeDocument}
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
