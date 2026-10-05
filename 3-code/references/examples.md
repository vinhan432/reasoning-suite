# Examples (code reasoning)

Good: G1-G3. Bad: X1-X2. "Supports" lines tie each example to the rules in `SKILL.md`.

## G1 - New paginated endpoint
Task: "Add `GET /orders?limit=&cursor=` to the existing FastAPI app."
```
ROOT: paginated orders endpoint -> output: route + criteria + test run.
Criteria: C1 200 + next when 30 items; C2 limit>100 -> 400; C3 bad cursor -> 400;
          C4 empty -> 200 [].
├─ B1: interface
│  ├─ L1: response `{items, next}` matches api/schemas.py conventions (read)
│  └─ L2: error shape reused from api/errors.py:31 (read)
├─ B2: core logic
│  ├─ L3: keyset query (created_at,id) in orders/repo.py:60
│  └─ L4: `pytest tests/test_orders.py -k paging` -> 4 passed
└─ B3: edges
   ├─ L5: limit=101 -> 400; limit=0 -> 400 (tests passed)
   └─ L6: cursor="xx" -> 400 (test passed); missing limit -> 20 (ASSUMPTION in docstring)
UP: criteria map C1->test_paging_next, C2->test_limit_too_large, C3->test_bad_cursor,
C4->test_empty; all ran. No extra code: no cache, no filter params.
Report: `pytest -q tests/test_orders.py` -> 6 passed.
```
Supports: rules 1, 3, 4, 8, and the criteria->proof mapping table.

## G2 - Refactor with unchanged behavior
Task: "Extract the retry loop from `client.py` into a helper."
```
ROOT: extract retry helper, behavior unchanged -> output: diff + same tests green.
Criteria: C1 all existing client tests pass unchanged; C2 no new public API.
├─ B1: characterize current behavior first
│  ├─ L1: run tests/test_client.py -> 9 passed (before)
│  └─ L2: 3 retry behaviors pinned: 5xx retried, 4xx not, jitter present (asserts)
├─ B2: the move
│  ├─ L3: new util/retry.py with signature (fn, attempts, base_delay)
│  └─ L4: client.py:70-96 replaced by one call; no signature change (diff)
└─ B3: edges kept
   └─ L5: 4xx not retried test still passes; attempts=1 path covered (test)
UP: C1 satisfied (9 passed after), C2 verified by diff (nothing new exported except the
helper). ASSUMPTION: jitter distribution unchanged - stated, not silently altered.
```
Supports: rules 2, 4, 6; "Refactors" section of the patterns file.

## G3 - CLI command with real edges
Task: "Add `mytool dedupe <file>` that removes duplicate lines."
```
ROOT: dedupe subcommand -> output: command + criteria + run transcript.
Criteria: C1 order preserved, first occurrence kept; C2 empty file ok; C3 file missing
-> exit 2 + message; C4 1M lines under 5s.
├─ B1: interface
│  └─ L1: `dedupe [--in-place] FILE`, stdout mode default (argparse group, read)
├─ B2: core logic
│  └─ L2: seen-set preserving order (cli/dedupe.py:20) + unit cases (3 passed)
├─ B3: edges/limits
│  ├─ L3: empty file -> exit 0, no output (test); missing file -> exit 2 (test)
│  └─ L4: 1M-line file -> 2.4s, memory 180MB (measure output, C4)
UP: C1-C4 each mapped to a run; no extra features (no regex mode, no column pick) -
candidates the model deliberately rejected.
Report: `pytest -q tests/test_dedupe.py` -> 6 passed; timing run shown.
```
Supports: rules 1, 3, 5 (rejected extras), 8; edge catalogue entries empty/missing/size.

## X1 - Unrequested machinery
Task: "Add `mytool dedupe <file>`."
Bad: builds a `DedupeStrategy` abstract base, a registry, a config section, and a
`--strategy` flag; the single implementation is used once. Core behavior (order, exit
codes) untested.
Failure: rule 5, rule 4. Fix: one function + tests for C1-C4; abstract only when a
second real strategy exists.

## X2 - Criteria never formed, happy path only
Task: "Add a CSV import endpoint."
Bad: model writes the parser, runs one manual happy-path curl, says "done". No criteria
list, so missing file, wrong delimiter, header mismatch, 10k rows, and duplicate keys
are never exercised; the criterion "bad CSV -> 400 with row number" never existed.
Failure: rules 1, 4, 7. Fix: write criteria first (including errors), map each to a
test, run them; report the uncovered assumption (delimiter default = ",") explicitly.
