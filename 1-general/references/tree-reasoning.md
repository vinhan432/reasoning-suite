# Root -> Branch -> Leaf

Open this when you are unsure how to split a problem, or when a leaf feels vague.
Readable independently of any other file.

## The shape
```
ROOT      the problem restated in one sentence + the exact output needed.
BRANCHES  2-4 independent sub-problems; together they answer the root.
LEAVES    for each branch, the smallest verifiable conclusion.
```
Written form (indentation is the contract; print this before answering hard tasks):
```
ROOT: <one sentence> -> output: <format/file/decision>
├─ B1: <sub-problem>
│  ├─ L1: <evidence + source>
│  └─ L2: <evidence + source>
└─ B2: <sub-problem>
   └─ L3: <evidence + source>
```

## Root rules
- ONE sentence. Two different goals -> two runs.
- Name the output: "a diff", "recommendation + 3 reasons", "pass/fail on 5 criteria".
  Without a named output the UP pass has nothing to check.
- Ambiguity is resolved by an explicit `ASSUMPTION:` line under the root, not by silence.

## Branch rules
- 2-4 branches. 1 = no decomposition needed. 5+ = you are listing steps: merge.
- Independence: can you answer A without answering B? If not, merge them.
- Sufficiency: if the user reads every branch answer, is the root fully answered?
- Branches are not ordered steps. "1. read file 2. edit file" is a plan, not a tree.
- Useful cuts: by constraint, by stakeholder, by risk, by mechanism (causes in
  debug-reasoning), by layer (data/logic/UI in web-reasoning), by time (now/next).

## Leaf rules
A leaf is valid only if a second person could re-run or re-read it and get the same
result.

| Leaf type         | Example |
|-------------------|---------|
| command + output  | `pytest tests/export.py` -> 3 passed |
| code location     | src/export.py:41 writes rows without LIMIT |
| measurement       | p99 12ms over 1000 runs (bench.ipynb cell 4) |
| doc/config quote  | config/features.yaml: `export_csv: false` |
| test result       | test_ttl_eviction fails: expected eviction, got stale row |
| named assumption  | ASSUMPTION: single-tenant; not verified, flagged |

Never a leaf: an opinion ("Redis is faster"); the branch restated ("errors handled");
an unfalsifiable claim ("should scale fine"); a plan for later ("we could test it").

## Bad leaf -> good leaf
- "Cache is fast enough" -> "bench.py: p99 1.8ms vs 40ms budget".
- "The bug is in parsing" -> "traceback line 12 raises ValueError on input ''".
- "Edge cases covered" -> "tests: empty, 1 row, 10k rows pass; duplicate key fails".
- "A11y is ok" -> "manual: Tab reaches submit in 4 presses; labels present".

## Downward procedure
1. Write ROOT (sentence + output).
2. Write branches; run the independence and sufficiency tests.
3. Write leaf placeholders: what evidence WOULD settle this branch?
4. Collect evidence until every placeholder holds real content.
5. Only now start the UP pass: `reverse-check.md`.

## Scale guide
- Simple question: skip the tree, answer.
- Medium task: tree in the working notes, answer in prose.
- Hard task or high cost of being wrong: print the tree, print the UP line, then answer.
