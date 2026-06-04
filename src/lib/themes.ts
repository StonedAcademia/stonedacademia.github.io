import { useEffect, useState } from "react";

/** Stable identifiers that map directly to `data-theme` CSS selectors. */
export type ThemeId = "paper" | "ink" | "terminal" | "signal";

/** Theme option displayed in the floating theme menu. */
export type ThemeOption = {
  /** Stable id mirrored to CSS selectors and localStorage. */
  id: ThemeId;
  /** Short visible label in the switcher. */
  label: string;
};

/** Ordered menu model for the theme switcher. */
export const themeOptions: ThemeOption[] = [
  { id: "paper", label: "paper" },
  { id: "ink", label: "ink" },
  { id: "terminal", label: "terminal" },
  { id: "signal", label: "signal" },
];

/** Theme state returned by `useTheme`. */
type ThemeState = {
  /** Active theme id, mirrored to `document.documentElement.dataset.theme`. */
  theme: ThemeId;
  /** Updates state, localStorage, and the root dataset on the next effect pass. */
  setTheme: (theme: ThemeId) => void;
};

/** Narrows a stored string to one of the themes supported by the stylesheet. */
function isThemeId(value: string | null): value is ThemeId {
  return themeOptions.some((option) => option.id === value);
}

/**
 * Persists the selected theme and exposes it to CSS through the root dataset.
 */
export function useTheme(): ThemeState {
  const [theme, setTheme] = useState<ThemeId>(() => {
    const stored = window.localStorage.getItem("stoned-academia-theme");
    return isThemeId(stored) ? stored : "paper";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("stoned-academia-theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
