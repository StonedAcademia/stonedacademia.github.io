# Automata Per-Glyph Collision for KaTeX and Graphviz — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `AutomataTextBridge` so gliders collide with individual KaTeX math glyphs and Graphviz node shapes, firing `automata-collision` CSS animations on impact.

**Architecture:** Generalize `CharEntry` to a `BridgeEntry` discriminated union (`"char" | "katex" | "graphviz"`). Add two new discovery passes in `init()` — one walking `.katex-html` for leaf spans, one querying `g.node` groups in Graphviz SVGs. `refreshTextField` gains emitter placement for these element types. A new `automataField` prop on `GraphvizBlock` opts diagrams into the system.

**Tech Stack:** TypeScript, React, KaTeX (via `rehype-katex`), `@viz-js/viz` (Graphviz SVG), CSS animations

---

## File Map

| File | Change |
|---|---|
| `src/components/pages/about/automata/text/automata-text-bridge.ts` | Generalize entry type; add KaTeX + Graphviz discovery; skip graphviz in glyph stamp + feedback |
| `src/components/pages/about/automata/automata-text-field.ts` | Add emitter placement when field element contains KaTeX or Graphviz |
| `src/lib/markdown/graphviz-block.tsx` | Add optional `automataField` prop forwarded as `data-automata-field` on `<figure>` |
| `src/lib/styles/motion-core.css` | Add `automata-collision` CSS rules for KaTeX leaf spans and SVG `g.node` groups |

---

## Task 1: Generalize `AutomataTextBridge` — entry type + KaTeX + Graphviz discovery

**Files:**
- Modify: `src/components/pages/about/automata/text/automata-text-bridge.ts`

The current bridge has `CharEntry` typed as `{ element: HTMLSpanElement, ... }` and only discovers `[data-automata-char]` spans. This task replaces the whole file with the generalized version.

