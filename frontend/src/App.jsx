import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus("Pilih file terlebih dahulu.");
      return;
    }

    // Menggunakan FormData untuk mengirim file
    const formData = new FormData();
    formData.append("file", file);

    setStatus("Mengunggah...");

    try {
      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setStatus(`Sukses: ${result.message}`);
    } catch (error) {
      setStatus("Gagal terhubung ke backend.");
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg border border-gray-100">
        <h1 className="mb-6 text-2xl font-bold text-gray-800 text-center">
          CoreKit PDF Uploader
        </h1>

        <div className="mb-6">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        <button
          onClick={handleUpload}
          className="w-full rounded-md bg-blue-600 py-2.5 text-white font-semibold transition hover:bg-blue-700 active:bg-blue-800 cursor-pointer"
        >
          Unggah Dokumen
        </button>

        {status && (
          <div className="mt-4 p-3 rounded-md bg-gray-50 text-center text-sm font-medium text-gray-700 border border-gray-200">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
