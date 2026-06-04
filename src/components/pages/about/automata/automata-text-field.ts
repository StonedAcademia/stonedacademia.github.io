import {
  clearMaskedCells,
  indexOf,
  SPAWNER_BLOCKER_PADDING_CELLS,
  type AutomataState,
} from "./automata-model";

/** Selector for foreground controls that should repel the background field. */
const BLOCKER_SELECTOR = "[data-automata-blocker]";
const TRANSITION_BLOCKER_PADDING_CELLS = 2;

/**
 * Rebuilds text-edge and blocker masks from the current DOM layout.
 *
 * @remarks
 * The bridge populates glyph edges separately; this pass owns non-text blockers
 * and clears live cells that now fall under those blockers.
 */
export function refreshTextField(state: AutomataState) {
  state.edge.fill(0);
  state.mask.fill(0);
  state.emitters = [];

  const blockerElements = document.querySelectorAll<HTMLElement>(BLOCKER_SELECTOR);

  for (const element of blockerElements) {
    const rect = element.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      if (element.dataset.automataBlocker === "transition") {
        markBlockerRect(state, rect);
      } else {
        markBlockerRadius(state, rect);
      }
    }
  }

  clearMaskedCells(state);
}

/** Marks a circular mask around a foreground element's bounding box. */
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

/** Marks a padded rectangular mask for wide foreground equation surfaces. */
function markBlockerRect(state: AutomataState, rect: DOMRect) {
  const padding = TRANSITION_BLOCKER_PADDING_CELLS * state.cellSize;
  const left = Math.max(0, Math.floor((rect.left - padding) / state.cellSize));
  const right = Math.min(
    state.cols - 1,
    Math.ceil((rect.right + padding) / state.cellSize),
  );
  const top = Math.max(0, Math.floor((rect.top - padding) / state.cellSize));
  const bottom = Math.min(
    state.rows - 1,
    Math.ceil((rect.bottom + padding) / state.cellSize),
  );

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      state.mask[indexOf(state, x, y)] = 1;
    }
  }
}
