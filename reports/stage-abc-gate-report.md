# Stage A–C Gate Report — stopped at Stage C

> **Snapshot.** State in this report (branches, PR status, running services) was verified on the date at the top of the file and is not maintained afterwards. For current PR/branch state use `git status`, `gh pr view`, and `reports/bajaj-alignment-status-and-blockers.md`.

Date: 2026-11-03 (IST). Branch `feat/agent-boundary-corpus-reset` @ `31cbe19`.
Master execution prompt requires Stages A, B and C to **pass** before Stage D (Phase 1 implementation).
**Stage C cannot pass without an owner action, so Stage D and Stage E have NOT been started and no source file has been modified.**

| Stage | Gate | Result |
|---|---|---|
| A — PR #38 backend-delta review | Gate A | **PASS** — `reports/pr38-backend-delta-review.md` |
| B — RBI source preservation | Gate B | **PASS with one documented MISSING** — `data/source_archive/` + manifest, 6/6 retention candidates checksummed |
| C — PR #42 synchronization | Gate C | **BLOCKED** — PR #42 is unmerged and needs a review approval |
| D — Phase 1 security implementation | — | **NOT STARTED** (correctly gated by C) |
| E — Security tests + final report | — | **NOT STARTED** |

---

## Stage A — result

PR #38 was reviewed read-only (not merged, not cherry-picked, not modified).

- Base is `main` @ `31cbe19`; head `feat/saral-redesign` @ `931985a`; **62 commits ahead, 0 behind** — no rebase needed.
- **Exactly one commit touches `apps/api`**: `9af3a71`, **33 additive lines in 3 files** — optional `Citation.excerpt`, `decision_card()` rule keys `actual_value` / `threshold_value` / `operator` plus a `_number()` guard, and `citation_excerpt()` (320-char, whitespace-collapsed, plain text) in `graph.py`.
- **No bureau access, no write path, no new env var, no new endpoint** anywhere in the PR. Its only bureau strings are frontend disclaimers. `www/borrower/application.py` changes one nav key (`"applications"` → `"application"`).
- Contract changes are **backward compatible** (optional fields with defaults; existing display strings untouched).
- **No architectural conflict** → Gate A passes, no owner decision needed.
- Reconciliation: do not merge or cherry-pick now; treat the three field names as a **forward contract** that Phase 1 must preserve, and add compatibility tests (§8 of the review) during Stage D. That makes PR #38's eventual merge a backend no-op. Cherry-picking `9af3a71` was considered and rejected (duplicate-commit merge hazard, no benefit).
- Overlap with Phase 1 is narrow but real: `graph.py` (different hunks → LOW) and `facts.py:decision_card()` (SAME dict Phase 1 must not reshape → MEDIUM if careless).

## Stage B — result

`data/source_archive/` created; originals left exactly where they were (copies only, nothing moved or deleted; the active corpus and the Qdrant collection were untouched).

| Document | Group | Archived as | Bytes | SHA-256 verified vs original | Extraction | Chunks |
|---|---|---|---:|---|---|---:|
| `RBI-RBC-NBFC-2025` | core | `.pdf` (browser-fetched) | 495,859 | ✅ `783413a9…f111` | 65,081 B, hash ✅ | 130 |
| `RBI-NBFC-CF-2025` | core | `.raw` (HTML) | 317,938 | ✅ `585ebeb7…0c49` | 45,666 B, hash ✅ | 71 |
| `RBI-IOS-2026` | core | `.pdf` (browser-fetched) | 260,017 | ✅ `f1195749…01b6` | 42,457 B, hash ✅ | 59 |
| `RBI-IOS-2026-FAQ` | core | `.raw` (HTML) | 129,599 | ✅ `b2e224ea…e3fd` | 21,579 B, hash ✅ | 40 |
| `RBI-CIC-CS-2023` | conditional | `.raw` (HTML) | 117,255 | ✅ `79a63841…8bfd` | 5,993 B, hash ✅ | 8 |
| `RBI-CIC-COMP-2023` | conditional | `.raw` (HTML) | 119,384 | ✅ `d571f247…0b34` | 7,567 B, hash ✅ | 10 |
| `IN-DPDP-2023` | privacy | **MISSING** | — | — | — | 0 |

