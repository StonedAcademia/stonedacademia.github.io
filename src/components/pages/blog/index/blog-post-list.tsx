import type { CSSProperties } from "react";
import { FileText } from "lucide-react";

import { TextLink } from "@/components/shell/text-link";
import type { BlogPost } from "@/lib/blog";
import type { Navigate } from "@/lib/navigation";
import { PretextText } from "@/lib/pretext/pretext-text";
import { cn } from "@/lib/utils";

/** Props for the rendered, already-filtered post list. */
type BlogPostListProps = {
  /** Internal navigation callback for post links. */
  navigate: Navigate;
  /** Promotes a clicked tag into the index filter state. */
  onSelectTag: (tag: string) => void;
  /** Posts to display in their existing order. */
  posts: BlogPost[];
  /** Active tag used to style matching chips. */
  selectedTag: string;
};

/** Renders post summaries and tag shortcuts for the blog index. */
export function BlogPostList({
  navigate,
  onSelectTag,
  posts,
  selectedTag,
}: BlogPostListProps) {
  return (
    <div className="space-y-5">
      {posts.length ? (
        posts.map((post, postIndex) => (
          <article
            className="motion-rail motion-list-item border-l border-border pl-4"
            key={post.slug}
            style={motionStyle(postIndex)}
          >
            <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <TextLink href={post.path} navigate={navigate}>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="motion-icon h-3.5 w-3.5" />
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
              <PretextText
                className="text-sm leading-6 text-muted-foreground"
                index={postIndex}
                text={post.description}
              >
                {post.description}
              </PretextText>
            ) : null}
            {post.tags.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {post.tags.map((tag, tagIndex) => (
                  <button
                    className={cn(
                      "motion-chip max-w-full truncate rounded-sm border border-border px-2 py-1 text-xs text-primary transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                      selectedTag === tag &&
                        "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                    )}
                    key={tag}
                    onClick={() => onSelectTag(tag)}
                    style={motionStyle(tagIndex)}
                    type="button"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        ))
      ) : (
        <p className="motion-rail motion-block border-l border-border pl-4 text-sm leading-6 text-muted-foreground">
          No posts match those filters.
        </p>
      )}
    </div>
  );
}

/** Exposes the item position used by CSS staggered motion. */
function motionStyle(index: number) {
  return { "--item-index": index } as CSSProperties;
}
