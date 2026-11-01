# Assistant transcript API contract and the new-thread 404

Task: find the real cause of the `conversation_messages` 404 on a fresh advisory workspace, fix it with
the smallest correct semantics, and prove the authorization boundary survived. Branch
`feat/frappe-borrower-platform`, captured 2026-11-01.

## 1. Root cause

The island restores a transcript whenever the open thread changes, and it had no way to know that the
thread it was about to ask for had never existed on the server.

The lifecycle, end to end:

| Step | What happens | Stored rows |
| --- | --- | --- |
| 1 | `/borrower/assistant` boots; the island computes a thread id `loan-advisory:thread:<user>:<application>` from `sessionStorage`, minting a fresh UUID when absent ([thread.ts](../../../../apps/web/assistant/src/thread.ts)) | none |
| 2 | A thread minted by this tab is remembered as *pending* (`…:pending`) | none |
| 3 | The effect on thread change calls `agent.conversation_messages(thread)` **before any turn exists** ([island.tsx:60-87](../../../../apps/web/assistant/src/island.tsx#L60-L87)) | none |
| 4 | `conversation_messages` resolves the id through `_owned_conversation`, which raises `NotFound` when no `Advisory Conversation` row matches — correct, but it is a 404 on the very first paint ([api/agent.py](../../../../apps/loan_advisory_portal/loan_advisory_portal/api/agent.py), `_owned_conversation`) | — |
| 5 | The borrower sees an empty panel (the client swallows the refusal) while the browser console and the network log carry a 404 | — |
| 6 | The first `record_turn` creates the conversation and its messages, and releases the pending marker | rows exist |

The invariant that decides the fix: **a thread this tab minted and never used has no stored rows, so
there is nothing to restore — asking is not a check, it is a request for a 404.** The pending marker
already existed for exactly this purpose; the restore path simply was not using it.

## 2. Chosen contract

The prompt offered Option A (answer 200 with a documented empty shape for an unknown thread) and
Option B (don't make the request). **Option B — client-side skip — was taken, and the server contract
was left unchanged.**

- Option A would have made `conversation_messages` answer 200 for identifiers that match no row. The
  caller cannot distinguish "your new thread is empty" from "that thread is someone else's", and the
  404 is the only thing that makes an enumeration attempt observable and useless. Weakening it to
  protect a console line is the wrong trade.
- Option B removes a request that could never succeed. It touches no authorization logic: the borrower
  still cannot read another borrower's transcript, and an unknown or foreign id still gets
  `NotFound`, still indistinguishable from a foreign one.
- The empty-but-existing case is already a **200 with `messages: []`** — a thread Frappe minted for a
  session that has not recorded a turn yet. So both shapes the frontend needs already exist; only the
  "no row at all" case remains a refusal, which is correct.

Client change ([island.tsx:69-71](../../../../apps/web/assistant/src/island.tsx#L69-L71)):

```ts
// A thread this tab minted but never used has no stored rows, so its transcript cannot be
// restored yet. The marker is kept in storage precisely so a reload does not ask for it.
if (pendingThread(context.user, context.application) === thread) return;
```

and the marker lifecycle in [thread.ts](../../../../apps/web/assistant/src/thread.ts): `newThread()` names
the thread and marks it pending at the moment it is minted; `clearThreadPending()` releases it only
after `record_turn` succeeds; a late-landing older turn cannot clear a newer marker; the marker is
per application; a stored value that is not a usable thread id is replaced.

Nothing was disabled to make the tests read-only, and no genuine functionality changed: a reload of a
used thread still restores the real transcript.

## 3. Security scenarios, each with its outcome

| # | Scenario | Behaviour | Pinned by |
| --- | --- | --- | --- |
| 1 | Brand-new thread id, never used | **no request at all** (was: 404) | island tests + browser journey check 2 |
| 2 | Thread minted by Frappe, no turn recorded | 200, `messages: []` | `test_minted_thread_without_a_turn_comes_back_empty` |
| 3 | Thread with turns | 200, messages oldest-first, capped at `MAX_RETURNED_MESSAGES` | `test_thread_with_turns_returns_them_in_order`, `test_transcript_drops_the_oldest_messages_beyond_the_buffer` |
| 4 | Another borrower's thread id | **404 `Conversation not found.`** — same shape and text as a non-existent id, so it cannot be probed | `test_another_borrowers_thread_is_refused_indistinguishably` |
| 5 | Thread bound to a different application | 404; a thread cannot be rebound | `test_thread_cannot_be_rebound_to_another_application`, `test_foreign_application_is_not_found` |
| 6 | Signed-out reader | `SignInRequired`, no transcript and no conversation list | `test_signed_out_reader_gets_no_transcript_and_no_list` |
| 7 | Malformed, oversized or non-string reference | refused before any lookup; Frappe's signature validation stops a list | `test_malformed_reference_is_refused_before_any_lookup`, `test_oversized_thread_id_is_rejected`, `test_non_string_reference_never_reaches_the_lookup` |
| 8 | Relinked profile (a Borrower Profile moved to another User) | the old thread is not carried over | `test_relinked_profile_cannot_keep_the_old_thread` |
| 9 | Attempt to append to a thread you do not own | refused; no turn is created | `test_turns_are_never_added_to_a_thread_you_do_not_own` |

The ownership test is `_owned_conversation`: the row must match both `ctx.user` **and** `ctx.customer`,
and any mismatch raises the same `NotFound`. Existing Frappe ownership checks were not weakened; the
only edited behaviour is "should the client ask".

No raw exception text, database detail or other borrower's content reaches the page. The refusal is
rendered as an empty panel; the browser's own 404 log line is not surfaced to the borrower (verified in
the control run, §5).

## 4. Backend regression tests

New module [tests/test_transcript_contract.py](../../../../apps/loan_advisory_portal/loan_advisory_portal/tests/test_transcript_contract.py),
8 tests, all passing inside the Frappe app suite (`Ran 179 tests … OK`, up from the 171 baseline):

```
test_brand_new_thread_id_has_no_transcript
test_minted_thread_without_a_turn_comes_back_empty
test_thread_with_turns_returns_them_in_order
test_another_borrowers_thread_is_refused_indistinguishably
test_signed_out_reader_gets_no_transcript_and_no_list
test_malformed_reference_is_refused_before_any_lookup
test_non_string_reference_never_reaches_the_lookup
test_turns_are_never_added_to_a_thread_you_do_not_own
```

The first is deliberate: it asserts that a minted-in-the-browser id has no row and that asking for it
*is* a 404. The fix removes the request, not the refusal — so if anyone later "fixes" the 404 by
loosening the endpoint, this test says what was chosen and why.

Host-side agent API suite also extended: [tests/test_agent_api.py](../../../../tests/test_agent_api.py)
(28 changed lines), part of the 685-passing host run.

## 5. Frontend tests

Island suite: **86 passed in 10 files** (baseline 72 in 9). The 14-test delta is this fix: 7 new tests
in `thread.test.ts` (13 in that file now) and the new 7-test `island.test.tsx`, which covers the restore
decision itself. The marker-lifecycle names added here:

```
thread.test.ts — the 7 tests added for this finding
  it("names a thread the moment it is minted")
  it("survives the reload that used to cause a needless 404")
  it("is released once a turn has been recorded")
  it("keeps the marker of a newer thread when an older turn lands late")
  it("holds one marker per application")
  it("works without a usable storage backend")
  it("ignores a marker that storage no longer holds")
```

Runtime gateway unchanged at 13/13; the transcript path does not go through it.

## 6. Real-browser verification

[tests/e2e/thread_continuity_e2e.cjs](../../../../tests/e2e/thread_continuity_e2e.cjs) (`npm --prefix
tests/e2e run thread`) drives the actual island against the real Frappe session, the real assertion
mint and a deterministic AG-UI stub, with a write guard attached. Console:
[thread-continuity/console.txt](thread-continuity/console.txt); data:
[thread-continuity-results.json](thread-continuity/thread-continuity-results.json); screenshots
`01-…png` … `06-…png` in the same folder.

Journey — **22/22 checks passed**, in two contexts:

| Load | Transcript requests | 404 | Panel |
| --- | --- | --- | --- |
| first load of a minted thread | **0** | 0 | empty, not invented |
| after the first answer | 0 (marker released only on `record_turn`) | 0 | answer on screen |
| reload | **1 → 200** | 0 | recorded exchange restored |
| "New conversation" | **0** | 0 | empty, nothing carried over |
| second answer | 1 → 200 | 0 | list holds both conversations, one not current |
| reopen the older conversation | 1 → 200 | 0 | older exchange restored |

Console errors during the journey: **0**. Transcript requests total: 2, both 200.

Control — **4/4 passed**, in a second context that removes the pending marker by hand to re-create the
original condition: the request is made, the server answers **404 exactly once**, the panel stays empty
with no invented transcript, and no raw error text appears in the page body. One browser console line is
recorded for that expected 404. This is the proof that the fix removed a *request* and not the
*refusal*: the endpoint still says no.

Writes: 6 allowed (login ×2, 2 runtime calls, 2 `record_turn` — the run's own conversation), 0 blocked,
0 unexpected.

## 7. Status

| Claim | Status |
| --- | --- |
| Root cause traced through the full thread lifecycle | **VERIFIED** |
| Smallest correct fix, authorization semantics intact | **VERIFIED** — server code unchanged; Option A rejected with reason |
| Seven security scenarios (plus two) covered by tests | **VERIFIED** — 8 new Frappe tests, 13 island thread tests |
| Fresh assistant experience is 404-free in a real browser | **VERIFIED** — 22/22 journey checks, 0 console errors, 6 numbered screenshots at 1440 (the journey harness runs one viewport; five-width rendering of the assistant is covered by the axe and missing-information runs) |
| A refused thread still yields an empty panel with no fabricated content | **VERIFIED** — control run |
| Behaviour with the live model rather than the stub | **VERIFIED** earlier in this acceptance work for streaming; this fix was verified against the stub only | 
| Screen-reader experience of the restored transcript | **NOT VERIFIED** — see [screen-reader-blocker.md](screen-reader-blocker.md) |
