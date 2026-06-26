import { useState } from "react";
import { API_URL } from "../api";

export default function Workspace({
  activeScreen,
  docDetails,
  triggerFileUpload,
  closeDocument,
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [isFitMode, setIsFitMode] = useState(true);
  const [isPanMode, setIsPanMode] = useState(false);

  const handleZoomIn = () => {
    if (zoom < 3.0) {
      setZoom((prev) => prev + 0.25);
      setIsFitMode(false);
    }
  };
  const handleZoomOut = () => {
    if (zoom > 0.5) {
      setZoom((prev) => prev - 0.25);
      setIsFitMode(false);
    }
  };
  const handleFitWidth = () => {
    setIsFitMode(true);
    setZoom(1.0);
  };

  const renderUrl = docDetails
    ? `${API_URL}/doc/render/${docDetails.doc_id}/${currentPage}?zoom=${isFitMode ? 2.0 : zoom * 2.0}`
    : "";

  return (
    <div
      id="screen-workspace"
      className={`screen ${activeScreen === "workspace" ? "active" : ""}`}
    >
      {/* RIBBON TOOLBAR */}
      <div className="ribbon">
        <div className="ribbon-group">
          <button className="tool-btn" onClick={closeDocument}>
            <img
              src="/assets/house-fill.svg"
              className="tool-icon"
              alt="Home"
            />
            Home
          </button>
          <button className="tool-btn" onClick={triggerFileUpload}>
            <img
              src="/assets/folder-fill.svg"
              className="tool-icon"
              alt="Open"
            />
            Open
          </button>
          <span className="group-label">FILE</span>
        </div>
        <div className="ribbon-group">
          <button className="tool-btn" disabled>
            <img
              src="/assets/arrow-counterclockwise.svg"
              className="tool-icon"
              alt="Undo"
            />
            Undo
          </button>
          <button className="tool-btn" disabled>
            <img
              src="/assets/arrow-clockwise.svg"
              className="tool-icon"
              alt="Redo"
            />
            Redo
          </button>
          <span className="group-label">HISTORY</span>
        </div>
        <div className="ribbon-group">
          <button className="tool-btn">
            <img
              src="/assets/arrow-repeat.svg"
              className="tool-icon"
              alt="Rotate"
            />
            Rotate
          </button>
          <button className="tool-btn">
            <img src="/assets/scissors.svg" className="tool-icon" alt="Split" />
            Split
          </button>
          <span className="group-label">PAGE</span>
        </div>
      </div>

      <div className="workspace-body">
        <div className="viewer-area">
          {/* PDF VIEWER */}
          <div
            id="viewer-container"
            className={`${isFitMode ? "fit-mode" : ""} ${isPanMode ? "pan-mode" : ""}`}
          >
            {docDetails ? (
              <div className="page-wrapper">
                <div
                  className="page-controls"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: "10px",
                  }}
                >
                  <button
                    className="page-btn"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(0, prev - 1))
                    }
                    disabled={currentPage === 0}
                  >
                    ◀
                  </button>
                  <span style={{ margin: "0 10px" }}>
                    Page {currentPage + 1} / {docDetails.total_pages}
                  </span>
                  <button
                    className="page-btn"
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(docDetails.total_pages - 1, prev + 1),
                      )
                    }
                    disabled={currentPage === docDetails.total_pages - 1}
                  >
                    ▶
                  </button>
                </div>
                <img
                  src={renderUrl}
                  alt={`Halaman ${currentPage + 1}`}
                  className="pdf-img loaded"
                  style={{
                    width: isFitMode ? "100%" : `${zoom * 100}%`,
                    transition: "width 0.2s ease-out",
                  }}
                  draggable="false"
                  key={renderUrl}
                />
              </div>
            ) : (
              <p style={{ marginTop: "50px", color: "#666" }}>
                Tidak ada dokumen aktif.
              </p>
            )}
          </div>

          {/* FLOAT ZOOM CONTROLS */}
          <div id="float-frame">
            <button className="float-btn" onClick={handleZoomOut}>
              −
            </button>
            <span id="zoom-text-float">
              {isFitMode ? "Fit" : `${Math.round(zoom * 100)}%`}
            </span>
            <button className="float-btn" onClick={handleZoomIn}>
              +
            </button>
            <div className="float-divider"></div>
            <button
              className="float-btn"
              title="Fit Width"
              onClick={handleFitWidth}
            >
              <img src="/assets/fullscreen.svg" alt="Fit Width" />
            </button>
            <div className="float-divider"></div>
            <button
              className={`float-btn ${isPanMode ? "active" : ""}`}
              onClick={() => setIsPanMode(!isPanMode)}
            >
              <img src="/assets/hand-index-fill.svg" alt="Pan Tool" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
