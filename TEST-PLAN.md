# Test Plan - reasoning-suite

Purpose: verify each skill activates at the right time, and that when it activates the
reasoning shape (root -> branches -> leaves -> UP) actually appears in the output.

## Harness rules
1. One skill installed per session (`1-general` alone, then `2-debug` alone, ...).
   A second skill installed changes the trigger decision.
2. Fresh session per prompt, empty conversation, no repo contents pre-loaded.
3. Run each prompt 3 times. Trigger must be 3/3 for trigger prompts (2/3 = DEFECT),
   and 0/3 for non-trigger prompts (1/3 = DEFECT).
4. Judge on observable artifacts, never on style: is there a root sentence with a named
   output? are there 2-4 branches? is each leaf a fact with a source? does the UP check
   appear (or its loop-back) before the answer?
5. Never accept a correct final answer as proof the procedure ran: a lucky answer with
   no leaves scores 0 on procedure.
6. Ground truth for "verifiable leaf": a second person could re-run or re-read it and
   get the same result, using only what the prompt and tools provide.

## Scoring sheet (per run)
| Dimension | 0 | 2 | 4 |
|---|---|---|---|
| Activation | wrong skill / none when required | activated but after a wrong start | activated first, correct |
| Root | no root or output unnamed | root present, output vague | one sentence + named output (or split + ASSUMPTION) |
| Branches | steps, or 5+ | 2-4 but overlapping or one part of root unclaimed | 2-4, independent, jointly sufficient |
| Leaves | opinions ("likely", "should be fine") | mixed: some facts, some opinions | every leaf a fact with a named source, opinions labelled ASSUMPTION |
| UP pass | absent; answer first | mentioned, not applied to leaves | applied per branch, audit line printed, loop-back used on a real gap |
| Discipline | suppressed / unrequested work / patched conclusion | one slip | no suppression, nothing unrequested, fixes at the faulty branch |

Pass bar per prompt: >= 20/24 and no 0 in Activation or Leaves.

---

# 1-general (`general-reasoning`)

## E1 - easy: pick a retry library
Install: `general-reasoning` only.
Prompt (verbatim):
```
Repo: tools/notify-cli (Node 20, TypeScript, esbuild bundle, currently ZERO runtime deps).
Team: 1 person. Budget: ~2 hours.
Task: the CLI POSTs to /notify and we need retry on 5xx with exponential backoff.
Constraint: no new transitive dependencies in the bundle - the CLI ships to customers
as a single file and we audit everything in it.
Question: use p-retry, use async-retry, or write ~30 lines ourselves?
Give me the decision and the reasoning.
```
Traps:
- The shallow answer is "both libraries work". Pass requires leaves that actually
  distinguish the options (dependency tree, API fit) and naming the one check that would
  flip the decision.
- "No new transitive deps" is the constraint most likely to be dropped.
Expected: activated 3/3; ROOT names output = decision + 3 reasons (+ the flip check);
branches ~ dependents/dependency weight, API fit (test/teardown control), maintenance
(commit activity, issue age); leaves cite package.json / lockfile contents / README
lines, not impressions; UP line printed.
Pass checks:
- C1 Root sentence contains "decision" and the required 3 reasons.
- C2 At least one leaf is a concrete dependency-tree or file-content observation.
- C3 At least one leaf covers the zero-deps constraint from the prompt.
- C4 Answer states the check that would flip the recommendation.
Fail patterns: answer "they are all fine, pick p-retry" with no leaf; ignoring the
bundle constraint; listing 5+ "branches" that are really implementation steps.
Variants that MUST still trigger: "which of these three should we ship, and why";
"we ship one file to customers, does either library break that".
Variants that MUST NOT trigger: "rename retry() to withRetry()" (mechanical);
"what is exponential backoff" (definition).

## H1 - hard: two goals in one prompt
Install: `general-reasoning` only.
Prompt (verbatim):
```
Support tickets went from 40/day to 85/day starting Tuesday 2026-09-29.
We deployed v2.31 that afternoon (login/session changes only). The support dashboard
was NOT changed. Daily active users: 12.1k -> 12.0k over the same period.
We are a 1-person on-call. No paging tooling today; if this is an incident I have to
decide tonight whether to wake people up and roll back, or wait for morning.
Tell me why this happened and what I should do tonight.
```
Traps:
- Two goals in one prompt (explain + decide). Rule 1: one sentence per root, two goals
  -> either split into two runs or one root with both parts in the named output.
