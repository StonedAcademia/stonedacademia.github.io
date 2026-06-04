import type { ReactNode } from "react";

import type { Navigate } from "@/lib/navigation";

/** Props for an SPA-aware semantic anchor. */
type TextLinkProps = {
  /** Rendered link contents. */
  children: ReactNode;
  /** Destination path preserved in the DOM `href`. */
  href: string;
  /** Internal navigation callback invoked after preventing default clicks. */
  navigate: Navigate;
};

/**
 * Anchor that keeps semantic `href` behavior while delegating clicks to the SPA.
 */
export function TextLink({
  children,
  href,
  navigate,
}: TextLinkProps) {
  return (
    <a
      className="motion-link text-primary underline decoration-dotted underline-offset-4 hover:decoration-solid"
      href={href}
      onClick={(event) => {
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}
