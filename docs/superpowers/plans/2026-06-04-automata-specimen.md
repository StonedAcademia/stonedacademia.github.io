# Automata Specimen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live, isolated Game of Life specimen box below the About page welcome text that auto-cycles through named species, shows their LaTeX formula, and dissolves on click to inject the living cells into the background automata.

**Architecture:** A self-contained `AutomataSpecimen` React component owns a canvas that runs its own Game of Life loop, cycling through five species. On click it fires a `CustomEvent('automata:inject')` on `window`; `ShannonAutomataBackground` listens for that event and stamps the cells into its live state. No shared refs or context — decoupled via the event.

**Tech Stack:** React 19, TypeScript, Canvas API, KaTeX (direct `renderToString`), Tailwind CSS, Vite

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/pages/about/automata/automata-model.ts` | Modify | Add `BLINKER`, `PULSAR`, `BLOCK` pattern constants |
| `src/components/pages/about/shannon-automata-background.tsx` | Modify | Listen for `automata:inject` event and stamp cells |
| `src/components/pages/about/automata-specimen.tsx` | Create | Entire specimen component |
| `src/components/pages/about/about-page.tsx` | Modify | Mount `<AutomataSpecimen />` |

---

## Task 1: Add new pattern constants to `automata-model.ts`

**Files:**
- Modify: `src/components/pages/about/automata/automata-model.ts`

- [ ] **Step 1: Add `BLINKER`, `PULSAR`, and `BLOCK` pattern constants**

Open `src/components/pages/about/automata/automata-model.ts`. After the existing `LIGHTWEIGHT_SPACESHIP` constant (line 41), add:

```typescript
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
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/about/automata/automata-model.ts
git commit -m "feat: add blinker, block, and pulsar pattern constants"
```

---

## Task 2: Wire `automata:inject` into `ShannonAutomataBackground`

**Files:**
- Modify: `src/components/pages/about/shannon-automata-background.tsx`

The background's state lives inside a `useEffect` closure. We add a `window` event listener in that same closure so it can close over the mutable `state` variable, which gets reassigned on resize — the listener always sees the current state.

- [ ] **Step 1: Add the event listener inside the existing `useEffect`**

Open `src/components/pages/about/shannon-automata-background.tsx`.

At the top of the file, add this import alongside the existing automata-model imports:

```typescript
import { indexOf } from "./automata/automata-model";
```

Then, inside the `useEffect` (after `portalTarget` guard), add a handler and register it. Place it just before `resizeCanvas()` is called:

```typescript
function handleInject(event: Event) {
  const { cells } = (event as CustomEvent<{ cells: Array<{ x: number; y: number }> }>).detail;

  for (const cell of cells) {
    const cellIndex = indexOf(state, cell.x, cell.y);

    if (!state.mask[cellIndex]) {
      state.grid[cellIndex] = 1;
    }
  }
}

