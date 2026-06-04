import {
  clearMaskedCells,
  indexOf,
  SPAWNER_BLOCKER_PADDING_CELLS,
  type AutomataState,
} from "./automata-model";

const BLOCKER_SELECTOR = "[data-automata-blocker='spawner']";

export function refreshTextField(state: AutomataState) {
  state.edge.fill(0);
  state.mask.fill(0);
  state.emitters = [];

  const blockerElements = document.querySelectorAll<HTMLElement>(BLOCKER_SELECTOR);

  for (const element of blockerElements) {
    const rect = element.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      markBlockerRadius(state, rect);
    }
  }

  clearMaskedCells(state);
}

function markBlockerRadius(state: AutomataState, rect: DOMRect) {
  const centerX = (rect.left + rect.right) / 2;
  const centerY = (rect.top + rect.bottom) / 2;
  const radius =
    Math.max(rect.width, rect.height) / 2 +
    SPAWNER_BLOCKER_PADDING_CELLS * state.cellSize;
  const left = Math.max(0, Math.floor((centerX - radius) / state.cellSize));
  const right = Math.min(
    state.cols - 1,
    Math.ceil((centerX + radius) / state.cellSize),
  );
  const top = Math.max(0, Math.floor((centerY - radius) / state.cellSize));
  const bottom = Math.min(
    state.rows - 1,
    Math.ceil((centerY + radius) / state.cellSize),
  );

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const cellCenterX = x * state.cellSize + state.cellSize / 2;
      const cellCenterY = y * state.cellSize + state.cellSize / 2;
      const distance = Math.hypot(cellCenterX - centerX, cellCenterY - centerY);

      if (distance <= radius) {
        state.mask[indexOf(state, x, y)] = 1;
      }
    }
  }
}
