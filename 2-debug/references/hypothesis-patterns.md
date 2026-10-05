# Hypothesis Patterns (debug)

Open this at step 3 of `SKILL.md` to pick branches, and at step 5 when a hypothesis
survives but the symptom is not fully explained. Readable independently.

## The five hypothesis classes

| Class | Typical probes | Evidence leaf shape | Fast falsifier |
|-------|----------------|---------------------|----------------|
| Environment/config | diff dev vs prod env, flags, secrets, paths, cwd, locale, clock | `env` dump line, config quote, `print` of resolved value | run the repro with the other env |
| Input data | dump the real payload/row/file that triggers it | log line, fixture file, failing row id | feed a known-good input |
| Logic | read the exact branch; trace values | `file:line` + actual value at that point | unit test the function directly |
| Dependencies/versions | lockfiles, runtime versions, CI image | version strings from both environments | pin to the other version, re-run |
| Concurrency/timing | ordering, shared state, sleeps, parallel tests | run N times: N-1 pass, 1 fail (+ seed/order) | force serial order, fixed seed |

Rule: each hypothesis must name, in advance, the evidence that would kill it. A
hypothesis with no falsifier is an opinion and must be rejected.

## Protocol: works locally, fails in CI/prod
1. List differences: OS image, versions, env vars, cwd, time, network, data.
2. Assign each difference to a class above; keep the 2-4 with a plausible mechanism.
3. Kill cheaply first: version strings, env dump, data sample. Cheapest leaf wins.

## Protocol: flaky / intermittent
1. Quantify: "fails 3 of 10 runs", with the command. Unquantified flakes are untestable.
2. Same-order vs random-order run. Ordering fails -> shared-state hypothesis
   (concurrency/timing or test isolation).
3. Log the seed / captured order for every failing run; a leaf must reproduce the failure.
4. Fixes that only reduce frequency (sleeps, retries, more timeout) are symptom
   suppression: FAIL unless the timing hypothesis itself is proven and the sleep is the
   documented contract.

## Protocol: bisect
- Repo regression: `git bisect` with the repro command; leaf = the first bad commit
  hash plus the diff hunk that causes it.
- Dependency regression: downgrade one package at a time; leaf = version pair
  (before/after) with repro output for each.

## Test: does the fix explain the WHOLE symptom?
Ask for every detail in the ROOT line (error text, expected vs actual, when it started,
reproducibility rate, which environments fail):
- Which leaf of the surviving hypothesis explains this detail?
- A detail with no explaining leaf -> the cause is incomplete: keep hunting. Do not fix.
This test is what separates a real cause from "the error no longer appears".

## Test: could the fix create a new bug?
- List every caller / input of the changed code (search the symbol).
- Re-run the previous behavior path and any test touching that code.
- Prefer the smallest change: a default value or a guard, not a rewrite.

## One-change log (keep in the working notes)
```
change 1: <diff/commit> -> repro: still fails (same error)
change 2: <diff/commit> -> repro: passes -> regression test added: <name>
```
No log -> steps were skipped or batched, and the result proves nothing.
