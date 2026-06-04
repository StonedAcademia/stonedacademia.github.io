import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { AutomataSpecimen } from "@/components/pages/about/automata-specimen";
import { ShannonAutomataBackground } from "@/components/pages/about/shannon-automata-background";
import { AutomataText } from "@/components/pages/about/automata-text";

const aboutEquation = String.raw`$$
\begin{aligned}
  \int
\end{aligned}
$$`;

export function AboutPage() {
  return (
    <section className="about-page motion-page flex min-h-[calc(100vh-12rem)] flex-col">
      <ShannonAutomataBackground />
      <div className="about-copy max-w-2xl space-y-5">
        <div
          className="about-equation automata-text-field motion-block text-muted-foreground"
          data-automata-field="about"
        >
          <ReactMarkdown
            rehypePlugins={[rehypeKatex]}
            remarkPlugins={[remarkMath]}
          >
            {aboutEquation}
          </ReactMarkdown>
        </div>
        <AutomataText
          animation="heading"
          as="h1"
          className="automata-text-field max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl"
          data-automata-field="about"
          text="Welcome."
        />
        <AutomataText
          className="automata-text-field max-w-2xl text-sm leading-7 text-muted-foreground"
          data-automata-field="about"
          text="I hope to share my ideas, thoughts, and works in an attempt to articulate my ideas neatly."
        />
        <AutomataSpecimen />
      </div>
    </section>
  );
}