- The "first plausible branch" (v2.31) must not be accepted without an alternatives
  branch; the deploy history must not be treated as proof.
- The decision must stay conditional while any leaf is UNVERIFIED.
Expected: activated 3/3; alternatives branch present; quantitative leaves (ticket tag
counts, DAU numbers, deploy timestamp); confidence stated; the tonight-decision derived
from leaves, not from vibe.
Pass checks:
- C1 Root handles the two goals explicitly (split or named two-part output).
- C2 At least one branch is "is the increase real / measured differently".
- C3 At least one branch kills an alternative cause.
- C4 Decision is conditional on a named check if any leaf is unverified.
- C5 UP audit line printed; any gap triggers a visible loop-back.
Fail patterns: single-cause narrative starting and ending with v2.31; "page the team"
with no leaf tie-in; 5+ branches; mixing explanation and decision into one answer
sentence per paragraph.
Variants that MUST still trigger: "was Tuesday's deploy the cause? and do we roll back";
"explain the spike, then give me a go/no-go".
Variants that MUST NOT trigger: "summarize this ticket export" (pure formatting);
"what does v2.31 change" (lookup).

## N1 - non-trigger: reformat JSON
Install: `general-reasoning` only.
Prompt (verbatim):
```
Reformat this JSON to 2-space indent and keep the key order:
{"b":1,"a":[2,3],"c":{"d":true}}
Output only the JSON, no commentary.
```
Expected: NOT activated. One mechanical transform, no constraints, no tradeoff.
Pass checks: no tree, no branch list, no UP line, no "let me decompose"; output is the
reformatted JSON only (key order preserved).
Fail patterns to catch: any decomposition preamble; any question back to the user;
reordering keys.
Variants that MUST NOT trigger: "sort these 50 strings alphabetically";
"convert this CSV to TSV".

---

# 2-debug (`debug-reasoning`)

## E2 - easy: one exact traceback
Install: `debug-reasoning` only.
Prompt (verbatim):
```
Command: python -m app.worker --job sync
Result: TypeError: cannot unpack non-sequence NoneType
Traceback (most recent call last):
  File "app/worker.py", line 88, in run_job
    payload, meta = load_config(job.name)
  File "app/config.py", line 31, in load_config
    return CACHE[name]
Versions: python 3.11.6, app 4.2.0. Same command worked yesterday.
Expected: the job starts and syncs.
app/config.py:
  28 def load_config(name):
  29     if name in CACHE and not _stale(name):
  30         return CACHE[name]
  31     return CACHE.get(name)          # line 31
```
Traps:
- The traceback points at line 31 in the pasted source, but the message comes from
  unpacking `None` at worker.py:88 - the model must not "fix" the quoted line blindly.
- "worked yesterday" is a time-based detail that belongs in the root, not ignored.
Expected: activated 3/3; ROOT copies the exact symptom + expected vs actual + "worked
yesterday"; hypotheses from at least three classes; a repro command is required before
any fix; the fix explains the None return path, not the unpacking site.
Pass checks:
- C1 Root quotes the error and states expected vs actual.
- C2 Hypotheses include >= 2 classes (e.g. input data, logic, environment/config).
- C3 Leaves are file:line citations or command outputs; no "probably".
- C4 Fix targets the source of `None`; regression check named.
- C5 UP answers "does this explain the 'worked yesterday' detail?".
Fail patterns: rewriting `payload, meta = ...` to a defensive unpack (symptom patch);
guessing "config cache expiry" with no leaf; editing before a repro; several changes at
once.
Variants that MUST still trigger: "this worked this morning, now it does not";
"can you tell what is None here".
Variants that MUST NOT trigger: "log the payload in worker.py:88" (known edit);
"explain what unpacking does" (explanation).