Key changes:
- `CharEntry` → `BridgeEntry` with a `kind: "char" | "katex" | "graphviz"` discriminant
- `element` widens to `Element` (covers both `HTMLSpanElement` and `SVGGElement`)
- `chars` → `entries`
- Two new discovery passes in `init()`
- `stampGlyphBitmaps` skips `"graphviz"` entries (no OffscreenCanvas needed — bounding-rect mask from `refreshTextField` is sufficient)
- `updateFeedback` skips `"graphviz"` entries (CSS custom properties don't apply to SVG groups in the same way)
- Reflow trick changed from `element.offsetWidth` (HTML-only) to `element.getBoundingClientRect()` (works on any Element)
- `collectKaTeXLeafSpans` helper: finds all `<span>` descendants with text content and no child elements

- [ ] **Replace the full file content**

```ts
import { type AutomataState } from "../automata-model";

type EntryKind = "char" | "katex" | "graphviz";

type BridgeEntry = {
  kind: EntryKind;
  element: Element;
  interactionCells: number[];
  lastPulsedTick: number;
  rect: DOMRect;
  text: string;
};

const INTERACTION_RADIUS_CELLS = 2;

export class AutomataTextBridge {
  private entries: BridgeEntry[] = [];
  private pendingTimeouts: Set<ReturnType<typeof setTimeout>> = new Set();

  init(state: AutomataState): void {
    for (const entry of this.entries) {
      if (entry.kind !== "graphviz") {
        (entry.element as HTMLElement).style.removeProperty("--char-density");
        (entry.element as HTMLElement).style.removeProperty("--char-hue-shift");
      }
    }

    this.entries = [];

    for (const span of document.querySelectorAll<HTMLSpanElement>("[data-automata-char]")) {
      const rect = span.getBoundingClientRect();
      this.entries.push({
        kind: "char",
        element: span,
        interactionCells: cellsNearRect(state, rect),
        lastPulsedTick: -999,
        rect,
        text: span.textContent ?? "",
      });
    }

    for (const container of document.querySelectorAll<HTMLElement>("[data-automata-field] .katex-html")) {
      for (const span of collectKaTeXLeafSpans(container)) {
        const rect = span.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        this.entries.push({
          kind: "katex",
          element: span,
          interactionCells: cellsNearRect(state, rect),
          lastPulsedTick: -999,
          rect,
          text: span.textContent ?? "",
        });
      }
    }

    for (const svg of document.querySelectorAll<SVGSVGElement>("[data-automata-field] svg")) {
      for (const group of svg.querySelectorAll<SVGGElement>("g.node")) {
        const rect = group.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        this.entries.push({
          kind: "graphviz",
          element: group,
          interactionCells: cellsNearRect(state, rect),
          lastPulsedTick: -999,
          rect,
          text: group.querySelector("title")?.textContent ?? "",
        });
      }
    }

    this.stampGlyphBitmaps(state);
  }

  private stampGlyphBitmaps(state: AutomataState): void {
    for (const entry of this.entries) {
      if (entry.kind === "graphviz" || !entry.text.trim()) {
        continue;
      }

      const { rect, text, element } = entry;
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));

      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext("2d");

      if (!ctx) continue;

      const styles = window.getComputedStyle(element as HTMLElement);
      const font =
        styles.font ||
        [
          styles.fontStyle,
          styles.fontVariant,
          styles.fontWeight,
          styles.fontSize,
          styles.fontFamily,
        ].join(" ");

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "white";
      ctx.font = font;
      ctx.textBaseline = "top";
      ctx.fillText(text, 0, 0);

      const imageData = ctx.getImageData(0, 0, w, h);
      const pixels = imageData.data;

      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const brightness = pixels[(py * w + px) * 4];
          if (brightness < 128) continue;

          const screenX = rect.left + px;
          const screenY = rect.top + py;
          const cellX = Math.floor(screenX / state.cellSize);
          const cellY = Math.floor(screenY / state.cellSize);

          if (cellX < 0 || cellX >= state.cols || cellY < 0 || cellY >= state.rows) continue;

          const cellIndex = cellY * state.cols + cellX;
          if (!state.mask[cellIndex]) {
            state.grid[cellIndex] = 1;
          }
        }
      }
    }
  }

  update(state: AutomataState, tick: number): void {
    if (tick % 4 === 0) {
      this.updateFeedback(state);
    }
    this.updateCollisions(state, tick);
  }

  destroy(): void {
    for (const id of this.pendingTimeouts) {
      clearTimeout(id);
    }
    this.pendingTimeouts.clear();
  }

  private updateFeedback(state: AutomataState): void {
    for (const entry of this.entries) {
      if (entry.kind === "graphviz") continue;

      const { element, interactionCells } = entry;
      let liveCount = 0;

      for (const cellIndex of interactionCells) {
        liveCount += state.grid[cellIndex];
      }

      const density = interactionCells.length > 0 ? liveCount / interactionCells.length : 0;
      const p = density;
      let entropy = 0;

      if (p > 0 && p < 1) {
        entropy = -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
      }

      (element as HTMLElement).style.setProperty("--char-density", density.toFixed(3));
      (element as HTMLElement).style.setProperty("--char-hue-shift", `${(entropy * 30).toFixed(1)}deg`);
    }
  }

  private updateCollisions(state: AutomataState, tick: number): void {
    for (const entry of this.entries) {
      const hasNearbyCell = entry.interactionCells.some(
        (cellIndex) => state.grid[cellIndex] === 1,
      );

      if (!hasNearbyCell || tick - entry.lastPulsedTick < 60) {
        continue;
      }

      entry.lastPulsedTick = tick;
      entry.element.classList.remove("automata-collision");
      void entry.element.getBoundingClientRect(); // force reflow to restart the animation
      entry.element.classList.add("automata-collision");

      const timeoutId = setTimeout(() => {
        this.pendingTimeouts.delete(timeoutId);
        entry.element.classList.remove("automata-collision");
      }, 500);
      this.pendingTimeouts.add(timeoutId);
    }
  }
}

function collectKaTeXLeafSpans(root: Element): HTMLSpanElement[] {
  const leaves: HTMLSpanElement[] = [];
  for (const span of root.querySelectorAll<HTMLSpanElement>("span")) {
    if (span.children.length === 0 && (span.textContent ?? "").trim() !== "") {
      leaves.push(span);
    }
  }
  return leaves;
}

function cellsNearRect(state: AutomataState, rect: DOMRect): number[] {
  const radius = INTERACTION_RADIUS_CELLS * state.cellSize;
  const left = Math.max(0, Math.floor((rect.left - radius) / state.cellSize));
  const right = Math.min(
    state.cols - 1,
    Math.ceil((rect.right + radius) / state.cellSize),
  );
  const top = Math.max(0, Math.floor((rect.top - radius) / state.cellSize));
  const bottom = Math.min(
    state.rows - 1,
    Math.ceil((rect.bottom + radius) / state.cellSize),
  );
  const cells: number[] = [];

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const cellIndex = y * state.cols + x;
      if (state.mask[cellIndex]) continue;

      const cellCenterX = x * state.cellSize + state.cellSize / 2;
      const cellCenterY = y * state.cellSize + state.cellSize / 2;

      if (distanceToRect(cellCenterX, cellCenterY, rect) <= radius) {
        cells.push(cellIndex);
      }
    }
  }

  return cells;
}

function distanceToRect(x: number, y: number, rect: DOMRect): number {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
}
```

- [ ] **Run typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Commit**

```bash
git add src/components/pages/about/automata/text/automata-text-bridge.ts
git commit -m "feat: extend bridge to discover KaTeX leaf spans and Graphviz node groups"
```

---

## Task 2: Add emitters for KaTeX and Graphviz field elements in `refreshTextField`

**Files:**
- Modify: `src/components/pages/about/automata/automata-text-field.ts`

Currently the `else` branch (elements without `[data-automata-char]` spans) masks the bounding rect but skips `placeFieldEmitters`. This means the KaTeX equation has no glider sources nearby. Fix: detect whether the field element contains `.katex-html` or SVG `g.node` elements and call `placeFieldEmitters` when true.

- [ ] **Edit the `else` branch in `refreshTextField`**

Find this block (roughly lines 46–56 in the current file):

```ts
    } else {
      // Element has no char spans (e.g. KaTeX equation): mask the element
      // rect directly so cells don't flow through it, but skip emitters so
      // gliders don't appear to originate from the element border.
      const rect = element.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        maskCharRect(state, rect);
      }
    }
```

Replace with:

```ts
    } else {
      const rect = element.getBoundingClientRect();

      if (rect.width > 0 && rect.height > 0) {
        maskCharRect(state, rect);

        if (
          element.querySelector(".katex-html") !== null ||
          element.querySelector("svg g.node") !== null
        ) {
          placeFieldEmitters(state, rect);
        }
      }
    }
```

- [ ] **Run typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Commit**

```bash
git add src/components/pages/about/automata/automata-text-field.ts
git commit -m "feat: place emitters around KaTeX and Graphviz field elements"
```

---

## Task 3: Add `automataField` prop to `GraphvizBlock`

**Files:**
- Modify: `src/lib/markdown/graphviz-block.tsx`

The `<figure>` wrapper needs `data-automata-field` to opt a diagram into the bridge's discovery. Add an optional `automataField` string prop and forward it.

- [ ] **Edit `graphviz-block.tsx`**

Replace:

```tsx
export function GraphvizBlock({ source }: { source: string }) {
```

With:

```tsx
export function GraphvizBlock({
  automataField,
  source,
}: {
  automataField?: string;
  source: string;
}) {
```

And replace the `<figure>` JSX:

```tsx
  return (
    <figure className="graphviz">
      <div ref={graphRef} />
    </figure>
  );
```

With:

```tsx
  return (
    <figure
      className="graphviz"
      {...(automataField !== undefined ? { "data-automata-field": automataField } : {})}
    >
      <div ref={graphRef} />
    </figure>
  );
```

- [ ] **Run typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Commit**

```bash
git add src/lib/markdown/graphviz-block.tsx
git commit -m "feat: add automataField prop to GraphvizBlock for automata integration"
```

---

## Task 4: Add `automata-collision` CSS for KaTeX leaf spans and SVG node groups

**Files:**
- Modify: `src/lib/styles/motion-core.css`

Two new rules at the end of the file:

1. **KaTeX leaf spans**: KaTeX renders spans as `display: inline`, so `transform: scale()` (used by the existing `automata-scale-pulse`) does not apply. Use a `filter: brightness()` pulse instead, which works on inline elements. Also set `color` to `--primary` to match the existing char collision behaviour.

2. **Graphviz `g.node` groups**: SVG group elements support `opacity` and `filter`. Use an opacity flash + `drop-shadow` glow in the primary colour.

- [ ] **Append to `src/lib/styles/motion-core.css`**

```css
/* KaTeX glyph collision — brightness pulse (transform: scale doesn't apply to inline spans) */
.katex-html .automata-collision {
  animation: automata-katex-pulse 500ms ease-out forwards;
  color: hsl(var(--primary));
}

@keyframes automata-katex-pulse {
  0%   { filter: brightness(2.2); }
  100% { filter: brightness(1); }
}

/* Graphviz node collision — opacity flash + primary glow */
g.node.automata-collision {
  animation: automata-node-pulse 500ms ease-out forwards;
}

@keyframes automata-node-pulse {
  0%   { opacity: 0.55; }
  25%  { opacity: 1; filter: drop-shadow(0 0 4px hsl(var(--primary) / 0.75)); }
  100% { opacity: 1; filter: none; }
}
```

- [ ] **Run typecheck to confirm no regressions**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Commit**

```bash
git add src/lib/styles/motion-core.css
git commit -m "feat: add automata-collision animations for KaTeX glyphs and Graphviz nodes"
```

---

## Task 5: Visual verification

**Files:** none (dev server only)

- [ ] **Start the dev server**

```bash
bun run dev
```

Open the about page (`/`). The page should load with the automata background running.

- [ ] **Verify KaTeX equation collision**

The integral equation at the top of the about copy has `data-automata-field="about"`. Within ~30 seconds a glider should reach a KaTeX glyph and trigger the brightness pulse + primary colour flash on an individual math symbol. Gliders should now also spawn from emitters near the equation (they previously had none).

- [ ] **Verify existing `AutomataText` collision is unaffected**

The "Welcome." heading and body text chars should still pulse with `automata-scale-pulse` exactly as before.

- [ ] **Verify Graphviz integration (if a diagram is present on the about page)**

If a `<GraphvizBlock automataField="about" source="..." />` is added to `about-page.tsx`, its node shapes should flash with `automata-node-pulse` on glider impact. If no Graphviz is on the about page yet, this can be verified later when diagrams are added.
