import { Home } from "lucide-react";

import { TextLink } from "@/components/shell/text-link";
import type { Navigate } from "@/lib/navigation";

export function SiteHeader({ navigate }: { navigate: Navigate }) {
  return (
    <header className="mb-12 flex items-center gap-4 text-xs text-muted-foreground">
      <TextLink href="/" navigate={navigate}>
        <span className="inline-flex items-center gap-1">
          <Home className="h-3.5 w-3.5" />
          about
        </span>
      </TextLink>
      <span>/</span>
      <TextLink href="/blog" navigate={navigate}>
        blog
      </TextLink>
    </header>
  );
}
