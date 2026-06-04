import { type AutomataState } from "../automata-model";

type EntryKind = "char" | "katex" | "graphviz";

type BridgeEntry = {
  kind: EntryKind;
  element: Element;
  interactionCells: number[];
  lastPulsedTick: number;
  rect: DOMRect;
  text: string;
};

const INTERACTION_RADIUS_CELLS = 2;

export class AutomataTextBridge {
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
      this.entries.push({
        kind: "char",
        element: span,
        interactionCells: cellsNearRect(state, rect),
        lastPulsedTick: -999,
        rect,
        text: span.textContent ?? "",
      });
    }

    for (const container of document.querySelectorAll<HTMLElement>("[data-automata-field] .katex-html")) {
      for (const span of collectKaTeXLeafSpans(container)) {
        const rect = span.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        this.entries.push({
          kind: "katex",
          element: span,
          interactionCells: cellsNearRect(state, rect),
          lastPulsedTick: -999,
          rect,
          text: span.textContent ?? "",
        });
      }
    }

    for (const svg of document.querySelectorAll<SVGSVGElement>("[data-automata-field] svg")) {
      for (const group of svg.querySelectorAll<SVGGElement>("g.node")) {
        const rect = group.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        this.entries.push({
          kind: "graphviz",
          element: group,
          interactionCells: cellsNearRect(state, rect),
          lastPulsedTick: -999,
          rect,
          text: group.querySelector("title")?.textContent ?? "",
        });
      }
    }

    this.stampGlyphBitmaps(state);
  }

  private stampGlyphBitmaps(state: AutomataState): void {
    for (const entry of this.entries) {
      if (entry.kind === "graphviz" || !entry.text.trim()) {
        continue;
      }

      const { rect, text, element } = entry;
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));

      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext("2d");

      if (!ctx) continue;

      const styles = window.getComputedStyle(element as HTMLElement);
      const font =
        styles.font ||
        [
          styles.fontStyle,
          styles.fontVariant,
          styles.fontWeight,
          styles.fontSize,
          styles.fontFamily,
        ].join(" ");

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "white";
      ctx.font = font;
      ctx.textBaseline = "top";
      ctx.fillText(text, 0, 0);

      const imageData = ctx.getImageData(0, 0, w, h);
      const pixels = imageData.data;

      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const brightness = pixels[(py * w + px) * 4];
          if (brightness < 128) continue;

          const screenX = rect.left + px;
          const screenY = rect.top + py;
          const cellX = Math.floor(screenX / state.cellSize);
          const cellY = Math.floor(screenY / state.cellSize);

          if (cellX < 0 || cellX >= state.cols || cellY < 0 || cellY >= state.rows) continue;

          const cellIndex = cellY * state.cols + cellX;
          if (!state.mask[cellIndex]) {
            state.grid[cellIndex] = 1;
          }
        }
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

      if (!hasNearbyCell || tick - entry.lastPulsedTick < 60) {
        continue;
      }

      entry.lastPulsedTick = tick;
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

function cellsNearRect(state: AutomataState, rect: DOMRect): number[] {
  const radius = INTERACTION_RADIUS_CELLS * state.cellSize;
  const left = Math.max(0, Math.floor((rect.left - radius) / state.cellSize));
  const right = Math.min(
    state.cols - 1,
    Math.ceil((rect.right + radius) / state.cellSize),
  );
  const top = Math.max(0, Math.floor((rect.top - radius) / state.cellSize));
  const bottom = Math.min(
    state.rows - 1,
    Math.ceil((rect.bottom + radius) / state.cellSize),
  );
  const cells: number[] = [];

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const cellIndex = y * state.cols + x;
      if (state.mask[cellIndex]) continue;

      const cellCenterX = x * state.cellSize + state.cellSize / 2;
      const cellCenterY = y * state.cellSize + state.cellSize / 2;

      if (distanceToRect(cellCenterX, cellCenterY, rect) <= radius) {
        cells.push(cellIndex);
      }
    }
  }

  return cells;
}

function distanceToRect(x: number, y: number, rect: DOMRect): number {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}