- Manifest: `data/source_archive/manifests/rbi-source-manifest.json`, schema `rbi-source-archive/1`, 7 records, all fields populated **from the register and the run manifest only** — no invented dates, versions or URLs. Records carry `document_id, title, publisher, source_url, local_path, sha256, extracted_text_sha256, bytes, retrieved_at, publication_date, effective_from, effective_until, document_version, document_type, applies_to_entity, register_approval_status, applicability, verification_status, indexed_chunks, extracted_chars, content_hash_at_last_fetch, notes`.
- Independent re-verification after writing: every archived file's SHA-256 equals its source file, every extracted-text hash matches, manifest parses, all extractions non-empty. Result: **ALL CHECKS PASS**.
- `corpus_fingerprint_of_active_index` recorded as `0c64cb52a32f9da18f44d8c0113f62f44824ccfa12e2c6a65f7188cd2854af99` (1,557 chunks), so the archive is bound to the index it came from.

**Three caveats recorded rather than hidden**
1. **`IN-DPDP-2023` is MISSING** — registered `registered_not_ingested`, never fetched, so no bytes exist to archive. Reconstructing a privacy answer from statute still needs a MeitY retrieval **plus legal review**; it was not a retention candidate, so Gate B is not failed by it.
2. **Two of the six are not script-reproducible** (`RBI-RBC-NBFC-2025`, `RBI-IOS-2026` come from `manual/`, fetched through the rbidocs browser/bot challenge). The archive is therefore the **only** copy of those byte sequences in existence on this project — which is exactly why Stage B precedes any deletion. The other four are re-fetchable HTML.
3. **Currency was not re-verified against the live RBI site in this stage**, and `RBI-RBC-NBFC-2025`'s archived hash differs from the 2026-10-14 hash in committed `policy_manifest_v2.json`. Extraction-quality note: `RBI-RBC-NBFC-2025.txt` opens with a partially mangled Devanagari masthead line (`भारतीय … बैंक`) from the PDF font encoding — English body text is intact, but re-ingesting will reproduce that artefact.

**Open decision from Stage B (not blocking Gate B, blocking the commit):** the archived PDFs/HTML are now duplicated inside a **public** repository working tree. The manifest is plain text and safe to commit; whether RBI publications belong in git is yours — repo convention already carries binaries (webfonts + OFL, brand SVGs, the generated assistant bundle). Recommendation: commit the manifest, keep the binaries out of git but copy them to a second location off this disk.

## Stage C — BLOCKED, exact state

```
PR #42  state=OPEN  mergedAt=null  mergeCommit=null
        mergeable=MERGEABLE  mergeStateStatus=BLOCKED  reviewDecision=REVIEW_REQUIRED
        base main @ 31cbe19  head docs/rag-policy-cost-audit @ 98ba876
        (as at that moment; the same branch later advanced to 3e1f7cc, which carries the audit erratum)
        and the implementation branch gained 2408d7e / 9afb5fc / 8044d42
        latest reviews: none
origin/main @ 31cbe19   (unchanged)
git ls-tree HEAD on feat/agent-boundary-corpus-reset → 0 report files (branch lacks them)
```

The branch is mergeable but the repository ruleset requires **1 approving review**, and no review exists. I did not merge it, approve it, or recreate its contents on the implementation branch — the prompt forbids inventing merge status or manually recreating the changes, and bypassing a required review needs your explicit instruction.

**To unblock, either:**
1. **Approve and merge PR #42** (you have admin rights; normally this is the one step I must not take), then tell me to continue — I will `git fetch`, merge updated `main` into `feat/agent-boundary-corpus-reset`, re-run the pre-commit checks, and proceed to Stage D. Expected: no conflicts, since #42 adds only three markdown files and the implementation branch has no commits yet.
2. **Authorize a documented waiver of Gate C** — Stage D proceeds on the current branch and the reports land separately. Cheapest path, but the implementation PR then carries no audit trail, which is the reason Gate C exists.

Nothing was changed in source, configuration, corpus, index or environment. Working tree contains only the untracked Stage A report and the Stage B archive.
