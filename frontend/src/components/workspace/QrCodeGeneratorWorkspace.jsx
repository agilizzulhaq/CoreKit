import { useState } from "react";
import { generateQrCode } from "../../api";

const QR_TYPES = [
  {
    value: "default",
    title: "Default",
    desc: "QR Code polos tanpa logo",
  },
  {
    value: "bpom",
    title: "Dengan Logo BPOM",
    desc: "QR Code dengan logo Badan POM di tengah",
  },
];

export default function QrCodeGeneratorWorkspace({ closeModal }) {
  const [link, setLink] = useState("");
  const [qrType, setQrType] = useState("default");
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrResult, setQrResult] = useState(null); // { image_b64 }
  const [filename, setFilename] = useState("LUNPIA_QRCode");

  const handleGenerate = async () => {
    if (!link.trim()) {
      alert("Masukkan link/URL terlebih dahulu.");
      return;
    }

    setIsGenerating(true);
    setQrResult(null);
    try {
      const result = await generateQrCode(link.trim(), qrType === "bpom");
      setQrResult(result);
    } catch (error) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan sistem saat membuat QR Code.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!qrResult) return;
    const finalFilename = filename.trim()
      ? `${filename.trim()}.png`
      : "LUNPIA_QRCode.png";

    const link = document.createElement("a");
    link.href = qrResult.image_b64;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

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
        {isGenerating ? (
          <div className="rotate-loading-text">Membuat QR Code...</div>
        ) : qrResult ? (
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
              textAlign: "center",
            }}
          >
            <img
              src={qrResult.image_b64}
              alt="QR Code"
              style={{ width: "320px", height: "320px", display: "block" }}
            />
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              color: "#9ca3af",
            }}
          >
            <img
              src="/assets/qr-code.svg"
              alt="QR Code"
              style={{ width: "72px", opacity: 0.4, marginBottom: "12px" }}
            />
            <p style={{ fontSize: "0.95rem" }}>
              Masukkan link di sisi kanan, lalu klik "Generate QR Code"
            </p>
          </div>
        )}
      </div>

      <div className="merge-action-sidebar">
        <h2>QR Code Generator</h2>

        <div className="form-group" style={{ marginBottom: "18px" }}>
          <label htmlFor="qr-link-input">Link / URL:</label>
          <input
            id="qr-link-input"
            type="text"
            className="form-control"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://contoh.com"
          />
        </div>

        <label
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "#333",
            marginBottom: "8px",
            display: "block",
          }}
        >
          Jenis QR Code:
        </label>

        <div className="compression-options" style={{ marginBottom: "10px" }}>
          {QR_TYPES.map((type) => (
            <label
              key={type.value}
              className="compression-card"
              htmlFor={`qr-type-${type.value}`}
            >
              <input
                type="radio"
                id={`qr-type-${type.value}`}
                name="qr-type"
                checked={qrType === type.value}
                onChange={() => setQrType(type.value)}
              />
              <div className="cc-content">
                <div className="cc-title">{type.title}</div>
                <div className="cc-desc">{type.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <button
          className="btn btn-primary"
          style={{ marginBottom: "20px" }}
          onClick={handleGenerate}
          disabled={isGenerating || !link.trim()}
        >
          {isGenerating ? "Memproses..." : "Generate QR Code"}
        </button>

        <div className="sidebar-spacer" style={{ flexGrow: 1 }}></div>

        {qrResult && (
          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <label
              htmlFor="qr-filename-input"
              style={{ fontSize: "14px", fontWeight: "500", color: "#333" }}
            >
              Simpan hasil sebagai:
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#fff",
                border: "1px solid #ccc",
                borderRadius: "6px",
                padding: "4px 12px",
              }}
            >
              <input
                id="qr-filename-input"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  flexGrow: 1,
                  padding: "8px 0",
                  fontSize: "14px",
                }}
                placeholder="Nama file"
              />
              <span
                style={{ color: "#666", fontSize: "14px", userSelect: "none" }}
              >
                .png
              </span>
            </div>
          </div>
        )}

        <button
          className="btn-action-big"
          onClick={handleDownload}
          disabled={!qrResult}
        >
          Unduh QR Code
          <img
            src="/assets/arrow-right-circle.svg"
            alt="Download"
            className="icon-merge-btn"
          />
        </button>
      </div>
    </div>
  );
}
