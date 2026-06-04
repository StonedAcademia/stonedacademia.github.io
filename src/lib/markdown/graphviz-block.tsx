import { useEffect, useRef, useState } from "react";

type VizInstance = Awaited<
  ReturnType<(typeof import("@viz-js/viz"))["instance"]>
>;

let vizInstance: Promise<VizInstance> | undefined;

function loadViz() {
  vizInstance ??= import("@viz-js/viz").then(({ instance }) => instance());
  return vizInstance;
}

export function GraphvizBlock({ source }: { source: string }) {
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
    <figure className="graphviz">
      <div ref={graphRef} />
    </figure>
  );
}
