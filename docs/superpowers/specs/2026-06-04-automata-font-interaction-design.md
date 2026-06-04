# Automata–Font Interaction

**Date:** 2026-06-04
**Status:** Approved

## Overview

A closed cybernetic loop between the Conway GoL background field and the page typography. Three interactions run simultaneously:

- **B — Text → field (page load):** Each character's glyph bitmap seeds live cells into the automata at startup.
- **A — Field → text (per frame):** Cell density dims individual characters; Shannon entropy shifts their hue — each letter is a two-channel readout of its local field state.
- **C — Collision (per tick):** When a live cell reaches the text edge boundary, the nearest character fires a brief scale pulse.

## Architecture

### New files

| File | Purpose |
|---|---|
| `src/components/pages/about/automata-text.tsx` | `AutomataText` component — renders text as per-char `<span data-automata-char>` elements |
| `src/components/pages/about/automata/automata-text-bridge.ts` | `AutomataTextBridge` class — owns all three interactions, reads `AutomataState`, writes to DOM spans |

### Modified files

| File | Change |
|---|---|
| `about-page.tsx` | Replace two `PretextText` elements with `AutomataText` |
| `shannon-automata-background.tsx` | Create bridge, call `bridge.init()` after `refreshTextField`, call `bridge.update()` each frame |
| `src/lib/styles/motion-core.css` | Add `[data-automata-char]` rules, `.automata-collision` animation |

### Data flow

```
Page load
  AutomataText renders → per-char <span data-automata-char="N">
  ShannonAutomataBackground init:
    createAutomataState → refreshTextField (mask + emitters)
    bridge.init(state) → scan spans, stamp glyph bitmaps, build edge→char lookup
    seedField(state)

Each frame (~82ms)
  stepField(state)
  bridge.update(state, tick)   ← reads grid/edge, writes span styles
  emitFromText(state, tick)
  emitFromEdges(state, tick)
  drawField(context, state, tick)
```

The bridge never touches the canvas. It only reads `state.grid` and `state.edge`, and writes to DOM span styles. Canvas owns the automata visual; DOM spans own the text visual.

## `AutomataText` Component

Drop-in replacement for `PretextText`. Same props signature (`as`, `animation`, `className`, `text`, `data-automata-field`, etc.), same pretext measurement hook, same CSS class names (`pretext-text`, `pretext-text-heading`, etc.).

Render output differs: instead of a plain text node, each character is a `<span data-automata-char="N">`. Spaces get spans too — needed for the grid position lookup, visually inert.

```tsx
<h1 class="pretext-text pretext-text-heading automata-text-field">
  <span data-automata-char="0">W</span>
  <span data-automata-char="1">e</span>
  ...
</h1>
```

## `AutomataTextBridge`

### `init(state: AutomataState)`

Called once after `refreshTextField`. Re-called on viewport resize.

1. **Scan characters:** Query all `[data-automata-char]` spans. Record `getBoundingClientRect()` and character string for each into a cached `chars[]` array.
2. **Glyph bitmap seeding:** For each character:
   - Create an offscreen canvas sized to the span's CSS pixel dimensions.
   - Draw the character in white on black using the span's computed font.
   - `getImageData` → threshold pixels above brightness cutoff.
   - For each lit pixel, compute `cellX = Math.floor((rect.left + pixelX) / cellSize)`, `cellY = Math.floor((rect.top + pixelY) / cellSize)`.
   - Stamp `state.grid[cellIndex] = 1` for unmasked cells.
3. **Edge→char lookup:** For every cell where `state.edge[cellIndex] === 1`, find the nearest character by Euclidean distance to character center. Store `edgeLookup: Map<cellIndex, charIndex>`. O(edgeCells × chars), built once.

### `update(state: AutomataState, tick: number)`

**CSS feedback (every 4 ticks, ~15fps):**

For each character, scan the cell window covering its bounding rect:
- `density = liveCount / windowSize` → write `--char-density`
- Binary Shannon entropy: `H = -(p·log₂p + (1−p)·log₂(1−p))` where `p = density`. H is 0 at all-dead or all-alive, peaks at 1.0 at 50/50. Write `--char-hue-shift: calc(H * 30deg)`

Skipped entirely when `prefers-reduced-motion` is active.

**Collision detection (every tick):**

For each live cell in the edge zone, look up nearest character via `edgeLookup`. If that character's `lastPulsedTick` was more than 60 ticks ago (~5s cooldown), add class `automata-collision`, schedule removal after 500ms, record `lastPulsedTick = tick`.

The 60-tick cooldown prevents oscillators sitting on the edge from continuously pulsing the same letter.

Skipped entirely when `prefers-reduced-motion` is active.

## CSS

```css
[data-automata-char] {
  display: inline-block;   /* required for transform on inline elements */
  opacity: calc(1 - var(--char-density, 0) * 0.5);
  filter: hue-rotate(var(--char-hue-shift, 0deg));
  transition: opacity 300ms ease, filter 300ms ease;
}

.automata-collision {
  animation: automata-scale-pulse 500ms ease-out forwards;
  transform-origin: center bottom;
}

@keyframes automata-scale-pulse {
  0%   { transform: scale(1); }
  25%  { transform: scale(1.18); }
  100% { transform: scale(1); }
}
```

`display: inline-block` is required — inline elements ignore CSS transforms. This does not affect text reflow since pretext measurement already ran.

## Accessibility

- `prefers-reduced-motion`: bridge skips all CSS var writes and collision pulses. Text renders at default opacity/hue with no animation.
- The spans are purely presentational — no role, no tabindex. Screen readers see the parent element's text content unchanged.

## About Page Changes

```tsx
// before
<PretextText animation="heading" as="h1" ... text="Welcome.">Welcome.</PretextText>
<PretextText className="... text-muted-foreground" ... text="I hope to share...">...</PretextText>

// after
<AutomataText animation="heading" as="h1" ... text="Welcome.">Welcome.</AutomataText>
<AutomataText className="... text-muted-foreground" ... text="I hope to share...">...</AutomataText>
```

The equation `<div>` and `<AutomataSpecimen>` are unchanged.
