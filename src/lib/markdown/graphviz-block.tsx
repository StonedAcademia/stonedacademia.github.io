import { useEffect, useRef, useState } from "react";

/** Resolved Viz renderer returned by the lazily imported package. */
type VizInstance = Awaited<
  ReturnType<(typeof import("@viz-js/viz"))["instance"]>
>;

/** Props for a rendered Graphviz Markdown block. */
type GraphvizBlockProps = {
  /** Optional automata field name that lets the text bridge sample the SVG. */
  automataField?: string;
  /** DOT source code from the Markdown fence. */
  source: string;
};

/** Shared lazy Viz instance so Markdown posts do not inflate the initial bundle. */
let vizInstance: Promise<VizInstance> | undefined;

/** Loads Viz on demand and reuses the same WASM-backed renderer afterward. */
function loadViz() {
  vizInstance ??= import("@viz-js/viz").then(({ instance }) => instance());
  return vizInstance;
}

/**
 * Renders Graphviz DOT source into an SVG figure.
 *
 * @remarks
 * Rendering is asynchronous and cancellable so navigating between Markdown posts
 * cannot replace the contents of an unmounted figure.
 */
export function GraphvizBlock({
  automataField,
  source,
}: GraphvizBlockProps) {
  const graphRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    setError(undefined);

    loadViz()
      .then((viz) => viz.renderSVGElement(source, { engine: "dot" }))
      .then((svg) => {
        if (cancelled || !graphRef.current) {
          return;
        }

        graphRef.current.replaceChildren(svg);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  if (error) {
    return (
      <pre className="graphviz-source">
        <code>{source}</code>
      </pre>
    );
  }

  return (
    <figure
      className="graphviz"
      {...(automataField !== undefined ? { "data-automata-field": automataField } : {})}
    >
      <div ref={graphRef} />
    </figure>
  );
}
