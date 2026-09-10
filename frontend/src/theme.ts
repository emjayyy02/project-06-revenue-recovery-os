export type Theme = "dark" | "light";
export const themeStorageKey = "rr-theme";

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // The current session still supports switching when storage is unavailable.
  }
}
