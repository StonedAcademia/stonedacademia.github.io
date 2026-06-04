import type { CSSProperties } from "react";
import { FileText } from "lucide-react";

import { TextLink } from "@/components/shell/text-link";
import type { BlogPost } from "@/lib/blog";
import type { Navigate } from "@/lib/navigation";
import { PretextText } from "@/lib/pretext/pretext-text";
import { cn } from "@/lib/utils";

type BlogPostListProps = {
  navigate: Navigate;
  onSelectTag: (tag: string) => void;
  posts: BlogPost[];
  selectedTag: string;
};

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

function motionStyle(index: number) {
  return { "--item-index": index } as CSSProperties;
}
