---
name: code-reasoning
description: Root-branch-leaf planning and verification for writing new code or features: requirement plus checkable acceptance criteria at the root, branches for interface/data flow/core logic/error handling/edge cases/tests, leaves as runnable pieces each with its check, a mandatory criteria-to-proof mapping, then a tree-json block. Trigger on "write / implement / add a function, endpoint, CLI, script, module, integration", "we need a feature that does X", "extract this into a helper" (refactor with unchanged behavior), or any build request that must actually work. Do NOT use for explaining existing code, one-line or mechanical edits, review-only requests, or failures with an unknown cause (use debug-reasoning).
---

# Code Reasoning (requirement -> criteria -> runnable parts)

Base shape, leaf rules, UP pass and `tree-json` output: `general-reasoning`
(`1-general/SKILL.md`); this skill adds the requirement root and runnable leaves.

## Purpose
Build the smallest thing that satisfies stated acceptance criteria.

## When to use
- Writing a new feature, endpoint, function set, CLI, script or integration.
- Behavior-preserving refactors (criteria = existing tests).
- NOT for: known one-line fixes, explaining code, unknown-cause failures.

## Procedure
1. ROOT: requirement in one sentence + the output: a list of acceptance criteria, each
   concrete and checkable ("returns 200 with `next` on 30 items"). Unstated
   requirements -> explicit `ASSUMPTION:` lines.
2. BRANCHES: choose 3-4 by risk from interface/structure, data flow, core logic, error
   handling, edge cases, tests. Chooser table:
   `references/decomposition-patterns.md`.
3. LEAVES: the smallest runnable unit per branch - one function, one route, one test
   case - each with the command or input that checks it. Unrunnable -> not a leaf.
4. DOWN: write the interface first (signature, input/output shape, error shape), then
   the smallest working version. Run each leaf's check when the leaf is written.
5. UP: map EVERY acceptance criterion to a leaf that proves it. Uncovered criterion ->
   new leaf, not a note. Code with no criterion -> delete.
6. EDGE pass: empty, single, many, max, malformed, duplicate, missing permission,
   concurrent (pick by domain; catalogue in the reference).
7. OVER-ENGINEERING pass: delete what is not requested and not required by a criterion:
   speculative abstraction, config for one caller, unused parameters, extra layers.
8. REPORT: what was built, the exact verify command with its real output, the
   criteria -> proof mapping, assumptions, untested items.
9. EMIT the `tree-json` block with `domain: "code"`: root = requirement, branches =
   chosen branches, leaves = parts with run evidence, `reverse_check` = one entry per
   acceptance criterion (`pass` only when its proof leaf ran green).

## Reverse check (code additions)
On top of the base UP pass: does every criterion have a named proof? Do the parts
satisfy the criteria together (integration, not only units)? Are edge cases covered by
an executable leaf? Anything over-engineered or unrequested? Any leaf a stub, `TODO`,
mock-only path or "will add later"?

## Rules
1. Acceptance criteria are listed and checkable before coding; none given -> state the
   bounded `ASSUMPTION` you commit to. [G1][X2]
2. Smallest working version first; extend only for a criterion. [G2][X2]
3. Every leaf is runnable and is actually run during the work. [G1][G3]
4. Every criterion maps to a proof leaf; unmapped -> not done. [G1][X2]
5. No unrequested features, abstractions or config. [X1]
6. Assumptions are written where the code depends on them. [G2][X1]
7. No stubs, placeholders, no-ops or fake fallbacks in the delivered code. [X2]
8. Report the verify command and its real output, never "should work". [G1]

## Common mistakes
- Coding before the criteria exist; the result solves a remembered problem (X2).
- Only the happy path exercised; error/edge branches have no leaf (X2).
- Adding a cache, plugin layer or generics "while we are here" (X1).
- "Done" with paths that never ran; tests that assert mocks, not behavior.

## Output (tree-json)
`domain: "code"`. Criteria live in the root text (or as branches when they are the
risk); a leaf is `status: "verified"` only when its check actually ran green. One
`reverse_check` entry per criterion, `target` = the leaf that proves it. Schema:
`../tree.schema.json`; rules: `../1-general/references/tree-format.md`.

## Compact example (indented tree) + tree-json
Task: add `GET /orders?limit=&cursor=`.
```
ROOT: paginated orders endpoint -> output: route + criteria + test run.
├─ B1: interface
│  └─ L1: response {items, next} matches api/schemas.py (review against C1)
├─ B2: core logic
│  └─ L2: keyset query (created_at,id) -> pytest -k paging: 4 passed (C1, C4)
└─ B3: edges
   ├─ L3: limit=101 -> 400 (C2), limit=0 -> 400 (test passed)
   └─ L4: cursor="xx" -> 400 (C3); missing limit -> 20 (ASSUMPTION, docstring)
UP: C1-C4 each map to a passing leaf; nothing beyond the criteria -> report + emit.
```
```tree-json
{"version":1,"domain":"code","title":"Paginated GET /orders endpoint",
 "root":{"id":"r","text":"add GET /orders?limit=&cursor= meeting C1-C4","children":[
  {"id":"b1","text":"interface matches existing conventions","children":[
    {"id":"b1-l1","text":"response {items, next} matches api/schemas.py","evidence":"schema file read; reviewed against C1","status":"verified"}]},
  {"id":"b2","text":"core keyset query","children":[
    {"id":"b2-l1","text":"paging works with a stable (created_at,id) order","evidence":"pytest -q tests/test_orders.py -k paging -> 4 passed","status":"verified"}]},
  {"id":"b3","text":"edges rejected and defaults documented","children":[
    {"id":"b3-l1","text":"limit=101 and limit=0 return 400","evidence":"test_limit_too_large, test_limit_zero passed","status":"verified"},
    {"id":"b3-l2","text":"bad cursor returns 400; missing limit defaults to 20","evidence":"test_bad_cursor passed; ASSUMPTION in docstring","status":"verified"}]}]},
 "reverse_check":[
  {"target":"b2-l1","question":"C1: 200 with next on 30 items?","result":"pass","note":"test_paging_next green"},
  {"target":"b3-l1","question":"C2: limit>100 rejected?","result":"pass","note":"test green"},
  {"target":"b3-l2","question":"C3: bad cursor rejected?","result":"pass","note":"test green"},
  {"target":"b2-l1","question":"C4: empty result returns 200 with []?","result":"pass","note":"test_empty green"}],
 "conclusion":"Endpoint shipped: 6 tests green, no extra code beyond the four criteria."}
```
