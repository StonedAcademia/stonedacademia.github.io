import type { AutomataState } from "../automata-model";
import type { AutomataVisualState } from "./automata-visual-state";

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

export function isActive(
  visualState: AutomataVisualState,
  cellIndex: number,
) {
  return visualState.activeSlots[cellIndex] !== -1;
}

export function isAlive(state: AutomataState, cellIndex: number) {
  return state.grid[cellIndex] === 1 && state.mask[cellIndex] !== 1;
}

export function approach(value: number, target: number, rate: number) {
  return value + (target - value) * rate;
}

export function rateFor(deltaMs: number, durationMs: number) {
  return 1 - Math.exp(-deltaMs / durationMs);
}
