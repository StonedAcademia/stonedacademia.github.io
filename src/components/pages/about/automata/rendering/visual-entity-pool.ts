import type { AutomataState } from "../automata-model";
import type { AutomataVisualState } from "./automata-visual-state";

/** Adds a cell to the packed active list if it is not already present. */
export function activateCell(
  visualState: AutomataVisualState,
  cellIndex: number,
) {
  if (isActive(visualState, cellIndex)) {
    return;
  }

  const slot = visualState.activeCount;

  visualState.activeCells[slot] = cellIndex;
  visualState.activeSlots[cellIndex] = slot;
  visualState.activeCount += 1;
}

/** Removes a cell from the packed active list by swapping in the final slot. */
export function removeActiveCell(
  visualState: AutomataVisualState,
  cellIndex: number,
  slot: number,
) {
  const lastSlot = visualState.activeCount - 1;
  const lastCell = visualState.activeCells[lastSlot];

  visualState.activeCells[slot] = lastCell;
  visualState.activeSlots[lastCell] = slot;
  visualState.activeCells[lastSlot] = 0;
  visualState.activeSlots[cellIndex] = -1;
  visualState.activeCount -= 1;
}

/** Clears all interpolation values for an inactive cell. */
export function clearCell(
  visualState: AutomataVisualState,
  cellIndex: number,
) {
  visualState.ageMs[cellIndex] = 0;
  visualState.alpha[cellIndex] = 0;
  visualState.offsetX[cellIndex] = 0;
  visualState.offsetY[cellIndex] = 0;
  visualState.scale[cellIndex] = 0;
}

/** Returns whether a cell is currently tracked by the packed active list. */
export function isActive(
  visualState: AutomataVisualState,
  cellIndex: number,
) {
  return visualState.activeSlots[cellIndex] !== -1;
}

/** Applies both grid liveness and UI masking to a cell. */
export function isAlive(state: AutomataState, cellIndex: number) {
  return state.grid[cellIndex] === 1 && state.mask[cellIndex] !== 1;
}

/** Moves `value` a fraction of the way toward `target`. */
export function approach(value: number, target: number, rate: number) {
  return value + (target - value) * rate;
}

/** Converts elapsed milliseconds and a duration constant into an easing rate. */
export function rateFor(deltaMs: number, durationMs: number) {
  return 1 - Math.exp(-deltaMs / durationMs);
}
