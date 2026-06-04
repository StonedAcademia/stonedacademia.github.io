import {
  indexOf,
  stampPattern,
  type AutomataState,
} from "../automata/automata-model";
import {
  SPECIMEN_CELL_SIZE,
  SPECIMEN_COLS,
  SPECIMEN_ROWS,
  type Species,
} from "./specimen-species";

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

export function seedSpecies(state: AutomataState, species: Species) {
  state.grid.fill(0);
  state.buffer.fill(0);
  stampPattern(state, species.pattern, species.originX, species.originY, "se");
}

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

export function drawSpecimen(
  context: CanvasRenderingContext2D,
  state: AutomataState,
) {
  const rootStyle = window.getComputedStyle(document.documentElement);
  const primary = rootStyle.getPropertyValue("--primary").trim();

  context.clearRect(
    0,
    0,
    SPECIMEN_COLS * SPECIMEN_CELL_SIZE,
    SPECIMEN_ROWS * SPECIMEN_CELL_SIZE,
  );

  for (let cellIndex = 0; cellIndex < state.grid.length; cellIndex += 1) {
    if (!state.grid[cellIndex]) {
      continue;
    }

    const x = (cellIndex % SPECIMEN_COLS) * SPECIMEN_CELL_SIZE;
    const y = Math.floor(cellIndex / SPECIMEN_COLS) * SPECIMEN_CELL_SIZE;

    context.fillStyle = `hsl(${primary})`;
    context.globalAlpha = 0.55;
    context.fillRect(
      x + 1,
      y + 1,
      SPECIMEN_CELL_SIZE - 2,
      SPECIMEN_CELL_SIZE - 2,
    );
  }
  context.globalAlpha = 1;
}
