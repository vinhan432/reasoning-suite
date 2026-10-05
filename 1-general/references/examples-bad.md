# Bad examples (general reasoning)

Each shows the exact skipped step and the failure pattern it feeds into "Common
mistakes" in `SKILL.md`. Reverse analysis: mistake <- observed failure.

## X1 - No root, no named output (scope drift)
Task: "We might move off the old CMS. Thoughts?"
Bad output: 900 words on CMS history, vendors, "it depends", ending with "keeping it
may be fine, but migrating has advantages".
Failure: no root sentence, no output named -> no branch can be judged sufficient, and
the text drifts to whatever is easy.
Fix: `ROOT: decide in/out for the CMS -> output: recommendation + 3 reasons + the one
check that would flip it.` Then 2-4 branches (content volume, migration cost, SEO/URL
risk), each with real leaves.
Feeds mistake/rule: rule 1, "answer written first".

## X2 - Branches as steps, no UP pass
Task: "Add SSO to our internal tool." (analysis requested, not coding)
Bad output:
```
1. read the auth code
2. add oauth lib
3. wire the login button
4. done
```
Failure: these are ordered steps, not independent sub-problems; no branch covers
"who can log in afterwards" or "what happens to existing sessions". Nothing was
verified, and the root (should we, and how) is unanswered.
Fix: branches = identity provider fit, session/existing-user impact, security
(domain restriction, token storage), rollout/rollback. Leaves = config quote, test
result, curl result.
Feeds mistake/rule: rule 2, "branches that are steps".

## X3 - Opinion leaves, then patching the conclusion
Task: "Should we shard the orders table?"
Bad output: conclusion "yes, shard now (perf)" with leaves
`L1: sharding is faster`, `L2: the table is probably big`, `L3: ops can handle it`.
UP "passes" because the conclusion is re-read, not the leaves.
Failure: three opinion leaves; no measurement, no row count, no query plan; when
someone notes the table is 4GB and p99 is 30ms, the model edits L2 to "4GB is large
enough" to keep the answer.
Fix: L1 -> `EXPLAIN ANALYZE top query -> 30ms, seq scan 4GB (output)`; L2 -> row count
+ growth/quarter (query); L3 -> ops leaf: existing partition maintenance in
k8s/cron/ (file quote). Likely outcome: do NOT shard yet.
Feeds mistake/rule: rule 3, rule 4, rule 6.
