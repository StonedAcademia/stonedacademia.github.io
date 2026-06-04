import { isValidElement, type CSSProperties, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

import { TextLink } from "@/components/shell/text-link";
import type { BlogPost } from "@/lib/blog";
import { MarkdownPre } from "@/lib/markdown/markdown-pre";
import type { Navigate } from "@/lib/navigation";
import { PretextText } from "@/lib/pretext/pretext-text";

/** Props for rendering one parsed Markdown post. */
type BlogPageProps = {
  /** Internal navigation callback for same-site Markdown links. */
  navigate: Navigate;
  /** Parsed post metadata and Markdown body. */
  post: BlogPost;
};

/**
 * Renders one Markdown post with local-link navigation and enhanced prose blocks.
 *
 * @remarks
 * Markdown headings, paragraphs, and list items pass raw text to `PretextText`
 * for measurement while preserving the original React Markdown children.
 */
export function BlogPage({
  navigate,
  post,
}: BlogPageProps) {
  return (
    <article className="motion-page">
      <div className="motion-rail motion-block mb-10 space-y-3 border-l border-border pl-4">
        <PretextText
          animation="meta"
          className="text-xs text-muted-foreground"
          text={post.path}
        />
        <PretextText
          animation="heading"
          as="h1"
          className="text-2xl font-semibold leading-tight"
          text={post.title}
        />
        {post.description ? (
          <PretextText
            className="text-sm leading-6 text-muted-foreground"
            text={post.description}
          >
            {post.description}
          </PretextText>
        ) : null}
        {post.date ? (
          <time className="motion-meta block text-xs text-muted-foreground">
            {post.date}
          </time>
        ) : null}
        {post.tags.length ? (
          <div className="flex flex-wrap gap-2">
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
      </div>

      <ReactMarkdown
        className="markdown motion-markdown"
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
          h1({ children }) {
            const text = textFromChildren(children);

            return (
              <PretextText as="h1" animation="heading" text={text}>
                {children}
              </PretextText>
            );
          },
          h2({ children }) {
            const text = textFromChildren(children);

            return (
              <PretextText as="h2" animation="heading" text={text}>
                {children}
              </PretextText>
            );
          },
          h3({ children }) {
            const text = textFromChildren(children);

            return (
              <PretextText as="h3" animation="heading" text={text}>
                {children}
              </PretextText>
            );
          },
          li({ children }) {
            const text = textFromChildren(children);

            return (
              <PretextText as="li" text={text}>
                {children}
              </PretextText>
            );
          },
          p({ children }) {
            const text = textFromChildren(children);

            return <PretextText text={text}>{children}</PretextText>;
          },
          pre: MarkdownPre,
        }}
        rehypePlugins={[rehypeKatex]}
        remarkPlugins={[remarkGfm, remarkMath]}
      >
        {post.body}
      </ReactMarkdown>

      <PretextText
        animation="meta"
        as="footer"
        className="motion-rail motion-block mt-10 border-l border-border pl-4 text-xs text-muted-foreground"
        text={post.readingTime}
      >
        {post.readingTime}
      </PretextText>
    </article>
  );
}

/** Extracts plain text from React Markdown children for layout measurement. */
function textFromChildren(children: ReactNode): string {
  if (
    children === null ||
    children === undefined ||
    typeof children === "boolean"
  ) {
    return "";
  }

  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map((child) => textFromChildren(child)).join("");
  }

  if (isValidElement(children)) {
    return textFromChildren(
      (children.props as { children?: ReactNode }).children,
    );
  }

  return "";
}
