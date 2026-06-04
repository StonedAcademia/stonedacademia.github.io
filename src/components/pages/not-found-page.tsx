import { TextLink } from "@/components/shell/text-link";
import type { Navigate } from "@/lib/navigation";

export function NotFoundPage({
  navigate,
  path,
}: {
  navigate: Navigate;
  path: string;
}) {
  return (
    <section className="motion-page space-y-5">
      <p className="text-xs uppercase tracking-normal text-muted-foreground">
        404
      </p>
      <h1 className="text-2xl font-semibold">not found</h1>
      <p className="max-w-xl text-sm leading-7 text-muted-foreground">
        No page exists at <span className="text-foreground">{path}</span>.
      </p>
      <TextLink href="/" navigate={navigate}>
        return home
      </TextLink>
    </section>
  );
}
