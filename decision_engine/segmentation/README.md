# Explanation tone from customer segmentation

Rule-based customer segmentation (first built by @BharathkumarGoud179 in PR #43) that picks
**how** the advisory agent explains a recorded decision. It never changes **what** the
decision is or which facts are shown, and the borrower never sees it.

## Input: the synthetic bureau record

The classifier takes one synthetic bureau record in the provider contract
`bureau-report/1` (`decision_engine/schemas/bureau.py`; the path list is
`contracts/synthetic_sources.json` → `sources.SYNTHETIC_BUREAU`). It reads only:

- `accounts[].account_type`
- `accounts[].months_reviewed`

The score, repayment history, income, gender, marital status and family details are never
inputs. There is no demo-file or id lookup: the caller passes the record.
Test fixtures (the 20 synthetic records from `data/synthetic/saral_v1/bureau_cases.json`) live
only under `tests/fixtures/segmentation/`.

## Four tone levels

| Tone | When | How |
|---|---|---|
| Guided | no loans on record yet (no credit record, or only a card) | short numbered steps, every money word explained |
| Simple | a little borrowing experience | everyday words, one point at a time |
| Standard | an established borrower | clear everyday professional language |
| Detailed | long, varied borrowing experience | a little more context, still plain words |

Every tone line follows the Saral plain-language rules (ADR-0006): no internal terms
(no FOIR, DTI, score bands, rule ids), no thresholds or cut-offs, no targets or gaps,
and no numbers. The experience cut points live only in `classifier.py`.

## Output

```json
{"segment": "Simple", "how_to_explain": ["Use everyday words and very short sentences.", "..."]}
```

Only `segment` and `how_to_explain`. In the agent, the segmentation stays in the graph
state. The prompt gets the tone lines (not the label) in front of the plain-language
style, and `AgentResponse` carries no segmentation field.

## CLI

```bash
python decision_engine/segmentation/customer_segmentation.py --reports tests/fixtures/segmentation/saral_v1_bureau_reports.json
```

## Agent hook

`loan_advisory.agent.segmentation.bureau_report_from_record(rec)` reads a `bureau-report/1`
record attached to the decision evidence as `bureau_report`. Decision evidence does not carry
that record yet, so until it does the agent keeps the default plain-language style (no tone).
Wiring the record (or a stored tone) into the evidence is tracked for Qoder.
