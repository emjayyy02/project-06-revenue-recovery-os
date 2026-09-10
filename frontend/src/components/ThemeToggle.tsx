import { useState } from "react";
import { applyTheme, type Theme } from "../theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "light" ? "light" : "dark",
  );
  const next = theme === "dark" ? "light" : "dark";
  return <button className="theme-toggle" type="button" aria-label={`Switch to ${next} mode`}
    onClick={() => { applyTheme(next); setTheme(next); }}>
    <svg className="rr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {next === "dark" ? <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z" /> : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>}
    </svg>
    <span>{next === "dark" ? "Dark" : "Light"} mode</span>
  </button>;
}
