# Upward Verification (reverse check)

Run before writing any final answer. Open this whenever UP finds a failure, the tree
has 3+ branches, or the first answer feels convenient.

## Level 1: leaf -> branch (per leaf)
- Is it a fact or a result, not an opinion? If not, replace it.
- Has it a nameable source (file, command, URL, run id)? If not, it is an
  `ASSUMPTION`; label it, and add a branch "validate assumption" if it is decisive.
- Does it bear on THIS branch? Off-branch evidence: delete or move under its branch.
- Is it stale after later edits? Re-run and re-read after every change.

## Level 2: branch -> root
- Restate the branch as "this branch answers: <part of root>". Cannot -> delete it.
- Any part of the root unclaimed by all branches? A branch is missing: add it (max 4)
  and fill real leaves.
- Two branches yield the same leaf? Merge; redundancy hides contradictions.
- Two branches contradict? Do not average. Find the weaker evidence, re-verify it,
  then compare.

## Level 3: conflicts with the preferred answer
- If strong evidence points against your first intuition, follow the evidence.
  Rewriting a leaf so the conclusion survives is forbidden.
- A fix is valid only if the repaired tree still answers the ORIGINAL root question.
  Patching the conclusion in place is forbidden.

## Loop-back procedure
1. Name the faulty branch (e.g. "B3: correctness evidence").
2. Say what is wrong: missing leaf, weak leaf, or contradicting leaf.
3. Replace the leaf or add evidence.
4. Re-run level 1 and level 2 for that branch and for any branch sharing its evidence.
5. Write the conclusion only after a clean pass.

## Stop conditions
- Two loop-backs change nothing -> the ROOT is mistated; restate it and rebuild.
- A leaf is unobtainable with available tools -> mark it `UNVERIFIED`, make the answer
  conditional ("decision if X holds"), and name the missing check.
- Cap: 3 shape changes (branch added/dropped) per run. Past that, report the tree and
  the blocker instead of guessing.

## Audit line
Append under every non-trivial answer:
```
UP: L1<->B1 ok | L2<->B1 ok | B1-B3 cover root | conflict: none | assumptions: 1
```
A missing line means the UP pass was skipped.
