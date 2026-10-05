/* Generated from examples/*.json - do not edit by hand.
   Loaded as a classic script so the page works from file:// with no fetch(). */
window.TREE_EXAMPLES = {
  "general": {
    "version": 1,
    "domain": "general",
    "title": "Ship the CSV export behind a feature flag?",
    "root": {
      "id": "r",
      "text": "decide flag vs direct release for the CSV export",
      "children": [
        {
          "id": "b1",
          "text": "blast radius if the export is wrong",
          "children": [
            {
              "id": "b1-l1",
              "text": "export reads rows only, never writes",
              "evidence": "src/export.py:41 - no INSERT/UPDATE in the module",
              "status": "verified"
            },
            {
              "id": "b1-l2",
              "text": "bad output is user-visible but recoverable by re-export",
              "evidence": "manual: re-export after fix produced the correct file",
              "status": "verified"
            }
          ]
        },
        {
          "id": "b2",
          "text": "cost of the feature flag",
          "children": [
            {
              "id": "b2-l1",
              "text": "flag costs 2 files, 6 lines",
              "evidence": "config/features.yaml + route guard diff (git show --stat)",
              "status": "verified"
            },
            {
              "id": "b2-l2",
              "text": "rollback without deploy",
              "evidence": "flag read per request; config reload observed in staging",
              "status": "verified"
            }
          ]
        },
        {
          "id": "b3",
          "text": "current correctness evidence",
          "children": [
            {
              "id": "b3-l1",
              "text": "export tests pass on the 3 existing fixtures",
              "evidence": "pytest -q tests/test_export.py -> 3 passed",
              "status": "verified"
            },
            {
              "id": "b3-l2",
              "text": "empty-table fixture added during the UP pass",
              "evidence": "pytest -q tests/test_export.py -> test_empty_table passed",
              "status": "verified"
            }
          ]
        }
      ]
    },
    "reverse_check": [
      {
        "target": "b1-l1",
        "question": "does the leaf prove there are no writes?",
        "result": "pass",
        "note": "module read end to end"
      },
      {
        "target": "b2-l1",
        "question": "is the flag cost complete?",
        "result": "pass",
        "note": "diff measured, not estimated"
      },
      {
        "target": "b3",
        "question": "was the empty-table gap closed before concluding?",
        "result": "pass",
        "note": "fixture added and re-run during UP"
      }
    ],
    "conclusion": "Ship behind the flag: 6 lines, instant rollback, and the empty-table gap was closed during the UP pass."
  },
  "debug": {
    "version": 1,
    "domain": "debug",
    "title": "test_cancel fails only in the full suite",
    "root": {
      "id": "r",
      "text": "stop test_cancel failing in the full suite on CI (~2 of 10 runs)",
      "children": [
        {
          "id": "b1",
          "text": "test isolation / order dependency",
          "children": [
            {
              "id": "b1-l1",
              "text": "order matters: test_a leaks a row into the session",
              "evidence": "pytest test_a test_orders -> fails; reversed order -> passes",
              "status": "verified"
            },
            {
              "id": "b1-l2",
              "text": "session-scoped db fixture is never reset",
              "evidence": "conftest.py:12 scope=\"session\" with no teardown",
              "status": "verified"
            }
          ]
        },
        {
          "id": "b2",
          "text": "xdist / version difference",
          "children": [
            {
              "id": "b2-l1",
              "text": "B2 is dead: failure reproduces with xdist disabled",
              "evidence": "pytest -p no:xdist full suite -> same assertion at line 44",
              "status": "verified"
            }
          ]
        },
        {
          "id": "b3",
          "text": "fix: order-independent cleanup",
          "children": [
            {
              "id": "b3-l1",
              "text": "cleanup added in test_a - suite still fails",
              "evidence": "CI run 8412: 2 failed, same AssertionError at test_orders.py:44",
              "status": "failed"
            },
            {
              "id": "b3-l2",
              "text": "function-scoped fixture rewrite still untested on CI",
              "evidence": "patch prepared locally, not pushed",
              "status": "unverified"
            }
          ]
        }
      ]
    },
    "reverse_check": [
      {
        "target": "b1-l1",
        "question": "does order genuinely explain the failure?",
        "result": "pass",
        "note": "reproduced both orders"
      },
      {
        "target": "b2-l1",
        "question": "is parallelism ruled out?",
        "result": "pass",
        "note": "fails with xdist off"
      },
      {
        "target": "b3-l1",
        "question": "does the applied fix clear the repro?",
        "result": "fail",
        "note": "CI still red: cleanup in one test is not enough, the fixture itself leaks"
      },
      {
        "target": "b3",
        "question": "does any leaf explain the whole symptom?",
        "result": "gap",
        "note": "no leaf yet proves the fixture rewrite removes the failure"
      }
    ],
    "conclusion": ""
  },
  "code": {
    "version": 1,
    "domain": "code",
    "title": "CSV import endpoint",
    "root": {
      "id": "r",
      "text": "add POST /import for order CSV files, meeting C1-C4",
      "children": [
        {
          "id": "b1",
          "text": "interface and error shape",
          "children": [
            {
              "id": "b1-l1",
              "text": "responses match api/schemas.py conventions",
              "evidence": "schema review against C1; 202 {job_id} on success",
              "status": "verified"
            }
          ]
        },
        {
          "id": "b2",
          "text": "core parsing and persistence",
          "children": [
            {
              "id": "b2-l1",
              "text": "5k-row fixture imports and row count matches",
              "evidence": "pytest -q tests/test_import.py -k happy -> passed; DB count 5000",
              "status": "verified"
            }
          ]
        },
        {
          "id": "b3",
          "text": "error and edge handling",
          "children": [
            {
              "id": "b3-l1",
              "text": "missing file and wrong delimiter return 400 with row number",
              "evidence": "test_missing_file, test_wrong_delimiter -> passed",
              "status": "verified"
            },
            {
              "id": "b3-l2",
              "text": "duplicate order ids are rejected at row level",
              "evidence": "test_duplicate_rows -> 400, row 7 reported",
              "status": "verified"
            }
          ]
        }
      ]
    },
    "reverse_check": [
      {
        "target": "b1-l1",
        "question": "C1: success shape matches the API conventions?",
        "result": "pass",
        "note": "reviewed against existing handlers"
      },
      {
        "target": "b2-l1",
        "question": "C2: a real file imports end to end?",
        "result": "pass",
        "note": "5k rows, count verified in DB"
      },
      {
        "target": "b3-l1",
        "question": "C3: malformed input rejected with a row number?",
        "result": "pass",
        "note": "two failing tests green"
      },
      {
        "target": "b3",
        "question": "C4: is the 1M-row / memory budget covered?",
        "result": "gap",
        "note": "no leaf measures large-file throughput; only a 5k-row fixture exists"
      }
    ],
    "conclusion": ""
  },
  "web": {
    "version": 1,
    "domain": "web",
    "title": "Checkout flow with saved cards",
    "root": {
      "id": "r",
      "text": "a logged-in user can pay with a saved card and reach the confirmation",
      "children": [
        {
          "id": "b1",
          "text": "cart and pricing",
          "children": [
            {
              "id": "b1-1",
              "text": "line items persist across the flow",
              "children": [
                {
                  "id": "b1-1-1",
                  "text": "cart state survives refresh and the 3DS round trip",
                  "children": [
                    {
                      "id": "b1-1-1-l1",
                      "text": "server-side cart keyed by session, not localStorage",
                      "evidence": "GET /api/cart after refresh returns the same 3 items",
                      "status": "verified"
                    },
                    {
                      "id": "b1-1-1-l2",
                      "text": "price is recomputed server-side before charge",
                      "evidence": "curl with tampered client total -> server total used (order 8812)",
                      "status": "verified"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "id": "b2",
          "text": "payment",
          "children": [
            {
              "id": "b2-1",
              "text": "3DS redirect return",
              "children": [
                {
                  "id": "b2-1-l1",
                  "text": "return URL restores the flow and does not resubmit",
                  "evidence": "manual walk: redirect back to /checkout/return, single charge (provider dashboard)",
                  "status": "verified"
                },
                {
                  "id": "b2-1-l2",
                  "text": "webhook is the source of truth for paid",
                  "evidence": "provider webhook replayed -> order marked paid once, idempotency key honored",
                  "status": "verified"
                }
              ]
            },
            {
              "id": "b2-2",
              "text": "saved cards",
              "children": [
                {
                  "id": "b2-2-l1",
                  "text": "another user's card id is rejected",
                  "evidence": "curl DELETE /api/cards/<other-id> -> 404, row unchanged",
                  "status": "verified"
                },
                {
                  "id": "b2-2-l2",
                  "text": "double submit never charges twice",
                  "evidence": "two rapid POSTs with the same idempotency key -> one charge, second 200 replay",
                  "status": "verified"
                }
              ]
            }
          ]
        },
        {
          "id": "b3",
          "text": "mobile and states",
          "children": [
            {
              "id": "b3-l1",
              "text": "375px layout keeps the pay button reachable",
              "evidence": "manual render at 375px, screenshot",
              "status": "verified"
            },
            {
              "id": "b3-l2",
              "text": "card list loading / error / empty states",
              "evidence": "loading and empty observed; error state not yet forced",
              "status": "unverified"
            }
          ]
        }
      ]
    },
    "reverse_check": [
      {
        "target": "b1-1-1-l2",
        "question": "can the client influence the amount charged?",
        "result": "pass",
        "note": "tampered total ignored"
      },
      {
        "target": "b2-2-l1",
        "question": "is card authorization enforced server-side per resource?",
        "result": "pass",
        "note": "cross-user id returns 404"
      },
      {
        "target": "b2-1-l2",
        "question": "is confirmation derived from the webhook, not the redirect?",
        "result": "pass",
        "note": "replay marks paid exactly once"
      },
      {
        "target": "b3-l2",
        "question": "does every data surface handle loading, error and empty?",
        "result": "gap",
        "note": "error state on the card list was never forced"
      }
    ],
    "conclusion": ""
  }
};
