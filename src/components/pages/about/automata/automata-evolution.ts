import {
  clearMaskedCells,
  GLIDER,
  indexOf,
  LIGHTWEIGHT_SPACESHIP,
  stampPattern,
  type AutomataState,
} from "./automata-model";

export function seedField(state: AutomataState) {
  state.grid.fill(0);

  const patternCount = Math.max(28, Math.floor((state.cols * state.rows) / 420));

  for (let patternIndex = 0; patternIndex < patternCount; patternIndex += 1) {
    const side = Math.floor(state.random() * 4);
    const x = Math.floor(state.random() * state.cols);
    const y = Math.floor(state.random() * state.rows);

    if (patternIndex % 5 === 0) {
      stampPattern(
        state,
        LIGHTWEIGHT_SPACESHIP,
        side < 2 ? x : side === 2 ? 2 : state.cols - 8,
        side < 2 ? (side === 0 ? 2 : state.rows - 8) : y,
        side === 0 ? "se" : side === 1 ? "ne" : side === 2 ? "se" : "sw",
      );
    } else {
      stampPattern(
        state,
        GLIDER,
        side === 2 ? 2 : side === 3 ? state.cols - 5 : x,
        side === 0 ? 2 : side === 1 ? state.rows - 5 : y,
        side === 0 ? "se" : side === 1 ? "ne" : side === 2 ? "se" : "sw",
      );
    }
  }

  clearMaskedCells(state);
}

export function stepField(state: AutomataState) {
  const { buffer, cols, grid, mask, rows } = state;

  buffer.fill(0);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cellIndex = indexOf(state, x, y);

      if (mask[cellIndex]) {
        continue;
      }

      const neighbors =
        grid[indexOf(state, x - 1, y - 1)] +
        grid[indexOf(state, x, y - 1)] +
        grid[indexOf(state, x + 1, y - 1)] +
        grid[indexOf(state, x - 1, y)] +
        grid[indexOf(state, x + 1, y)] +
        grid[indexOf(state, x - 1, y + 1)] +
        grid[indexOf(state, x, y + 1)] +
        grid[indexOf(state, x + 1, y + 1)];

      if (grid[cellIndex]) {
        buffer[cellIndex] = neighbors === 2 || neighbors === 3 ? 1 : 0;
      } else {
        buffer[cellIndex] = neighbors === 3 ? 1 : 0;
      }
    }
  }

  state.grid = buffer;
  state.buffer = grid;
}

export function emitFromText(state: AutomataState, tick: number) {
  if (!state.emitters.length || tick % 16 !== 0) {
    return;
  }

  const emitter = state.emitters[tick % state.emitters.length];
  stampPattern(state, GLIDER, emitter.x, emitter.y, emitter.direction);
}

export function emitFromEdges(state: AutomataState, tick: number) {
  if (tick % 28 !== 0) {
    return;
  }

  const side = tick % 4;
  const x = Math.floor(state.random() * state.cols);
  const y = Math.floor(state.random() * state.rows);

  stampPattern(
    state,
    tick % 3 === 0 ? LIGHTWEIGHT_SPACESHIP : GLIDER,
    side === 2 ? 2 : side === 3 ? state.cols - 7 : x,
    side === 0 ? 2 : side === 1 ? state.rows - 7 : y,
    side === 0 ? "se" : side === 1 ? "ne" : side === 2 ? "se" : "sw",
  );
}
