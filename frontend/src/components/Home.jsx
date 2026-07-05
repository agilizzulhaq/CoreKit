import { useEffect, useRef, useState } from "react";

const SECTION_KEY_MAP = [
  { id: "cat-doc-conversion", key: "doc-conversion" },
  { id: "cat-pdf-tools", key: "pdf-tools" },
  { id: "cat-qr-code", key: "qr-code" },
];
const SCROLLSPY_OFFSET = 120;

export default function Home({
  activeScreen,
  setIsSidebarHidden,
  activeMenu,
  setActiveMenu,
  triggerFilesToPdfUpload,
  triggerRotateUpload,
  triggerMergeUpload,
  triggerSplitUpload,
  triggerCompressUpload,
  triggerNumberingUpload,
  triggerProtectUpload,
  triggerLockUpload,
  triggerSignUpload,
  openQrGenerator,
  openQrScanner,
}) {
  const toolsRef = useRef(null);
  const heroRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (typeof setIsSidebarHidden === "function")
            setIsSidebarHidden(false);
          computeActiveSection();
        } else {
          if (typeof setIsSidebarHidden === "function")
            setIsSidebarHidden(true);
          if (typeof setActiveMenu === "function") setActiveMenu("home");
        }
      },
      { threshold: 0.2 },
    );
    if (toolsRef.current) observer.observe(toolsRef.current);
    return () => {
      if (toolsRef.current) observer.unobserve(toolsRef.current);
    };
  }, [setIsSidebarHidden]);

  const computeActiveSection = () => {
    const container = toolsRef.current;
    if (!container || typeof setActiveMenu !== "function") return;
    const containerTop = container.getBoundingClientRect().top;
    let currentKey = SECTION_KEY_MAP[0].key;
    for (const { id, key } of SECTION_KEY_MAP) {
      const el = document.getElementById(id);
      if (!el) continue;
      const relativeTop = el.getBoundingClientRect().top - containerTop;
      if (relativeTop <= SCROLLSPY_OFFSET) currentKey = key;
    }
    setActiveMenu(currentKey);
  };

  useEffect(() => {
    const container = toolsRef.current;
    if (!container) return;
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        computeActiveSection();
        ticking = false;
      });
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [setActiveMenu]);

  const handleFeatureClick = (e, featureName) => {
    e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" });
    alert(
      `Membuka modul: ${featureName}\n(Akan dihubungkan ke fitur selanjutnya)`,
    );
  };

  const scrollToTools = () => {
    const toolsContainer = document.getElementById("home-tools-container");
    if (toolsContainer) toolsContainer.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      id="screen-home"
      className={`screen ${activeScreen === "home" ? "active" : ""}`}
    >
      <div className="hero" id="screen-home-hero" ref={heroRef}>
        <div
          className="hero-bg-photo"
          style={{ backgroundImage: "url(/assets/bbpom.jpg)" }}
          aria-hidden="true"
        ></div>
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge">Layanan Unit PDF Integrasi Akurat</div>
            <h1>
              <span className="hero-title-main">LUNPIA</span>
              <span className="hero-title-sub">Workspace</span>
            </h1>
            <p>
              Kelola, gabungkan, dan amankan dokumen PDF dalam satu ruang kerja
              yang cepat dan rapi.
            </p>
            <div className="hero-chips">
              <button
                className="hero-chip"
                onClick={() =>
                  document
                    .getElementById("cat-doc-conversion")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Konversi Dokumen
              </button>
              <button
                className="hero-chip"
                onClick={() =>
                  document
                    .getElementById("cat-pdf-tools")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                PDF Tools
              </button>
              <button
                className="hero-chip"
                onClick={() =>
                  document
                    .getElementById("cat-qr-code")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                QR Code
              </button>
            </div>
          </div>

          <div className="hero-illustration" aria-hidden="true">
            <div className="doc-stack">
              <div className="doc-card doc-card-3"></div>
              <div className="doc-card doc-card-2"></div>
              <div className="doc-card doc-card-1">
                <span className="doc-line doc-line-title"></span>
                <span className="doc-line"></span>
                <span className="doc-line"></span>
                <span className="doc-line doc-line-short"></span>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator" onClick={scrollToTools}>
          <span className="scroll-text">Scroll to see features</span>
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      <div
        id="home-tools-container"
        ref={toolsRef}
        className={isVisible ? "animate-in" : ""}
      >
        <div className="features-wrapper">
          <div className="category-header" id="cat-doc-conversion">
            <img
              src="/assets/file-earmark-richtext-fill.svg"
              alt="Doc Conversion Icon"
            />
            <h2>Document Conversion</h2>
          </div>
          <div className="grid" id="grid-doc-conversion">
            <div className="card" onClick={triggerFilesToPdfUpload}>
              <div className="card-icon">
                <img
                  src="/assets/file-earmark-richtext-fill.svg"
                  alt="Files to PDF"
                />
              </div>
              <div className="card-text">
                <h3>Files to PDF</h3>
                <p>Convert images & text into a PDF document</p>
              </div>
            </div>
          </div>

          {/* --- PDF TOOLS --- */}
          <div className="category-header mt-30" id="cat-pdf-tools">
            <img src="/assets/file-pdf-fill.svg" alt="PDF Icon" />
            <h2>PDF Tools</h2>
          </div>
          <div className="grid" id="grid-pdf-tools">
            {/* Open PDF dihapus dari sini */}

            <div className="card" onClick={triggerRotateUpload}>
              <div className="card-icon">
                <img src="/assets/arrow-repeat.svg" alt="Rotate PDF" />
              </div>
              <div className="card-text">
                <h3>Rotate PDF</h3>
                <p>Rotate pages clockwise or counter-clockwise</p>
              </div>
            </div>

            <div className="card" onClick={triggerSplitUpload}>
              <div className="card-icon">
                <img src="/assets/scissors.svg" alt="Split PDF" />
              </div>
              <div className="card-text">
                <h3>Split PDF</h3>
                <p>Extract or separate specific pages</p>
              </div>
            </div>

            {/* Panggil fungsi triggerMergeUpload di sini */}
            <div className="card" onClick={triggerMergeUpload}>
              <div className="card-icon">
                <img src="/assets/file-earmark-plus-fill.svg" alt="Merge PDF" />
              </div>
              <div className="card-text">
                <h3>Merge PDF</h3>
                <p>Combine multiple PDF files into one</p>
              </div>
            </div>

            <div className="card" onClick={triggerCompressUpload}>
              <div className="card-icon">
                <img
                  src="/assets/file-earmark-zip-fill.svg"
                  alt="Compress PDF"
                />
              </div>
              <div className="card-text">
                <h3>Compress PDF</h3>
                <p>Reduce file size for easier sharing</p>
              </div>
            </div>

            <div className="card" onClick={triggerNumberingUpload}>
              <div className="card-icon">
                <img src="/assets/123.svg" alt="Page Numbering" />
              </div>
              <div className="card-text">
                <h3>Page Numbering</h3>
                <p>Add custom page numbers to document</p>
              </div>
            </div>

            <div className="card" onClick={triggerSignUpload}>
              <div className="card-icon">
                <img src="/assets/vector-pen.svg" alt="Signature" />
              </div>
              <div className="card-text">
                <h3>Signature</h3>
                <p>Add your signature to the document</p>
              </div>
            </div>

            <div className="card" onClick={triggerProtectUpload}>
              <div className="card-icon">
                <img src="/assets/key-fill.svg" alt="Password Protection" />
              </div>
              <div className="card-text">
                <h3>Password Protection</h3>
                <p>Secure your PDF with a password</p>
              </div>
            </div>

            <div className="card" onClick={triggerLockUpload}>
              <div className="card-icon">
                <img src="/assets/shield-lock-fill.svg" alt="Lock Document" />
              </div>
              <div className="card-text">
                <h3>Lock Document</h3>
                <p>Restrict editing and copying permissions</p>
              </div>
            </div>
          </div>

          <div className="category-header mt-30" id="cat-qr-code">
            <img src="/assets/qr-code.svg" alt="QR Icon" />
            <h2>QR Code</h2>
          </div>
          <div className="grid" id="grid-qr-code">
            <div className="card" onClick={openQrGenerator}>
              <div className="card-icon">
                <img src="/assets/qr-code.svg" alt="Generate QR Code" />
              </div>
              <div className="card-text">
                <h3>QR Code Generator</h3>
                <p>Convert links or URLs into a QR Code image</p>
              </div>
            </div>
            <div className="card" onClick={openQrScanner}>
              <div className="card-icon">
                <img src="/assets/qr-code-scan.svg" alt="QR Code Scanner" />
              </div>
              <div className="card-text">
                <h3>QR Code Scanner</h3>
                <p>Read and extract data from a QR Code image</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
