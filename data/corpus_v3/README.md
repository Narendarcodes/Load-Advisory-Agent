# Saral corpus v3: two collections (Gate G1)

Metadata only. Raw pages and extracted texts stay outside git, as `policy_manifest_v2.json` already does.

| Collection | Source | What it holds |
|---|---|---|
| `saral_nbfc_policy` | Bajaj Finance Limited (`lender_id: BFL`) | Bajaj's public personal-loan pages and policies. Bajaj is a **public reference lender, not a partner**. |
| `rbi_regulatory` | Reserve Bank of India | RBI texts that apply to an NBFC personal-loan borrower. These are never merged with the NBFC set. |

Owner decisions (2026-11-03): Saral follows the published policies of one NBFC, Bajaj Finance. RBI texts get their own collection. **No new documents** were fetched. Products are personal loans grouped by purpose. Flexi Dropline and Flexi Hybrid are repayment variants, not products.

## Files

- `collections.yaml`: the include or exclude decision for every registered document, with its reason, the text fixes and the flags. You edit this file by hand.
- `manifest.json` / `manifest.csv`: generated, one row per document. Each row records:
  - the collection, the decision and the reason;
  - the doc type, the source URL, the as-of date and when it was fetched;
  - the sha256 of the cleaned text;
  - the chunk count before and after cleaning, and the duplicates dropped;
  - the fixes applied and the flags.
- `chunk_index.csv`: generated. Gives the id, section, pages, word count and sha256 of every indexed chunk. It holds no text.
- `dedup_log.json`, `conflicts_scan.json`, `purpose_mentions.json`: generated evidence for the G1 report.
- `smoke_test.json`: the live-local retrieval smoke test, produced by `scripts/policy/index_corpus_v3.py`.

## Rebuild

```bash
# 1. clean + chunk (repo chunker, default settings). Reads the already-fetched texts; writes chunk text outside git
python scripts/policy/build_corpus_v3.py --src <runs/policy_local/src> --out <dir outside git>
# 2. embed + LOCAL embedded Qdrant (one directory per collection) + smoke test. Never a server.
python scripts/policy/index_corpus_v3.py --chunks <same dir> --qdrant-dir <dir>/qdrant_v3 --report data/corpus_v3/smoke_test.json
```

Nothing here changes `data/sources/policy_register.yaml`, the `bajaj_v1` benchmark, `policy_chunks_v2` or the agent runtime. Wiring the runtime to the two collections is a later gate.
