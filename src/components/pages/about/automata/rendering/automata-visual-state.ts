import { indexOf, type AutomataState } from "../automata-model";
import {
  activateCell,
  approach,
  clearCell,
  isActive,
  isAlive,
  rateFor,
  removeActiveCell,
} from "./visual-entity-pool";

/**
 * Per-cell render state layered on top of the discrete automata grid.
 *
 * @remarks
 * Active-cell arrays let renderers iterate only visible or fading cells instead
 * of scanning the whole grid every frame.
 */
export type AutomataVisualState = {
  /** Milliseconds since the current visual birth of each cell. */
  ageMs: Float32Array;
  /** Packed list of cells currently visible or fading. */
  activeCells: Int32Array;
  /** Reverse lookup from cell index to active slot, or `-1`. */
  activeSlots: Int32Array;
  /** Number of valid entries in `activeCells`. */
  activeCount: number;
  /** Per-cell opacity target/interpolation state. */
  alpha: Float32Array;
  /** Birth offset on the x axis, easing back toward zero. */
  offsetX: Float32Array;
  /** Birth offset on the y axis, easing back toward zero. */
  offsetY: Float32Array;
  /** Snapshot from the previous generation for birth/death detection. */
  previousGrid: Uint8Array;
  /** Per-cell size interpolation state. */
  scale: Float32Array;
};

/** Creates render state sized to the automata grid and synced to live cells. */
export function createVisualState(state: AutomataState) {
  const length = state.grid.length;
  const visualState: AutomataVisualState = {
    ageMs: new Float32Array(length),
    activeCells: new Int32Array(length),
    activeCount: 0,
    activeSlots: new Int32Array(length),
    alpha: new Float32Array(length),
    offsetX: new Float32Array(length),
    offsetY: new Float32Array(length),
    previousGrid: new Uint8Array(length),
    scale: new Float32Array(length),
  };

  visualState.activeSlots.fill(-1);
  syncVisualState(visualState, state);
  return visualState;
}

/** Resets all visual arrays to match the current discrete grid exactly. */
export function syncVisualState(
  visualState: AutomataVisualState,
  state: AutomataState,
) {
  visualState.activeCount = 0;
  visualState.activeSlots.fill(-1);

  for (let cellIndex = 0; cellIndex < state.grid.length; cellIndex += 1) {
    const alive = isAlive(state, cellIndex);

    visualState.ageMs[cellIndex] = 0;
    visualState.alpha[cellIndex] = alive ? 1 : 0;
    visualState.offsetX[cellIndex] = 0;
    visualState.offsetY[cellIndex] = 0;
    visualState.previousGrid[cellIndex] = alive ? 1 : 0;
    visualState.scale[cellIndex] = alive ? 1 : 0;

    if (alive) {
      activateCell(visualState, cellIndex);
    }
  }
}

/**
 * Captures newly born and newly dead cells after a simulation generation.
 *
 * @remarks
 * Births are primed with offsets from their parent cluster, while deaths remain
 * active long enough for `updateVisualState` to fade them out.
 */
export function captureVisualGeneration(
  visualState: AutomataVisualState,
  state: AutomataState,
) {
  for (let cellIndex = 0; cellIndex < state.grid.length; cellIndex += 1) {
    const alive = isAlive(state, cellIndex);
    const wasAlive = visualState.previousGrid[cellIndex] === 1;

    if (alive && !isActive(visualState, cellIndex)) {
      activateCell(visualState, cellIndex);
    }

    if (alive && !wasAlive) {
      primeBirth(visualState, state, cellIndex);
    }

    if (!alive && wasAlive && !isActive(visualState, cellIndex)) {
      activateCell(visualState, cellIndex);
    }
  }

  for (let cellIndex = 0; cellIndex < state.grid.length; cellIndex += 1) {
    visualState.previousGrid[cellIndex] = isAlive(state, cellIndex) ? 1 : 0;
  }
}

/** Advances all active visual cells toward their current alive/dead targets. */
export function updateVisualState(
  visualState: AutomataVisualState,
  state: AutomataState,
  deltaMs: number,
) {
  const frameMs = Math.max(0, Math.min(deltaMs, 64));
  const birthAlphaRate = rateFor(frameMs, 150);
  const birthScaleRate = rateFor(frameMs, 260);
  const deathAlphaRate = rateFor(frameMs, 760);
  const deathScaleRate = rateFor(frameMs, 940);
  const offsetRate = rateFor(frameMs, 360);

  for (let slot = 0; slot < visualState.activeCount; slot += 1) {
    const cellIndex = visualState.activeCells[slot];
    const alive = isAlive(state, cellIndex);

    visualState.ageMs[cellIndex] += frameMs;
    visualState.offsetX[cellIndex] = approach(
      visualState.offsetX[cellIndex],
      0,
      offsetRate,
    );
    visualState.offsetY[cellIndex] = approach(
      visualState.offsetY[cellIndex],
      0,
      offsetRate,
    );

    if (alive) {
      visualState.alpha[cellIndex] = approach(
        visualState.alpha[cellIndex],
        1,
        birthAlphaRate,
      );
      visualState.scale[cellIndex] = approach(
        visualState.scale[cellIndex],
        1,
        birthScaleRate,
      );
      continue;
    }

    visualState.alpha[cellIndex] = approach(
      visualState.alpha[cellIndex],
      0,
      deathAlphaRate,
    );
    visualState.scale[cellIndex] = approach(
      visualState.scale[cellIndex],
      0.16,
      deathScaleRate,
    );

    if (visualState.alpha[cellIndex] < 0.006) {
      clearCell(visualState, cellIndex);
      removeActiveCell(visualState, cellIndex, slot);
      slot -= 1;
    }
  }
}

/** Subtle per-cell breathing scale so live cells do not look mechanically static. */
export function cellBreath(cellIndex: number, ageMs: number) {
  return 1 + Math.sin(ageMs / 620 + (cellIndex % 19)) * 0.035;
}

/** Initializes the visual state for a newly born cell. */
function primeBirth(
  visualState: AutomataVisualState,
  state: AutomataState,
  cellIndex: number,
) {
  const offset = parentClusterOffset(visualState, state, cellIndex);

  activateCell(visualState, cellIndex);
  visualState.ageMs[cellIndex] = 0;
  visualState.alpha[cellIndex] = Math.max(visualState.alpha[cellIndex], 0.16);
  visualState.offsetX[cellIndex] = offset.x;
  visualState.offsetY[cellIndex] = offset.y;
  visualState.scale[cellIndex] =
    visualState.alpha[cellIndex] > 0.24
      ? Math.max(visualState.scale[cellIndex], 0.42)
      : 0.32;
}

/** Pulls a newborn cell from the average direction of its previous neighbors. */
function parentClusterOffset(
  visualState: AutomataVisualState,
  state: AutomataState,
  cellIndex: number,
) {
  const x = cellIndex % state.cols;
  const y = Math.floor(cellIndex / state.cols);
  let count = 0;
  let totalX = 0;
  let totalY = 0;

  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }

      const neighborIndex = indexOf(state, x + dx, y + dy);

      if (visualState.previousGrid[neighborIndex] === 1) {
        count += 1;
        totalX += dx;
        totalY += dy;
      }
    }
  }

  if (!count) {
    return { x: 0, y: 0 };
  }

  const pull = state.cellSize * 0.52;

  return {
    x: (totalX / count) * pull,
    y: (totalY / count) * pull,
  };
}
