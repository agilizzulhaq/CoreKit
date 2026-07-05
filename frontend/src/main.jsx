import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./Style.css";
import App from "./App.jsx";

// Terapkan tema tersimpan sebelum render pertama, agar tidak ada flash warna
document.documentElement.setAttribute(
  "data-theme",
  localStorage.getItem("lunpia-theme") || "light",
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
