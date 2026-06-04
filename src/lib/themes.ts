import { useEffect, useState } from "react";

export type ThemeId = "paper" | "ink" | "terminal" | "signal";

export const themeOptions: Array<{ id: ThemeId; label: string }> = [
  { id: "paper", label: "paper" },
  { id: "ink", label: "ink" },
  { id: "terminal", label: "terminal" },
  { id: "signal", label: "signal" },
];

function isThemeId(value: string | null): value is ThemeId {
  return themeOptions.some((option) => option.id === value);
}

export function useTheme() {
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
