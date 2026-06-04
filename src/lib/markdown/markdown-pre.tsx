import {
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { GraphvizBlock } from "@/lib/markdown/graphviz-block";

/** Fenced code languages that should render as Graphviz diagrams. */
const graphvizLanguages = new Set(["dot", "graphviz", "gv"]);

/** React Markdown passes an internal `node`; this component only needs DOM props. */
type MarkdownPreProps = ComponentPropsWithoutRef<"pre"> & {
  node?: unknown;
};

/** Extracts the fenced-code language from React Markdown's generated class name. */
function languageFromClassName(className?: string) {
  return className?.match(/language-(\S+)/)?.[1].toLowerCase();
}

/** Flattens code children back to source text for Graphviz rendering. */
function textFromChildren(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(textFromChildren).join("");
  }

  return "";
}

/**
 * Replaces Graphviz code fences with rendered SVG while leaving other code intact.
 */
export function MarkdownPre({
  children,
  node: _node,
  ...props
}: MarkdownPreProps) {
  if (isValidElement<{ className?: string; children?: ReactNode }>(children)) {
    const language = languageFromClassName(children.props.className);

    if (language && graphvizLanguages.has(language)) {
      return <GraphvizBlock source={textFromChildren(children.props.children)} />;
    }
  }

  return <pre {...props}>{children}</pre>;
}
