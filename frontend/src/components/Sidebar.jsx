import { useEffect, useRef } from "react";

const NAV_ITEMS = [
  {
    key: "home",
    label: "Home",
    icon: "/assets/house-fill.svg",
    section: null,
  },
  {
    key: "doc-conversion",
    label: "Doc Conversion",
    icon: "/assets/file-earmark-richtext-fill.svg",
    section: "cat-doc-conversion",
  },
  {
    key: "pdf-tools",
    label: "PDF Tools",
    icon: "/assets/file-pdf-fill.svg",
    section: "cat-pdf-tools",
  },
  {
    key: "qr-code",
    label: "QR Code",
    icon: "/assets/qr-code.svg",
    section: "cat-qr-code",
  },
];

export default function Sidebar({
  activeScreen,
  setActiveScreen,
  activeMenu,
  setActiveMenu,
  isCollapsed,
  toggleSidebar,
  docDetails,
}) {
  const navRefs = useRef({});
  const indicatorRef = useRef(null);

  const resolvedActiveKey =
    activeScreen === "workspace" ? "pdf-tools" : activeMenu;

  const moveIndicator = () => {
    const el = navRefs.current[resolvedActiveKey];
    const indicator = indicatorRef.current;
    if (!indicator) return;

    if (el) {
      indicator.style.transform = `translateY(${el.offsetTop}px)`;
      indicator.style.height = `${el.offsetHeight}px`;
      indicator.style.opacity = "1";
    } else {
      indicator.style.opacity = "0";
    }
  };

  useEffect(() => {
    moveIndicator();
  }, [resolvedActiveKey, isCollapsed]);

  useEffect(() => {
    window.addEventListener("resize", moveIndicator);
    return () => window.removeEventListener("resize", moveIndicator);
  }, [resolvedActiveKey]);

  const handleNavClick = (item) => {
    if (item.key === "pdf-tools" && docDetails) {
      setActiveScreen("workspace");
      setActiveMenu("pdf-tools");
      return;
    }

    setActiveScreen("home");
    setActiveMenu(item.key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (item.section) {
          const target = document.getElementById(item.section);
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        } else {
          const hero = document.getElementById("screen-home-hero");
          if (hero) {
            hero.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      });
    });
  };

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

      <div className="nav-list">
        <div ref={indicatorRef} className="nav-indicator" />

        <div
          ref={(el) => (navRefs.current["home"] = el)}
          className={`nav-btn ${resolvedActiveKey === "home" ? "active" : ""}`}
          onClick={() => handleNavClick(NAV_ITEMS[0])}
        >
          <img src={NAV_ITEMS[0].icon} className="nav-icon" alt="Home" />
          <span className="nav-text">Home</span>
        </div>

        <div className="sidebar-label">CATEGORIES</div>

        <div
          ref={(el) => (navRefs.current["doc-conversion"] = el)}
          className={`nav-btn ${
            resolvedActiveKey === "doc-conversion" ? "active" : ""
          }`}
          onClick={() => handleNavClick(NAV_ITEMS[1])}
        >
          <img
            src={NAV_ITEMS[1].icon}
            className="nav-icon"
            alt="Doc Conversion"
          />
          <span className="nav-text">Doc Conversion</span>
        </div>

        <div
          ref={(el) => (navRefs.current["pdf-tools"] = el)}
          className={`nav-btn ${
            resolvedActiveKey === "pdf-tools" ? "active" : ""
          }`}
          onClick={() => handleNavClick(NAV_ITEMS[2])}
        >
          <img src={NAV_ITEMS[2].icon} className="nav-icon" alt="PDF Tools" />
          <span className="nav-text">PDF Tools</span>
        </div>

        <div
          ref={(el) => (navRefs.current["qr-code"] = el)}
          className={`nav-btn ${
            resolvedActiveKey === "qr-code" ? "active" : ""
          }`}
          onClick={() => handleNavClick(NAV_ITEMS[3])}
        >
          <img src={NAV_ITEMS[3].icon} className="nav-icon" alt="QR Code" />
          <span className="nav-text">QR Code</span>
        </div>
      </div>
    </div>
  );
}
