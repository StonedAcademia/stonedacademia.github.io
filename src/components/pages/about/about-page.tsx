import type { CSSProperties } from "react";
import { FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { TextLink } from "@/components/shell/text-link";
import type { BlogPost } from "@/lib/blog";
import type { Navigate } from "@/lib/navigation";
import { PretextText } from "@/lib/pretext/pretext-text";

const aboutEquation = String.raw`$$
\begin{aligned}
  \int_V
\end{aligned}
$$`;

export function AboutPage({
  navigate,
  sortedPosts,
}: {
  navigate: Navigate;
  sortedPosts: BlogPost[];
}) {
  return (
    <>
      <section className="motion-page space-y-5">
        <div className="about-equation motion-block text-muted-foreground">
          <ReactMarkdown
            rehypePlugins={[rehypeKatex]}
            remarkPlugins={[remarkMath]}
          >
            {aboutEquation}
          </ReactMarkdown>
        </div>
        <PretextText
          animation="heading"
          as="h1"
          className="max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl"
          text="Welcome."
        >
          Welcome.
        </PretextText>
        <PretextText
          className="max-w-2xl text-sm leading-7 text-muted-foreground"
          text="I hope to share my ideas, thoughts, and works in an attempt to articulate my ideas neatly."
        >
          I hope to share my ideas, thoughts, and works in an attempt to 
          articulate my ideas neatly.
        </PretextText>
      </section>

      <section className="mt-14">
        <h2 className="mb-5 text-sm font-semibold">blog</h2>
        <div className="space-y-5">
          {sortedPosts.map((post, postIndex) => (
            <article
              className="motion-rail motion-list-item border-l border-border pl-4"
              key={post.slug}
              style={{ "--item-index": postIndex } as CSSProperties}
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
                    <span
                      className="motion-chip max-w-full truncate rounded-sm border border-border px-2 py-1 text-xs text-primary"
                      key={tag}
                      style={{ "--item-index": tagIndex } as CSSProperties}
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
