import katex from "katex";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  BLINKER,
  BLOCK,
  GLIDER,
  indexOf,
  LIGHTWEIGHT_SPACESHIP,
  PULSAR,
  stampPattern,
  type AutomataState,
  type Pattern,
} from "./automata/automata-model";

const CELL_SIZE = 7;
const COLS = 17;
const ROWS = 17;
const STEP_INTERVAL_MS = 82;
const CYCLE_INTERVAL_MS = 5000;
const FADE_DURATION_MS = 600;
const DISSOLVE_DURATION_MS = 400;
const RESEED_DELAY_MS = 800;

type Species = {
  formula: string;
  name: string;
  originX: number;
  originY: number;
  pattern: Pattern;
};

const SPECIES: ReadonlyArray<Species> = [
  {
    formula: String.raw`v = \dfrac{c}{4}`,
    name: "glider",
    originX: 6,
    originY: 6,
    pattern: GLIDER,
  },
  {
    formula: String.raw`v = \dfrac{c}{2}`,
    name: "lightweight spaceship",
    originX: 4,
    originY: 7,
    pattern: LIGHTWEIGHT_SPACESHIP,
  },
  {
    formula: String.raw`\sigma(t+2) = \sigma(t)`,
    name: "blinker",
    originX: 7,
    originY: 8,
    pattern: BLINKER,
  },
  {
    formula: String.raw`\sigma(t+3) = \sigma(t)`,
    name: "pulsar",
    originX: 2,
    originY: 2,
    pattern: PULSAR,
  },
  {
    formula: String.raw`\sigma(t+1) = \sigma(t)`,
    name: "block",
    originX: 7,
    originY: 7,
    pattern: BLOCK,
  },
];

function createSpecimenState(): AutomataState {
  const length = COLS * ROWS;

  return {
    buffer: new Uint8Array(length),
    cellSize: CELL_SIZE,
    cols: COLS,
    edge: new Uint8Array(length),
    emitters: [],
    grid: new Uint8Array(length),
    mask: new Uint8Array(length),
    random: () => 0,
    rows: ROWS,
  };
}

function seedSpecies(state: AutomataState, species: Species) {
  state.grid.fill(0);
  state.buffer.fill(0);
  stampPattern(state, species.pattern, species.originX, species.originY, "se");
}

