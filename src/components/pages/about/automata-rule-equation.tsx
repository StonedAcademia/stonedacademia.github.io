import { useMemo } from "react";
import katex from "katex";

import type { SpecimenRuleReadout } from "./specimen/specimen-simulation";

/** Conway transition rule rendered as display KaTeX beside the specimen. */
const conwayRule = String.raw`\begin{aligned}
N_{i,j}(t)
  &= \sum_{\substack{a,b\in\{-1,0,1\}\\(a,b)\ne(0,0)}}
     x_{i+a,j+b}(t)\\
x_{i,j}(t+1)
  &=
  \begin{cases}
    1, & x_{i,j}(t)=0 \land N_{i,j}(t)=3\\
    1, & x_{i,j}(t)=1 \land N_{i,j}(t)\in\{2,3\}\\
    0, & \text{otherwise}
  \end{cases}
\end{aligned}`;

/** Accessible aside explaining the B3/S23 transition used by the automata. */
export function AutomataRuleEquation({
  readout,
}: {
  readout: SpecimenRuleReadout | null;
}) {
  const conwayRuleHtml = useMemo(
    () =>
      katex.renderToString(conwayRuleFor(readout), {
        displayMode: true,
        throwOnError: false,
      }),
    [readout],
  );

  return (
    <aside
      aria-label="Conway Game of Life transition equation"
      className="automata-rule-equation automata-text-field"
    >
      <div className="automata-rule-equation-meta" aria-hidden="true">
        <span>Conway's G.o.L. Transition</span>
        <span
          className="automata-rule-equation-rule"
          data-active={readout ? "true" : undefined}
        >
          {readout?.ruleToken ?? "B3/S23"}
        </span>
      </div>
      <div
        className="automata-rule-equation-formula"
        dangerouslySetInnerHTML={{ __html: conwayRuleHtml }}
      />
      {readout ? (
        <div className="automata-rule-equation-live" aria-hidden="true">
          <span>{readout.cellLabel}</span>
          <span>{`t=${readout.generation}`}</span>
          <span>{`N=${readout.neighborCount}`}</span>
          <span>{`${readout.currentValue}->${readout.nextValue}`}</span>
        </div>
      ) : null}
      <p className="sr-only">
        A live-neighbor count updates each cell: dead cells are born with three
        live neighbors, live cells survive with two or three live neighbors, and
        all other cells are dead in the next tick.
      </p>
    </aside>
  );
}

function conwayRuleFor(readout: SpecimenRuleReadout | null) {
  if (!readout) {
    return conwayRule;
  }

  const nextGeneration = readout.generation + 1;

  return String.raw`\begin{aligned}
N_{${readout.x},${readout.y}}^{(${readout.generation})}
  &= \sum_{\substack{a,b\in\{-1,0,1\}\\(a,b)\ne(0,0)}}
     x_{${readout.x}+a,${readout.y}+b}^{(${readout.generation})}
   = ${readout.neighborCount}\\
x_{${readout.x},${readout.y}}^{(${readout.generation})}
  &= ${readout.currentValue}\\
x_{${readout.x},${readout.y}}^{(${nextGeneration})}
  &=
  \begin{cases}
    1, & ${readout.currentValue}=0 \land ${readout.neighborCount}=3\\
    1, & ${readout.currentValue}=1 \land ${readout.neighborCount}\in\{2,3\}\\
    0, & \text{otherwise}
  \end{cases}
  = ${readout.nextValue}
\end{aligned}`;
}
