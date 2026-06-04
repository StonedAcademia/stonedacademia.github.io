# Automata Per-Glyph Collision for KaTeX and Graphviz

**Date:** 2026-06-04  
**Status:** Approved

## Problem

The automata background in `about/` currently treats KaTeX equations and Graphviz diagrams as opaque bounding-box rectangles. Gliders bounce off the border, not the actual rendered content. `AutomataText` elements already get per-character collision (the `automata-collision` CSS class fires on individual letter spans). KaTeX and Graphviz have no equivalent.

## Goal

Extend `AutomataTextBridge` to detect collisions against:
- Individual KaTeX glyph spans (leaf spans inside `.katex-html`)
- Graphviz node shapes (`<g class="node">` SVG groups)

## Data Model

Generalize the bridge's internal entry type to a discriminated union:

```ts
type BridgeEntry =
  | { kind: "char";     element: HTMLSpanElement; /* existing fields */ }
  | { kind: "katex";    element: HTMLSpanElement; /* same fields */ }
  | { kind: "graphviz"; element: SVGGElement;     /* same fields, no OffscreenCanvas */ }
```

All three kinds share:
- `rect: DOMRect` — bounding rect used for masking and edge lookup
- `lastPulsedTick: number` — collision cooldown (~5s)
- `cellWindowX1/Y1/X2/Y2` — window for density/entropy feedback
- Collision path: `automata-collision` class added on hit, removed after 500ms

Per-kind difference is only in `init()` discovery and `stampGlyphBitmaps`:
- `char` / `katex` — OffscreenCanvas glyph stamp for pixel-level masking
- `graphviz` — bounding-rect mask only (no OffscreenCanvas); `refreshTextField` already masks the rect

## Discovery in `AutomataTextBridge.init()`

Three discovery passes, all results appended to the same entries array:

1. **`char`**: existing `[data-automata-char]` query — unchanged
2. **`katex`**: for each `[data-automata-field]` element containing `.katex-html`, walk the DOM to collect leaf spans (nodes with non-whitespace text content and no child element nodes)
3. **`graphviz`**: for each `[data-automata-field]` element containing an `<svg>`, query `g.node` SVG groups

After discovery, `buildEdgeLookup` and `stampGlyphBitmaps` run once across all entries.

## Collision Animation

- **`katex` entries**: `automata-collision` class on the leaf `<span>`. Add a CSS rule alongside the existing keyframes targeting these spans (opacity/scale pulse).
- **`graphviz` entries**: `automata-collision` class on the `<g class="node">` SVG group. Add a `g.node.automata-collision` CSS rule with an SVG-compatible animation (opacity pulse + slight scale on the shape child).

`GraphvizBlock` replaces children on `source` change only, not on a timer — a mid-animation re-render (cutting the 500ms animation short) is acceptable.

## Changes Outside the Bridge

### `refreshTextField` (`automata-text-field.ts`)

The KaTeX equation currently goes through the "no char spans / no emitters" path. Fix: detect that a `[data-automata-field]` element contains `.katex-html` (or SVG `g.node` elements) and call `placeFieldEmitters` using the element's bounding rect — same as `AutomataText` already does.

### `GraphvizBlock` (`graphviz-block.tsx`)

Add an optional `automataField` prop (type `string | undefined`). Forward it as `data-automata-field` on the `<figure>` wrapper. The about page passes `"about"`; blog posts omit it.

### `about-page.tsx`

The KaTeX equation div already has `data-automata-field="about"` — no change.  
When Graphviz diagrams are added to the about page, pass `automataField="about"` to `GraphvizBlock`.

## Files Changed

| File | Change |
|---|---|
| `automata/text/automata-text-bridge.ts` | Generalize entry type; add `katex` and `graphviz` discovery; extend `stampGlyphBitmaps` |
| `automata/automata-text-field.ts` | Add emitter placement for KaTeX/Graphviz field elements |
| `lib/markdown/graphviz-block.tsx` | Add optional `automataField` prop → `data-automata-field` on `<figure>` |
| `lib/styles/pages/automata-specimen.css` (or shared CSS) | Add `automata-collision` keyframe rules for KaTeX leaf spans and SVG node groups |

## Out of Scope

- Pixel-perfect SVG shape masking (ellipse/polygon boundary) — bounding-rect masking is sufficient
- Collision animation on Graphviz edge labels or KaTeX delimiters — node shapes and math glyphs only
- Blog page automata integration