## H2 - hard: flaky, CI-only, order-dependent
Install: `debug-reasoning` only.
Prompt (verbatim):
```
test_orders.py::test_cancel passes alone on my machine, but fails in the full suite.
CI: 2 failures in the last 10 runs (10-15%). Local single-file run: 10/10 pass.
CI image: python:3.9, pytest 7.4, xdist -n 4. Local: python 3.12, pytest 8.1, no xdist.
Failure: AssertionError: expected 1 order, got 2 (test_orders.py:44)
conftest.py fixture:
  @pytest.fixture(scope="session")
  def db():
      return create_engine(URL)
The failing test creates an order in test_a.py earlier in the session, then test_cancel
counts orders.
We are supposed to ship tomorrow. Should I just add retries to CI?
```
Traps:
- "Should I just add retries to CI?" is bait for symptom suppression.
- Two plausible axes (test isolation vs parallelism/version). Both need leaves.
- Unquantified claims are not allowed: the 2/10 must be turned into a reproducible leaf.
Expected: activated 3/3; flake protocol (quantify, order vs random, seed/order capture);
session-scoped fixture and xdist named as hypotheses; retries explicitly rejected unless
a timing leaf proves them; fix = isolation/cleanup; regression = both orders in CI.
Pass checks:
- C1 Root quantifies the flake and names the repro command.
- C2 Hypotheses cover both isolation/order and xdist/version.
- C3 A leaf distinguishes them (e.g. `-p no:xdist`, reversed order).
- C4 Answer rejects blind retries, or states the timing leaf that would justify them.
- C5 Regression check added with the fix; UP covers "why not local".
Fail patterns: "add retries/sleep" as the answer; only one hypothesis; fix at the
assertion line (change expected 1 -> 2); no seed/order evidence.
Variants that MUST still trigger: "passes locally, red on CI about 1 in 5";
"test passes in isolation but not with the suite".
Variants that MUST NOT trigger: "set pytest -n 0 in CI" (known config change);
"what does xdist do".

## N2 - non-trigger: known, mechanical edit
Install: `debug-reasoning` only.
Prompt (verbatim):
```
In settings.py change LOG_LEVEL from DEBUG to WARNING. It is on line 12.
```
Expected: NOT activated. Cause is not in question; nothing is broken.
Pass checks: no hypotheses, no repro step, no regression-test demand; a single edit
(or the exact diff) only.
Fail patterns: asking for a stack trace; writing a hypothesis table; demanding a
reproduction.
Variants that MUST NOT trigger: "rename MAX_RETRY to MAX_RETRIES everywhere";
"delete the unused import in line 3".

---

# 3-code (`code-reasoning`)

## E3 - easy: small parser
Install: `code-reasoning` only.
Prompt (verbatim):
```
Write a Python 3.11 function `parse_pairs(text: str) -> dict[str, str]` for our config
loader. Input lines look like `key=value`. It will read user-edited files, so it must
not blow up on junk. No dependencies. There is a tests/ dir with pytest.
```
Traps:
- Behaviour for malformed lines is unspecified. Pass requires either asking or an
  explicit ASSUMPTION line; silent invention is a fail.
- "must not blow up on junk" is not a criterion until it is turned into one.
Expected: activated 3/3; criteria listed before code (comment lines, empty value,
duplicate key, whitespace, no `=`, empty file); leaves = function + a run of those
cases; verify command with real output.
Pass checks:
- C1 >= 4 acceptance criteria listed, including malformed input.
- C2 Unspecified behaviour marked ASSUMPTION (or one bounded question).
- C3 Test run shown, covering empty + malformed + duplicate.
- C4 No extras: no plugins, no config object, no CLI.
Fail patterns: 30-line function with no criteria; "raises ValueError on bad input"
silently assumed; only the happy path tested; adding a `PairStrategy`.
Variants that MUST still trigger: "parse these into a dict, source files are user-edited";
"we need a robust parser for `k=v` files used by config".
Variants that MUST NOT trigger: "fix the typo in parse_pairs docstring";
"explain how dict comprehension works".

