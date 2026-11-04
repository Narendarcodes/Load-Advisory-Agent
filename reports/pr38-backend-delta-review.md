# Stage A — PR #38 Backend-Delta Review

> **Snapshot.** State in this report (branches, PR status, running services) was verified on the date at the top of the file and is not maintained afterwards. For current PR/branch state use `git status`, `gh pr view`, and `reports/bajaj-alignment-status-and-blockers.md`.

Reviewed 2026-11-03 (IST) on branch `feat/agent-boundary-corpus-reset`, before any Phase 1 code change.
Reviewer: senior backend architect / security engineer role, per the master execution prompt.
Constraint respected: **PR #38 was not merged, not cherry-picked, not modified**; this is a read-only review plus a reconciliation decision.

---

## 1. Metadata as reviewed

| Item | Value | Verified by |
|---|---|---|
| PR | #38 — "Saral: borrower portal and assistant redesign (final)" | `gh pr view 38` |
| State | **OPEN**, not draft, `mergeable: MERGEABLE`, `reviewDecision: REVIEW_REQUIRED` | `gh pr view 38` |
| Base | `main` @ `31cbe19` | `git merge-base main origin/feat/saral-redesign` → `31cbe19…` |
| Head | `feat/saral-redesign` @ `931985a` (2026-11-03 06:03:11 UTC) | `git log -1 origin/feat/saral-redesign` |
| Ancestry | **62 commits ahead of `main`, 0 behind** — the branch is current with `main`; no rebase is required | `git rev-list --count main..origin/feat/saral-redesign` |
| Scale | 129 files, +16,272 / −6,192 | `gh pr view 38` |
| **Commits touching `apps/api`** | **exactly one**: `9af3a71` "feat(agent): rule rows carry engine numbers and citations carry a short excerpt for the assistant's meters and source chips" | `git log main..origin/feat/saral-redesign -- apps/api` |

**Corrected premise from the earlier baseline:** PR #38 is *not* frontend-only, but its backend content is a **single additive commit of 33 lines across 3 files**. The "merge it after Phase 5 and resolve a big conflict" worry is therefore small in scope and manageable if we protect three field names.

## 2. Files changed, by area

| Area | Files | Nature |
|---|---:|---|
| `public/illustrations`, `public/brand`, `public/fonts` | 55 | SVG/PNG/WOFF2 assets + OFL/CC0 licence files |
| `apps/web/assistant/src` (+ `genui/`) | 26 | React island source: `chat-panel.tsx` (+476), `assistant.css` (+1,767), `blocks.tsx`, **new** `meter.ts`, `trail.ts`, `markdown.tsx`, `turns.ts`, `feedback.ts`, `voice-orb.ts`, `voice-transport.ts`, plus tests |
| `www/borrower/*.html`, `templates/portal` | 18 | portal redesign templates |
| `public/js/pages`, `public/js`, `public/js/assistant` | 9 | portal JS + the **committed generated island bundle** |
| `apps/api/src/loan_advisory/agent` | **3** | the backend delta (§3) |
| `scripts/brand`, `tests/e2e`, `tests`, `docs` | 17 | brand tooling, e2e and unit test updates |
| `www/borrower/application.py` | 1 | nav-key fix: `borrower_page(context, "applications", …)` → `"application"`; **no security or data effect** |

**No changes at all** to `rag/`, `config/`, `decision_engine/`, `data/`, `infra/`, `apps/runtime/src`, `.env*`, or any requirement file.

## 3. API contract differences (the only backend substance)

### 3.1 `agent/contracts.py` — +1 line

```python
class Citation(BaseModel):
    ...
+   excerpt: str | None = None   # opening of the cited passage, plain text (source chip)
```

Optional field with a default on an existing pydantic model. **Backward compatible**: every producer that omits it still validates, and old consumers ignore unknown keys.

### 3.2 `agent/facts.py` — +11 / −1

`decision_card()` per-rule rows gain three keys taken straight from the engine record:

```python
+ "actual_value": _number(e.get("actual_value")), "threshold_value": _number(e.get("threshold")),
+ "operator": e.get("operator") if e.get("operator") in (">=", "<=") else None,
```

plus a new private helper:

```python
+ def _number(v):
+     """A finite int/float from the engine record, else None (never a string or bool)."""
```

Notes: the display strings (`actual`, `threshold`) are untouched, so every existing consumer keeps working; the values come from the **pinned engine record**, not from a model, which is the correct source for a money meter; the bool/exclusion guard means a `True` can never reach a meter as `1`.

### 3.3 `agent/graph.py` — +18 / −1

```python
+ EXCERPT_MAX_CHARS = 320
+ def citation_excerpt(text) -> str | None:   # collapse whitespace, cut at a word, append "…", add no markup
...
- cites = [by_label[c]["citation"] for c in s.get("cited") or [] if c in by_label]
+ cites = [{**by_label[c]["citation"], "excerpt": citation_excerpt(by_label[c].get("text"))} ...]
```

Behaviour-preserving for every intent except that policy citations now carry a bounded plain-text excerpt.

## 4. Security review of PR #38 (explicitly required)

