import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { TextLink } from "@/components/shell/text-link";
import type { BlogPost } from "@/lib/blog";
import { MarkdownPre } from "@/lib/markdown/markdown-pre";
import type { Navigate } from "@/lib/navigation";

export function BlogPage({
  navigate,
  post,
}: {
  navigate: Navigate;
  post: BlogPost;
}) {
  return (
    <article>
      <div className="mb-10 space-y-3 border-l border-border pl-4">
        <p className="text-xs text-muted-foreground">{post.path}</p>
        <h1 className="text-2xl font-semibold leading-tight">{post.title}</h1>
        {post.description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {post.description}
          </p>
        ) : null}
        {post.date ? (
          <time className="block text-xs text-muted-foreground">
            {post.date}
          </time>
        ) : null}
        {post.tags.length ? (
          <div className="flex flex-wrap gap-2">
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
      </div>

      <ReactMarkdown
        className="markdown"
        components={{
          a({ children, href }) {
            if (href?.startsWith("/")) {
              return (
                <TextLink href={href} navigate={navigate}>
                  {children}
                </TextLink>
              );
            }

            return (
              <a href={href} rel="noreferrer" target="_blank">
                {children}
              </a>
            );
          },
          pre: MarkdownPre,
        }}
        rehypePlugins={[rehypeKatex]}
        remarkPlugins={[remarkGfm, remarkMath]}
      >
        {post.body}
      </ReactMarkdown>
    </article>
  );
}
