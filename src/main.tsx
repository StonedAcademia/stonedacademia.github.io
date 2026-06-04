import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "katex/dist/katex.min.css";
import "./index.css";
import "./lib/styles/motion-core.css";
import "./lib/styles/motion-controls.css";
import "./lib/styles/page-surfaces.css";
import "./lib/styles/pages/automata-specimen.css";
import "./lib/styles/markdown.css";

/** Mounts the React app after global theme, motion, Markdown, and KaTeX styles. */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
