import {
  clearMaskedCells,
  indexOf,
  SPAWNER_BLOCKER_PADDING_CELLS,
  type AutomataState,
} from "./automata-model";

const BLOCKER_SELECTOR = "[data-automata-blocker='spawner']";
const TEXT_FIELD_SELECTOR = "[data-automata-field='about']";

export function refreshTextField(state: AutomataState) {
  state.edge.fill(0);
  state.mask.fill(0);
  state.emitters = [];

  // Emitters at field element corners (element-level bounding box).
  const fieldElements = document.querySelectorAll<HTMLElement>(TEXT_FIELD_SELECTOR);

  for (const element of fieldElements) {
    const rect = element.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      placeFieldEmitters(state, rect);
    }
  }

  // Mask individual character spans — avoids a dead-zone border around the
  // entire element box when the element is wider than the text content.
  const charSpans = document.querySelectorAll<HTMLElement>("[data-automata-char]");

  for (const span of charSpans) {
    const rect = span.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      maskCharRect(state, rect);
    }
  }

  const blockerElements = document.querySelectorAll<HTMLElement>(BLOCKER_SELECTOR);

  for (const element of blockerElements) {
    const rect = element.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      markBlockerRadius(state, rect);
    }
  }

  clearMaskedCells(state);
}

function placeFieldEmitters(state: AutomataState, rect: DOMRect) {
  const padding = Math.max(4, state.cellSize);
  const left = Math.max(0, Math.floor((rect.left - padding) / state.cellSize));
  const right = Math.min(state.cols - 1, Math.ceil((rect.right + padding) / state.cellSize));
  const top = Math.max(0, Math.floor((rect.top - padding) / state.cellSize));
  const bottom = Math.min(state.rows - 1, Math.ceil((rect.bottom + padding) / state.cellSize));

  const edgeLeft = Math.max(0, left - 2);
  const edgeRight = Math.min(state.cols - 1, right + 2);
  const edgeTop = Math.max(0, top - 2);
  const edgeBottom = Math.min(state.rows - 1, bottom + 2);

  state.emitters.push(
    { direction: "nw", x: edgeLeft, y: edgeTop },
    { direction: "ne", x: edgeRight - 3, y: edgeTop },
    { direction: "sw", x: edgeLeft, y: edgeBottom - 3 },
    { direction: "se", x: edgeRight - 3, y: edgeBottom - 3 },
  );
}

function maskCharRect(state: AutomataState, rect: DOMRect) {
  const padding = Math.max(4, state.cellSize);
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

  const edgeLeft = Math.max(0, left - 2);
  const edgeRight = Math.min(state.cols - 1, right + 2);
  const edgeTop = Math.max(0, top - 2);
  const edgeBottom = Math.min(state.rows - 1, bottom + 2);

  for (let y = edgeTop; y <= edgeBottom; y += 1) {
    for (let x = edgeLeft; x <= edgeRight; x += 1) {
      const isFrame = x < left || x > right || y < top || y > bottom;

      if (isFrame) {
        state.edge[indexOf(state, x, y)] = 1;
      }
    }
  }
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
