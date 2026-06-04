export type Direction = "ne" | "nw" | "se" | "sw";

export type Emitter = {
  direction: Direction;
  x: number;
  y: number;
};

export type AutomataState = {
  buffer: Uint8Array;
  cellSize: number;
  cols: number;
  edge: Uint8Array;
  emitters: Emitter[];
  grid: Uint8Array;
  mask: Uint8Array;
  random: () => number;
  rows: number;
};

export type Pattern = ReadonlyArray<readonly [number, number]>;

export const SPAWNER_BLOCKER_PADDING_CELLS = 3;

export const GLIDER: Pattern = [
  [1, 0],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
];

export const LIGHTWEIGHT_SPACESHIP: Pattern = [
  [1, 0],
  [4, 0],
  [0, 1],
  [0, 2],
  [4, 2],
  [0, 3],
  [1, 3],
  [2, 3],
  [3, 3],
];

export const BLINKER: Pattern = [
  [0, 0],
  [1, 0],
  [2, 0],
];

export const BLOCK: Pattern = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
];

export const PULSAR: Pattern = [
  [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
  [0, 2], [5, 2], [7, 2], [12, 2],
  [0, 3], [5, 3], [7, 3], [12, 3],
  [0, 4], [5, 4], [7, 4], [12, 4],
  [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],
  [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
  [0, 8], [5, 8], [7, 8], [12, 8],
  [0, 9], [5, 9], [7, 9], [12, 9],
  [0, 10], [5, 10], [7, 10], [12, 10],
  [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12],
];

export function createAutomataState(width: number, height: number) {
  const cellSize = width < 680 ? 7 : 8;
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const length = cols * rows;

  return {
    buffer: new Uint8Array(length),
    cellSize,
    cols,
    edge: new Uint8Array(length),
    emitters: [],
    grid: new Uint8Array(length),
    mask: new Uint8Array(length),
    random: mulberry32(width * 131 + height * 17 + length),
    rows,
  } satisfies AutomataState;
}

export function stampPattern(
  state: AutomataState,
  pattern: Pattern,
  originX: number,
  originY: number,
  direction: Direction,
) {
  for (const [patternX, patternY] of orientPattern(pattern, direction)) {
    const x = originX + patternX;
    const y = originY + patternY;
    const cellIndex = indexOf(state, x, y);

    if (!state.mask[cellIndex]) {
      state.grid[cellIndex] = 1;
    }
  }
}

export function clearMaskedCells(state: AutomataState) {
  for (let cellIndex = 0; cellIndex < state.grid.length; cellIndex += 1) {
    if (state.mask[cellIndex]) {
      state.grid[cellIndex] = 0;
      state.buffer[cellIndex] = 0;
    }
  }
}

export function indexOf(state: AutomataState, x: number, y: number) {
  const wrappedX = (x + state.cols) % state.cols;
  const wrappedY = (y + state.rows) % state.rows;

  return wrappedY * state.cols + wrappedX;
}

export function viewportSize() {
  return {
    height: window.innerHeight,
    width: window.innerWidth,
  };
}

function orientPattern(pattern: Pattern, direction: Direction) {
  const points = pattern.map(([x, y]) => {
    if (direction === "nw") {
      return [-x, -y] as const;
    }

    if (direction === "ne") {
      return [x, -y] as const;
    }

    if (direction === "sw") {
      return [-x, y] as const;
    }

    return [x, y] as const;
  });

  const minX = Math.min(...points.map(([x]) => x));
  const minY = Math.min(...points.map(([, y]) => y));

  return points.map(([x, y]) => [x - minX, y - minY] as const);
}

function mulberry32(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
