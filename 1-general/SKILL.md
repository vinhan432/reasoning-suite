---
name: general-reasoning
description: Root-branch-leaf reasoning with a mandatory upward (reverse) verification pass and a tree-json output block, for complex multi-step problems: planning, analysis, comparison, decisions with tradeoffs, designs, estimates, investigations, or any task with 2+ constraints where being wrong is expensive. Trigger on prompts like "which should we choose", "plan X", "why did Y happen", "is this good enough", "compare A and B", "should we do X or wait", or any multi-part ask. Do NOT use for single-step lookups, factual recall, definitions, one-line or mechanical edits, or pure reformatting and summarizing.
---

# General Reasoning (root -> branch -> leaf)

## Purpose
Turn a hard problem into a small tree, prove the tree, then write the answer.
DOWN = decompose, UP = verify. The answer is written only after UP passes.

## When to use
- 2+ constraints, 2+ steps, or a decision with tradeoffs.
- Planning, analysis, comparison, design, investigation, estimate, explanation of a
  surprising observation.
- Skip and answer directly when one tool call or one known fact settles it.

## Procedure
1. ROOT: restate the problem in ONE sentence and name the exact output. Ambiguity ->
   an explicit `ASSUMPTION:` line. Two different goals -> two runs.
2. BRANCHES: 2-4 independent sub-problems that together answer the root.
   Independence: can branch A be answered without branch B? Sufficiency: if every
   branch is answered, is the root answered? Ordered steps are not branches.
3. LEAVES: per branch, the smallest verifiable conclusion: command output, test
   result, `file:line`, measurement, config/doc quote, or a labelled `ASSUMPTION`.
   Opinions, branch restatements and unfalsifiable claims are not leaves.
4. DOWN: first write what evidence WOULD settle each branch, then collect the real
   evidence. No placeholder leaf may survive into the UP pass.
5. UP (reverse check): per leaf - a fact with a named source? per branch - does it
   answer a named part of the root? whole tree - anything missing, redundant or
   contradicting? Contradictions are resolved at the weaker leaf, never averaged.
6. LOOP: on failure, fix the FAULTY BRANCH (new evidence, leaf or branch), then re-run
   UP from there. Never patch the conclusion, never reshape a leaf to keep a
   preferred answer.
7. WRITE: root answer, then 2-4 decisive leaves, then open assumptions/risks.
8. EMIT: one `tree-json` block (see Output) after the prose answer.

## Reverse check
Order: leaf -> branch -> root -> conflict with your preferred answer. Checklist,
loop-back procedure and stop conditions: `references/reverse-check.md`. Open it when UP
finds any failure, or when the tree has 3+ branches.

## Rules
1. One root sentence with the required output named. [G1][X1]
2. 2-4 independent, jointly sufficient branches. [G1][G2][X2]
3. Every leaf verifiable with a named source; no opinion leaves. [G3][X3]
4. No conclusion before UP passes; no patching the conclusion. [X2][X3]
5. Fix at the faulty branch, then re-run UP from there. [G4][X3]
6. Gaps are labelled `ASSUMPTION`, never silently filled. [G2][X3]
7. Default 3 branches; 5+ means you listed steps, not sub-problems.
8. Print the UP audit line so a skipped check is visible. [G2]

## Common mistakes
- Steps as branches ("read file", "edit file").
- Opinion leaves ("performance is fine") instead of measurements.
- Answer first, tree built afterwards to justify it.
- UP pass that re-reads the conclusion instead of the leaves.
- Stopping at the first plausible branch; ignoring a contradicting branch.
- Two loop-backs with no change: restate the ROOT, do not loop forever.

## Output (tree-json)
After the prose answer, emit ONE fenced block tagged `tree-json`:
`version`, `domain`, `title`, `root` (nodes: `id`, `text`; leaves also `evidence` +
`status`), `reverse_check` (`target`, `question`, `result`, `note`), `conclusion`.
Rules: every leaf carries `evidence` and `status`; max 4 children per node; root and
branch status are computed by the renderer, never stored; `conclusion` stays empty
while any check is `fail` or `gap`. Full rules and error table:
`references/tree-format.md`; schema: `../tree.schema.json`.

## Compact example (indented tree)
Task: "Ship the CSV export behind a feature flag?"
```
ROOT: decide flag vs direct release for the CSV export -> output: decision + 3 reasons.
├─ B1: blast radius if the export is wrong
│  └─ L1: export reads only, never writes -> src/export.py:41 (read)
└─ B2: cost of the flag
   └─ L2: flag = 1 config row + 1 route guard -> 2 files, 6 lines
UP: L1 supports B1, L2 supports B2, B1+B2 answer the root, no conflict -> write it.
```
Same tree as `tree-json`:
```tree-json
{"version":1,"domain":"general","title":"CSV export: flag or direct release",
 "root":{"id":"r","text":"decide flag vs direct release for the CSV export","children":[
  {"id":"b1","text":"blast radius if the export is wrong","children":[
    {"id":"b1-l1","text":"export reads only, never writes","evidence":"src/export.py:41 (no INSERT/UPDATE)","status":"verified"}]},
  {"id":"b2","text":"cost of the flag","children":[
    {"id":"b2-l1","text":"flag costs 2 files, 6 lines","evidence":"config/features.yaml + route guard diff","status":"verified"}]}]},
 "reverse_check":[
  {"target":"b1","question":"does the leaf prove there are no writes?","result":"pass","note":"code read"},
  {"target":"b2","question":"is the flag cost complete?","result":"pass","note":"diff measured"}],
 "conclusion":"Ship behind the flag: reversible, 6 lines, no persistence risk."}
```
