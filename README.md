# stoned_academia

A small GitHub Pages site built with React, TypeScript, Vite, Tailwind, and
shadcn-style primitives.

## routes

- `/` renders the about page.
- `/blog/<blog_name>.md` renders a Markdown file from `src/content/blog`.

To add a post, create a Markdown file in `src/content/blog`:

```md
---
title: "post title"
date: "2026-06-03"
description: "short index text"
---

Body text here.
```

The filename becomes the route. For example, `src/content/blog/notes.md` becomes
`/blog/notes.md`.

Markdown posts also support LaTeX math with `$inline$` and `$$block$$` syntax,
plus Graphviz diagrams in fenced `dot`, `graphviz`, or `gv` code blocks.

## commands

```bash
npm install
npm run dev
npm run build
```

The build script copies `dist/index.html` to `dist/404.html` so GitHub Pages can
serve direct links such as `/blog/first-post.md`.
