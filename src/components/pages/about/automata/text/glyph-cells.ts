import { type AutomataState } from "../automata-model";

/**
 * Rasterizes a single glyph into the automata grid cells it visually occupies.
 *
 * @remarks
 * Canvas rasterization makes collision zones match the actual font rather than
 * the looser DOM rectangle around each character.
 */
export function glyphInteractionCells(
  state: AutomataState,
  element: Element,
  rect: DOMRect,
  text: string,
) {
  const width = Math.max(1, Math.ceil(rect.width));
  const height = Math.max(1, Math.ceil(rect.height));
  const canvas = createGlyphCanvas(width, height);
  const context = canvas.getContext("2d");

  if (!context) {
    return [];
  }

  const styles = window.getComputedStyle(element as HTMLElement);
  const cells = new Set<number>();

  context.clearRect(0, 0, width, height);
  context.fillStyle = "white";
  context.font = styles.font || canvasFont(styles);
  context.textBaseline = "top";
  context.fillText(text, 0, 0);

  const { data } = context.getImageData(0, 0, width, height);

  for (let py = 0; py < height; py += 1) {
    for (let px = 0; px < width; px += 1) {
      if (data[(py * width + px) * 4 + 3] < 96) {
        continue;
      }

      const cellX = Math.floor((rect.left + px) / state.cellSize);
      const cellY = Math.floor((rect.top + py) / state.cellSize);

      if (cellX >= 0 && cellX < state.cols && cellY >= 0 && cellY < state.rows) {
        cells.add(cellY * state.cols + cellX);
      }
    }
  }

  return [...cells];
}

/** Maps a DOM rectangle to every automata cell overlapped by its bounds. */
export function rectInteractionCells(state: AutomataState, rect: DOMRect) {
  const left = Math.max(0, Math.floor(rect.left / state.cellSize));
  const right = Math.min(state.cols - 1, Math.ceil(rect.right / state.cellSize));
  const top = Math.max(0, Math.floor(rect.top / state.cellSize));
  const bottom = Math.min(state.rows - 1, Math.ceil(rect.bottom / state.cellSize));
  const cells: number[] = [];

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      cells.push(y * state.cols + x);
    }
  }

  return cells;
}

/** Marks interaction cells and their neighbors as text-edge cells. */
export function markGlyphEdges(state: AutomataState, cells: number[]) {
  for (const cellIndex of cells) {
    const x = cellIndex % state.cols;
    const y = Math.floor(cellIndex / state.cols);

    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const edgeX = x + dx;
        const edgeY = y + dy;

        if (edgeX >= 0 && edgeX < state.cols && edgeY >= 0 && edgeY < state.rows) {
          state.edge[edgeY * state.cols + edgeX] = 1;
        }
      }
    }
  }
}

/** Creates a throwaway canvas, preferring `OffscreenCanvas` when available. */
function createGlyphCanvas(width: number, height: number) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** Builds a canvas-compatible font shorthand when `computedStyle.font` is empty. */
function canvasFont(styles: CSSStyleDeclaration) {
  return [
    styles.fontStyle,
    styles.fontVariant,
    styles.fontWeight,
    styles.fontSize,
    styles.fontFamily,
  ].join(" ");
}
