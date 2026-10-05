# Decomposition Patterns (code)

Open this at step 2 to pick branches, at step 3 for leaf sizing, and at step 6 for the
edge catalogue. Readable independently.

## Branch chooser (pick 3-4 by risk, not all)
| Branch | Use when | Leaf examples |
|--------|----------|---------------|
| Interface / structure | others consume it, or it replaces existing code | signature, schema, route list, module map (with the file that will hold each) |
| Data flow | input shape is non-trivial or transformed | mapping table input field -> stored field; sample input/output pair |
| Core logic | the algorithm is the risk | the one function + a run of its cases |
| Error handling | failure must be visible to the caller | error codes + a test per error |
| Edge cases | inputs are unbounded or user-supplied | test per edge (see catalogue) |
| Tests / verification | criteria are numerous or subtle | one test name per criterion |

## Leaf sizing
- One leaf = one function, one route, one test case, one config change. If it needs
  "and", split it.
- Every leaf names its check: a test name, a command, or a concrete input/output pair.
- Ordering: interface leaves first (they constrain the rest), then core, then edges.
- A leaf that is only described in prose ("handle errors") is a branch, not a leaf.

## Interface first
Write the boundary before the body: name, inputs, outputs, error cases, side effects.
If two leaves need a shared shape, fix the shape once and note the file where it lives.
This prevents two incompatible halves written in one pass.

## Assumptions log
```
ASSUMPTION: limit default 20 (not stated by requester) - affects C4
ASSUMPTION: cursor is opaque base64 (matches existing API style)
```
Each assumption names the criterion or leaf it affects. Unused assumption -> delete.

## Acceptance-criteria -> proof mapping (mandatory in the report)
```
C1 200 + next when 30 items -> tests/test_orders.py::test_paging_next (passed)
C2 limit>100 -> 400          -> test_limit_too_large (passed)
C3 bad cursor -> 400         -> test_bad_cursor (passed)
C4 empty -> 200 []           -> test_empty (passed)
```
A criterion with no row is not done. A row with no run is not a proof.

## Edge catalogue (choose by domain)
- empty collection / empty string / null / missing field
- single item / maximum size / maximum length / overflow
- malformed, wrong type, unicode, path traversal, injection strings
- duplicate keys, repeated calls (idempotency), retry after partial failure
- boundary values: 0, 1, limit, limit+1, max int
- permission denied, expired token, other user's resource
- concurrency: two writers, cancel mid-flight, timeout

## YAGNI filter (run before reporting)
For each artifact ask: "which criterion requires this?" No answer -> delete.
Typical offenders: caches, base classes with one subclass, config keys with one value,
generics with one instantiation, hooks nobody calls, flags nobody flips.

## Refactors
Root = behavior must not change. Criteria = the characterization tests that exist
before the change. Leaves = move + run the same tests after each move. New behavior in
a refactor = a separate change, with its own criteria.
