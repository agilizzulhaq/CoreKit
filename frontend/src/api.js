export const API_URL = "http://127.0.0.1:8000";
export const GATEWAY_URL = "http://localhost:3000";

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${GATEWAY_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Gagal mengunggah file");
  return await response.json();
}

export async function closeDocumentApi(docId) {
  const response = await fetch(`${API_URL}/doc/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doc_id: docId }),
  });

  if (!response.ok) throw new Error("Gagal menutup dokumen");
  return await response.json();
}

export async function filesToPdf(files) {
  const paths = files.map((f) => f.path);

  const response = await fetch(`${API_URL}/tools/files_to_pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: paths }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let errorMessage = "Gagal mengonversi file ke PDF";

    if (Array.isArray(err.detail)) {
      errorMessage = err.detail.map((e) => e.msg).join(", ");
    } else if (err.detail) {
      errorMessage = err.detail;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

export async function rotateDocument(docId, pages, angle) {
  const response = await fetch(`${API_URL}/tools/rotate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doc_id: docId, pages, angle }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let errorMessage = "Gagal memutar halaman PDF";

    if (Array.isArray(err.detail)) {
      errorMessage = err.detail.map((e) => e.msg).join(", ");
    } else if (err.detail) {
      errorMessage = err.detail;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

export async function splitDocument(docId, mode, pages, perPage) {
  const body = { doc_id: docId, mode };
  if (mode === "custom") body.pages = pages;
  if (mode === "fixed") body.per_page = perPage;

  const response = await fetch(`${API_URL}/tools/split`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let errorMessage = "Gagal memisahkan PDF";

    if (Array.isArray(err.detail)) {
      errorMessage = err.detail.map((e) => e.msg).join(", ");
    } else if (err.detail) {
      errorMessage = err.detail;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

export async function mergeDocuments(files) {
  const paths = files.map((f) => f.path);

  const response = await fetch(`${API_URL}/tools/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: paths }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let errorMessage = "Gagal melakukan merge PDF";

    // Penanganan khusus untuk error 422 (array of objects) dari FastAPI
    if (Array.isArray(err.detail)) {
      errorMessage = err.detail.map((e) => e.msg).join(", ");
    } else if (err.detail) {
      errorMessage = err.detail;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

export async function compressDocument(docId, mode, password) {
  const body = { doc_id: docId, mode };
  if (password) body.password = password;

  const response = await fetch(`${API_URL}/tools/compress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let errorMessage = "Gagal mengompres PDF";

    if (Array.isArray(err.detail)) {
      errorMessage = err.detail.map((e) => e.msg).join(", ");
    } else if (err.detail) {
      errorMessage = err.detail;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

export async function numberPages(docId, options) {
  const response = await fetch(`${API_URL}/tools/numbering`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doc_id: docId, ...options }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let errorMessage = "Gagal menambahkan nomor halaman";

    if (Array.isArray(err.detail)) {
      errorMessage = err.detail.map((e) => e.msg).join(", ");
    } else if (err.detail) {
      errorMessage = err.detail;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

export async function signDocument(
  docId,
  pageNum,
  imageB64,
  normX,
  normY,
  normW,
  normH,
  removeBg,
) {
  const response = await fetch(`${API_URL}/tools/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      doc_id: docId,
      page_num: pageNum,
      image_b64: imageB64,
      norm_x: normX,
      norm_y: normY,
      norm_w: normW,
      norm_h: normH,
      remove_bg: removeBg,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let errorMessage = "Gagal menerapkan tanda tangan";

    if (Array.isArray(err.detail)) {
      errorMessage = err.detail.map((e) => e.msg).join(", ");
    } else if (err.detail) {
      errorMessage = err.detail;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

export function getRenderUrl(docId, pageIndex, zoom = 1.5) {
  return `${API_URL}/doc/render/${docId}/${pageIndex}?zoom=${zoom}`;
}

export async function protectDocuments(fileEntries, password) {
  const response = await fetch(`${API_URL}/security/protect_batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: fileEntries, password }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let errorMessage = "Gagal memberikan password pada PDF";

    if (Array.isArray(err.detail)) {
      errorMessage = err.detail.map((e) => e.msg).join(", ");
    } else if (err.detail) {
      errorMessage = err.detail;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

export async function lockDocuments(fileEntries) {
  const response = await fetch(`${API_URL}/security/lock_batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: fileEntries }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    let errorMessage = "Gagal mengunci PDF";

    if (Array.isArray(err.detail)) {
      errorMessage = err.detail.map((e) => e.msg).join(", ");
    } else if (err.detail) {
      errorMessage = err.detail;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}
