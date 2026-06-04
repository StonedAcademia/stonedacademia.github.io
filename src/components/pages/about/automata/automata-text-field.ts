import {
  clearMaskedCells,
  indexOf,
  type AutomataState,
} from "./automata-model";

const TEXT_FIELD_SELECTOR = "[data-automata-field='about']";

export function refreshTextField(state: AutomataState) {
  state.edge.fill(0);
  state.mask.fill(0);
  state.emitters = [];

  const sourceElements = document.querySelectorAll<HTMLElement>(
    TEXT_FIELD_SELECTOR,
  );

  for (const element of sourceElements) {
    const rects = element.getClientRects();

    for (const rect of rects) {
      if (rect.width <= 0 || rect.height <= 0) {
        continue;
      }

      markTextRect(state, rect);
    }
  }

  clearMaskedCells(state);
}

function markTextRect(state: AutomataState, rect: DOMRect) {
  const padding = Math.max(10, state.cellSize * 1.5);
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

  state.emitters.push(
    { direction: "nw", x: edgeLeft, y: edgeTop },
    { direction: "ne", x: edgeRight - 3, y: edgeTop },
    { direction: "sw", x: edgeLeft, y: edgeBottom - 3 },
    { direction: "se", x: edgeRight - 3, y: edgeBottom - 3 },
  );
}
