import { FileText } from "lucide-react";

import { TextLink } from "@/components/shell/text-link";
import type { BlogPost } from "@/lib/blog";
import type { Navigate } from "@/lib/navigation";

export function AboutPage({
  navigate,
  sortedPosts,
}: {
  navigate: Navigate;
  sortedPosts: BlogPost[];
}) {
  return (
    <>
      <section className="space-y-5">
        <p className="text-xs uppercase tracking-normal text-muted-foreground">
          stoned_academia
        </p>
        <h1 className="max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl">
          plain text for notes that still want a place to live.
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          A small web notebook for essays, scraps, references, and loose
          arguments. The format is Markdown; the surface stays quiet.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="mb-5 text-sm font-semibold">blog</h2>
        <div className="space-y-5">
          {sortedPosts.map((post) => (
            <article className="border-l border-border pl-4" key={post.slug}>
              <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <TextLink href={post.path} navigate={navigate}>
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    {post.title}
                  </span>
                </TextLink>
                {post.date ? (
                  <time className="text-xs text-muted-foreground">
                    {post.date}
                  </time>
                ) : null}
              </div>
              {post.description ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  {post.description}
                </p>
              ) : null}
              {post.tags.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      className="max-w-full truncate rounded-sm border border-border px-2 py-1 text-xs text-primary"
                      key={tag}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
