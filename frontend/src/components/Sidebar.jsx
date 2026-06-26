export default function Sidebar({
  activeScreen,
  setActiveScreen,
  isCollapsed,
  toggleSidebar,
  docDetails,
}) {
  return (
    <div id="sidebar" className={isCollapsed ? "collapsed" : ""}>
      <div className="sidebar-header">
        <img
          src="/assets/list.svg"
          className="burger-btn"
          alt="Menu"
          onClick={toggleSidebar}
        />
        <span className="brand">LUNPIA</span>
      </div>

      <div
        className={`nav-btn ${activeScreen === "home" ? "active" : ""}`}
        onClick={() => setActiveScreen("home")}
      >
        <img src="/assets/house-fill.svg" className="nav-icon" alt="Home" />
        <span className="nav-text">Home</span>
      </div>

      <div className="sidebar-label">CATEGORIES</div>

      <div className="nav-btn" onClick={() => setActiveScreen("home")}>
        <img
          src="/assets/file-earmark-richtext-fill.svg"
          className="nav-icon"
          alt="Doc Conversion"
        />
        <span className="nav-text">Doc Conversion</span>
      </div>

      <div
        className={`nav-btn ${activeScreen === "workspace" ? "active" : ""}`}
        onClick={() => {
          if (docDetails) setActiveScreen("workspace");
        }}
      >
        <img
          src="/assets/file-pdf-fill.svg"
          className="nav-icon"
          alt="PDF Tools"
        />
        <span className="nav-text">PDF Tools</span>
      </div>

      <div className="nav-btn" onClick={() => setActiveScreen("home")}>
        <img src="/assets/qr-code.svg" className="nav-icon" alt="QR Code" />
        <span className="nav-text">QR Code</span>
      </div>
    </div>
  );
}
