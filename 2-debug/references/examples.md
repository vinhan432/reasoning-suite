# Examples (debug reasoning)

Good: G1-G3. Bad: X1-X3. Each "supports" line ties the example to the rules in
`SKILL.md`.

## G1 - Prod-only KeyError
Task: "`KeyError: 'currency'` at checkout in prod; fine locally."
```
ROOT: cause + fix for KeyError 'currency' (prod checkout) -> cause + diff + verify cmd.
├─ B1: environment/config
│  ├─ L1: prod env dump lacks CURRENCY; .env.example line 7 defines it
│  └─ L2: docker-compose.yml:22 env_file: .env.prod (read)
├─ B2: input data
│  └─ L3: cart log line 118 -> payload contains "currency":"EUR" (not the input)
└─ B3: logic
   └─ L4: settings.py:14 uses os.environ["CURRENCY"] with no default
```
UP: L3 kills B2; L1+L4 explain prod-only failure and the exact key; fix = default +
explicit env value; verify = repro with empty CURRENCY, then checkout; regression =
test_settings_defaults (fails before, passes after).
Supports: rule 1 (produce repro), rule 2, rule 3, rule 5, rule 7.
Note: the model did NOT add `try/except` around settings (see X2).

## G2 - Test order dependency
Task: "`test_orders` passes alone, fails in the full suite."
```
ROOT: cause of order-dependent failure -> cause + diff + verify cmd.
├─ B1: shared mutable state
│  ├─ L1: run alone -> 1 passed; full suite -> fails at assertion line 44
│  └─ L2: conftest.py fixture `db` is session-scoped, not reset (read)
├─ B2: time/randomness
│  └─ L3: seed 0 and 42 -> both fail in suite, pass alone -> time/random not the axis
└─ B3: leaked row from an earlier test
   ├─ L4: `pytest test_a test_orders` -> fails; `pytest test_orders test_a` -> passes
   └─ L5: after test_a, orders has 1 extra row (query output)
```
UP: B3 leaf L4 pinpoints test_a; L2 explains the mechanism (no reset between tests);
B2 excluded. Fix = function-scoped fixture or explicit cleanup in test_a. Verify:
full suite green; single test still green. Regression = run both orders in CI.
Supports: rule 2 (falsifiable hypotheses), rule 3, rule 6, flaky protocol.

## G3 - Works locally, fails in CI
Task: "CI fails on `SyntaxError` in a file that runs locally."
```
ROOT: cause of CI-only SyntaxError -> cause + fix + CI verify.
├─ B1: versions/runtime
│  ├─ L1: local python 3.12.2; CI image python:3.9 (ci.yml:14) (read)
│  └─ L2: failing line uses `X | None` (PEP 604) -> 3.10+ only (file:line)
├─ B2: environment/config
│  └─ L3: CI env dump: same paths, no locale issue (log)
└─ B3: partial checkout/stale cache
   └─ L4: CI log shows fresh checkout of commit hash (matches local)
```
UP: L1+L2 explain the whole symptom (local ok, CI fails, exact error). B2/B3 dead.
Fix = require-python >=3.10 in pyproject + CI image 3.12, or rewrite the annotation.
Verify = re-run CI job; regression = keep the 3.12 job that would have caught it.
Supports: rule 2 (dependency branch), rule 6 (whole-symptom test).

## X1 - Guessed cause, no evidence
Task: "API returns 500 sometimes."
Bad: "Probably a race condition. Add a lock around the handler." No repro command, no
log, no hypothesis killed, no leaf. The first plausible branch won.
Failure: rule 2, rule 4. Fix: quantify the flake, then branches (DB timeout, lock
contention, deploy overlap) with a leaf each.

## X2 - Suppressed the symptom
Task: "`KeyError: 'currency'` in prod."
Bad: wrap the read in `try/except KeyError: currency = "USD"`. Checkout goes green; the
missing prod configuration is still missing, and all USD/EUR carts are now mispriced.
Failure: rule 5, rule 6. Fix: prove the config hypothesis (G1), fix the value, keep the
default only as a documented fallback with a warning log.

## X3 - Fixed a different error than the symptom
Task: "Feature X fails for user A."
Bad: while debugging, the model finds and fixes an unrelated warning, sees tests pass,
and declares X fixed. No repro of X, no admin/user A path exercised.
Failure: rule 1, rule 4, rule 5. Fix: reproduce X for user A first, then apply the
hypothesis/evidence cycle; only after the repro passes may the answer claim a fix.