| Question | Finding | Label |
|---|---|---|
| Does it introduce **bureau API access** anywhere? | **No.** Zero new `bureau` identifiers, URLs, clients or credentials in the diff. The only bureau strings in its frontend are **disclaimers** ("no credit bureau was contacted", "does not … run a credit bureau enquiry") in `public/js/pages/eligibility.js` | VERIFIED |
| Does it call `/api/bureau/run`? | **No.** No `.js/.ts/.tsx/.html` caller exists on `main` **or** on `origin/feat/saral-redesign` | VERIFIED |
| Does it introduce a **business-data write**? | **No.** No `insert`/`save`/`submit`/`cancel`/`delete`, no Frappe write call, no new `POST` from portal JS to a write route | VERIFIED |
| New environment variables, endpoints, tokens? | **None** in `apps/api` | VERIFIED |
| Data-exposure risk in the new fields? | **Bounded.** `excerpt` is the opening of an already-approved **policy passage** (public regulator/lender text), capped at 320 chars, whitespace-collapsed, no markup. It is not borrower data. It does extend the response payload with corpus text the client could already obtain by other means, so it adds no new class of disclosure | VERIFIED + judgement |
| Licence/provenance hygiene | Open Peeps figures are CC0 with the licence shipped; Space Grotesk ships its OFL text; brand SVGs are original | VERIFIED |

**Conclusion: PR #38's backend content is compatible with the target architecture.** Nothing in it has to be refused, and nothing in it obstructs Phase 1.

## 5. Overlap with Phase 1 (the reason this review exists)

Phase 1 touches: `agent/server.py`, `api/routes_agent.py`, `api/auth.py`, `application/bureau_intake.py`, `application/lifecycle.py`, `infrastructure/bureau_client.py`, `infrastructure/frappe_adapter.py`, `infrastructure/evidence_store.py`, `agent/tools.py`, `agent/state_paths.py`, plus `agent/settings.py`/`graph.py` only where the bureau route wiring is referenced.

| PR #38 file | Phase 1 interaction | Conflict risk |
|---|---|---|
| `agent/graph.py` | Phase 1 does **not** edit the citation-assembly block (`:643`) or add a `citation_excerpt`. Graph edits are limited to bureau-route wiring and node removal | **LOW** — same file, different hunks; git will merge cleanly |
| `agent/facts.py` | Phase 1 **must preserve** `bureau_facts`, the DQ wording and the review projection — i.e. the same file PR #38 edits (`decision_card`) | **MEDIUM if careless** — the rule-row dict in `decision_card()` is the exact line PR #38 changed |
| `agent/contracts.py` | Phase 1 leaves `Citation`/`AgentResponse` alone | LOW |
| `www/borrower/application.py` | untouched by Phase 1 | NONE |
| generated island bundle | Phase 1 must not rebuild or commit `public/js/assistant/**` | NONE if the constraint is respected |

## 6. Compatible vs deferred

**Compatible with the target architecture (keep as-is when it merges):** all three backend fields, the whole React island, the portal templates, brand assets, `scripts/brand`, and the nav-key fix.

**Deliberately deferred to Phase 6 (per decision 11):** the portal/island UI itself, and any dependency of it on `SARAL_DEMO` content — Phase 3 authoring and Phase 5 evaluation must land first, or the redesigned UI will be measured against a corpus that is about to be deleted.

**Must be actively protected by Phase 1 (not deferred):** the presence and meaning of `Citation.excerpt`, and `decision_card()` rule keys `actual_value`, `threshold_value`, `operator`. If Phase 1 drops or renames them, PR #38's meters and source chips silently render `None` — a regression invisible in `main`'s own tests, because nothing on `main` consumes them.

## 7. Reconciliation strategy (recommended, no owner decision required)

1. **Do not merge or cherry-pick #38 now.** Its base is already `main` @ `31cbe19`, so it will remain mergeable and small.
2. **Treat the three field names as a forward contract.** Phase 1 keeps `facts.decision_card()` emitting `actual_value`, `threshold_value`, `operator` (nullable, engine-sourced) and keeps `Citation.excerpt` optional. Any refactor that reshapes the rule row must re-add them.
3. **Add a compatibility test on the Phase 1 branch** that asserts those keys exist with the right null-safety, so the contract is enforced by CI rather than by a note in this file. It costs nothing on `main` (the keys are produced there by Phase 1's own preserved code) and it makes PR #38's later merge a no-op on the backend.
4. **No frontend changes in the Phase 1 branch** (per constraint), including no rebuild of `public/js/assistant/**`.
5. **At Phase 6**, re-run this same check (`git log base..head -- apps/api`) — if the backend delta is still exactly `9af3a71`, PR #38 merges with zero backend conflict.

**Rejected alternative:** cherry-picking `9af3a71` onto the implementation branch. It would duplicate a commit that still exists on `feat/saral-redesign`, creating a "same change, two identities" merge situation for no benefit, since nothing in Phase 1 needs those fields to *work* — only to *survive*.

## 8. Tests required to preserve compatibility

| Test | Assertion | Where |
|---|---|---|
| `test_decision_card_exposes_engine_numbers` | each rule row has `actual_value`, `threshold_value`, `operator` (`>=`/`<=`/None), from the record, never a bool or string | `tests/test_agent_graph.py` or a new `tests/test_card_contract.py` |
| `test_decision_card_number_guard` | `_number(True) is None`, `_number("700") is None`, `_number(nan) is None`, `_number(700) == 700` | new test |
| `test_citation_model_allows_missing_excerpt` | `Citation(**payload_without_excerpt)` validates, `.excerpt is None` | `tests/test_contracts.py` (or existing agent contracts test) |
| `test_bureau_facts_survive_route_removal` | after Phase 1, `bureau_facts(record)` still returns the DQ projection for a stored bureau record | Stage E test #10 |
| `test_review_templates_localized` | bureau review/improvement templates still resolve in en/hi/te | Stage E |

## 9. Gate A

**PASS — no architectural conflict requiring an owner decision.** PR #38 introduces no bureau access, no write path, no new environment surface, and its backend delta is 33 additive lines that Phase 1 can preserve by contract. Reconciliation approach recorded in §7 and carried into Stage D as an implementation constraint.

Proceeding to Stage B.