## H3 - hard: public API rate limiting
Install: `code-reasoning` only.
Prompt (verbatim):
```
Add rate limiting to our public API. FastAPI app, deployed with 4 uvicorn workers,
behind one nginx. Existing clients send no special headers and must keep working.
Per API key: 600 requests / 10 minutes. Over limit: 429 with Retry-After (seconds).
Redis is already in the stack for caching (redis-py client + REDIS_URL in prod).
No new infrastructure. We need a counter we can alert on. Ship it.
```
Traps:
- 4 workers rules out an in-process counter; that leaf must appear (otherwise the
  delivered limit is per-worker = 4x).
- "Existing clients keep working" + Retry-After must be criteria, not afterthoughts.
- "we need a counter we can alert on" invites scope creep (dashboards, admin API).
Expected: activated 3/3; criteria list incl. 429 shape, Retry-After, multi-worker
correctness, existing-client compatibility; branches by risk (interface/headers, storage
keying, core logic, errors/edges, tests); leaves runnable (tests, worker-count check,
key format); YAGNI pass rejects the dashboard.
Pass checks:
- C1 Criteria include the 4-worker requirement as a checkable statement.
- C2 A leaf cites the deployment/worker configuration as the reason for shared storage.
- C3 Tests cover: under limit, at limit, over limit, missing key, Retry-After value.
- C4 Report has criteria -> proof mapping and the exact verify command + output.
- C5 Nothing beyond the ask (no admin UI, no per-route config, no metrics vendor).
Fail patterns: in-memory dict limit shipped; 429 without Retry-After; only happy-path
test; unrequested dashboard; "should work in prod" as verification.
Variants that MUST still trigger: "we run 4 workers and need a shared limit";
"our API needs 429 + Retry-After per key, no new infra".
Variants that MUST NOT trigger: "document the existing rate limit in README";
"where is REDIS_URL used".

## N3 - non-trigger: explanation only
Install: `code-reasoning` only.
Prompt (verbatim):
```
Explain what this query does:
SELECT u.id, COUNT(o.id) FROM users u LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id HAVING COUNT(o.id) = 0;
No code changes.
```
Expected: NOT activated. No implementation, no criteria, no artifacts.
Pass checks: a plain explanation (users with no orders, LEFT JOIN + HAVING trick);
no criteria list, no tree, no verify command.
Fail patterns: proposing tests; proposing to refactor it; asking for acceptance
criteria.
Variants that MUST NOT trigger: "summarize this file"; "what does HAVING do".

---

# 4-web (`web-reasoning`)

## E4 - easy: signup form
Install: `web-reasoning` only.
Prompt (verbatim):
```
Add a newsletter signup to the marketing landing page. Stack: Next.js app router,
Tailwind, existing POST /api/contact route, Resend for email.
Requirements: GDPR consent checkbox (unchecked by default, required), show success
message, show an error if the address is bad or the provider fails, must not
double-submit if the user clicks twice. Design mobile view first.
```
Traps:
- "bad address" invites client-only validation; the server leaf is mandatory.
- Double-submit is a state requirement (disabled + idempotent request), often skipped.
- Consent must be stored/checked server-side, not just rendered.
Expected: activated 3/3; root = "a visitor can subscribe" with the flows named; states
pass (loading/error/success/empty-not-applicable); server validation leaf; consent leaf;
375px leaf; disable-on-submit leaf.
Pass checks:
- C1 Root is user-goal phrased, not "add a component".
- C2 A curl leaf bypasses the form and proves the server rejects bad/absent consent.
- C3 Double-submit handled and stated (button state + server behaviour).
- C4 States all observable; 375px render named.
- C5 No secrets/keys referenced in client code.
Fail patterns: only client-side regex; success message only; no consent check server
side; sending the API key from the browser; no error state.
Variants that MUST still trigger: "let visitors subscribe, we are in the EU";
"simple email capture on the landing page, mobile first".
Variants that MUST NOT trigger: "fix the footer typo"; "change the hero image alt text".

## H4 - hard: checkout with saved cards
Install: `web-reasoning` only.
Prompt (verbatim):
```
Build the checkout flow: cart -> pay -> confirmation, with saved cards for logged-in
users. Payments go through our existing billing/ integration (provider tokenizes cards;
no PAN touches our servers). Session cookie auth exists. Save-card must be opt-in per
payment and removable from /account/cards.
Hard requirements: 3DS may redirect away and back - the flow must survive the return;
a double click must never charge twice; the confirmation webhook is the source of truth
for "paid"; mobile-first.
We ship Friday.
```
Traps:
- The 3DS return and the webhook-as-source-of-truth are flow requirements that unit
  tests will not catch; the browser walk must include them.
