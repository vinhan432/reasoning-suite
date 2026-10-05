# Good examples (general reasoning)

Each example: task -> tree -> UP result -> answer. The "supports" line ties it to the
rules in `SKILL.md` (reverse analysis: rule <- observed step).

## G1 - Decision under a latency budget
Task: "Pick Redis or an in-process dict for our rate limiter. p99 budget 40ms."
```
ROOT: choose the rate-limit store -> output: choice + 3 reasons.
├─ B1: latency of each option
│  ├─ L1: bench.py dict -> p99 0.3ms
│  └─ L2: bench.py redis(local) -> p99 1.8ms
├─ B2: operational cost for a 1-person team
│  ├─ L3: k8s/redis.yaml does not exist -> +1 deploy unit, failover config
│  └─ L4: config/features.yaml already carries 1 flag pattern (2 files, 6 lines)
└─ B3: correctness under rollout
   ├─ L5: test_ratelimit.py -> 8 passed against dict
   └─ L6: redis path skips TTL test -> gap found in UP
```
UP: L6 leaves B3 incomplete -> fix B3 (add TTL test for redis), re-run, re-check.
Answer: dict. Reasons: B1 both pass the budget; B2 far cheaper; B3 verified by 9 tests.
Supports: rule 1 (named output), rule 2, rule 4 (UP before answer), leaf types
(command+output, measurement, missing-file check).

## G2 - Plan with rollback
Task: "Plan the Postgres 13 -> 16 upgrade for a 3-day window."
```
ROOT: give an upgrade plan with rollback -> output: ordered steps + rollback point.
├─ B1: incompatibilities that force work before the window
│  ├─ L1: pg_upgrade --check on copy -> 2 issues (cite output)
│  └─ L2: app SQL: 1 use of removed syntax -> src/db/queries.py:88
├─ B2: rollback feasibility
│  ├─ L3: ASSUMPTION: no upgrade-after data written during window (unverified)
│  └─ L4: 200GB dump time measured -> 41min restore (log)
└─ B3: verification after cutover
   ├─ L5: row counts per top-5 table captured pre/post (script output)
   └─ L6: app smoke suite -> 12 passed
```
UP: L3 is decisive for B2 and unverified -> add branch B4 "validate assumption: writes
blocked?" (bounded, cheap) instead of guessing. After that, branches cover the root.
Answer: plan with a named rollback point, the 2 pre-window fixes, and the note "rollback
is safe ONLY if writes are blocked; verify before cutover".
Supports: rule 6 (assumption labelled), rule 8 (UP audit line printed), rule 5.

## G3 - Is this page fast enough?
Task: "Does the product page meet a 2.5s LCP budget on a mid-range phone?"
```
ROOT: pass/fail against 2.5s LCP -> output: verdict + the measuring leaf.
├─ B1: what the measured LCP is now
│  ├─ L1: Lighthouse mobile run -> LCP 3.9s (report path)
│  └─ L2: 689KB JS in the critical path (coverage report)
├─ B2: which part dominates
│  ├─ L3: hero image 1.4MB, no width/height (index.html:31)
│  └─ L4: 3 blocking scripts in <head> (index.html:8-10)
└─ B3: what a cheap fix buys
   └─ L5: after deferring scripts + sizing hero on a branch -> 2.1s (re-run)
```
UP: B1/B2/B3 answer the root; L5 is post-change evidence -> verdict is conditional on
the change being applied, state it that way.
Answer: FAIL now (3.9s, L1); two dominant leaves (L3, L4); a tested fix reaches 2.1s
(L5), still needs a re-run on the real deploy target.
Supports: rule 3 (every leaf measurable), rule 5 (fix verified in its own branch).

## G4 - Why did support tickets double?
Task: "Tickets went from 40/day to 85/day after Tuesday. Explain."
```
ROOT: explain the ticket increase -> output: cause + evidence + confidence.
├─ B1: is the increase real or measured differently?
│  ├─ L1: raw ticket export, same query -> 41 -> 84/day (artifact)
│  └─ L2: no schema/dashboard change (form diff empty)
├─ B2: what changed on Tuesday
│  ├─ L3: deploy 2026-09-29 shipped v2.31 -> status page + 42 tickets mention login
│  └─ L4: 61/84 tickets contain "login" -> tag counts (script output)
└─ B3: alternative causes
   ├─ L5: signup spike? daily active users flat -> analytics export 12.1k -> 12.0k
   └─ L6: new mobile OS release that day? release calendar -> none
```
UP: B3 kills the alternatives, so B2 is not just the first plausible branch; B1 rules
out measurement drift; the remaining leaf set supports the root without contradiction.
Answer: cause = v2.31 login regression (61/84 tickets, L4); alternatives excluded
(L5, L6); confidence high; next check = canary log for login errors.
Supports: rule 2 (independent branches, alternatives branch), common-mistake
"stopping at the first plausible branch".