window.addEventListener("automata:inject", handleInject);
```

In the cleanup `return () => { ... }` block, add:

```typescript
window.removeEventListener("automata:inject", handleInject);
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/about/shannon-automata-background.tsx
git commit -m "feat: handle automata:inject event to stamp external cells into field"
```

---

## Task 3: Create `AutomataSpecimen` — canvas and animation loop

**Files:**
- Create: `src/components/pages/about/automata-specimen.tsx`

The mini canvas is 17×17 cells at 7px each (119×119 logical pixels). 17×17 gives the Pulsar (13×13 bounding box) 2 cells of padding on each side, preventing wrap-around interference. Spaceships and smaller patterns loop freely.

- [ ] **Step 1: Create the file with species definitions and canvas setup**

Create `src/components/pages/about/automata-specimen.tsx`:

```typescript
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
```

- [ ] **Step 2: Add the React component with canvas animation**

Append to the same file:

```typescript
export function AutomataSpecimen() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speciesIndexRef = useRef(0);
  const [speciesIndex, setSpeciesIndex] = useState(0);
  const [canvasOpacity, setCanvasOpacity] = useState(1);
  const [dissolved, setDissolved] = useState(false);
  const dissolvedRef = useRef(false);

  // animation loop
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
    const state = createSpecimenState();
    seedSpecies(state, SPECIES[speciesIndexRef.current]);

    let animationFrame = 0;
    let lastStep = 0;

    function animate(now: number) {
      if (!reducedMotion.matches && now - lastStep > STEP_INTERVAL_MS) {
        stepSpecimen(state);
        lastStep = now;
      }

      drawSpecimen(context!, state);
      animationFrame = window.requestAnimationFrame(animate);
    }

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [speciesIndex]);

  // species cycling
  useEffect(() => {
    const timer = setInterval(() => {
      if (dissolvedRef.current) {
        return;
      }

      setCanvasOpacity(0);

      setTimeout(() => {
        const next = (speciesIndexRef.current + 1) % SPECIES.length;
        speciesIndexRef.current = next;
        setSpeciesIndex(next);
        setCanvasOpacity(1);
      }, FADE_DURATION_MS);
    }, CYCLE_INTERVAL_MS);

    return () => {
      clearInterval(timer);
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

    const context = canvas.getContext("2d");

    if (context) {
      const state = createSpecimenState();
      seedSpecies(state, SPECIES[speciesIndexRef.current]);

      // run a few steps to get current live state (approximation — canvas state isn't accessible)
      for (let i = 0; i < 10; i += 1) {
        stepSpecimen(state);
      }

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
    }

    window.dispatchEvent(
      new CustomEvent("automata:inject", { detail: { cells } }),
    );

    dissolvedRef.current = true;
    setDissolved(true);

    setTimeout(() => {
      const next = (speciesIndexRef.current + 1) % SPECIES.length;
      speciesIndexRef.current = next;
      setSpeciesIndex(next);
      setDissolved(false);
      dissolvedRef.current = false;
    }, DISSOLVE_DURATION_MS + RESEED_DELAY_MS);
  }, []);

  const species = SPECIES[speciesIndex];
  const formulaHtml = katex.renderToString(species.formula, {
    throwOnError: false,
    displayMode: false,
  });

  const wrapperOpacity = dissolved ? 0 : 1;
  const wrapperTransition = dissolved
    ? `opacity ${DISSOLVE_DURATION_MS}ms ease-out`
    : `opacity ${FADE_DURATION_MS}ms ease-in`;

  // canvasOpacity fades canvas + formula together during species cycling.
  // wrapperOpacity fades the entire box (border included) during dissolution.
  return (
    <div
      className="relative cursor-pointer"
      onClick={handleClick}
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
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/pages/about/automata-specimen.tsx
git commit -m "feat: add AutomataSpecimen component with live canvas and species cycling"
```

---

## Task 4: Mount `AutomataSpecimen` in `AboutPage`

**Files:**
- Modify: `src/components/pages/about/about-page.tsx`

- [ ] **Step 1: Import and mount the specimen**

Open `src/components/pages/about/about-page.tsx`. Add the import:

```typescript
import { AutomataSpecimen } from "@/components/pages/about/automata-specimen";
```

Inside the `about-copy` div, after the last `<PretextText>` element, add:

```tsx
<AutomataSpecimen />
```

The full `about-copy` div should look like:

```tsx
<div className="about-copy max-w-2xl space-y-5">
  <div
    className="about-equation automata-text-field motion-block text-muted-foreground"
    data-automata-field="about"
  >
    <ReactMarkdown
      rehypePlugins={[rehypeKatex]}
      remarkPlugins={[remarkMath]}
    >
      {aboutEquation}
    </ReactMarkdown>
  </div>
  <PretextText
    animation="heading"
    as="h1"
    className="automata-text-field max-w-2xl text-2xl font-semibold leading-tight sm:text-3xl"
    data-automata-field="about"
    text="Welcome."
  >
    Welcome.
  </PretextText>
  <PretextText
    className="automata-text-field max-w-2xl text-sm leading-7 text-muted-foreground"
    data-automata-field="about"
    text="I hope to share my ideas, thoughts, and works in an attempt to articulate myself neatly."
  >
    I hope to share my ideas, thoughts, and works in an attempt to
    articulate myself neatly.
  </PretextText>
  <AutomataSpecimen />
</div>
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Visual verification**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify:
- The specimen box appears below the welcome paragraph, left-aligned
- The mini automata is running (cells moving)
- A LaTeX formula is visible in the bottom-left at low opacity
- After ~5 seconds, the grid cross-fades to the next species with a different formula
- Clicking the box: border and formula fade out, then cells appear in the background automata field near where the box was, then the box reappears with the next species

- [ ] **Step 4: Commit**

```bash
git add src/components/pages/about/about-page.tsx
git commit -m "feat: mount AutomataSpecimen on about page below welcome copy"
```

---

## Task 5: Fix cell-state synchronization in dissolve handler

**Context:** The `handleClick` handler in Task 3 approximates the live canvas state by re-creating a fresh state and running 10 steps from seed. This will always inject the pattern at a fixed "10 steps in" state rather than its actual live state at click time. Fix this by storing the running state in a ref so click can read the actual current grid.

**Files:**
- Modify: `src/components/pages/about/automata-specimen.tsx`

- [ ] **Step 1: Lift the animation state into a ref**

In `AutomataSpecimen`, add a ref to hold the live state:

```typescript
const stateRef = useRef<AutomataState>(createSpecimenState());
```

In the animation `useEffect`, replace the local `const state = createSpecimenState()` with:

```typescript
stateRef.current = createSpecimenState();
seedSpecies(stateRef.current, SPECIES[speciesIndexRef.current]);
```

Replace all references to `state` inside `animate` and the seeding with `stateRef.current`:

```typescript
function animate(now: number) {
  if (!reducedMotion.matches && now - lastStep > STEP_INTERVAL_MS) {
    stepSpecimen(stateRef.current);
    lastStep = now;
  }

  drawSpecimen(context!, stateRef.current);
  animationFrame = window.requestAnimationFrame(animate);
}
```

- [ ] **Step 2: Update `handleClick` to read from `stateRef`**

Replace the block in `handleClick` that creates a fresh state and runs 10 steps with a direct read from `stateRef.current`:

```typescript
const handleClick = useCallback(() => {
  if (dissolvedRef.current) {
    return;
  }

  const canvas = canvasRef.current;

  if (!canvas) {
    return;
  }

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

  dissolvedRef.current = true;
  setDissolved(true);

  setTimeout(() => {
    const next = (speciesIndexRef.current + 1) % SPECIES.length;
    speciesIndexRef.current = next;
    setSpeciesIndex(next);
    setDissolved(false);
    dissolvedRef.current = false;
  }, DISSOLVE_DURATION_MS + RESEED_DELAY_MS);
}, []);
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Visual verification — confirm injection uses live state**

```bash
npm run dev
```

Click the specimen box and verify the cells that appear in the background field visually match the positions of the live cells in the box at the moment of click (they should appear to escape from the exact positions they occupied).

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/about/automata-specimen.tsx
git commit -m "fix: read live animation state on click instead of re-seeding from scratch"
```

---

## Task 6: Reduced-motion and accessibility pass

**Files:**
- Modify: `src/components/pages/about/automata-specimen.tsx`

- [ ] **Step 1: Skip cycling when `prefers-reduced-motion` is set**

In the species cycling `useEffect`, wrap the `setCanvasOpacity(0)` block in a reduced-motion check:

```typescript
useEffect(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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

    setTimeout(() => {
      const next = (speciesIndexRef.current + 1) % SPECIES.length;
      speciesIndexRef.current = next;
      setSpeciesIndex(next);
      setCanvasOpacity(1);
    }, FADE_DURATION_MS);
  }, CYCLE_INTERVAL_MS);

  return () => {
    clearInterval(timer);
  };
}, []);
```

- [ ] **Step 2: Make dissolve instant under reduced motion**

In `handleClick`, read `reducedMotion.matches` and set the timeout delay to `0` when true:

```typescript
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const dissolveDuration = reducedMotion.matches ? 0 : DISSOLVE_DURATION_MS;

dissolvedRef.current = true;
setDissolved(true);

setTimeout(() => {
  const next = (speciesIndexRef.current + 1) % SPECIES.length;
  speciesIndexRef.current = next;
  setSpeciesIndex(next);
  setDissolved(false);
  dissolvedRef.current = false;
}, dissolveDuration + RESEED_DELAY_MS);
```

- [ ] **Step 3: Add cursor and button semantics**

Wrap the outer `div` in a `button` element (or add `role="button"` and `tabIndex={0}`) so keyboard users can trigger the click. Add a screen-reader label:

```tsx
<div
  aria-label={`Release ${species.name} into the field`}
  className="relative cursor-pointer"
  onClick={handleClick}
  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleClick(); }}
  role="button"
  tabIndex={0}
  style={{ ... }}
>
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/pages/about/automata-specimen.tsx
git commit -m "feat: accessibility and reduced-motion support for automata specimen"
```
