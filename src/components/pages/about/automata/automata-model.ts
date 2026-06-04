/** Diagonal direction used when orienting mobile Life patterns. */
export type Direction = "ne" | "nw" | "se" | "sw";

/** A text-edge launch point that periodically emits a glider. */
export type Emitter = {
  /** Direction the emitted pattern should travel. */
  direction: Direction;
  /** Grid x coordinate of the emission origin. */
  x: number;
  /** Grid y coordinate of the emission origin. */
  y: number;
};

/**
 * Mutable Game of Life state shared by the background and specimen renderers.
 *
 * @remarks
 * `grid`, `buffer`, `edge`, and `mask` use the same wrapped linear indexing so
 * evolution can swap buffers without reallocating on every tick.
 */
export type AutomataState = {
  /** Scratch generation buffer swapped with `grid` after each step. */
  buffer: Uint8Array;
  /** Pixel size of one logical cell. */
  cellSize: number;
  /** Number of columns in the wrapped grid. */
  cols: number;
  /** Cells adjacent to text or diagrams, used for color and emitters. */
  edge: Uint8Array;
  /** Dynamic launch points derived from text layout. */
  emitters: Emitter[];
  /** Current live/dead generation, with `1` meaning alive. */
  grid: Uint8Array;
  /** Cells reserved for UI blockers where automata should not render or evolve. */
  mask: Uint8Array;
  /** Deterministic random source seeded from viewport dimensions. */
  random: () => number;
  /** Number of rows in the wrapped grid. */
  rows: number;
};

/** Life pattern encoded as relative `[x, y]` live-cell coordinates. */
export type Pattern = ReadonlyArray<readonly [number, number]>;

/** Extra mask radius around foreground specimen controls, measured in cells. */
export const SPAWNER_BLOCKER_PADDING_CELLS = 3;

/** Five-cell diagonal spaceship with period four. */
export const GLIDER: Pattern = [
  [1, 0],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
];

/** Orthogonal spaceship used to add larger moving structures to the field. */
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

/** Period-two oscillator. */
export const BLINKER: Pattern = [
  [0, 0],
  [1, 0],
  [2, 0],
];

/** Still-life block. */
export const BLOCK: Pattern = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
];

/** Period-three oscillator used by the specimen carousel. */
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

/**
 * Creates a viewport-sized automata state with deterministic randomness.
 *
 * @param width - Viewport width in CSS pixels.
 * @param height - Viewport height in CSS pixels.
 */
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

/**
 * Stamps a pattern into the grid after orienting it toward the requested edge.
 */
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

/** Clears current and buffered live cells wherever the UI mask is active. */
export function clearMaskedCells(state: AutomataState) {
  for (let cellIndex = 0; cellIndex < state.grid.length; cellIndex += 1) {
    if (state.mask[cellIndex]) {
      state.grid[cellIndex] = 0;
      state.buffer[cellIndex] = 0;
    }
  }
}

/**
 * Converts wrapped grid coordinates into a linear array index.
 *
 * @remarks
 * Wrapping makes the full-field background toroidal, allowing edge-spawned
 * patterns to keep moving without extra boundary checks.
 */
export function indexOf(state: AutomataState, x: number, y: number) {
  const wrappedX = (x + state.cols) % state.cols;
  const wrappedY = (y + state.rows) % state.rows;

  return wrappedY * state.cols + wrappedX;
}

/** Reads the current viewport size in CSS pixels for canvas and grid sizing. */
export function viewportSize() {
  return {
    height: window.innerHeight,
    width: window.innerWidth,
  };
}

/** Mirrors pattern coordinates and normalizes them back to a zero-based box. */
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

/** Small deterministic PRNG used to keep the same viewport visually stable. */
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
