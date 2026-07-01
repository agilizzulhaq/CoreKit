import { useEffect, useRef, useState } from "react";

// Mapping id elemen kategori -> key menu sidebar
const SECTION_KEY_MAP = [
  { id: "cat-doc-conversion", key: "doc-conversion" },
  { id: "cat-pdf-tools", key: "pdf-tools" },
  { id: "cat-qr-code", key: "qr-code" },
];

// Jarak ambang (px) dari atas container: section dianggap "aktif"
// begitu bagian atasnya melewati garis ini.
const SCROLLSPY_OFFSET = 120;

export default function Home({
  activeScreen,
  triggerFileUpload,
  setIsSidebarHidden,
  activeMenu,
  setActiveMenu,
}) {
  const toolsRef = useRef(null);
  const heroRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Observer untuk mengatur animasi slide-in fitur, memunculkan sidebar,
    // dan menentukan apakah kita sedang di "Home" (hero) atau di "Features".
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (typeof setIsSidebarHidden === "function") {
            setIsSidebarHidden(false); // Tampilkan sidebar saat fitur terlihat
          }
          // Begitu container fitur terlihat, langsung hitung kategori teratas
          computeActiveSection();
        } else {
          if (typeof setIsSidebarHidden === "function") {
            setIsSidebarHidden(true); // Jika hero terlihat, sembunyikan sidebar lagi
          }
          // Sedang di hero -> indikator sidebar harus di "Home"
          if (typeof setActiveMenu === "function") {
            setActiveMenu("home");
          }
        }
      },
      { threshold: 0.2 },
    );

    if (toolsRef.current) {
      observer.observe(toolsRef.current);
    }

    return () => {
      if (toolsRef.current) observer.unobserve(toolsRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsSidebarHidden]);

  // Hitung kategori mana yang sedang "aktif" berdasarkan posisi scroll,
  // bukan berdasarkan IntersectionObserver band — supaya section pendek
  // seperti "Doc Conversion" tetap terdeteksi dengan benar.
  const computeActiveSection = () => {
    const container = toolsRef.current;
    if (!container || typeof setActiveMenu !== "function") return;

    const containerTop = container.getBoundingClientRect().top;

    // Default ke kategori pertama (paling atas)
    let currentKey = SECTION_KEY_MAP[0].key;

    for (const { id, key } of SECTION_KEY_MAP) {
      const el = document.getElementById(id);
      if (!el) continue;

      const relativeTop = el.getBoundingClientRect().top - containerTop;

      // Jika bagian atas section sudah melewati garis ambang,
      // section ini (atau yang setelahnya) dianggap aktif.
      if (relativeTop <= SCROLLSPY_OFFSET) {
        currentKey = key;
      }
    }

    setActiveMenu(currentKey);
  };

  // Pasang listener scroll pada container fitur (bukan window),
  // karena container inilah yang benar-benar discroll oleh user.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActiveMenu]);

  const handleFeatureClick = (e, featureName) => {
    e.currentTarget.scrollIntoView({ behavior: "smooth", block: "center" });

    console.log(`Fitur ${featureName} diklik!`);
    alert(
      `Membuka modul: ${featureName}\n(Akan dihubungkan ke Modal/State UI React selanjutnya)`,
    );
  };

  const scrollToTools = () => {
    const toolsContainer = document.getElementById("home-tools-container");
    if (toolsContainer) {
      toolsContainer.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      id="screen-home"
      className={`screen ${activeScreen === "home" ? "active" : ""}`}
    >
      <div className="hero" id="screen-home-hero" ref={heroRef}>
        <div className="hero-content">
          <div className="hero-badge">Layanan Unit PDF Integrasi Akurat</div>
          <h1>LUNPIA Workspace</h1>
          <p>Smart and Secure Solution for Your Digital Document Management.</p>
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
            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Files to PDF")}
            >
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
            <div className="card" onClick={triggerFileUpload}>
              <div className="card-icon">
                <img src="/assets/folder-fill.svg" alt="Open PDF" />
              </div>
              <div className="card-text">
                <h3>Open PDF</h3>
                <p>View & edit document in Workspace</p>
              </div>
            </div>

            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Rotate PDF")}
            >
              <div className="card-icon">
                <img src="/assets/arrow-repeat.svg" alt="Rotate PDF" />
              </div>
              <div className="card-text">
                <h3>Rotate PDF</h3>
                <p>Rotate pages clockwise or counter-clockwise</p>
              </div>
            </div>

            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Split PDF")}
            >
              <div className="card-icon">
                <img src="/assets/scissors.svg" alt="Split PDF" />
              </div>
              <div className="card-text">
                <h3>Split PDF</h3>
                <p>Extract or separate specific pages</p>
              </div>
            </div>

            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Merge PDF")}
            >
              <div className="card-icon">
                <img src="/assets/file-earmark-plus-fill.svg" alt="Merge PDF" />
              </div>
              <div className="card-text">
                <h3>Merge PDF</h3>
                <p>Combine multiple PDF files into one</p>
              </div>
            </div>

            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Compress PDF")}
            >
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

            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Page Numbering")}
            >
              <div className="card-icon">
                <img src="/assets/123.svg" alt="Page Numbering" />
              </div>
              <div className="card-text">
                <h3>Page Numbering</h3>
                <p>Add custom page numbers to document</p>
              </div>
            </div>

            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Manual Signature")}
            >
              <div className="card-icon">
                <img src="/assets/vector-pen.svg" alt="Manual Signature" />
              </div>
              <div className="card-text">
                <h3>Manual Signature</h3>
                <p>Draw or upload signature manually</p>
              </div>
            </div>

            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Auto Signature")}
            >
              <div className="card-icon">
                <img
                  src="/assets/lightning-charge-fill.svg"
                  alt="Auto Signature"
                />
              </div>
              <div className="card-text">
                <h3>Auto Signature</h3>
                <p>Batch apply signature to multiple pages</p>
              </div>
            </div>

            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Text Editor")}
            >
              <div className="card-icon">
                <img src="/assets/textarea-t.svg" alt="Text Editor" />
              </div>
              <div className="card-text">
                <h3>Text Editor</h3>
                <p>Insert custom text into your document</p>
              </div>
            </div>

            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Password Protection")}
            >
              <div className="card-icon">
                <img src="/assets/key-fill.svg" alt="Password Protection" />
              </div>
              <div className="card-text">
                <h3>Password Protection</h3>
                <p>Secure your PDF with a password</p>
              </div>
            </div>

            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Lock Document")}
            >
              <div className="card-icon">
                <img src="/assets/shield-lock-fill.svg" alt="Lock Document" />
              </div>
              <div className="card-text">
                <h3>Lock Document</h3>
                <p>Restrict editing and copying permissions</p>
              </div>
            </div>
          </div>

          {/* --- QR CODE --- */}
          <div className="category-header mt-30" id="cat-qr-code">
            <img src="/assets/qr-code.svg" alt="QR Icon" />
            <h2>QR Code</h2>
          </div>
          <div className="grid" id="grid-qr-code">
            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Generate QR Code")}
            >
              <div className="card-icon">
                <img src="/assets/qr-code.svg" alt="Generate QR Code" />
              </div>
              <div className="card-text">
                <h3>QR Code Generator</h3>
                <p>Convert links or URLs into a QR Code image</p>
              </div>
            </div>
            <div
              className="card"
              onClick={(e) => handleFeatureClick(e, "Scan QR Code")}
            >
              <div className="card-icon">
                <img src="/assets/qr-code-scan.svg" alt="Scan QR Code" />
              </div>
              <div className="card-text">
                <h3>Scan QR Code</h3>
                <p>Read and extract data from a QR Code image</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
