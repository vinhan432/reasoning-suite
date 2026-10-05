# tree-json Format

The contract between the reasoning skills and the visualizer. Read this before emitting
a `tree-json` block. Machine version: `../../tree.schema.json`.

## Where it goes
At the end of a non-trivial reasoning run, after the prose answer, emit exactly ONE
fenced block whose info string is `tree-json` and whose body is the JSON object
described in "Shape" below. Every `tree-json` fence in this suite contains valid,
parseable content - there are no skeleton blocks: each of the four `SKILL.md` files
carries a complete example.

The renderer also accepts a whole markdown message: it extracts the first `tree-json`
block, or parses the raw text as JSON if no block is found.

## Shape
```json
{
  "version": 1,
  "domain": "general | debug | code | web",
  "title": "short title of the problem",
  "root": { "id": "r", "text": "...", "children": [ /* 1-4 nodes */ ] },
  "reverse_check": [
    { "target": "b1", "question": "...", "result": "pass | fail | gap", "note": "..." }
  ],
  "conclusion": "written only when no reverse_check entry is fail or gap"
}
```

## Validation rules (enforced by the schema and by the website)
1. `version` = 1; `domain` one of the four values; `title` non-empty.
2. Every node: `id` non-empty, unique across the tree; `text` non-empty.
3. A node is a LEAF when it has no `children` key. Leaves MUST have `evidence`
   (non-empty) and `status` in `verified | unverified | failed`.
4. A node with `children` is a BRANCH (or the root). `children` must hold 1-4 nodes.
   An empty `children` array is invalid: remove the key or add a child.
5. `evidence` must be concrete: command output, test result, `file:line`, measurement,
   config/doc quote, or a text starting with `ASSUMPTION`. Opinions are invalid leaves.
6. `status` is stored on LEAVES ONLY. Root/branch status is always computed by the
   website, never written by the model.
7. `reverse_check[].target` must be an existing node `id`. `question` non-empty,
   `result` in `pass | fail | gap`, `note` short.
8. `conclusion` is a string. It must be empty while any `reverse_check` result is
   `fail` or `gap`; the website flags the violation as "NOT READY".
9. Depth is flexible; width is not: at most 4 children per node.

## Computed status (website, not stored)
- Leaf: `verified` -> green, `unverified` -> amber, `failed` -> red.
  `failed` = the leaf's claim was checked and did NOT hold (for example: the fix did
  not clear the repro, the test is red), so it blocks the READY verdict. A hypothesis
  that was killed is not a failure: write it as a verified finding ("B2 is dead: log
  line 118 shows the field").
- Branch/root: red if ANY child is red; green only if ALL children are green;
  otherwise amber.
- READY verdict: every leaf green AND no `reverse_check` entry with `fail`/`gap`.
  Otherwise NOT READY, and the blocking nodes are listed: non-verified leaves plus the
  targets of `fail`/`gap` checks.

## Minimal valid example
```json
{
  "version": 1,
  "domain": "general",
  "title": "flag or direct release",
  "root": {
    "id": "r",
    "text": "decide flag vs direct release for the CSV export",
    "children": [
      {
        "id": "b1",
        "text": "blast radius if the export is wrong",
        "children": [
          {
            "id": "b1-l1",
            "text": "export reads only, never writes",
            "evidence": "src/export.py:41 - no INSERT/UPDATE",
            "status": "verified"
          }
        ]
      },
      {
        "id": "b2",
        "text": "cost of the flag",
        "children": [
          {
            "id": "b2-l1",
            "text": "flag costs 2 files, 6 lines",
            "evidence": "config/features.yaml + route guard diff",
            "status": "verified"
          }
        ]
      }
    ]
  },
  "reverse_check": [
    { "target": "b1", "question": "does the leaf prove there are no writes?", "result": "pass", "note": "code read" },
    { "target": "b2", "question": "is the flag cost complete?", "result": "pass", "note": "diff measured" }
  ],
  "conclusion": "Ship behind the flag: reversible, 6 lines, no persistence risk."
}
```

## Common validation errors and fixes
| Message | Cause | Fix |
|---|---|---|
| `leaf missing evidence` | leaf with no `evidence` | add the concrete observation or mark `ASSUMPTION ...` |
| `leaf missing status` | leaf with no `status` | one of verified/unverified/failed |
| `children must have 1-4 items` | empty array, or 5+ children | remove the key, or merge/split branches |
| `duplicate id` | two nodes share an id | make ids unique (`b1-l1`, `b2-l2`, ...) |
| `unknown target` | `reverse_check.target` not a node id | use an existing id |
| `conclusion while check failed` | conclusion written with a fail/gap | clear it, fix the branch, re-run UP |

## Writing order (skill side)
1. Build the tree in the working notes (indented text).
2. Run the UP pass; fix the faulty branch.
3. Write the prose answer.
4. Emit the `tree-json` block with the final leaf statuses and the `reverse_check`
   results you actually obtained.
