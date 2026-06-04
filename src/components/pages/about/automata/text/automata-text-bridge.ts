import { type AutomataState } from "../automata-model";
import {
  glyphInteractionCells,
  markGlyphEdges,
  rectInteractionCells,
} from "./glyph-cells";

type EntryKind = "char" | "katex" | "graphviz";

type BridgeEntry = {
  collision: CollisionState;
  kind: EntryKind;
  element: Element;
  interactionCells: number[];
  rect: DOMRect;
  text: string;
};

type CollisionState = {
  lastPulsedTick: number;
  wasColliding: boolean;
};

export class AutomataTextBridge {
  private collisionStates = new WeakMap<Element, CollisionState>();
  private entries: BridgeEntry[] = [];
  private pendingTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();

  init(state: AutomataState): void {
    for (const entry of this.entries) {
      if (entry.kind !== "graphviz") {
        (entry.element as HTMLElement).style.removeProperty("--char-density");
        (entry.element as HTMLElement).style.removeProperty("--char-hue-shift");
      }
    }

    this.entries = [];

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

  update(state: AutomataState, tick: number): void {
    if (tick % 4 === 0) {
      this.updateFeedback(state);
    }
    this.updateCollisions(state, tick);
  }

  destroy(): void {
    for (const id of this.pendingTimeouts) {
      clearTimeout(id);
    }
    this.pendingTimeouts.clear();
  }

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
      void entry.element.getBoundingClientRect(); // force reflow to restart the animation
      entry.element.classList.add("automata-collision");

      const timeoutId = setTimeout(() => {
        this.pendingTimeouts.delete(timeoutId);
        entry.element.classList.remove("automata-collision");
      }, 500);
      this.pendingTimeouts.add(timeoutId);
    }
  }

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

function collectKaTeXLeafSpans(root: Element): HTMLSpanElement[] {
  const leaves: HTMLSpanElement[] = [];
  for (const span of root.querySelectorAll<HTMLSpanElement>("span")) {
    if (span.children.length === 0 && (span.textContent ?? "").trim() !== "") {
      leaves.push(span);
    }
  }
  return leaves;
}
