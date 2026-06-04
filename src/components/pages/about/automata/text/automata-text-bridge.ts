import { type AutomataState } from "../automata-model";
import {
  glyphInteractionCells,
  markGlyphEdges,
  rectInteractionCells,
} from "./glyph-cells";

/** Kinds of DOM element the automata bridge can sample and annotate. */
type EntryKind = "char" | "katex" | "graphviz";

/** Cached DOM geometry and interaction cells for one sampled text-like element. */
type BridgeEntry = {
  /** Persistent collision timing state for this DOM element. */
  collision: CollisionState;
  /** Renderer-specific behavior for feedback and collision effects. */
  kind: EntryKind;
  /** Source DOM element that receives CSS variables or collision classes. */
  element: Element;
  /** Automata cells occupied by the element at the last layout refresh. */
  interactionCells: number[];
  /** Last measured browser rectangle. */
  rect: DOMRect;
  /** Text payload used for glyph rasterization or diagnostics. */
  text: string;
};

/** Per-element collision debouncing so pulses do not restart every frame. */
type CollisionState = {
  /** Last automata tick that triggered the pulse animation. */
  lastPulsedTick: number;
  /** Whether the previous update still had a live cell nearby. */
  wasColliding: boolean;
};

/**
 * Bridges DOM text, math, and diagrams into the canvas automata simulation.
 *
 * @remarks
 * `init` samples layout and marks edge cells; `update` writes CSS feedback and
 * collision classes. Keeping this class stateful lets WeakMap collision timing
 * survive layout refreshes for the same DOM nodes.
 */
export class AutomataTextBridge {
  private collisionStates = new WeakMap<Element, CollisionState>();
  private entries: BridgeEntry[] = [];
  private pendingTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();

  /**
   * Rebuilds sampled entries from the current DOM and marks their grid edges.
   */
  init(state: AutomataState): void {
    for (const entry of this.entries) {
      if (entry.kind !== "graphviz") {
        (entry.element as HTMLElement).style.removeProperty("--char-density");
        (entry.element as HTMLElement).style.removeProperty("--char-hue-shift");
      }
    }

    this.entries = [];

    // Plain automata text wraps each visible glyph in `data-automata-char`.
    for (const span of document.querySelectorAll<HTMLSpanElement>("[data-automata-char]")) {
      const rect = span.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      const text = span.textContent ?? "";
      const interactionCells = glyphInteractionCells(state, span, rect, text);
      markGlyphEdges(state, interactionCells);
      this.entries.push({
        collision: this.collisionStateFor(span),
        kind: "char",
        element: span,
        interactionCells,
        rect,
        text,
      });
    }

    // KaTeX creates nested spans; leaf spans are the closest glyph equivalent.
    for (const container of document.querySelectorAll<HTMLElement>("[data-automata-field] .katex-html")) {
      for (const span of collectKaTeXLeafSpans(container)) {
        const rect = span.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        const text = span.textContent ?? "";
        const interactionCells = glyphInteractionCells(state, span, rect, text);
        markGlyphEdges(state, interactionCells);
        this.entries.push({
          collision: this.collisionStateFor(span),
          kind: "katex",
          element: span,
          interactionCells,
          rect,
          text,
        });
      }
    }

    // Graphviz nodes use full rectangles because text is inside SVG groups.
    for (const svg of document.querySelectorAll<SVGSVGElement>("[data-automata-field] svg")) {
      for (const group of svg.querySelectorAll<SVGGElement>("g.node")) {
        const rect = group.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        this.entries.push({
          collision: this.collisionStateFor(group),
          kind: "graphviz",
          element: group,
          interactionCells: rectInteractionCells(state, rect),
          rect,
          text: group.querySelector("title")?.textContent ?? "",
        });
      }
    }
  }

  /** Applies visual feedback and collision pulses for the current automata tick. */
  update(state: AutomataState, tick: number): void {
    if (tick % 4 === 0) {
      this.updateFeedback(state);
    }
    this.updateCollisions(state, tick);
  }

  /** Clears delayed class-removal timers created by collision pulses. */
  destroy(): void {
    for (const id of this.pendingTimeouts) {
      clearTimeout(id);
    }
    this.pendingTimeouts.clear();
  }

  /** Updates per-glyph density and entropy CSS variables. */
  private updateFeedback(state: AutomataState): void {
    for (const entry of this.entries) {
      if (entry.kind === "graphviz") continue;

      const { element, interactionCells } = entry;
      let liveCount = 0;

      for (const cellIndex of interactionCells) {
        liveCount += state.grid[cellIndex];
      }

      const density = interactionCells.length > 0 ? liveCount / interactionCells.length : 0;
      const p = density;
      let entropy = 0;

      if (p > 0 && p < 1) {
        entropy = -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
      }

      (element as HTMLElement).style.setProperty("--char-density", density.toFixed(3));
      (element as HTMLElement).style.setProperty("--char-hue-shift", `${(entropy * 30).toFixed(1)}deg`);
    }
  }

  /** Adds a throttled collision class when a live cell intersects an entry. */
  private updateCollisions(state: AutomataState, tick: number): void {
    for (const entry of this.entries) {
      const hasNearbyCell = entry.interactionCells.some(
        (cellIndex) => state.grid[cellIndex] === 1,
      );

      if (!hasNearbyCell) {
        entry.collision.wasColliding = false;
        continue;
      }

      if (
        entry.collision.wasColliding ||
        tick - entry.collision.lastPulsedTick < 60
      ) {
        entry.collision.wasColliding = true;
        continue;
      }

      entry.collision.lastPulsedTick = tick;
      entry.collision.wasColliding = true;
      entry.element.classList.remove("automata-collision");
      // Force reflow so re-adding the class restarts the CSS animation.
      void entry.element.getBoundingClientRect();
      entry.element.classList.add("automata-collision");

      const timeoutId = setTimeout(() => {
        this.pendingTimeouts.delete(timeoutId);
        entry.element.classList.remove("automata-collision");
      }, 500);
      this.pendingTimeouts.add(timeoutId);
    }
  }

  /** Returns persistent collision timing for an element, creating it on demand. */
  private collisionStateFor(element: Element): CollisionState {
    const state = this.collisionStates.get(element);

    if (state) {
      return state;
    }

    const nextState = { lastPulsedTick: -999, wasColliding: false };
    this.collisionStates.set(element, nextState);
    return nextState;
  }
}

/** Finds KaTeX spans that directly contain visible text. */
function collectKaTeXLeafSpans(root: Element): HTMLSpanElement[] {
  const leaves: HTMLSpanElement[] = [];
  for (const span of root.querySelectorAll<HTMLSpanElement>("span")) {
    if (span.children.length === 0 && (span.textContent ?? "").trim() !== "") {
      leaves.push(span);
    }
  }
  return leaves;
}
