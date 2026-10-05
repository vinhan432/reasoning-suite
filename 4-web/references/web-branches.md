# Web Branches and Leaf Shapes

Open this at step 2 of `SKILL.md` to pick branches, and at step 3 to phrase leaves.
Readable independently.

## Branch table (pick 3-4 by risk)
| Branch | Use when | Leaf shape |
|--------|----------|-----------|
| UI / layout | any visual surface | "375px render: <element> visible/clickable" + screenshot path |
| Data + state | anything fetched or mutated | "loading/error/empty/success each observed: <how>" |
| API / backend | new or changed route | "curl <cmd> -> <status + body shape>" |
| Auth + security | users, sessions, private data | "curl without token -> 401; other user's id -> 404" |
| Performance | lists, images, large payloads | "Lighthouse LCP <n>; payload <n>KB; <n> queries" |
| Accessibility | forms, nav, interactive UI | "Tab order reaches submit in <n>; labels present; contrast ratio" |
| Deployment | env vars, migrations, rollback | "build with prod env ok; migration reversible; rollback step named" |

## States matrix (every data surface, no exceptions)
| State | Check |
|-------|-------|
| loading | skeleton/spinner visible before data arrives (throttle network) |
| error | failure of the request shows retry, not a blank screen |
| empty | zero results show explicit text + the next action |
| success | data renders, layout does not jump |
| partial/paginated | page 2 works, `next` absent at the end, no duplicate rows |
| mutation in flight | button disabled, double-submit prevented |
| mutation failed | error surfaced, state not falsely updated |

## Security leaves (attempt, then report)
- Send tampered input straight to the API (skip the form): status?
- Request another user's resource id: 404/403, never 200.
- Request a private route with no/expired token: redirect to login, no data in HTML.
- Inspect the response body: only fields the UI needs; no internal ids/flags/PII.
- Inspect the bundle and page source: no API keys, tokens, or admin endpoints.
- Check HTML sinks for user content (XSS), and POST forms for CSRF protection.
- Check server-side validation of every required field (type, range, length).

## Performance leaves
- Budget first ("LCP < 2.5s on mobile"), then measure (Lighthouse/WebPageTest), then the
  dominant cause (image size, blocking script, query count), then a re-measure.
- Lists: virtualize or paginate; report item count and render time, not opinions.

## Accessibility leaves
- Keyboard-only path to the primary action; visible focus.
- Every input has a label; errors are text, not colour only.
- Images have alt text that states purpose; contrast ratio recorded.
- The flow works at 200% zoom and at 375px width.

## Deployment leaves
- Env vars needed listed, with the failure mode if missing.
- Migration: forward step + reversible step, or explicitly irreversible with a backup.
- Rollback: the exact command/flag and what state it leaves behind.

## Trust-boundary rule
Client validation = UX. Server validation = correctness and security. Every leaf that
touches user input names the server-side check, even when the UI already prevents it.
