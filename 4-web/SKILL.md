---
name: web-reasoning
description: Root-branch-leaf reasoning for building or changing web pages and apps (frontend, backend, full-stack): user-goal root with named flows, branches for UI/layout, data+state, API/backend, auth+security, performance, accessibility, deployment, leaves as checkable components/routes/queries/policies, then a full user-flow walk plus an attacker walk and a tree-json block. Trigger on "build / add / fix a page, form, flow, route, API, login, signup, checkout, dashboard, list view", on loading/error/empty-state work, and on reviews of auth, sessions or data exposure. Do NOT use for copy-only or static content edits, styling-only tweaks with a known target, or non-web code (use code-reasoning).
---

# Web Reasoning (user goal -> checkable web parts -> flow walk)

Base shape, leaf rules, UP pass and `tree-json` output: `general-reasoning`
(`1-general/SKILL.md`); this skill adds the user-goal root and the web branch set.

## Purpose
Deliver a flow that works for real users and fails safely, each part checked in a real
browser or a real request.

## When to use
- New page, flow, route, API used by a UI, auth behavior, or a change to any of these.
- NOT for: copy-only edits, static HTML with no logic, non-web code.

## Procedure
1. ROOT: the user's goal in one sentence ("a new user can create an account and reach
   the dashboard"), the flows in scope, and the done-definition. Unstated product
   decisions -> `ASSUMPTION:` lines.
2. BRANCHES: choose 3-4 by risk from UI/layout, data+state, API/backend,
   auth+security, performance, accessibility, deployment. Per-branch leaf shapes:
   `references/web-branches.md`.
3. LEAVES: named component/route/query/policy plus how it is checked: viewport render,
   Network tab request, curl with/without token, keyboard walk, Lighthouse number.
4. DOWN: mobile-first layout, then states, then data wiring, then backend, then
   security hardening.
5. STATES pass: every data surface has loading, error, empty, success (+ partial when
   paginated). A missing state is a missing leaf, not a follow-up.
6. UP: walk the full flow as a new user, entry to goal, on a 375px viewport - each step
   works, no dead end, refresh/back do not break state; then walk it as an attacker: no
   client-trusted input, no unauthorized route, no leaked field.
7. REPORT: routes/files changed, the manual walk result, security leaves attempted and
   their results, a11y/perf numbers, untested items.
8. EMIT the `tree-json` block with `domain: "web"`: root = user goal, branches = chosen
   branches, leaves = components/routes/policies with their result, `reverse_check` =
   the flow walk, the attacker walk and each state check.

## Reverse check (web additions)
Does the flow complete end to end in a real browser? Are loading/error/empty/success all
observable? Is every input validated server-side at the trust boundary (client
validation is UX only)? Is authorization enforced per route on the server? Is any secret
or unneeded field exposed to the client or logs? Does it survive refresh/back/double-submit?

## Rules
1. Root is the user's goal with the flows named; checkable done-definition. [G1][X2]
2. Mobile-first: build the 375px layout before desktop. [G1][X2]
3. Every data surface has loading, error, empty (and success) states. [G2][X1]
4. Never trust client input; validate and authorize server-side, per route/resource -
   hiding UI is not authorization. [G3][X1][X3]
5. No secrets in the client bundle; return only the fields the UI needs. [X3]
6. Walk the whole user flow in a browser and report the security leaves: what was
   attempted, what was rejected. [G1][X2][G3]

## Common mistakes
- Happy path only; loading/error/empty states missing (X1).
- Client-side validation treated as validation; the API accepts anything (X1).
- Hiding a button instead of checking permission on the server (X3).
- API returns the whole row; internal fields leak to the client (X3).
- Flow never walked in a browser; auth redirect cases (deep link, expired session,
  back button) untested (X2).

## Output (tree-json)
`domain: "web"`. Leaves name a route/component/policy and carry the observed result as
`evidence` (`curl ... -> 403`, `375px render ok`, `Lighthouse LCP 1.9s`). A missing
state or unrun probe is an `unverified` leaf, never a silent omission. Schema:
`../tree.schema.json`; rules: `../1-general/references/tree-format.md`.

## Compact example (indented tree) + tree-json
Task: saved-items page for logged-in users.
```
ROOT: a logged-in user can view and remove saved items -> page + route + checks.
├─ B1: UI/states
│  ├─ L1: 375px render shows list and reachable remove button
│  └─ L2: loading skeleton, error retry, empty text observed
├─ B2: data/API
│  ├─ L3: GET /api/saved returns items[] only (no internal fields)
│  └─ L4: DELETE /api/saved/:id -> 204; repeat -> 404
└─ B3: auth/security
   └─ L5: no token -> 401; other user's id -> 404 (not 200)
UP: logged-in walk ok; logged-out deep link returns after login; refresh keeps state.
```
```tree-json
{"version":1,"domain":"web","title":"Saved-items page (logged-in users)",
 "root":{"id":"r","text":"a logged-in user can view and remove saved items","children":[
  {"id":"b1","text":"UI and states","children":[
    {"id":"b1-l1","text":"375px: list visible, remove button reachable","evidence":"manual render at 375px, screenshot","status":"verified"},
    {"id":"b1-l2","text":"loading, error, empty states all observable","evidence":"throttled network + forced 500 + 0-row account","status":"verified"}]},
  {"id":"b2","text":"data and API","children":[
    {"id":"b2-l1","text":"GET /api/saved returns items[] only","evidence":"curl -s /api/saved -> {items:[{id,title,url}]}","status":"verified"},
    {"id":"b2-l2","text":"DELETE is idempotent-safe","evidence":"curl -X DELETE -> 204; repeat -> 404","status":"verified"}]},
  {"id":"b3","text":"auth and security","children":[
    {"id":"b3-l1","text":"unauthenticated and cross-user access blocked","evidence":"curl no token -> 401; other user's id -> 404","status":"verified"}]}]},
 "reverse_check":[
  {"target":"b2-l1","question":"does the response leak internal fields?","result":"pass","note":"body inspected, 3 fields only"},
  {"target":"b3-l1","question":"is authorization enforced server-side, not by hiding UI?","result":"pass","note":"curl bypasses UI and is rejected"},
  {"target":"b1-l2","question":"does every data surface handle loading/error/empty?","result":"pass","note":"all three observed manually"}],
 "conclusion":"Page shipped: flow walked at 375px, states observed, authz and field exposure checked by curl."}
```
