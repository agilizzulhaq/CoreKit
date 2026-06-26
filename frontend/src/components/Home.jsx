export default function Home({ activeScreen, triggerFileUpload }) {
  return (
    <div
      id="screen-home"
      className={`screen ${activeScreen === "home" ? "active" : ""}`}
    >
      <div className="hero">
        <div className="hero-badge">Layanan Unit PDF Integrasi Akurat</div>
        <h1>LUNPIA Workspace</h1>
        <p>Smart and Secure Solution for Your Digital Document Management.</p>
      </div>

      <div id="home-tools-container">
        {/* --- DOCUMENT CONVERSION --- */}
        <div className="category-header">
          <img
            src="/assets/file-earmark-richtext-fill.svg"
            alt="Doc Conversion Icon"
          />
          <h2>Document Conversion</h2>
        </div>
        <div className="grid" id="grid-doc-conversion">
          <div className="card">
            <div className="card-icon">
              <img
                src="/assets/file-earmark-richtext-fill.svg"
                alt="Files to PDF"
              />
            </div>
            <div className="card-text">
              <h3>Files to PDF</h3>
              <p>Convert files into PDF document</p>
            </div>
          </div>
        </div>

        {/* --- PDF TOOLS --- */}
        <div className="category-header mt-30">
          <img src="/assets/file-pdf-fill.svg" alt="PDF Icon" />
          <h2>PDF Tools</h2>
        </div>
        <div className="grid" id="grid-pdf-tools">
          <div className="card" onClick={triggerFileUpload}>
            <div className="card-icon">
              <img src="/assets/folder-fill.svg" alt="Open" />
            </div>
            <div className="card-text">
              <h3>Open</h3>
              <p>Open Workspace</p>
            </div>
          </div>

          <div className="card">
            <div className="card-icon">
              <img src="/assets/arrow-repeat.svg" alt="Rotate" />
            </div>
            <div className="card-text">
              <h3>Rotate</h3>
              <p>Rotate Pages</p>
            </div>
          </div>

          <div className="card">
            <div className="card-icon">
              <img src="/assets/scissors.svg" alt="Split" />
            </div>
            <div className="card-text">
              <h3>Split</h3>
              <p>Split Pages</p>
            </div>
          </div>

          <div className="card">
            <div className="card-icon">
              <img src="/assets/file-earmark-plus-fill.svg" alt="Merge" />
            </div>
            <div className="card-text">
              <h3>Merge</h3>
              <p>Insert Merged PDF</p>
            </div>
          </div>

          <div className="card">
            <div className="card-icon">
              <img src="/assets/file-earmark-zip-fill.svg" alt="Compress" />
            </div>
            <div className="card-text">
              <h3>Compress</h3>
              <p>Compress PDF</p>
            </div>
          </div>

          <div className="card">
            <div className="card-icon">
              <img src="/assets/123.svg" alt="Number" />
            </div>
            <div className="card-text">
              <h3>Number</h3>
              <p>Add Page Numbers</p>
            </div>
          </div>

          <div className="card">
            <div className="card-icon">
              <img src="/assets/vector-pen.svg" alt="Sign" />
            </div>
            <div className="card-text">
              <h3>Sign</h3>
              <p>Manual Signature Studio</p>
            </div>
          </div>

          <div className="card">
            <div className="card-icon">
              <img src="/assets/lightning-charge-fill.svg" alt="Auto Sign" />
            </div>
            <div className="card-text">
              <h3>Auto Sign</h3>
              <p>Auto Signature Studio</p>
            </div>
          </div>

          <div className="card">
            <div className="card-icon">
              <img src="/assets/textarea-t.svg" alt="Text" />
            </div>
            <div className="card-text">
              <h3>Text</h3>
              <p>Text Studio</p>
            </div>
          </div>

          <div className="card">
            <div className="card-icon">
              <img src="/assets/key-fill.svg" alt="Password" />
            </div>
            <div className="card-text">
              <h3>Password</h3>
              <p>Protect PDF</p>
            </div>
          </div>

          <div className="card">
            <div className="card-icon">
              <img src="/assets/shield-lock-fill.svg" alt="Lock" />
            </div>
            <div className="card-text">
              <h3>Lock</h3>
              <p>Lock Document</p>
            </div>
          </div>
        </div>

        {/* --- QR CODE --- */}
        <div className="category-header mt-30">
          <img src="/assets/qr-code.svg" alt="QR Icon" />
          <h2>QR Code</h2>
        </div>
        <div className="grid" id="grid-qr-code">
          <div className="card">
            <div className="card-icon">
              <img src="/assets/qr-code.svg" alt="Generate QR" />
            </div>
            <div className="card-text">
              <h3>Generate QR Code</h3>
              <p>Generate QR Code</p>
            </div>
          </div>
          <div className="card">
            <div className="card-icon">
              <img src="/assets/qr-code-scan.svg" alt="Scan QR" />
            </div>
            <div className="card-text">
              <h3>Scan QR Code</h3>
              <p>Scan QR Code</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
