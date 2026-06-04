import { viewportSize, type AutomataState } from "./automata-model";

export function drawField(
  context: CanvasRenderingContext2D,
  state: AutomataState,
  tick: number,
) {
  const { height, width } = viewportSize();
  const rootStyle = window.getComputedStyle(document.documentElement);
  const primary = rootStyle.getPropertyValue("--primary").trim();
  const foreground = rootStyle.getPropertyValue("--foreground").trim();
  const accent = rootStyle.getPropertyValue("--accent").trim();
  const pulse = 0.55 + Math.sin(tick / 7) * 0.2;

  context.clearRect(0, 0, width, height);
  context.fillStyle = `hsl(${accent})`;
  context.globalAlpha = 0.045;

  for (let cellIndex = 0; cellIndex < state.edge.length; cellIndex += 1) {
    if (!state.edge[cellIndex]) {
      continue;
    }

    const x = (cellIndex % state.cols) * state.cellSize;
    const y = Math.floor(cellIndex / state.cols) * state.cellSize;
    context.fillRect(x + 1, y + 1, state.cellSize - 2, state.cellSize - 2);
  }

  for (let cellIndex = 0; cellIndex < state.grid.length; cellIndex += 1) {
    if (!state.grid[cellIndex]) {
      continue;
    }

    const x = (cellIndex % state.cols) * state.cellSize;
    const y = Math.floor(cellIndex / state.cols) * state.cellSize;
    const nearText = state.edge[cellIndex] === 1;

    context.fillStyle = nearText ? `hsl(${primary})` : `hsl(${foreground})`;
    context.globalAlpha = nearText ? 0.3 + pulse * 0.1 : 0.13;
    context.fillRect(
      x + 1,
      y + 1,
      Math.max(1, state.cellSize - 2),
      Math.max(1, state.cellSize - 2),
    );
  }

  context.globalAlpha = 1;
}
