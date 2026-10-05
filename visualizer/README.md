# tree-json visualizer

Static viewer for the `tree-json` reasoning trees emitted by the four skills in this
suite. Plain HTML + CSS + vanilla JS: no build step, no framework, no backend, no
network calls at runtime.

## Files
```
visualizer/
├── index.html          structure + i18n hooks
├── style.css           light/dark tokens, layout, status colours + patterns
├── app.js              parse, validate, status, layout, render, playback, edit, export
├── examples/
│   ├── general.json    all-green tree (READY)
│   ├── debug.json      failed leaf + check fail/gap (NOT READY)
│   ├── code.json       reverse-check gap with all leaves verified (NOT READY)
│   ├── web.json        deeply nested tree (depth 5) with one unverified leaf
│   └── data.js         the same four examples, embedded for offline use
└── README.md
```

## Run
- Double-click `index.html` (offline-ready: examples load from `examples/data.js`
  because browsers block `fetch()` on `file://`).
- Or serve the folder: `python -m http.server 8080` then open `http://localhost:8080`.
  Serving also lets the file-upload button read `.json` files directly.

## Deploy
Static hosting only: GitHub Pages (publish this folder), Netlify drop, Vercel
(`framework: Other`, no build command), Cloudflare Pages. Total size is well under
150 KB and nothing is fetched at runtime.

## Use
1. Paste a `tree-json` block or a whole markdown answer (the block is extracted
   automatically), press **Render**. Or load an example / upload a `.json` file.
2. Validation errors list the exact node path and the failed rule (same rules as
   `../tree.schema.json`), for example `root.children[1].children[0] - leaf missing
   evidence [leafEvidence]`.
3. Read the health bar: leaves verified / unverified / failed, number of check
   fails+gaps, and READY / NOT READY. Blocking chips are clickable and jump to the node.
4. Playback: **DOWN** reveals root -> branches -> leaves, **UP** walks the
   `reverse_check` entries (highlighting each target) and then propagates the computed
   status upward, deepest level first. Play/pause, step forward/back, speed slider,
   Show all to exit. `prefers-reduced-motion` disables all animation.
5. Inspect: click a node for text, evidence, status and the checks targeting it.
   Double-click to edit; add a child (max 4) or delete a sub-tree. Edits update the
   JSON in the textarea live.
6. Export/copy: Copy JSON, Download JSON, Export SVG, Export PNG (current view,
   `viewBox` fitted to the tree).
7. Keyboard: Tab into the tree, arrows move (up = parent, down = first child,
   left/right = siblings), Enter opens details, Space collapses/expands, `+`/`-` zoom,
   `0` fits to screen.
8. Session (JSON, language, theme, collapsed nodes) is restored from `localStorage`
   inside `try/catch`; with storage disabled the page still works.

## Status model (computed, never stored)
| Node | Rule |
|---|---|
| leaf | `verified` green, `unverified` amber, `failed` red |
| branch / root | red if ANY child is red, green only if ALL children are green, else amber |

Colour is never the only signal: each status also has an icon (✓ ? ✕ ○) and a stroke
pattern (solid / dashed / dotted), so the tree stays readable for colour-blind users.

**READY** requires every leaf verified and zero `reverse_check` entries with
`fail`/`gap`. Otherwise the bar lists the blocking nodes.

## Editing notes
- A new child starts as a leaf with `status: "unverified"` and a `TODO` evidence line,
  so it is schema-valid and visibly blocks the verdict until you replace the evidence.
- Adding a child to a leaf turns it into a branch (its `evidence`/`status` stay in the
  JSON but are ignored, exactly as the schema specifies).
- Deleting a node also drops the `reverse_check` entries that targeted the removed
  sub-tree.
- Maximum 4 children per node; the Add-child button disables at the limit.

## i18n
UI text lives in the `I18N` object at the top of `app.js` (`en` and `vi` complete).
Add a language by copying the `en` keys under a new code; no other change is needed.
The `vi` entries are authored with numeric HTML entities so `app.js` stays ASCII; the
loader decodes them once at startup (own strings only, never user data), so plain
UTF-8 text also works if you prefer to write it directly.

## Safety
No `eval`, no `innerHTML`: every piece of user text goes through `textContent` or
`createElementNS`, so a node text like `<img src=x onerror=alert(1)>` renders as
literal characters. Uploaded files are read locally with `FileReader`; nothing is sent
anywhere.

## Limits and known scope
- Layout is a deterministic tidy-tree: no overlap up to ~100 visible nodes; beyond that
  use collapse or zoom. Fit-to-screen scales down to 8%.
- PNG export uses an SVG data URL + canvas (no external images, so the canvas is never
  tainted). Fonts fall back to the system sans-serif in exports.
- Print/PDF is out of scope; use Export PNG/SVG.
