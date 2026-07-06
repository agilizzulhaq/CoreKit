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
      <img
        src={
          theme === "light" ? "/assets/moon-fill.svg" : "/assets/sun-fill.svg"
        }
        alt={theme === "light" ? "Dark mode" : "Light mode"}
        style={{ width: "16px", height: "16px", filter: "invert(1)" }}
      />
    </button>
  );
}