function stepSpecimen(state: AutomataState) {
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

function drawSpecimen(
  context: CanvasRenderingContext2D,
  state: AutomataState,
) {
  const rootStyle = window.getComputedStyle(document.documentElement);
  const primary = rootStyle.getPropertyValue("--primary").trim();

  context.clearRect(0, 0, COLS * CELL_SIZE, ROWS * CELL_SIZE);

  for (let cellIndex = 0; cellIndex < state.grid.length; cellIndex += 1) {
    if (!state.grid[cellIndex]) {
      continue;
    }

    const x = (cellIndex % COLS) * CELL_SIZE;
    const y = Math.floor(cellIndex / COLS) * CELL_SIZE;

    context.fillStyle = `hsl(${primary})`;
    context.globalAlpha = 0.55;
    context.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
  }

  context.globalAlpha = 1;
}

export function AutomataSpecimen() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<AutomataState>(createSpecimenState());
  const speciesIndexRef = useRef(0);
  const [speciesIndex, setSpeciesIndex] = useState(0);
  const [canvasOpacity, setCanvasOpacity] = useState(1);
  const [dissolved, setDissolved] = useState(false);
  const dissolvedRef = useRef(false);
  const dissolveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // animation loop — re-runs when speciesIndex changes to reseed
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d", { alpha: true });

    if (!context) {
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(COLS * CELL_SIZE * pixelRatio);
    canvas.height = Math.floor(ROWS * CELL_SIZE * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    stateRef.current = createSpecimenState();
    seedSpecies(stateRef.current, SPECIES[speciesIndexRef.current]);

    let animationFrame = 0;
    let lastStep = 0;

    function animate(now: number) {
      if (!reducedMotion.matches && now - lastStep > STEP_INTERVAL_MS) {
        stepSpecimen(stateRef.current);
        lastStep = now;
      }

      drawSpecimen(context!, stateRef.current);
      animationFrame = window.requestAnimationFrame(animate);
    }

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [speciesIndex]);

  // species cycling — auto-advances every CYCLE_INTERVAL_MS
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;

    const timer = setInterval(() => {
      if (dissolvedRef.current) {
        return;
      }

      if (reducedMotion.matches) {
        // advance species instantly, no fade
        const next = (speciesIndexRef.current + 1) % SPECIES.length;
        speciesIndexRef.current = next;
        setSpeciesIndex(next);
        return;
      }

      setCanvasOpacity(0);

      fadeTimeout = setTimeout(() => {
        if (dissolvedRef.current) {
          setCanvasOpacity(1);
          return;
        }
        const next = (speciesIndexRef.current + 1) % SPECIES.length;
        speciesIndexRef.current = next;
        setSpeciesIndex(next);
        setCanvasOpacity(1);
      }, FADE_DURATION_MS);
    }, CYCLE_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      clearTimeout(fadeTimeout);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (dissolvedRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    // translate live cells to background grid coordinates
    const rect = canvas.getBoundingClientRect();
    const bgCellSize = window.innerWidth < 680 ? 7 : 8;
    const cells: Array<{ x: number; y: number }> = [];
    const state = stateRef.current;

    for (let cellIndex = 0; cellIndex < state.grid.length; cellIndex += 1) {
      if (!state.grid[cellIndex]) {
        continue;
      }

      const localX = (cellIndex % COLS) * CELL_SIZE + CELL_SIZE / 2;
      const localY = Math.floor(cellIndex / COLS) * CELL_SIZE + CELL_SIZE / 2;
      const screenX = rect.left + localX;
      const screenY = rect.top + localY;

      cells.push({
        x: Math.floor(screenX / bgCellSize),
        y: Math.floor(screenY / bgCellSize),
      });
    }

    window.dispatchEvent(
      new CustomEvent("automata:inject", { detail: { cells } }),
    );

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dissolveDuration = reducedMotion.matches ? 0 : DISSOLVE_DURATION_MS;

    dissolvedRef.current = true;
    setDissolved(true);

    dissolveTimeoutRef.current = setTimeout(() => {
      const next = (speciesIndexRef.current + 1) % SPECIES.length;
      speciesIndexRef.current = next;
      setSpeciesIndex(next);
      setDissolved(false);
      dissolvedRef.current = false;
    }, dissolveDuration + RESEED_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(dissolveTimeoutRef.current);
    };
  }, []);

  const species = SPECIES[speciesIndex];
  const formulaHtml = katex.renderToString(species.formula, {
    throwOnError: false,
    displayMode: false,
  });

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const wrapperOpacity = dissolved ? 0 : 1;
  const wrapperTransition = prefersReducedMotion
    ? "none"
    : dissolved
      ? `opacity ${DISSOLVE_DURATION_MS}ms ease-out`
      : `opacity ${FADE_DURATION_MS}ms ease-in`;

  // canvasOpacity fades canvas + formula together during species cycling.
  // wrapperOpacity fades the entire box (border included) during dissolution.
  return (
    <div
      aria-label={`Release ${species.name} into the field`}
      className="relative cursor-pointer focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[hsl(var(--primary))]"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={dissolved ? -1 : 0}
      style={{
        border: "1px solid hsl(var(--border))",
        borderRadius: "2px",
        display: "inline-block",
        opacity: wrapperOpacity,
        transition: wrapperTransition,
        width: `${COLS * CELL_SIZE}px`,
      }}
    >
      <div
        style={{
          opacity: canvasOpacity,
          position: "relative",
          transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
        }}
      >
        <canvas
          aria-hidden="true"
          ref={canvasRef}
          style={{
            display: "block",
            height: `${ROWS * CELL_SIZE}px`,
            width: `${COLS * CELL_SIZE}px`,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-1 left-1.5"
          dangerouslySetInnerHTML={{ __html: formulaHtml }}
          style={{
            color: "hsl(var(--primary))",
            fontSize: "10px",
            fontStyle: "italic",
            opacity: 0.45,
          }}
        />
      </div>
    </div>
  );
}
