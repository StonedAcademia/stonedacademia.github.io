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

  update(_state: AutomataState, _tick: number): void {
    // implemented in later tasks
  }
}
