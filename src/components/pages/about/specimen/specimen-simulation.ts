import {
  indexOf,
  stampPattern,
  type AutomataState,
} from "../automata/automata-model";
import {
  cellBreath,
  createVisualState,
  updateVisualState,
  type AutomataVisualState,
} from "../automata/rendering/automata-visual-state";
import { fillRoundedRect } from "../automata/rendering/rounded-rect";
import {
  SPECIMEN_CELL_SIZE,
  SPECIMEN_COLS,
  SPECIMEN_ROWS,
  type Species,
} from "./specimen-species";

/** Creates the fixed-size automata state used by the specimen canvas. */
export function createSpecimenState(): AutomataState {
  const length = SPECIMEN_COLS * SPECIMEN_ROWS;

  return {
    buffer: new Uint8Array(length),
    cellSize: SPECIMEN_CELL_SIZE,
    cols: SPECIMEN_COLS,
    edge: new Uint8Array(length),
    emitters: [],
    grid: new Uint8Array(length),
    mask: new Uint8Array(length),
    random: () => 0,
    rows: SPECIMEN_ROWS,
  };
}

/** Clears the specimen grid and stamps the selected species into place. */
export function seedSpecies(state: AutomataState, species: Species) {
  state.grid.fill(0);
  state.buffer.fill(0);
  stampPattern(state, species.pattern, species.originX, species.originY, "se");
}

/** Advances the fixed specimen grid by one Conway B3/S23 generation. */
export function stepSpecimen(state: AutomataState) {
  const { buffer, cols, grid, rows } = state;

  buffer.fill(0);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cellIndex = indexOf(state, x, y);
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

/**
 * Draws one frame of the specimen canvas using the shared visual interpolation.
 */
export function drawSpecimen(
  context: CanvasRenderingContext2D,
  state: AutomataState,
  visualState: AutomataVisualState,
  deltaMs: number,
) {
  const rootStyle = window.getComputedStyle(document.documentElement);
  const primary = rootStyle.getPropertyValue("--primary").trim();

  updateVisualState(visualState, state, deltaMs);
  context.clearRect(
    0,
    0,
    SPECIMEN_COLS * SPECIMEN_CELL_SIZE,
    SPECIMEN_ROWS * SPECIMEN_CELL_SIZE,
  );

  for (let slot = 0; slot < visualState.activeCount; slot += 1) {
    const cellIndex = visualState.activeCells[slot];
    const alpha = visualState.alpha[cellIndex];

    if (alpha <= 0.01) {
      continue;
    }

    const scale =
      smoothIntensity(visualState.scale[cellIndex]) *
      (state.grid[cellIndex] === 1
        ? cellBreath(cellIndex, visualState.ageMs[cellIndex])
        : 1);
    const size = Math.max(1, (SPECIMEN_CELL_SIZE - 1.2) * scale);
    const x =
      (cellIndex % SPECIMEN_COLS) * SPECIMEN_CELL_SIZE +
      SPECIMEN_CELL_SIZE / 2 +
      visualState.offsetX[cellIndex] -
      size / 2;
    const y =
      Math.floor(cellIndex / SPECIMEN_COLS) * SPECIMEN_CELL_SIZE +
      SPECIMEN_CELL_SIZE / 2 +
      visualState.offsetY[cellIndex] -
      size / 2;

    context.fillStyle = `hsl(${primary})`;
    context.globalAlpha = 0.55 * smoothIntensity(alpha);
    fillRoundedRect(context, x, y, size, size, Math.max(1, size * 0.38));
  }
  context.globalAlpha = 1;
}

/** Creates a visual state for the specimen through the shared automata renderer. */
export function createSpecimenVisualState(state: AutomataState) {
  return createVisualState(state);
}

/** Cubic smoothstep used to soften specimen alpha and scale transitions. */
function smoothIntensity(value: number) {
  return value * value * (3 - 2 * value);
}
