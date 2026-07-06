import { useRef, useState } from "react";
import { scanQrCode, openLink } from "../../api";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function QrCodeScannerWorkspace({ closeModal }) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageB64, setImageB64] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // string link hasil scan
  const [isOpeningLink, setIsOpeningLink] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanResult(null);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const b64 = await fileToBase64(file);
      setImageB64(b64);
    } catch (err) {
      console.error(err);
      alert("Gagal membaca gambar yang diunggah.");
    }
    e.target.value = null;
  };

  const handleScan = async () => {
    if (!imageB64) {
      alert("Unggah gambar QR Code terlebih dahulu.");
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    try {
      const result = await scanQrCode(imageB64);
      setScanResult(result.data);
    } catch (error) {
      console.error(error);
      alert(error.message || "QR Code tidak terdeteksi pada gambar.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenLink = async () => {
    if (!scanResult) return;
    setIsOpeningLink(true);
    try {
      await openLink(scanResult);
    } catch (error) {
      console.error(error);
      alert(error.message || "Gagal membuka link di browser.");
    } finally {
      setIsOpeningLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!scanResult) return;
    try {
      await navigator.clipboard.writeText(scanResult);
      alert("Link berhasil disalin ke clipboard.");
    } catch {
      alert("Gagal menyalin link.");
    }
  };

  const isValidUrl = scanResult && /^https?:\/\//i.test(scanResult);

  return (
    <div className="merge-workspace-layout">
      <div
        className="merge-preview-area"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/bmp"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {previewUrl ? (
          <div
            style={{
              background: "var(--surface)",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
              textAlign: "center",
            }}
          >
            <img
              src={previewUrl}
              alt="QR Code diunggah"
              style={{
                width: "320px",
                height: "320px",
                objectFit: "contain",
                display: "block",
                marginBottom: "16px",
              }}
            />
            <button
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Ganti Gambar
            </button>
          </div>
        ) : (
          <div
            className="file-dropzone p-30"
            style={{ maxWidth: "360px", cursor: "pointer" }}
            onClick={() => fileInputRef.current?.click()}
          >
            <img
              src="/assets/qr-code-scan.svg"
              alt="Unggah QR Code"
              className="dropzone-icon"
            />
            <div className="dropzone-title">
              Klik untuk unggah gambar QR Code
            </div>
            <span className="dropzone-subtitle">
              Mendukung PNG, JPG, WEBP, BMP
            </span>
          </div>
        )}
      </div>

      <div className="merge-action-sidebar">
        <h2>QR Code Scanner</h2>
        <div className="merge-info-alert">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0078d7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          Unggah gambar yang berisi QR Code, lalu klik "Scan QR Code" untuk
          membaca data di dalamnya.
        </div>

        <button
          className="btn btn-primary"
          style={{ marginBottom: "20px" }}
          onClick={handleScan}
          disabled={isScanning || !imageB64}
        >
          {isScanning ? "Memindai..." : "Scan QR Code"}
        </button>

        <div className="sidebar-spacer" style={{ flexGrow: 1 }}></div>

        {scanResult && (
          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              style={{
                fontSize: "14px",
                fontWeight: "500",
                color: "var(--text-primary)",
              }}
            >
              Hasil pemindaian:
            </label>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "10px 12px",
                fontSize: "13px",
                color: "var(--text-primary)",
                wordBreak: "break-all",
                maxHeight: "120px",
                overflowY: "auto",
              }}
            >
              {scanResult}
            </div>
            <button
              className="btn btn-secondary btn-sm-pad"
              onClick={handleCopyLink}
              style={{ alignSelf: "flex-start" }}
            >
              Salin Teks
            </button>
          </div>
        )}

        <button
          className="btn-action-big"
          onClick={handleOpenLink}
          disabled={!isValidUrl || isOpeningLink}
          title={
            scanResult && !isValidUrl
              ? "Hasil pemindaian bukan berupa URL yang valid"
              : undefined
          }
        >
          {isOpeningLink ? "Membuka..." : "Buka di Browser"}
          {!isOpeningLink && (
            <img
              src="/assets/arrow-right-circle.svg"
              alt="Open"
              className="icon-merge-btn"
            />
          )}
        </button>
      </div>
    </div>
  );
}
