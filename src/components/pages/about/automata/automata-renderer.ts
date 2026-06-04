import { viewportSize, type AutomataState } from "./automata-model";
import {
  cellBreath,
  updateVisualState,
  type AutomataVisualState,
} from "./rendering/automata-visual-state";
import { fillRoundedRect } from "./rendering/rounded-rect";

/**
 * Draws one animation frame for the full-screen automata background.
 *
 * @remarks
 * Simulation state is discrete, while `visualState` interpolates alpha, scale,
 * and birth offsets so canvas frames remain smooth between B3/S23 ticks.
 */
export function drawField(
  context: CanvasRenderingContext2D,
  state: AutomataState,
  tick: number,
  visualState: AutomataVisualState,
  deltaMs: number,
) {
  const { height, width } = viewportSize();
  const rootStyle = window.getComputedStyle(document.documentElement);
  const primary = rootStyle.getPropertyValue("--primary").trim();
  const foreground = rootStyle.getPropertyValue("--foreground").trim();
  const pulse = 0.55 + Math.sin(tick / 7) * 0.2;

  updateVisualState(visualState, state, deltaMs);
  context.clearRect(0, 0, width, height);

  for (let slot = 0; slot < visualState.activeCount; slot += 1) {
    const cellIndex = visualState.activeCells[slot];
    const alpha = visualState.alpha[cellIndex];

    if (alpha <= 0.01 || state.mask[cellIndex]) {
      continue;
    }

    const scale =
      smoothIntensity(visualState.scale[cellIndex]) *
      (state.grid[cellIndex] === 1
        ? cellBreath(cellIndex, visualState.ageMs[cellIndex])
        : 1);
    const size = Math.max(1, (state.cellSize - 1.4) * scale);
    const x =
      (cellIndex % state.cols) * state.cellSize +
      state.cellSize / 2 +
      visualState.offsetX[cellIndex] -
      size / 2;
    const y =
      Math.floor(cellIndex / state.cols) * state.cellSize +
      state.cellSize / 2 +
      visualState.offsetY[cellIndex] -
      size / 2;
    const nearText = state.edge[cellIndex] === 1;

    context.fillStyle = nearText ? `hsl(${primary})` : `hsl(${foreground})`;
    context.globalAlpha =
      (nearText ? 0.3 + pulse * 0.1 : 0.13) * smoothIntensity(alpha);
    fillRoundedRect(context, x, y, size, size, Math.max(1, size * 0.38));
  }

  context.globalAlpha = 1;
}

/** Cubic smoothstep used to soften alpha and scale transitions. */
function smoothIntensity(value: number) {
  return value * value * (3 - 2 * value);
}
