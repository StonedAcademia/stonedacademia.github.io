import type { ReactNode } from "react";

import type { Navigate } from "@/lib/navigation";

export function TextLink({
  children,
  href,
  navigate,
}: {
  children: ReactNode;
  href: string;
  navigate: Navigate;
}) {
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
