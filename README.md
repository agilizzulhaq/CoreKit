<div align="center">

# 📄 LUNPIA — Smart & Secure PDF Workspace

**Layanan Unit PDF Integrasi Akurat**

Aplikasi desktop lintas platform untuk mengelola, mengedit, dan mengamankan dokumen PDF Anda — cepat, ringan, dan sepenuhnya berjalan di perangkat Anda sendiri.

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.10%2B-3776AB?logo=python&logoColor=white)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/frontend-React-61DAFB?logo=react&logoColor=black)
![NestJS](https://img.shields.io/badge/gateway-NestJS-E0234E?logo=nestjs&logoColor=white)
![FastAPI](https://img.shields.io/badge/engine-FastAPI-009688?logo=fastapi&logoColor=white)

</div>

---

## ✨ Tentang LUNPIA

**LUNPIA** (dikenal juga dengan nama internal **CoreKit**) adalah workspace dokumen digital yang menggabungkan kekuatan **PyMuPDF**, **FastAPI**, **NestJS**, dan **React** dalam satu aplikasi desktop yang solid. Semua pemrosesan dokumen — mulai dari konversi, rotasi, penggabungan, hingga penandatanganan — dijalankan secara **lokal** melalui _engine_ Python bawaan, sehingga dokumen Anda tidak perlu diunggah ke server pihak ketiga mana pun.

Proyek ini dibangun dengan arsitektur tiga lapis:

| Lapisan         | Teknologi         | Peran                                                           |
| --------------- | ----------------- | --------------------------------------------------------------- |
| **Frontend**    | React (Vite)      | Antarmuka pengguna, workspace interaktif, preview PDF real-time |
| **Gateway**     | NestJS            | Menangani upload file & menjembatani frontend ke Core Engine    |
| **Core Engine** | FastAPI + PyMuPDF | Logika inti pemrosesan PDF, gambar, dan data                    |

---

## 🚀 Fitur Utama

### 📑 Document Conversion

- **Files to PDF** — Gabungkan gambar (`PNG`, `JPG`, `WEBP`, `BMP`) dan file teks (`.txt`) menjadi satu dokumen PDF yang rapi, lengkap dengan drag-and-drop untuk mengatur urutan halaman.

### 🛠️ PDF Tools

- **Rotate PDF** — Putar halaman tertentu searah atau berlawanan arah jarum jam, per halaman atau sekaligus banyak halaman dengan sudut berbeda.
- **Split PDF** — Pisahkan dokumen dengan mode _Custom Range_ (pilih halaman spesifik) atau _Fixed Split_ (bagi rata menjadi beberapa file per-N-halaman).
- **Merge PDF** — Gabungkan banyak file PDF menjadi satu dokumen, dengan pengurutan berbasis drag-and-drop.
- **Compress PDF** — Kompres ukuran file dengan tiga level kualitas (_Extreme_, _Recommended_, _High Quality_) tanpa proses upload ke luar.
- **Page Numbering** — Tambahkan penomoran halaman otomatis dengan berbagai gaya (angka, romawi, alfabet) dan format kustom.
- **Manual Signature** — Tempatkan tanda tangan digital secara presisi pada halaman yang dipilih, lengkap opsi hapus latar belakang otomatis.
- **Auto Signature** — Terapkan tanda tangan yang sama ke banyak halaman sekaligus dalam satu aksi.
- **Text Editor** — Sisipkan teks kustom (warna, ukuran, posisi bebas) langsung ke dalam dokumen PDF.
- **Password Protection** — Amankan PDF dengan enkripsi AES-256 dan kata sandi milik Anda sendiri.
- **Lock Document** — Kunci dokumen menjadi mode _read-only_ untuk mencegah pengeditan dan penyalinan konten.

### 📷 QR Code

- **QR Code Generator** — Ubah tautan/URL menjadi gambar QR Code, lengkap opsi logo di tengah.
- **Scan QR Code** — Baca dan ekstrak data dari gambar QR Code secara instan.

### 🔍 Kualitas Hidup Lainnya

- Riwayat **Undo/Redo** di setiap sesi dokumen.
- **Audit log** otomatis untuk setiap aksi yang dilakukan pada dokumen.
- Deteksi dan penanganan PDF berpassword secara otomatis saat dibuka.
- Rendering halaman real-time menggunakan `pdf.js` di sisi frontend.

---

## 🏗️ Arsitektur Singkat

```
┌─────────────────┐      HTTP       ┌──────────────────┐      HTTP       ┌───────────────────┐
│   React (UI)    │ ─────────────▶ │  NestJS Gateway   │ ─────────────▶ │  FastAPI Core     │
│  Vite + pdf.js  │ ◀───────────── │  (Upload Handler) │ ◀───────────── │  Engine (PyMuPDF) │
└─────────────────┘                 └──────────────────┘                 └───────────────────┘
     Port 5173                            Port 3000                            Port 8000
```

- **Frontend** mengunggah file ke **Gateway** (`/upload`), yang kemudian meneruskannya ke **Core Engine** (`/doc/open`) untuk dibuka sebagai sesi dokumen aktif.
- Seluruh operasi PDF (rotate, merge, split, sign, dll.) dikirim langsung dari frontend ke Core Engine menggunakan `doc_id` sesi tersebut.
- Hasil akhir diunduh langsung dari Core Engine melalui endpoint streaming (`/doc/download/{doc_id}`).

---

## 🧰 Prasyarat

Pastikan perangkat Anda telah memiliki:

- **Python** 3.10 atau lebih baru
- **Node.js** 18 LTS atau lebih baru beserta `npm`
- **Git**

---

## ⚡ Cara Memulai

### 1. Clone Repository

```bash
git clone https://github.com/<username>/<repo-name>.git
cd <repo-name>
```

### 2. Jalankan Core Engine (FastAPI)

```bash
cd engine
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Engine akan berjalan di `http://127.0.0.1:8000`.

### 3. Jalankan Gateway (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

Gateway akan berjalan di `http://localhost:3000`.

### 4. Jalankan Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:5173` di browser Anda — LUNPIA siap digunakan! 🎉

> 💡 **Tips:** Jalankan ketiga layanan (`engine`, `backend`, `frontend`) secara bersamaan di terminal terpisah agar aplikasi berfungsi penuh.

---

## 📁 Struktur Proyek

```
.
├── engine/            # Core Engine — FastAPI + PyMuPDF (logika pemrosesan PDF)
│   └── main.py
├── backend/            # Gateway — NestJS (menangani upload file)
│   └── src/app.controller.ts
└── frontend/           # Antarmuka pengguna — React + Vite
    └── src/
        ├── components/
        │   ├── Home.jsx
        │   ├── Sidebar.jsx
        │   ├── Workspace.jsx
        │   └── workspace/       # Workspace per-fitur (Rotate, Split, Merge, dst.)
        ├── api.js
        └── Style.css
```

---

## 🆘 Bantuan & Dukungan

- **Menemukan bug atau ingin request fitur?** Silakan buka [Issue baru](../../issues) di repository ini.
- **Punya pertanyaan seputar penggunaan?** Cek [Discussions](../../discussions) atau ajukan pertanyaan lewat Issue dengan label `question`.
- Dokumentasi tambahan (jika tersedia) dapat ditemukan di folder [`docs/`](docs/).

---

## 🤝 Kontribusi

Kontribusi dalam bentuk apa pun sangat kami hargai — baik laporan bug, ide fitur, maupun pull request!

Sebelum mengirimkan kontribusi, mohon baca panduan lengkap di [`CONTRIBUTING.md`](CONTRIBUTING.md).

Alur singkat berkontribusi:

1. Fork repository ini
2. Buat branch baru (`git checkout -b fitur/nama-fitur`)
3. Commit perubahan Anda (`git commit -m 'Menambahkan fitur X'`)
4. Push ke branch Anda (`git push origin fitur/nama-fitur`)
5. Buka Pull Request

---

## 👥 Maintainer

Proyek ini dikembangkan dan dipelihara oleh tim internal **Balai Besar POM di Semarang**.

Untuk pertanyaan langsung terkait proyek, silakan hubungi maintainer melalui halaman [Issues](../../issues) repository ini.

---

## 📜 Lisensi

Proyek ini dilisensikan di bawah ketentuan yang tercantum dalam berkas [`LICENSE`](LICENSE).

---

<div align="center">

**LUNPIA Workspace** · All rights reserved © 2026

</div>
