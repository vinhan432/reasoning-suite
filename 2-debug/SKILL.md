---
name: debug-reasoning
description: Root-branch-leaf debugging for errors, failures and wrong behavior in code, tests, builds or services: reproduce the exact symptom, form falsifiable cause hypotheses (environment/config, input data, logic, dependencies/versions, concurrency/timing), verify each with real evidence, fix the cause, confirm by re-run, then emit a tree-json block. Trigger on a stack trace, error text, failing test, crash, hang, wrong output, flake, "passes alone but fails in the suite", "works locally, fails on CI", "worked yesterday, not today", or a regression with an unknown cause. Do NOT use when the cause is already proven and only the known fix must be applied, for code explanation, or for behavior-preserving refactors.
---

# Debug Reasoning (symptom -> hypotheses -> evidence -> fix)

Base shape, leaf rules, UP pass and `tree-json` output: `general-reasoning`
(`1-general/SKILL.md`); this skill adds the debug root and hypothesis branches.

## Purpose
Find the cause of a failure with evidence, fix the cause, prove the fix.

## When to use
- An error, failing test, wrong output, crash, hang, flake or regression whose cause is
  unknown.
- NOT for: applying a known fix, explaining code, refactors.

## Procedure
1. ROOT: the symptom exactly - error text, command, expected vs actual, when it
   started, reproducibility (always / N of M). Output = cause + fix + verify command.
2. REPRODUCE: smallest command + full output. No fix attempts before a repro exists.
   No repro yet -> branch B1 = "find a repro" (flake protocol in the reference).
3. BRANCHES: 2-4 cause hypotheses from environment/config, input data, logic,
   dependencies/versions, concurrency/timing. Name the killing evidence in advance.
4. LEAVES: one evidence item per hypothesis: exact log line, minimal repro, test
   result, diff, version string. Assumption-only leaves are labelled `ASSUMPTION`.
5. KILL/SURVIVE: kill hypotheses with evidence. All dead -> add a hypothesis branch.
   Survivor that does not explain the WHOLE symptom -> back to step 3, do not fix.
6. FIX the cause: one change at a time, smallest diff. Re-run the repro -> must pass.
7. REGRESSION: keep the smallest check that failed before and passes after; re-run the
   previous behavior path for side effects.
8. EMIT the `tree-json` block with `domain: "debug"`. A killed hypothesis is written
   as a `verified` finding ("B2 is dead: log 118 shows the field"), never as a failed
   leaf - `failed` means a check that failed (e.g. the fix did not clear the repro) and
   it blocks the READY verdict.

## Reverse check (debug additions)
- Does the fix explain the ORIGINAL symptom completely - every observed detail, not
  just the repro? Partial explanation -> wrong or incomplete cause.
- Could it create a new bug? Check other callers/inputs of the changed code.
- Confirmed by a re-run of the repro and covered by a regression check?
- Was the symptom suppressed instead of fixed (broad `except`, retries, `|| true`,
  skipped test, longer timeout)? That is a fail.

## Rules
1. Reproduce before diagnosing; the repro command goes in the answer. [G1][X3]
2. Each hypothesis is falsifiable and gets its own evidence leaf. [G2][X1]
3. One change at a time; after each change re-run the repro. [G2][X2]
4. No fix without evidence; "likely" is not evidence. [X1][X3]
5. Fix the cause, not the symptom; never suppress to go green. [X2]
6. The fix must explain every detail of the original symptom. [G3][X3]
7. Add the regression check in the same change as the fix.
8. All hypotheses dead -> add a hypothesis; do not widen the fix.

## Common mistakes
- Editing code before having a repro (X3).
- Guessing a cause from the error text; the first plausible hypothesis wins (X1).
- `try/except` or retries around the failing line: symptom hidden, cause alive (X2).
- Fixing a different error found on the way and declaring the original fixed (X3).
- Changing several things at once, so the result proves nothing (X2).

## Output (tree-json)
`domain: "debug"`. Root = the symptom; branches = hypotheses; leaves = evidence with
`status`: `verified` = the statement is established (a killed hypothesis is written as a
verified finding), `unverified` = still open, `failed` = a check failed. `reverse_check`
entries answer the four checks above, typically `target` = the surviving hypothesis and
its fix leaf. Schema and rules: `../tree.schema.json`,
`../1-general/references/tree-format.md`.

## Compact example (indented tree) + tree-json
Task: prod-only `KeyError: 'currency'` at checkout.
```
ROOT: cause + fix for KeyError 'currency' (prod checkout) -> cause + diff + verify cmd.
├─ B1: environment/config
│  ├─ L1: prod env dump lacks CURRENCY; .env.example:7 defines it
│  └─ L2: docker-compose.yml:22 env_file: .env.prod
├─ B2: input data
│  └─ L3: B2 is dead - cart log line 118 carries "currency":"EUR"
└─ B3: logic
   └─ L4: settings.py:14 os.environ["CURRENCY"], no default
UP: L1+L4 explain prod-only failure and the exact key; fix = default + explicit env
value; verify = repro with empty CURRENCY, then checkout; regression = test_settings.
```
```tree-json
{"version":1,"domain":"debug","title":"Prod-only KeyError 'currency' in checkout",
 "root":{"id":"r","text":"find the cause of KeyError 'currency' at prod checkout and fix it","children":[
  {"id":"b1","text":"environment/config missing the value","children":[
    {"id":"b1-l1","text":"prod env lacks CURRENCY; .env.example:7 has it","evidence":"prod env dump diff","status":"verified"}]},
  {"id":"b2","text":"input data missing the field","children":[
    {"id":"b2-l1","text":"B2 is dead: cart payload carries currency=EUR","evidence":"log line 118","status":"verified"}]},
  {"id":"b3","text":"code path has no default","children":[
    {"id":"b3-l1","text":"settings.py:14 hard-indexes the env var","evidence":"settings.py:14 (read)","status":"verified"},
    {"id":"b3-l2","text":"fix verified by repro + regression test","evidence":"repro with empty CURRENCY fails before, passes after; test_settings passes","status":"verified"}]}]},
 "reverse_check":[
  {"target":"b1","question":"does the config difference explain prod-only failure?","result":"pass","note":"only prod lacks the key"},
  {"target":"b2","question":"does the input hypothesis survive?","result":"pass","note":"killed by log line 118; leaf records the verified finding"},
  {"target":"b3","question":"does the fix explain the whole symptom and risk nothing new?","result":"pass","note":"default + explicit env value, re-run green"}],
 "conclusion":"Missing prod env var read through a hard index; add default and set CURRENCY, regression test added."}
```
