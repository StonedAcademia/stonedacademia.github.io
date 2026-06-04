import { type AutomataState } from "./automata-model";

type CharEntry = {
  cellWindowX1: number;
  cellWindowY1: number;
  cellWindowX2: number;
  cellWindowY2: number;
  element: HTMLSpanElement;
  lastPulsedTick: number;
  rect: DOMRect;
  text: string;
};

export class AutomataTextBridge {
  private chars: CharEntry[] = [];
  private edgeLookup: Map<number, number> = new Map();

  init(state: AutomataState): void {
    this.chars = [];
    this.edgeLookup = new Map();

    const spans = document.querySelectorAll<HTMLSpanElement>("[data-automata-char]");

    for (const span of spans) {
      const rect = span.getBoundingClientRect();
      const text = span.textContent ?? "";

      const x1 = Math.max(0, Math.floor(rect.left / state.cellSize));
      const y1 = Math.max(0, Math.floor(rect.top / state.cellSize));
      const x2 = Math.min(state.cols - 1, Math.ceil(rect.right / state.cellSize));
      const y2 = Math.min(state.rows - 1, Math.ceil(rect.bottom / state.cellSize));

      this.chars.push({
        cellWindowX1: x1,
        cellWindowY1: y1,
        cellWindowX2: x2,
        cellWindowY2: y2,
        element: span,
        lastPulsedTick: -999,
        rect,
        text,
      });
    }

    this.buildEdgeLookup(state);
    this.stampGlyphBitmaps(state);
  }

  private buildEdgeLookup(state: AutomataState): void {
    for (let cellIndex = 0; cellIndex < state.edge.length; cellIndex++) {
      if (!state.edge[cellIndex]) {
        continue;
      }

      const cellCol = cellIndex % state.cols;
      const cellRow = Math.floor(cellIndex / state.cols);

      let nearestIndex = -1;
      let nearestDist = Infinity;

      for (let i = 0; i < this.chars.length; i++) {
        const { rect } = this.chars[i];
        const charCellCx = (rect.left + rect.width / 2) / state.cellSize;
        const charCellCy = (rect.top + rect.height / 2) / state.cellSize;
        const dist = Math.hypot(cellCol + 0.5 - charCellCx, cellRow + 0.5 - charCellCy);

        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIndex = i;
        }
      }

      if (nearestIndex !== -1) {
        this.edgeLookup.set(cellIndex, nearestIndex);
      }
    }
  }

  private stampGlyphBitmaps(state: AutomataState): void {
    for (const char of this.chars) {
      if (!char.text.trim()) {
        continue; // skip spaces — no glyph to render
      }

      const { rect, text, element } = char;
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));

      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        continue;
      }

      const styles = window.getComputedStyle(element);
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
          const brightness = pixels[(py * w + px) * 4]; // red channel from white glyph

          if (brightness < 128) {
            continue;
          }

          const screenX = rect.left + px;
          const screenY = rect.top + py;
          const cellX = Math.floor(screenX / state.cellSize);
          const cellY = Math.floor(screenY / state.cellSize);

          if (cellX < 0 || cellX >= state.cols || cellY < 0 || cellY >= state.rows) {
            continue;
          }

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

  private updateFeedback(state: AutomataState): void {
    for (const char of this.chars) {
      const { cellWindowX1, cellWindowY1, cellWindowX2, cellWindowY2, element } = char;

      let liveCount = 0;
      let total = 0;

      for (let y = cellWindowY1; y <= cellWindowY2; y++) {
        for (let x = cellWindowX1; x <= cellWindowX2; x++) {
          if (x < 0 || x >= state.cols || y < 0 || y >= state.rows) {
            continue;
          }

          const cellIndex = y * state.cols + x;
          liveCount += state.grid[cellIndex];
          total++;
        }
      }

      const density = total > 0 ? liveCount / total : 0;

      // Binary Shannon entropy — 0 when all dead or all alive, 1 at 50/50
      const p = density;
      let entropy = 0;

      if (p > 0 && p < 1) {
        entropy = -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
      }

      element.style.setProperty("--char-density", density.toFixed(3));
      element.style.setProperty("--char-hue-shift", `${(entropy * 30).toFixed(1)}deg`);
    }
  }

  private updateCollisions(_state: AutomataState, _tick: number): void {
    // implemented in Task 6
  }
}
