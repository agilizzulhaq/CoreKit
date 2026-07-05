import * as pdfjsLib from "pdfjs-dist";
import FilesToPdfWorkspace from "./workspace/FilesToPdfWorkspace";
import RotateWorkspace from "./workspace/RotateWorkspace";
import SplitWorkspace from "./workspace/SplitWorkspace";
import MergeWorkspace from "./workspace/MergeWorkspace";
import CompressWorkspace from "./workspace/CompressWorkspace";
import PageNumberingWorkspace from "./workspace/PageNumberingWorkspace";
import PasswordProtectionWorkspace from "./workspace/PasswordProtectionWorkspace";
import LockDocumentWorkspace from "./workspace/LockDocumentWorkspace";
import SignatureWorkspace from "./workspace/SignatureWorkspace";
import QrCodeGeneratorWorkspace from "./workspace/QrCodeGeneratorWorkspace";
import QrCodeScannerWorkspace from "./workspace/QrCodeScannerWorkspace";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export default function Workspace({
  activeModal,
  closeModal,
  files,
  setFiles,
}) {
  if (!activeModal) return null;

  const renderFeatureWorkspace = () => {
    switch (activeModal) {
      case "filesToPdf":
        return (
          <FilesToPdfWorkspace
            files={files}
            setFiles={setFiles}
            closeModal={closeModal}
          />
        );
      case "rotate":
        return <RotateWorkspace files={files} closeModal={closeModal} />;
      case "split":
        return <SplitWorkspace files={files} closeModal={closeModal} />;
      case "merge":
        return (
          <MergeWorkspace
            files={files}
            setFiles={setFiles}
            closeModal={closeModal}
          />
        );
      case "compress":
        return <CompressWorkspace files={files} closeModal={closeModal} />;
      case "numbering":
        return <PageNumberingWorkspace files={files} closeModal={closeModal} />;
      case "protect":
        return (
          <PasswordProtectionWorkspace
            files={files}
            setFiles={setFiles}
            closeModal={closeModal}
          />
        );
      case "lock":
        return (
          <LockDocumentWorkspace
            files={files}
            setFiles={setFiles}
            closeModal={closeModal}
          />
        );
      case "sign":
        return <SignatureWorkspace files={files} closeModal={closeModal} />;
      case "qrGenerator":
        return <QrCodeGeneratorWorkspace closeModal={closeModal} />;
      case "qrScanner":
        return <QrCodeScannerWorkspace closeModal={closeModal} />;
      default:
        return (
          <div className="workspace-empty">
            <h2>Fitur dalam pengembangan</h2>
            <button className="btn btn-primary" onClick={closeModal}>
              Tutup
            </button>
          </div>
        );
    }
  };

  return (
    <div className="workspace-feature-overlay">
      <div className="workspace-feature-modal">
        <button className="btn-close-workspace-right" onClick={closeModal}>
          ✕
        </button>
        {renderFeatureWorkspace()}
      </div>
    </div>
  );
}
