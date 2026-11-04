# Saral OCR bake-off: PR #41 Tesseract vs PaddleOCR PP-OCRv5, plus signature screening

Track B, Phase 4 (document intelligence). Branch `feat/saral-ocr-paddle-signature`, cut from PR #41's head (`dd45a2f`).

> **Every number below is AUTOMATED, measured on SYNTHETIC documents only.** No real person, ID
> number, employer or bank is in the data. Every page carries a `SPECIMEN - SYNTHETIC` banner, the PAN
> numbers start `ZZ`, and the Aadhaar numbers start `9999` with a valid Verhoeff check digit. Half the
> Aadhaar cards show only the last four digits. Synthetic layouts are cleaner and more uniform than real
> scans, so treat these figures as a ranking of the engines, not as production accuracy. Nobody has
> reviewed them by hand.

## 1. Results at a glance

Primary set: 40 documents (8 applicants x PAN, Aadhaar, payslip, bank statement, employment letter),
each with a clean page, one degraded twin (rotation 2-7°, Gaussian blur, JPEG q15-25 plus noise, or a
phone-photo perspective warp, cycled) and a low-resolution twin (40-50% scale, JPEG q80). That makes
120 pages. Both engines feed the **same PR #41 parser** (`document_parser.parse`), so any difference in
field accuracy comes from the OCR.

