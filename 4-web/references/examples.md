# Examples (web reasoning)

Good: G1-G3. Bad: X1-X2. "Supports" lines tie each example to the rules in `SKILL.md`.

## G1 - Login + session
Task: "Add email/password login to the app."
```
ROOT: a user can log in and stay logged in -> output: login page + session + checks.
Flows: /login submit, wrong password, logged-out deep link, logout.
├─ B1: UI/states
│  ├─ L1: 375px: fields + submit reachable, error text under field (manual)
│  └─ L2: loading state disables submit; server error shows retry (manual)
├─ B2: API
│  ├─ L3: POST /api/login 200 sets HttpOnly cookie (curl -i, header shown)
│  └─ L4: POST /api/login wrong pw -> 401, generic message (curl)
├─ B3: security
│  ├─ L5: cookie HttpOnly+Secure+SameSite=Lax (header check)
│  ├─ L6: 10 failed attempts -> 429 (script output)
│  └─ L7: GET /dashboard no cookie -> 302 /login?next=/dashboard (curl)
└─ B4: flow completion
   ├─ L8: after login -> /dashboard; refresh stays; logout -> cookie cleared (manual)
   └─ L9: deep link round trip: /settings -> login -> back to /settings (manual)
UP: all four states observed (L2), no error-message user enumeration (L4 generic), the
walk completes (L8, L9). Report: routes, curl transcripts, cookie flags, screenshot.
```
Supports: rules 1, 2 (375px first), 3, 4 (server-side auth), 5, 7, 8.

## G2 - Dashboard with real fetch states
Task: "User dashboard showing recent activity."
```
ROOT: user opens dashboard and sees recent activity, incl. failure cases -> page + checks.
├─ B1: states
│  ├─ L1: throttled network -> skeleton, no layout jump (manual)
│  ├─ L2: /api/activity 500 -> error + retry button; retry succeeds (manual)
│  └─ L3: new user, 0 rows -> "no activity yet" + link to start (manual)
├─ B2: data
│  ├─ L4: GET /api/activity -> {items:[{ts,type,summary}]} only (curl)
│  └─ L5: page 2 + end-of-list behavior, no dup rows (curl, 2 calls)
└─ B3: performance
   ├─ L6: 200 items -> 1 request, 42KB, LCP 1.9s mobile (Lighthouse)
   └─ L7: before fix 480KB -> cause: un-sized avatar images (report)
UP: states L1-L3 all seen; L4 shows no internal fields; L6/L7 measured with the fix in
place and re-measured. Report includes the numbers, not "fast enough".
Supports: rules 3, 6, 7, 9; performance leaves (budget -> measure -> cause -> re-measure).

## G3 - Full-stack CRUD with authorization
Task: "Let users edit their own posts."
```
ROOT: a user can edit only their own post -> edit page + API + authz checks.
├─ B1: API/data
│  ├─ L1: PUT /api/posts/:id 200, updated_at changes (curl)
│  └─ L2: body with extra field `role:"admin"` -> ignored, not written (curl + row read)
├─ B2: validation
│  ├─ L3: title "" -> 400 with field error; 10k chars -> 400 (curl)
│  └─ L4: id "xx" -> 400; unknown id -> 404 (curl)
├─ B3: authorization
│  ├─ L5: user B edits user A's post -> 403, row unchanged (curl + row read)
│  └─ L6: UI hides the button for others, but L5 proves the server also blocks (manual)
└─ B4: flow
   ├─ L7: edit -> save -> refresh -> value persisted; back button safe (manual)
   └─ L8: concurrent save from two tabs -> last-write-wins documented (manual)
UP: flow completes, server-side authz proven (L5), mass-assignment blocked (L2), no
unrequested features. Report: routes, curl transcripts, the rejected-field check.
Supports: rules 4, 5, 6, 8; "Security leaves" list in the branches file.

## X1 - Happy path only, client-side validation trusted
Task: "Add a signup form."
Bad: form renders on desktop, submit with valid data works in one manual test. No
loading/error states, no server-side validation (API stores `""` email), no duplicate
account handling. Told "the browser blocks empty fields", so the API is not checked.
Failure: rules 3, 4, 7. Fix: server-side validation leaves (empty, wrong type, duplicate,
too long) + error/loading states + a curl run that bypasses the form.

## X2 - Flow never walked, desktop-only
Task: "Add a checkout page."
Bad: unit tests for the cart total pass; the page is built at 1280px. In a real browser
at 375px the "Pay" button is off-screen, and after payment the redirect goes back to the
cart with the item still present. Reported as done because tests were green.
Failure: rules 1, 2, 7. Fix: define the done-definition as the full flow (cart ->
pay -> confirmation, cart emptied), build mobile-first, and walk it in the browser
before reporting.
