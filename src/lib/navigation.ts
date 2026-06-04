import { useEffect, useState } from "react";

/** Imperative navigation callback shared by links and pages in the SPA shell. */
export type Navigate = (path: string) => void;

/** Current route state returned by `usePathname`. */
type PathnameState = {
  /** Browser pathname currently selected by the SPA. */
  pathname: string;
  /** Internal navigation callback that updates history and React state. */
  navigate: Navigate;
};

/**
 * Tracks the current browser path and exposes same-page navigation.
 *
 * @remarks
 * This intentionally stays smaller than a router library: it mirrors
 * `popstate`, pushes history entries for internal links, and scrolls new pages
 * back to the top.
 */
export function usePathname(): PathnameState {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /** Pushes a path into history and synchronizes React state immediately. */
  function navigate(path: string) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }

    setPathname(path);
    window.scrollTo({ top: 0 });
  }

  return { pathname, navigate };
}