| Metric (120 pages, AUTOMATED) | Tesseract 5.5 (PR #41) | Paddle PP-OCRv5 **mobile** | Paddle PP-OCRv5 server |
|---|---|---|---|
| All fields, exact match | 65.5% (291/444) | **75.5% (335/444)** | 68.5% (304/444) |
| PAN, all 10 characters | 46% (11/24) | **100% (24/24)** | 92% (22/24) |
| Net pay | 83% (20/24) | **100%** | **100%** |
| Employer | 94% (45/48) | **96%** (46/48) | 62% (30/48) |
| Statement salary credits (sum) | 54% (13/24) | 54% (13/24) | 29% (7/24) |
| Name (all docs; limited by the parser, see §3) | 41% | 42% | 42% |
| DOB (PAN + Aadhaar; limited by the parser) | 42% | 50% | 50% |
| Amounts (6 money fields) | 83% | **92%** | 84% |
| Dates | 61% | **67%** | 65% |
| CER / WER, clean (line-aligned) | 1.5% / 2.6% | **0.2% / 1.5%** | 0.8% / 8.8% |
| Bank transactions, full row read: clean / degraded / low-res | 100% / 43% / 30% | 100% / 77% / 88% | 94% / 78% / 91% |
| Median s/page (80-page run without low-res) | **0.45** | 0.89 | 3.42 |
| Median / max per-page peak memory (process tree) | **111 / 145 MB** | 1.5 / 1.9 GB | 3.0 / 4.75 GB |

**Recommendation:** keep Tesseract as the default and as the fallback behind PR #41's interface. Add
PaddleOCR **PP-OCRv5 mobile** (not server) as an opt-in primary engine through the adapter and chain
on this branch, and switch the default only after the three fixes in §5. Do not adopt PP-Structure tables
or the PP-OCRv5 server models on this hardware.

Full tables: `docs/saral/ocr_bakeoff/tables_banner_120pages.md` (primary) and
`docs/saral/ocr_bakeoff/tables_overlay_watermark_80pages.md` (watermark stress test).

## 2. Setup

| Item | Value |
|---|---|
| Machine | InstaBox `narendar-builds`: 4 vCPU, 7 GB RAM, no GPU. Work in `/data/ocr`, `TMPDIR=/data/tmp` |
| Tesseract | 5.5.0, `eng`, PR #41 `extractor.extract_lines` unchanged (TSV over stdin) |
| PaddleOCR | paddleocr 3.7.0 + paddlepaddle 3.2.0 CPU, Python 3.12 venv. `PP-OCRv5_{mobile,server}_{det,rec}`. Document orientation, unwarping and text-line orientation off |
| PP-Structure | `TableRecognitionPipelineV2` (layout + table + PP-OCRv5 server OCR), bank pages only |
| Parser | PR #41 `document_parser.parse` for every engine |
| Data seed | 20261103. The `--watermark banner` and `--watermark overlay` sets differ only in the overlay. The 80 shared pages were byte-identical between the two banner runs (md5-checked) |

How to reproduce:

```bash
python scripts/saral_ocr/generate_synthetic_docs.py --out /data/ocr/synth_banner_v2 --watermark banner --extra-low-res
for e in tesseract paddle_mobile paddle_server ppstructure; do
  python scripts/saral_ocr/ocr_bakeoff.py run --engine $e --data /data/ocr/synth_banner_v2 --out /data/ocr/results_v2
done
python scripts/saral_ocr/ocr_bakeoff.py report --out /data/ocr/results_v2
python scripts/saral_ocr/signature_screening.py --data /data/ocr/synth_banner_v2 --out /data/ocr/results_v2
```

Two kinds of accuracy are reported, so parser gaps are not blamed on an engine:

* **parsed exact**: the PR #41 parser's field equals the ground truth. Names are compared case- and whitespace-insensitively, money to the paisa, dates in ISO format. For PAN and Aadhaar, the masked output is compared with the masked truth.
* **read in text**: the printed value appears anywhere in the recognised text, ignoring whitespace.

## 3. Findings

1. **PAN.** Tesseract misreads the final letter `I` as `1` in a monospaced PAN font (for example `ZZBPN86631`), so PR #41's PAN regex rejects the value. Tesseract failed the PAN on 13 of 24 pages. `I`→`1` was the failure seen in the pages inspected, but not every miss was inspected. Paddle mobile read every PAN exactly.
2. **Names and DOB are capped by the parser, not the OCR.** PAN cards print the label above the value ("Name" on one line, then the name), and Aadhaar prints the name with no label. PR #41's same-line `^name: (.+)$` regex therefore misses these for every engine. Text recall for names is 73-79%, but parsed accuracy is about 42%. The PAN date of birth is missed the same way. This is worth a parser fix in PR #41 for both engines.
3. **Paddle server drops spaces between English words** (`CRSALARYVARDHAN`, `VardhanLedger`). That is why its WER is 8.8% on clean pages while its CER is 0.8%. It breaks `\bsalary\b` (salary credits 29%) and employer matching on degraded pages (44%). Mobile does this much less. So server is both slower and worse here.
4. **Paddle is fragile to text-like watermarks.** With the diagonal SPECIMEN overlay crossing the text, Paddle's detector merged watermark letters into fields (`SYNT993TIC`). Clean-page accuracy fell from 76-79% to 51-66%, and DOB fell to 0% on clean pages, while Tesseract stayed at 73% (see the overlay tables). Real e-Aadhaar and bank PDFs do carry watermarks, so preprocessing (§5) or a fallback is needed.
5. **Rotation hurts both engines.** On 2-7° rotated pages, Paddle's row grouping fails for tables (0% of full transaction rows), and Tesseract drops to 42% field accuracy. Deskew before OCR is the cheapest fix.
6. **Blur, JPEG noise and low resolution favour Paddle mobile.** Bank rows: 100% / 100% / 88% for mobile against 0% / 100% / 30% for Tesseract. Field accuracy at low resolution: 72% against 61%.
7. **Validation.** PAN regex with the holder-type letter, Aadhaar Verhoeff, and date sanity (age 18-100, no future employment start, salary date within 400 days) ran on every page. On the banner set they fired only on Tesseract misreads: one PAN shape failure and two Verhoeff failures. Date sanity never fired, because every misread date was missing rather than wrong. A unit test shows it rejects an under-18 DOB.

### Degradation breakdown (all fields, parsed exact, AUTOMATED)

| Engine | clean | rotated | blurred | JPEG noise | phone photo | low-resolution |
|---|---|---|---|---|---|---|
| Tesseract | 73% | 42% | 68% | 72% | 66% | 61% |
| Paddle mobile | **79%** | **72%** | **79%** | **78%** | 74% | **72%** |
| Paddle server | 76% | 58% | 61% | 72% | 74% | 63% |

Rotated, blurred, JPEG and phone-photo pages are 8-10 pages each (36-38 fields), so treat them as directional. Clean and low-resolution are 40 pages each.

### Character and word error rates (AUTOMATED)

"Line-aligned" pairs each printed line with its closest recognised line, so reading order is ignored. "Page" scores whole pages in each engine's own reading order.

| Engine | clean CER / WER | rotated | blurred | JPEG noise | phone photo | low-res |
|---|---|---|---|---|---|---|
| Tesseract | 1.5% / 2.6% | 17.1 / 29.1 | 15.4 / 23.9 | 1.7 / 3.1 | 10.1 / 13.0 | 10.0 / 21.9 |
| Paddle mobile | **0.2% / 1.5%** | 16.7 / 22.9 | **1.2 / 8.6** | **1.2** / 14.6 | **4.2 / 11.1** | **2.3** / 22.5 |
| Paddle server | 0.8% / 8.8% | 18.0 / 32.5 | 4.5 / 41.4 | 3.2 / 35.4 | 7.7 / 36.2 | 3.7 / 39.7 |

Paddle's WER is inflated well above its CER by dropped spaces (finding 3).

### Bank-statement tables

| Method | clean: full rows | degraded: full rows | s/page | peak RSS |
|---|---|---|---|---|
| Tesseract lines (PR #41) | 100% | 43% (low-res included) | 0.45 | 0.15 GB |
| Paddle mobile + line grouping (this branch) | 100% | 77% | 0.89 | 1.9 GB |
| PP-Structure table pipeline (cell-level, 5 columns) | 100% (480/480 cells) | 54% (258/480 cells; no low-res) | **13.4** | **3.9 GB** |

PP-Structure fits in RAM, but it is 15x slower than mobile and no better on clean pages. It is worse on degraded pages. Not recommended now.

### Confidence calibration (does reported confidence predict a correct field?)

| Engine | fields with a value | accuracy | conf <80 | 80-90 | 90-95 | 95-100 | AUROC | ECE |
|---|---|---|---|---|---|---|---|---|
| Tesseract | 293 | 91% | 67% | 76% | 80% | 100% (176/176) | **0.82** | 0.070 |
| Paddle mobile | 321 | 93% | none | none | 88% | 93% | 0.74 | **0.052** |
| Paddle server | 309 | 89% | none | none | 84% | 90% | 0.59 | 0.076 |

Tesseract's confidence ranks errors well: every field at 95 or above was correct. Paddle's box scores sit almost entirely above 90, so they separate right from wrong only weakly. **Do not feed raw Paddle confidence to ZEN as a probability.** Use the field status, the validation checks and engine agreement instead (§4).

### Latency and memory (AUTOMATED, 4 vCPU, CPU only)

| Engine | median / p90 s per page | first page (model load) | idle after import | median / max per-page peak (process tree) |
|---|---|---|---|---|
| Tesseract | 0.45 / 0.65 | 0.2 s | 42 MB | 111 / 145 MB |
| Paddle mobile | 0.89 / 2.10 | 1.7-10 s | 451 MB | 1.51 / 1.88 GB |
| Paddle server | 3.42 / 5.02 | 3.9-4.7 s | 452 MB | 3.03 / 4.75 GB |
| PP-Structure tables | 13.4 / 14.7 | 7.9-15.5 s init | n/a | 3.9 GB process peak |

Latency comes from the 80-page banner run. Memory comes from the 120-page run, where the sampler polled every 10 ms. Paddle's memory grows with page size and stays resident between pages. The 7 GB InstaBox cannot hold the server models alongside the agent stack. Mobile fits with headroom.

### Fallback chain (simulated on the measured results)

| Chain | pages by route (of 120) | all-field exact |
|---|---|---|
| Tesseract alone | n/a | 65.5% |
| Paddle mobile → Tesseract → manual review | mobile 94, Tesseract 2, manual 24 | **75.5%** |
| Paddle server → Tesseract → manual review | server 81, Tesseract 14, manual 25 | 72.7% |

All 24 manual-review routes in the mobile chain are PAN pages. The critical PAN DOB is never parsed (finding 2), so the chain works as designed and the parser fix would clear these routes.

## 4. Integration design (now the default path; see `OCR_DEPLOY.md`)

```
upload -> validate_document (PR #41, unchanged)
       -> chain.extract_document_chain(document_type, bytes, filename)
            1. paddle_engine.extract_lines_paddle   (PP-OCRv5 mobile, lazy singleton, CPU)
            2. extractor.extract_lines               (PR #41 Tesseract, unchanged)
            3. route = "manual_review" when neither attempt finds every critical field
          each attempt -> document_parser.parse (PR #41, one parser for all engines)
                       -> field_checks: PAN regex + holder type, Aadhaar Verhoeff, date sanity
       -> ExtractionResult.as_dict()  (same browser-safe shape; masked IDs; no raw text)
       -> ChainOutcome.zen_inputs()   -> ZEN
```

* **Adapter** (`ocr/paddle_engine.py`). It has the same `(lines, pages, used_text_layer)` contract as `extract_lines`, so PR #41's parser, masking and API stay untouched. It merges Paddle's per-region boxes into reading-order lines anchored on each line's mean centre. Tall watermark boxes are kept separate so they cannot chain rows together. Bytes stay in memory. Model names come from `PADDLE_OCR_DET_MODEL` / `PADDLE_OCR_REC_MODEL`.
* **Chain** (`ocr/chain.py`). The order comes from `SARAL_OCR_ENGINES` (default `paddle,tesseract`; set `tesseract` to keep PR #41 behaviour exactly). The first attempt that FINDS every critical field wins. Otherwise the better attempt is returned with `route="manual_review"`. Critical fields: PAN number + DOB; Aadhaar DOB; payslip net salary + employee name; statement salary credits + account holder; letter employer + start date.
* **Per-field confidence into ZEN.** `zen_inputs()` emits flat values: `ocr_route`, `ocr_needs_manual_review`, `ocr_engine`, `ocr_<field>_status` and `ocr_<field>_confidence` (0-1). Following §3's calibration result, the proposed ZEN rule reads status first: FOUND with validation passed means use the value; LOW_CONFIDENCE, INVALID or MISSING means REFER to a human. Confidence is a secondary signal only, with Tesseract's ≥95 band trusted more than Paddle's. ZEN decides and OCR never does. An income value read by OCR stays a prefill that the applicant confirms, as in PR #41.
* **Validation** (`ocr/field_checks.py`). Each check is recorded with its result and note, and a failed check downgrades the field to INVALID. Nothing is ever filled in.
* **Deployment.** Paddle is optional: when it is missing, `OcrUnavailable` falls through to Tesseract. Budget about 2 GB RSS per OCR worker with mobile and one worker per 4 vCPU. Keep Tesseract installed in `Dockerfile.ocr` as it is now. Add `paddlepaddle==3.2.0` (CPU index) and `paddleocr==3.7.0` (about 0.7 GB installed for `paddle`, plus 22 MB of mobile det+rec model files; the server models are 167 MB and the PP-Structure table models about 1.1 GB) only in an opt-in image.

## 5. Before Paddle becomes the default (status 2026-11-04: items 1-3 done, Paddle mobile is the default)

Done on this branch: deskew (`ocr/preprocess.py`), space-tolerant rules, stacked/bilingual/unlabelled
PAN and Aadhaar names, PAN DOB (labelled, next line, or standalone), plus fixes found on the real
samples in §9. Item 4 is still not built. Item 5 is §9 (public specimens, not consented real scans).


1. **Deskew and orientation** before OCR (Paddle's `use_doc_orientation_classify` or a Hough deskew). Rotated pages are the weakest case for both engines.
2. **Space-tolerant parser rules.** For example, `salary` without `\b`, and a whitespace-free comparison of employer names. Better still, use mobile, which drops fewer spaces.
3. **Parser fixes for PAN and Aadhaar layouts**: a stacked label, then a value on the next line, and the unlabelled name line on Aadhaar. This applies to both engines.
4. Optional: position-aware PAN character repair (the 10th character is a letter, so `1→I`, `0→O`; characters 6-9 are digits) before the regex. This would recover most of Tesseract's PAN misses. Not built.
5. Validate on real-looking scans the team is allowed to use, such as consented specimen forms, before any production claim.

## 6. Signature screening prototype (`scripts/saral_ocr/signature_screening.py`)

> **Screening signal only. This is not identity verification and never proof of forgery.** A low score
> sends the application to a human reviewer (REFER). A high score means only "no flag raised". It must
> never approve or reject anything on its own.

Synthetic set: 30 writers whose "signatures" are random pen strokes. Each writer has a reference, a genuine variant (jitter, pen width, ±4° rotation, ±8% scale) and a simulated skilled forgery (traced shape, larger wobble, a different pen, one stroke redrawn). Random forgeries pair a writer's reference with another writer's genuine variant. Each method's REFER threshold was set on one half of the writers to keep calibration FRR ≤ 10%, then measured on the other half (2-fold).

| Method (AUTOMATED, synthetic) | FRR (genuine referred) | FAR skilled | FAR random | AUC skilled / random | ms per pair |
|---|---|---|---|---|---|
| SSIM after Otsu binarisation + crop | 10% (3/30) | 30% (9/30) | 3% (1/30) | 0.90 / 0.99 | 5.8 |
| ORB keypoint ratio | 10% | 57% | 30% | 0.78 / 0.93 | 2.3 |
| **Classical = mean(SSIM, ORB)** | 10% | **17% (5/30)** | **0% (0/30)** | **0.94 / 1.00** | 8.1 |
| ResNet-18 ImageNet embedding, cosine (generic, not signature-trained) | 10% | 40% | 3% | 0.86 / 0.97 | 12.6 |

**Anomaly score** = 1 - similarity, reported per pair. Median classical anomaly: genuine 0.56, skilled forgery 0.65, random 0.71. REFER when the classical anomaly is above 0.61 (both folds).

**Presence detection and crop quality.** 60 signatures were pasted at random offsets into synthetic form boxes with a printed baseline (JPEG q60-80). There were 30 negative boxes: empty, with a faint stamp-like smudge, or with a stray pen tick.

| Present detected | Negatives correctly empty | Crop IoU mean / median | IoU ≥ 0.8 | IoU ≥ 0.9 |
|---|---|---|---|---|
| 60/60 | 30/30 | 0.986 / 0.997 | 60/60 | 58/60 |

These are easy synthetic cases; real form boxes with overlapping stamps and printed text will be harder.
**Recommendation:** use the classical score as a REFER-only screening signal, with a written threshold and
human review on every REFER. The generic embedding adds cost without benefit here. A signature-trained
model (for example SigNet-style weights) would need licensed data and a separate review before use.

## 7. Files on this branch (all new; nothing in PR #41 modified)

| File | Purpose |
|---|---|
| `scripts/saral_ocr/generate_synthetic_docs.py` | Synthetic PAN, Aadhaar, payslip, bank statement and employment letter pages, with degradations, ground-truth JSON, reference text and signatures |
| `scripts/saral_ocr/ocr_bakeoff.py` | Per-engine runner and report: field accuracy, text recall, CER/WER, tables, calibration, per-page memory, simulated chain |
| `scripts/saral_ocr/signature_screening.py` | SSIM / ORB / embedding screening, anomaly score, presence and crop evaluation |
| `apps/.../ocr/paddle_engine.py` | Experimental PaddleOCR adapter behind PR #41's line interface |
| `apps/.../ocr/chain.py` | Experimental Paddle → Tesseract → manual-review chain and `zen_inputs()` |
| `apps/.../ocr/field_checks.py` | PAN regex + holder type, Aadhaar Verhoeff, date sanity |
| `tests/test_ocr_paddle_chain.py` | Unit tests for line grouping, checks and chain routing (no OCR engine needed) |
| `docs/saral/ocr_bakeoff/*` | Generated result tables and the signature summary |

## 8. Limits of this study

* Synthetic, single-font layouts with 8 applicants. Per-degradation cells hold only 8-10 pages for rotation, blur, JPEG and phone photo.
* No real scans, no Hindi or Telugu text, no multi-page PDFs. All pages were PNG or JPEG.
* The overlay-watermark run's `paddle_mobile` pass started while code was being re-synced on the box (its modules had already loaded). Its PAN-regex check counts also predate a false-positive fix for masked account numbers. Treat that set as a stress test only.
* No human has reviewed these results.

## Synthetic mode (added after the bake-off)

`loan_advisory_portal/ocr/synthetic.py` adds an explicit synthetic mode so the SPECIMEN identifiers in
`docs/saral/SYNTHETIC_DATASETS.md` (feat/saral-synthetic-kyc-bank) validate without loosening production rules.

| | Normal mode (default) | Synthetic mode |
|---|---|---|
| Aadhaar | first digit 2-9 + Verhoeff | first digit 0/1 + Verhoeff **only** |
| PAN | `AAAAA9999A`, `ZZ` series rejected | `ZZ?P?9999?` **only** |
| IFSC (raw check) | `AAAA0XXXXXX`, `XSYNS` rejected | `XSYNS` + 6 digits **only** |

It is on only when the caller passes `synthetic=True` (a document or request flagged synthetic, taken from
server-side state; the portal API reads an application/document `synthetic` field or the site config key
`saral_synthetic_mode`) or when the `SARAL_SYNTHETIC_MODE` setting is on. A real-format number is never
accepted in synthetic mode. Aadhaar is kept as the last four digits only (`XXXX XXXX 1234`); a card printed
masked is read as its last four digits with a note that the checksum cannot be verified.

The bake-off generator now emits `1000…` Aadhaar numbers (same random draws as before, so every other value
is unchanged for a seed) and the bake-off runs validation in synthetic mode. The numbers in this report were
produced earlier with the real-format `9999…` prefix and have not been re-run.


## 9. Real-sample benchmark (public specimen / sample documents, 2026-11-04)

> **AUTOMATED. Public specimen, sample and third-party synthetic documents only. No real person's
> PAN, Aadhaar, payslip or statement was used.** These layouts and fonts are real-world-like (issuer
> specimens, a phone photo of the UIDAI specimen sheet, third-party generators, payroll-vendor and
> educational statement samples), which the §1-§3 synthetic set was not. They are still not
> real customer scans, so read the numbers as engine ranking and failure analysis, not production
> accuracy. Labels were written by hand (or taken from the dataset's own ground truth and
> spot-checked); nobody has double-checked them.

**Documents (46 originals, 184 pages with variants).** Sources, licences and provenance per file are in
`docs/saral/ocr_real/manifest.csv`; masked labels in `docs/saral/ocr_real/labels_masked.json`. Images are
kept out of git.

| Type | Originals | Sources |
|---|---|---|
| PAN | 13 | 12 third-party synthetic cards (HF `whoismatz/pan-card-ocr-synthetic`, Apache-2.0); 1 Wikimedia rendered specimen (CC BY-SA 4.0) |
| Aadhaar | 16 | 12 synthetic fake-app cards (Mendeley `wk6n8fhx3c`, CC BY 4.0); 1 phone photo of the UIDAI PVC specimen sheet (Wikimedia, CC BY-SA); 1 UIDAI e-Aadhaar sample (masked); 2 blank templates as negatives (Wikimedia) |
| Bank statement | 11 | 6 scanned synthetic statements (HF `AgamiAI/Indian-Bank-Statements`, Apache-2.0, page 1); 5 educational sample statements (bankfileconverter.net, fictional holder) |
| Salary slip | 6 | 4 Zoho Payroll samples, 1 Keka sample, 1 Husys sample |

Each original also gets three phone-camera-style variants (`scripts/saral_ocr/real_benchmark.py prepare`):
perspective warp + 4° tilt on a desk-coloured background, the same with a glare blob, and a 0.6x
JPEG at quality 30. Digital PDFs were rasterised at 200 DPI so both engines had to read pixels.
Engines ran through PR #47's interface (`chain._run`: `extract_lines` / `extract_lines_paddle` →
`document_parser.parse` → field checks) in normal (non-synthetic) mode, one process per engine,
on InstaBox (4 vCPU, no GPU). Deskew was on for both engines.

**How "parser outcome correct" is scored.** Many specimen numbers are not valid identifiers
(6 of 13 PANs fail the format or holder-type rule; 11 of the 12 synthetic Aadhaar numbers fail the
Verhoeff checksum or start with 1). For those, the correct outcome is that the parser flags the value INVALID; for valid ones
it is the masked value (`XXXXX1234X`, `XXXX XXXX 1234`). An engine that read nothing scores every
field as wrong.

### Results (all 184 pages; full tables incl. originals-only and phone-only splits in `docs/saral/ocr_real/tables_real_samples.md`)

| Doc type | Field | Tesseract | Paddle mobile | Default chain (Paddle → Tesseract) |
|---|---|---|---|---|
| PAN | PAN, all 10 characters read | 2% (1/52) | 60% (31/52) | 60% (31/52) |
| PAN | PAN, parser outcome correct | 2% (1/52) | 63% (33/52) | 63% (33/52) |
| PAN | Name | 10% (5/48) | 44% (21/48) | 44% (21/48) |
| PAN | DOB | 2% (1/48) | 65% (31/48) | 65% (31/48) |
| Aadhaar | Number read (12 digits / masked last 4) | 29% (16/56) | 96% (54/56) | 96% (54/56) |
| Aadhaar | Parser outcome correct | 29% (16/56) | 96% (54/56) | 96% (54/56) |
| Aadhaar | Name / DOB / gender | 85% / 85% / 88% | 100% / 100% / 100% | 100% / 100% / 100% |
| Aadhaar | Blank template: no number invented | 100% (8/8) | 100% (8/8) | 100% (8/8) |
| Bank | Account holder | 2% (1/44) | 41% (18/44) | 41% (18/44) |
| Bank | Closing balance | 9% (4/44) | 55% (24/44) | 55% (24/44) |
| Bank | Transaction rows (amount + balance on one line), originals | 78% (69/88) | 100% (88/88) | — |
| Salary slip | Employee name | 69% (11/16) | 100% (16/16) | 100% (16/16) |
| Salary slip | Employer | 50% (10/20) | 30% (6/20) | 30% (6/20) |
| Salary slip | Gross / net salary | 46% / 46% | 88% / 88% | 92% / 92% |
| **All fields** | PAN / Aadhaar / bank / slip | 4% / 62% / 6% / 51% | 58% / 98% / 48% / 76% | 58% / 98% / 48% / 79% |

Originals only, all fields: Tesseract 12% / 56% / 9% / 48%, Paddle 88% / 100% / 41% / 71%.
Phone-style variants only: Tesseract 1% / 64% / 5% / 52%, Paddle 48% / 98% / 50% / 78%.

| Engine | pages | median s/page | p90 s/page | peak RSS |
|---|---|---|---|---|
| Tesseract 5 | 184 (24 read nothing) | 0.33 | 2.26 | 172 MB (tesseract) + 164 MB (python) |
| Paddle PP-OCRv5 mobile | 184 (1 read nothing) | 0.52 | 5.96 | **2,990 MB** |

Default-chain routes (pages): PAN 11 Paddle / 0 Tesseract / 41 manual review; Aadhaar 48 / 0 / 16;
bank 0 / 0 / 44; slip 18 / 1 / 5.

### What this shows

1. **Paddle mobile is clearly better on real-world-like layouts**, more than on the §1 synthetic set:
   PAN 60% vs 2% read exactly, Aadhaar 96% vs 29%, statement rows 100% vs 78% on originals and 97-100%
   vs 1-38% on phone/glare variants. This supports making it the default.
2. **Tesseract failed to read anything on 24 pages** (small-font PAN cards after JPEG, glare), and it
   misses wide-spaced Aadhaar digits. As a fallback it still helps: on salary slips the chain beats
   Paddle alone (79% vs 76% all fields) because Tesseract rescued one page Paddle missed.
3. **Manual-review routes are mostly correct behaviour, not misses.** 41 PAN pages route to review
   because the specimen PANs fail the holder-type check (correctly INVALID) or the photo variants
   blur them. All 44 bank pages route to review because these are business current accounts with no
   salary credits, a critical field for a salaried applicant.
4. **Remaining failures, by cause:**
   * PAN on phone/JPEG variants: the HF cards use ~10 px text; at 0.6x JPEG neither engine reads it
     (Paddle 49%). Real phone photos are usually higher resolution.
   * Bank account holder: Paddle merges words in the bold header (`DISTRIBUTIONNETWORKS INDIA`), and
     the educational samples print the holder under a column heading on a line shared with the
     statement period. Not fixed; a column-aware layout step would be needed.
   * Closing balance on the educational samples sits in a header row above its value. Not fixed.
   * Employer on Zoho slips: the header line has no company word (`Zylker`) or carries logo text
     (`Zylker Corp OOUD`). Not fixed.
   * Hindi on Aadhaar cards is read as garbage by both English models; the parser now tolerates a
     garbled token before `/Name:` and `D0B` for `DOB`.
5. **Memory is higher than the §3 estimate.** Peak RSS reached ~3.0 GB on 1,650x2,340 statement
   pages (vs 1.9 GB on the smaller synthetic pages). Budget 3 GB per OCR-serving worker
   (`OCR_DEPLOY.md`).

### Parser fixes made from these samples (all with tests in `tests/test_ocr_paddle_default.py`)
`D0B` read for `DOB`; garbled Hindi label before `/Name:`; masked Aadhaar never matched across a line
break (a blank template's `XXXX XXXX XXXX` above a `1947` helpline line); up to 40 non-digit
characters between a salary label and its amount (`NET PAY (Gross Earnings - Total Deductions) ₹…`,
`Total Net Payable`, `Take Home Salary`); employee number and next column dropped from the name;
`Account Holders Name` / `Account Holder's Name`.

### Limits
Specimen, sample and third-party synthetic documents only; no consented real scans. Small sample:
13 PAN, 16 Aadhaar, 11 statements, 6 slips (46 originals), with augmentation standing in for phone
capture. English models only. One page per statement. Labels hand-written by one person (an
automated agent), not double-checked. Images under "no licence stated" were used for internal
evaluation only and are not redistributed.
