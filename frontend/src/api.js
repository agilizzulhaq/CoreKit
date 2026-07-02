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

export async function mergeDocuments(files) {
  const formData = new FormData();
  // Append semua file ke dalam key 'files' (sesuaikan dengan parameter backend)
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(`${API_URL}/pdf/merge`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Gagal melakukan merge PDF");

  // Karena output berupa file PDF, kita ambil sebagai Blob
  return await response.blob();
}
