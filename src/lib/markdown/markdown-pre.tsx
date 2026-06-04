import {
  isValidElement,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

import { GraphvizBlock } from "@/lib/markdown/graphviz-block";

const graphvizLanguages = new Set(["dot", "graphviz", "gv"]);

type MarkdownPreProps = ComponentPropsWithoutRef<"pre"> & {
  node?: unknown;
};

function languageFromClassName(className?: string) {
  return className?.match(/language-(\S+)/)?.[1].toLowerCase();
}

function textFromChildren(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(textFromChildren).join("");
  }

  return "";
}

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