- Idempotency and double-charge are security/state leaves.
- "saved cards" invites leaked-card-data mistakes: another user's card id, provider
  secret in the client bundle, card metadata in the list response.
Expected: activated 3/3; branches by risk incl. auth+security and states; flow walk
covering redirect return, refresh, back, double submit; security leaves attempted and
reported (other user's card id -> 404, no secrets in bundle, webhook signature verified);
idempotency key leaf; no-PAN statement checked against the integration.
Pass checks:
- C1 Root names the flow and the done-definition (3 routes + webhook).
- C2 At least 3 security leaves attempted, with the observed result each.
- C3 Double-submit/idempotency covered by a concrete leaf (test or observed request).
- C4 Flow walk covers: 3DS return, refresh mid-flow, back button, logged-out deep link.
- C5 States matrix applied to the card list (loading/error/empty/success).
- C6 Nothing unrequested (no admin refund UI, no card editing beyond add/remove).
Fail patterns: unit tests as proof of the flow; confirmation derived from the client
redirect instead of the webhook; saving cards by default; card list returning provider
payloads verbatim; "mobile-first" forgotten; no idempotency leaf.
Variants that MUST still trigger: "saved cards + 3DS, we ship in 3 days";
"cart to confirmation, must never double-charge".
Variants that MUST NOT trigger: "change the price colour on the cart page";
"add a `<title>` to the confirmation page".

## N4 - non-trigger: static copy
Install: `web-reasoning` only.
Prompt (verbatim):
```
The footer says "Copyrite 2026 Acme" - fix it to "Copyright 2026 Acme".
```
Expected: NOT activated. No logic, no data, no flow.
Pass checks: the one-line edit only; no states matrix, no security leaves, no flow walk,
no 375px requirement.
Fail patterns: asking about loading/error states; listing branches; demanding a browser
walk for a string edit.
Variants that MUST NOT trigger: "make the footer text 14px instead of 16px";
"add aria-label to the footer logo link" (small a11y edit with a known target).
```
Note on the last variant: it is a deliberate boundary probe - if `web-reasoning`
activates only because "aria" appears, tighten the description wording, not the skill
body.

---

# Defect routing (how to improve the suite from failures)
| Observed defect | Edit this file |
|---|---|
| Fires on non-trigger prompts | the skill's `description` (add the "Do NOT use for ..." case) |
| Misses a trigger prompt | the skill's `description` (add the concrete trigger phrasing) |
| Activated but no root sentence / no named output | Procedure step 1 in `SKILL.md` |
| Steps instead of independent branches | `references/tree-reasoning.md` (branch rules) or the domain `*-branches.md` |
| Opinion leaves survive | `references/*examples*.md` (add the bad example) or the leaf table |
| UP pass skipped or patched conclusion | `references/reverse-check.md` + rule 4/5 wording |
| Domain step missing (e.g. states pass, flake protocol) | the domain SKILL.md procedure or its reference file |
| Suppression (retry/try-except/skip test) accepted | the domain "Common mistakes" + rule wording |
| Over-engineering accepted | the YAGNI/over-engineering pass wording |

---

# Part B: visualizer manual checklist

Target: `visualizer/index.html` (double-click, or serve the folder). Start each run
from a clean profile (or clear the session) because the last session is restored.
Items marked **[auto]** below are already covered by the Chromium run recorded in the
delivery notes; keep them in the manual pass as regression checks.

1. **Load / default** [auto] - page opens with no console errors, the general example
   renders (10 nodes, 9 edges), verdict READY, 6 verified leaves, 0 errors.
2. **Invalid JSON** [auto] - paste `{"version":1,` -> one error
   `$ - Invalid JSON: ... [json]`, tree area empties, verdict `-`, no crash.
3. **Schema error with node path** [auto] - general example, delete a leaf `evidence`
   -> `root.children[0].children[0] - leaf missing evidence ... [leafEvidence]`,
   verdict NOT READY, blocking chip `tree invalid: 1 validation errors`.
4. **Semantic warning** [auto] - debug example with a `conclusion` added while a check
   is `fail`/`gap` -> amber warning row `[semantic]`, verdict NOT READY.
5. **100-node tree** [auto] - render the generated 100-node tree: 100 nodes,
   99 edges, 0 overlapping cards, < 300 ms render, verdict READY, pinch/zoom still
   responsive.
6. **Failed / gap examples** [auto] - debug: 3 verified / 1 unverified / 1 failed,
   2 check issues, blocking `b3-l1`, `b3-l2`, `b3`. code: 4 verified, 1 gap, blocking
   `b3`. web: 7 verified / 1 unverified, 1 gap, 16 nodes, depth 5.
7. **Playback DOWN** [auto] - click DOWN then pause: 0 nodes visible at step 0,
   root at step 1, one more node per step, revealed nodes neutral (`status-none`).
8. **Playback UP** [auto] - click UP: all nodes visible, no status colours yet; each
   step highlights one `reverse_check` target (`.node.highlight`) and the badge shows
   `step N/M · <target> <RESULT>`; statuses appear deepest level first; Show all exits
   playback with every status shown.
9. **Step / speed / reduced motion** - Step - at index 0 does not go negative; the
   speed slider changes the interval; with OS "reduce motion" enabled (or DevTools ->
   Rendering -> prefers-reduced-motion: reduce) nothing animates and steps apply
   instantly [auto for the CSS rule, manual for the OS toggle].
10. **Zoom / pan / fit** [auto] - wheel zooms about the cursor, drag pans (a drag must
    not select a node), pinch zooms on a touch device, Fit returns a sane scale and
    the badge matches `state.zoom`.
11. **Mobile view** - 375 x 812: panels stack, details become a bottom sheet, the tree
    keeps ~62vh, the toolbar wraps without clipping, tree gestures do not scroll the
    page (`touch-action: none`).
12. **Dark mode** [auto] - toggle Light/Dark/Auto: body background changes with the
    theme, cards stay readable, status colours keep their icons and stroke patterns.
13. **XSS attempt in a node text** [auto] - `root.text = '<img src=x onerror=...>'`
    and a nested `<svg onload=...>`: no script fires, no `img`/`svg` element enters
    the tree SVG, the text renders literally (and wraps across lines).
14. **Edit + validation loop** - double-click a node: change text/evidence/status ->
    JSON in the textarea updates, health counts and verdict update. Clear `evidence`
    -> error appears and verdict flips to NOT READY. Restore -> READY.
15. **Add / delete / cap** - add a child (new leaf is `unverified` with a `TODO`
    evidence, so it blocks READY), delete it, and confirm a 5th child is impossible
    (`Add child` disables at 4).
16. **Collapse** - collapse the root: only the root remains; expand: full tree back.
    Collapsed state survives a reload (session restore).
17. **Copy / download / export** - Copy JSON matches the textarea; Download JSON opens
    a file that re-imports; Export SVG opens in a browser with colours intact (styles
    are inlined); Export PNG writes a 2x image with a white background.
18. **Upload** - upload `examples/*.json`: tree renders identically to the dropdown
    version. Upload a `.md` file containing a ` ```tree-json ` block: the block is
    extracted and rendered.
19. **i18n** - switch to `vi`: all labels, verdict, blocking chips and error messages
    change (`Hiển thị`, `SẴN SÀNG`, `CHƯA SẴN SÀNG`, `children tối đa 4: hãy tách
    hoặc hợp nhánh.`); no `&#...;` entity leaks into rendered text.
20. **Keyboard** [auto] - Tab to the tree, ArrowDown/Up move parent/child,
    ArrowLeft/Right move siblings, Enter opens the details panel with focus inside,
    Space collapses, `+`/`-` zoom, `0` fits.
21. **Storage disabled** - with cookies/site data blocked (or in private mode),
    the page still loads, renders, edits and exports; only session restore is lost.
22. **Offline** - disable the network, reload: everything works (nothing is fetched
    at runtime; examples come from `examples/data.js`).
23. **Size budget** - `app.js` + `style.css` + `index.html` + `examples/` stay under
    150 KB total.

