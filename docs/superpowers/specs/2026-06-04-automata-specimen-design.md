# Automata Specimen Component

**Date:** 2026-06-04  
**Status:** Approved

## Overview

A companion component placed below the welcome text on the About page. It shows a live, isolated Game of Life simulation inside a minimal bordered box. A LaTeX formula identifying the current species floats at the bottom-left. Clicking dissolves both the border and the formula, injecting the living cells into the background automata.

## Placement

Below the welcome copy (`about-copy` div), left-aligned with the existing text. No additional wrapper needed — it sits as a sibling element inside `.about-copy`.

## Visual Design

- **Border:** `1px solid` using `--border` CSS variable (matches the site's existing border color). `border-radius: 2px`.
- **Canvas:** A small canvas inside the box (~120×96 logical pixels, or 15×12 cells at 8px). Renders using the same cell drawing style as the background (filled squares with 1px gap, `--primary` color, matching opacity levels).
- **Formula:** Rendered with KaTeX (already a project dependency). Positioned absolute, bottom-left inside the box, `--primary` color at low opacity (~0.45). Italic. Small font (~11px). No separator.
- **Hover state:** Border opacity and formula opacity increase slightly (CSS transition, ~150ms). Subtle — just enough to feel responsive.
- **Dissolved state:** On click, border color and formula both transition to `opacity: 0` over ~400ms. Component remains in the DOM (invisible) and reseeds silently after ~800ms, then fades back in.

## Species & Formulas

Auto-cycles through five species in order, cross-fading the grid and formula over ~600ms every ~5 seconds:

| Species | Class | Formula |
|---|---|---|
| Glider | Spaceship | `v = \frac{c}{4}` |
| Lightweight spaceship | Spaceship | `v = \frac{c}{2}` |
| Blinker | Oscillator | `\sigma(t+2) = \sigma(t)` |
| Pulsar | Oscillator | `\sigma(t+3) = \sigma(t)` |
| Block | Still life | `\sigma(t+1) = \sigma(t)` |

The mini canvas runs each species live (not a static image). Spaceships are seeded near the center with appropriate orientation so they loop within the small grid via wrap-around. Oscillators are centered.

## Mini Canvas Behavior

- Uses its own `requestAnimationFrame` loop at the same `STEP_INTERVAL_MS` (82ms) as the background.
- Same `stepField` logic (Conway B3/S23), same wrapping (`indexOf` with modulo).
- Grid is small enough (15×12) that spaceships wrap continuously — they appear to travel in an infinite loop within the frame.
- On species transition: the grid cross-fades (canvas opacity 0→1) while reseeding with the new pattern.
- On click ("release"): cells currently alive in the mini canvas are translated from mini-canvas cell coordinates to background screen coordinates, then injected into the background.

## Background Injection

**Mechanism:** `window.dispatchEvent(new CustomEvent('automata:inject', { detail: { cells: Array<{x, y}> } }))` where `x` and `y` are cell coordinates in the background grid.

**Coordinate translation:** The specimen component knows its own bounding rect (`getBoundingClientRect`). Each live cell in the mini canvas maps to a screen pixel position, which is then divided by the background's `cellSize` (8px) to get background grid coordinates.

**Background automata change:** Add a `useEffect` listener inside `ShannonAutomataBackground` for `automata:inject`. On receipt, stamp each provided cell directly into `state.grid` (skip masked cells, same as `stampPattern`).

**Result:** The living cells appear to escape from the box into the surrounding field and propagate as normal Game of Life cells.

**Click guard:** While the component is in its dissolved state (opacity animating out, reseeding, or fading back in), click events are ignored. This prevents double-injection if the user clicks rapidly.

## Component Architecture

```
src/components/pages/automata-specimen.tsx   ← new file
```

- Self-contained component. Owns its own canvas ref, animation loop, species state, and dissolve state.
- No shared context or refs with `ShannonAutomataBackground` — communication is one-way via the `automata:inject` custom event.
- `ShannonAutomataBackground` gets a small addition: a `useEffect` that listens for `automata:inject` and stamps cells into the current state.
- KaTeX renders the formula. Already used in `about-page.tsx` via `rehype-katex` / `remark-math` for the equation block — use the same `katex.renderToString` directly for inline rendering in the specimen.

## Files Changed

| File | Change |
|---|---|
| `src/components/pages/automata-specimen.tsx` | New component |
| `src/components/pages/shannon-automata-background.tsx` | Add `automata:inject` event listener |
| `src/components/pages/about-page.tsx` | Mount `<AutomataSpecimen />` below the copy |

## Accessibility

- `aria-hidden="true"` on the specimen canvas (decorative).
- `prefers-reduced-motion`: skip the animation loop, show a static snapshot of the current species. Dissolve still works but is instant.
