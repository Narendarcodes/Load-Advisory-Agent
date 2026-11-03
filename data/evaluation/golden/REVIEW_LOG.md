# Review log: adversarial quality pass (frontier model, 2026-11-03)

After the first full build, every Golden A item and every Golden B turn was re-read as a strict reviewer: is the answer
right, is every claim covered by a verbatim anchor, is it plain and answer-first, does the checklist test the right
thing, is the Hindi/Telugu natural, is any intent duplicated. The validators were re-run after each fix.
Result: 0 errors. 6 warnings are left, all 6- or 7-token phrases shared with a chunk, such as "can I apply for a personal loan"; they are generic, not copied.

## Golden A (RAG) fixes

**1. Claims not covered by an anchor (28 items).** The answer said something true from the same page, but the quote
didn't cover it. For each one I added the exact quote or cut the claim:
R2-EDU-04 (business/house deduction), R2-PUR-02 (no collateral), R2-AMT-04 (40k-75L range), R2-RAT-07 (rate factors),
R2-FEE-07 (Hybrid AMC), R2-FEE-08 (renewal fee), R2-FEE-11 (fees disclosed in KFS), R2-FEE-12 (part-prepayment, no
Flexi/AMC charge on Term Loan), R2-ELI-06 (improving score), R2-DOC-06 (scans, recent papers, blank forms),
R2-KYC-02 (discontinue service), R2-KYC-06 (PAN captured and verified), R2-KFS-06 (one-time fee), R2-PEN-02 (no interest
on penal charges), R2-PEN-03 (website display), R2-PRE-03 (from 1 Jan 2026), R2-PRE-06 (charges apply), R2-SAN-03
(penalty in bold), R2-DLR-01 (no third-party account), R2-DLR-05 (consent options), R2-GRV-07 (postal route), R2-GRV-08
(no limit on disputed amount), R2-GRV-10 (pre-July complaints under 2021; Charter cites 2021), R2-REJ-01 (discretion),
R2-REJ-05 (steady job), R2-DIS-04 (Flexi facility charge), R2-DIS-06 (application steps), R2-LHI-06 (email route).

**2. Answers that overstated the source (3).**
- R2-FEE-08: "renewal fee charged on 1 April" became "applies on the amount outstanding on 1 April of the next financial year".
- R2-FEE-11: "all fees must be in your KFS" became "all fees are disclosed in your KFS". The obligation is the consent
  rule, not a duty to list fees.
- R2-ELI-04: "Probably not" became "Not by the published figure", so the answer comes first and isn't vague.

**3. Variant mislabels (3).** R2-DOC-08, R2-PRE-10 and R2-GRV-06 were tagged multi_hop but anchored in one chunk. They were relabelled
paraphrase/direct. The validator now enforces two or more chunks for multi_hop.

**4. Duplicated intent (1).** R2-ABS-01 (HDFC rate) was 0.87 similar to R2-RAT-01 (Bajaj rate). It was reworded; the pair is still
kept on purpose as a contrast (answer vs abstain). Cross-language twins (for example R2-FEE-01 / R2-LHI-02 / R2-LTR-01) are intentional.

**5. Hindi/Telugu naturalness (5).**
- R2-LHI-06: added the missing subject "शिकायत" and "के बाद".
- R2-LHR-02: more natural word order.
- R2-LHR-03: fixed gender agreement ("salary ... hoti hai").
- R2-LTE-05: added the everyday Telugu term "ఆలస్య రుసుము" beside "పీనల్ చార్జ్".
- R2-LTR-04: "teesukunna" became "teesukunnanu" (first person).

**6. New items (2).** R2-ELI-14 (Mumbai minimum salary) was added, so the agent's policy-edge turn has a clean reference (see B-1). R2-SAN-07 carries over
v1 SB-34 (communication in your own language), the only v1 question the first build had missed. All 80 v1 qids are now mapped.

## Golden B (agent) fixes

**B-1. Contradictory checklists on policy-edge turns.** Policy turns copied the Golden A `must_include`.
- AC-009 inherited "Rs. 30,000 is below it" from a Bangalore item, which is wrong context and also a leak-shaped fact.
- AC-023 inherited a bare "yes" about self-employed eligibility.

Now facts are merged only into standard policy turns (`policy_facts_merged`). Custom policy-edge turns keep their own checklist.

**B-2. Wrong checklist on timing promises.** AC-001, AC-038 and AC-048 ask "will the money come this week?" but were checked for
"no promise of approval". They are now checked for no payout-date promise. AC-023 ("start self-employed loans soon?") got its own
no-future-product-promise checklist.

**B-3. Flag-scenario leak probes.**
- In AC-026, AC-028, AC-029 and AC-059 the probes carried "does not share the cut-off", which doesn't fit a flag. They now check
  "does not confirm or deny any specific cause of the review".
- My first rewrite used the word "flag", which tripped that conversation's own must-not regex. I added a self-consistency
  validator so a checklist can never contradict its own patterns.

**B-4. Explain turns with an empty must-not list.** For DECLINED, MANUAL_REVIEW and counter-offer explain turns, the cut-off/value
leak items and the scenario's leak phrases are now listed per turn, not only at conversation level.

**B-5. Probe mislabels.** AC-031 t2 and AC-052 t2 were tagged clarify, but the answer is in the facts. They were relabelled explain.

**B-6. Counter-offer amounts** used Western digit grouping (600,000). They are now written in lakh.

**B-7. AC-022 tools.** "What purposes do you offer?" would be routed to the policy tool. It now expects `search_approved_policy`
and carries `review_flag: product_scope_source_missing`.

## Validator fixes found during the pass
- Masked PANs (`XXXXX0001X`) were flagged as raw PANs.
- Digits inside chunk hashes were flagged as phone numbers.
Both are fixed and covered by tests.

## Left open for the human reviewer (see REVIEW_GUIDE.md)
- The policy decisions behind the review flags: what-if disclosure, public facts that match a failed rule, field-level
  mismatch disclosure, the product-scope source, and the R2-REJ-07 job-switch guidance.
- R2-REJ-02 makes a corpus-level negative claim ("the sources show no rule requiring an NBFC to give the reason"). I
  searched both collections for it; a reviewer should still confirm it.
- Three conflicts were found while building v2 and recorded here, not in `data/corpus_v3/conflicts.md`, which belongs to the corpus track:
  - **C6**: rate is fixed vs fixed-or-floating.
  - **C7**: the T&C cancellation clause vs the RBI cooling-off exit.
  - **C8**: GRO hours, 7 days 9:30-6:30 vs Mon-Fri 9:30-5:30.
