<div align="center">

# 📄 LUNPIA — Smart & Secure PDF Workspace

**Layanan Unit PDF Integrasi Akurat**

A cross-platform desktop application for managing, editing, and securing your PDF documents — fast, lightweight, and running entirely on your own device.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.10%2B-3776AB?logo=python&logoColor=white)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/frontend-React-61DAFB?logo=react&logoColor=black)
![NestJS](https://img.shields.io/badge/gateway-NestJS-E0234E?logo=nestjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/engine-FastAPI-009688?logo=fastapi&logoColor=white)

</div>

---

## ✨ About LUNPIA

**LUNPIA** (also known internally as **CoreKit**) is a digital document workspace that combines the power of **PyMuPDF**, **FastAPI**, **NestJS**, and **React** into a single, solid desktop application. All document processing — from conversion and rotation to merging and security — runs **locally** through a built-in Python engine, so your documents never need to be uploaded to any third-party server.

The project is built on a three-layer architecture:

| Layer           | Technology        | Role                                                                    |
| --------------- | ----------------- | ----------------------------------------------------------------------- |
| **Frontend**    | React (Vite)      | User interface, per-feature modals, real-time PDF preview               |
| **Gateway**     | NestJS            | Handles file uploads and bridges the frontend to the Core Engine        |
| **Core Engine** | FastAPI + PyMuPDF | Core processing logic for PDFs, images, QR codes, and document sessions |

---

## 🚀 Key Features

### 📑 Document Conversion

- **Files to PDF** — Combine images (`PNG`, `JPG`, `JPEG`, `WEBP`, `BMP`) and text files (`.txt`) into a single, clean PDF document.

### 🛠️ PDF Tools

- **Rotate PDF** — Rotate specific pages clockwise or counter-clockwise, either one page at a time or in batches with different angles, complete with a live preview.
- **Split PDF** — Split a document using _Custom Range_ mode (select specific pages) or _Fixed Split_ mode (divide evenly into multiple files every N pages, automatically packaged into a ZIP when the result is more than one file).
- **Merge PDF** — Combine multiple PDF files into a single document, with drag-and-drop reordering.
- **Compress PDF** — Reduce file size with three quality levels (_Extreme_, _Recommended_, _High Quality_), fully processed locally.
- **Page Numbering** — Automatically add page numbers with various styles (numeric, roman, alphabetic) and customizable formats (prefix, suffix, divider).
- **Signature** — Precisely place a digital signature on selected pages, with an option to automatically remove the background.
- **Password Protection** — Secure your PDF with AES-256 encryption and a password of your choice, with support for batch-processing multiple files at once.
- **Lock Document** — Lock a document into read-only mode to prevent editing, form filling, and signing, with support for batch-processing multiple files at once.

### 📷 QR Code

- **QR Code Generator** — Turn a link/URL into a QR code image, with an optional logo in the center.
- **QR Code Scanner** — Read and extract data from a QR code image instantly.

---

## 🏗️ Architecture Overview

```
┌─────────────────┐      HTTP       ┌──────────────────┐      HTTP       ┌───────────────────┐
│   React (UI)    │ ─────────────▶ │  NestJS Gateway   │ ─────────────▶ │  FastAPI Core     │
│  Vite + pdf.js  │ ◀───────────── │  (Upload Handler) │ ◀───────────── │  Engine (PyMuPDF) │
└─────────────────┘                 └──────────────────┘                 └───────────────────┘
     Port 5173                            Port 3000                            Port 8000
```

- For features that require an **interactive document session and preview** (Rotate, Page Numbering, Signature), the file is uploaded through the **Gateway** (`/upload`) and then opened as an active session in the **Core Engine** (`/doc/open`), producing a `doc_id` that is used for all subsequent operations (rotate, numbering, sign, page rendering).
- For **batch, local-file-path-based** features (Files to PDF, Merge, Split, Compress, Password Protection, Lock Document), the Electron frontend sends the absolute file path directly to the relevant Core Engine endpoint (`/tools/*`, `/security/*`) without going through an explicit upload step.
- The final result is downloaded directly from the Core Engine via a streaming endpoint (`/doc/download/{doc_id}`, `/doc/download_zip/{zip_id}`, or `/doc/download_blob/{blob_id}`, depending on the output type).

---

## 🧰 Prerequisites

Make sure your machine has the following installed:

- **Python** 3.10 or newer
- **Node.js** 18 LTS or newer, along with `npm`
- **Git**

---

## ⚡ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<username>/<repo-name>.git
cd <repo-name>
```

### 2. Run the Core Engine (FastAPI)

```bash
cd engine
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

The engine will run at `http://127.0.0.1:8000`.

### 3. Run the Gateway (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

The gateway will run at `http://localhost:3000`.

### 4. Run the Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser — LUNPIA is ready to use! 🎉

> 💡 **Tip:** Run all three services (`engine`, `backend`, `frontend`) simultaneously in separate terminals for the app to work fully.

---

## 📁 Project Structure

```
.
├── engine/                        # Core Engine — FastAPI + PyMuPDF (PDF processing logic)
│   └── main.py
├── backend/                       # Gateway — NestJS (handles file uploads)
│   └── src/app.controller.ts
└── frontend/                      # User interface — React + Vite
    └── src/
        ├── components/
        │   ├── Home.jsx           # Landing page & feature navigation grid
        │   ├── Sidebar.jsx        # Sidebar navigation with scrollspy
        │   ├── Workspace.jsx      # Modal router for each feature
        │   └── workspace/         # Per-feature modals
        │       ├── FilesToPdfWorkspace.jsx
        │       ├── RotateWorkspace.jsx
        │       ├── SplitWorkspace.jsx
        │       ├── MergeWorkspace.jsx
        │       ├── CompressWorkspace.jsx
        │       ├── PageNumberingWorkspace.jsx
        │       ├── PasswordProtectionWorkspace.jsx
        │       ├── LockDocumentWorkspace.jsx
        │       ├── SignatureWorkspace.jsx
        │       ├── QrCodeGeneratorWorkspace.jsx
        │       └── QrCodeScannerWorkspace.jsx
        ├── App.jsx                # Root component & modal state management
        ├── api.js                 # Collection of Gateway/Engine API call functions
        └── Style.css
```

---

## 🆘 Help & Support

- **Found a bug or want to request a feature?** Please open a [new Issue](../../issues) in this repository.
- **Have a question about usage?** Check the [Discussions](../../discussions) tab or ask via an Issue with the `question` label.
- Additional documentation (if available) can be found in the [`docs/`](docs/) folder.

---

## 🤝 Contributing

Contributions of any kind are greatly appreciated — bug reports, feature ideas, and pull requests alike!

Before submitting a contribution, please read the full guide in [`CONTRIBUTING.md`](CONTRIBUTING.md).

Quick contribution workflow:

1. Fork this repository
2. Create a new branch (`git checkout -b feature/feature-name`)
3. Commit your changes following the `feat:` / `fix:` convention (`git commit -m 'feat: add feature X'`)
4. Push to your branch (`git push origin feature/feature-name`)
5. Open a Pull Request

---

## 👥 Maintainers

This project is developed and maintained by the internal team at **Balai Besar POM di Semarang**.

For direct questions regarding the project, please contact the maintainers via this repository's [Issues](../../issues) page.

---

## 📜 License

This project is licensed under the terms stated in the [`LICENSE`](LICENSE) file.

---

<div align="center">

**LUNPIA Workspace** · All rights reserved © 2026

</div>
