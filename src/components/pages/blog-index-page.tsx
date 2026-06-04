import { FileText } from "lucide-react";

import { TextLink } from "@/components/shell/text-link";
import type { BlogPost } from "@/lib/blog";
import type { Navigate } from "@/lib/navigation";

export function BlogIndexPage({
  navigate,
  sortedPosts,
}: {
  navigate: Navigate;
  sortedPosts: BlogPost[];
}) {
  return (
    <section>
      <div className="mb-10 space-y-3 border-l border-border pl-4">
        <p className="text-xs uppercase tracking-normal text-muted-foreground">
          blog
        </p>
        <h1 className="text-2xl font-semibold leading-tight">posts</h1>
      </div>

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
          </article>
        ))}
      </div>
    </section>
  );
}
