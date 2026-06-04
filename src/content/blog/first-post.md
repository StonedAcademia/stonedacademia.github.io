---
title: "first post"
date: "2026-06-03"
description: "A starter Markdown file wired to /blog/first-post.md."
tags: ["markdown", "math", "graphviz"]
---

This is a Markdown post.

The file lives at `src/content/blog/first-post.md`, and the route is
`/blog/first-post.md`.

## notes

- keep the filename lowercase
- use hyphens between words
- write in Markdown

Code works too:

```ts
const site = "stoned_academia";
```

Inline math renders with $e^{i\pi} + 1 = 0$.

Block math renders too:

$$
\int_0^1 x^2\,dx = \frac{1}{3}
$$

Graphviz diagrams render from fenced DOT blocks:

```dot
digraph notes {
  rankdir=LR;
  markdown -> latex;
  markdown -> graphviz;
  graphviz -> svg;
}
```
