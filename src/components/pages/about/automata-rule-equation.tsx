import katex from "katex";

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

/** Static KaTeX HTML; rendering once avoids repeated work during React renders. */
const conwayRuleHtml = katex.renderToString(conwayRule, {
  displayMode: true,
  throwOnError: false,
});

/** Accessible aside explaining the B3/S23 transition used by the automata. */
export function AutomataRuleEquation() {
  return (
    <aside
      aria-label="Conway Game of Life transition equation"
      className="automata-rule-equation automata-text-field"
    >
      <div className="automata-rule-equation-meta" aria-hidden="true">
        <span>Conway transition</span>
        <span>B3/S23</span>
      </div>
      <div
        className="automata-rule-equation-formula"
        dangerouslySetInnerHTML={{ __html: conwayRuleHtml }}
      />
      <p className="sr-only">
        A live-neighbor count updates each cell: dead cells are born with three
        live neighbors, live cells survive with two or three live neighbors, and
        all other cells are dead in the next tick.
      </p>
    </aside>
  );
}
