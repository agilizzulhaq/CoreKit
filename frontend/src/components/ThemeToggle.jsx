import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("lunpia-theme") || "light",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("lunpia-theme", theme);
  }, [theme]);

  return (
    <button
      className="theme-toggle-btn"
      onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
      title={theme === "light" ? "Aktifkan Dark Mode" : "Aktifkan Light Mode"}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
