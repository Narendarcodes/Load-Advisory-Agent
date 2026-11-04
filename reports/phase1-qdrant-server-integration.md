# Phase 1.6 §A — Qdrant Server-backed retrieval

Date: 2026-11-03 (IST). Branch `feat/agent-boundary-corpus-reset`, commits `7503b7a` (implementation) and
`4758cb2` (the live verification). Machine: Windows 11 x64, CPython 3.14.4 for the offline suite and
`.venv-embed` (torch 2.12.1, sentence-transformers 6.2.0, qdrant-client 1.19.1) for anything that loads a
model. No secret value appears in this document; the server's key was passed to the container through an
`--env-file` and read back only into process environments.

Phase 1.5 recorded this as **BLOCKED, 0 of 4**: *"Qdrant Server is not an architecture the application
has"* — the serve path was `QdrantClient(path=...)`, `url=` existed only on the builder, no config slot,
no container. That was true and it is no longer true. The owner's decision was that server-backed
retrieval stays a required integration target rather than being replaced by the embedded collection, so
this milestone wired it, verified it against a real server, and kept the two sides deliberately unequal.

## 1. Architecture: one selection rule, two asymmetric surfaces

`rag/dense_read.py` is the serving module. `rag/retrieve.py:DenseIndex` remains the builder, and index
management (create, payload indexes, upsert, replace) stays in the tooling — `scripts/policy/` for the
real corpus, `tests/e2e/qdrant_server_fixture.py` for this verification.

Selection comes from configuration alone:

| Configuration | Result |
|---|---|
| `AGENT_QDRANT_URL` unset | embedded/local mode at `AGENT_QDRANT_DIR` or `<LOAN_POLICY_DIR>/qdrant_v2` — the existing behaviour, unchanged |
| `AGENT_QDRANT_URL=https://host:port` | Qdrant Server mode, `AGENT_QDRANT_API_KEY` optional, `AGENT_QDRANT_COLLECTION` (default `policy_chunks_v2`) |
| URL **and** an explicit `AGENT_QDRANT_DIR` | refused: "one index per process", not resolved by precedence |
| URL with a path, query, fragment or userinfo | refused — the client appends its own routes, and credentials belong in the key slot |
| `AGENT_QDRANT_COLLECTION` set but empty | refused |
| no location at all | refused, naming all three settings |

What the serving runtime may do is a strict subset of what a Qdrant client can do.
`ReadOnlyDenseSearch.open()` keeps three things: a bound `query_points`, a filter builder, and strings.
Its whole public surface is `{backend, close, collection, describe, location, open, search}` — seven names,
none of them a mutation. Opening is not passive: it refuses to start unless the collection exists and
matches the corpus it is about to be asked to search (`validate_collection`: vector size, distance, point
count, and the exact `chunk_id` set — missing *and* extra). The embedded mode additionally checks the
`index_compat.json` sidecar. A failed open closes the client, so an embedded directory is never left
locked, and a missing collection in either mode names the tooling that should create it instead of
creating it.

`PolicyTools.__init__` now runs `assert_reader` on the retriever, so the vector-index mutation names in
`WRITE_METHOD_NAMES` (`upsert`, `create_collection`, `delete_points`, `overwrite_payload`, …) are enforced
against the object the borrower's turn can reach, in either mode. A `DenseIndex` handle passed where a
serving handle belongs fails at construction.

Parity of behaviour, which §A asked for explicitly: `qdrant_filter` moved to module level in
`rag/retrieve.py` and is used by the builder and the serving read alike, so governance (approval status,
lender, entity type, source type) cannot drift between an embedded index and a server collection.
Dimensions, distance, payload keys, point ids and the citation mapping are the same objects on both paths.

## 2. What the live run used

| Component | Value |
|---|---|
| Server | `qdrant/qdrant:v1.19.1`, container `p16-qdrant`, `--rm`, no volume, published `127.0.0.1:6333/6334` only |
| Authentication | `QDRANT__SERVICE__API_KEY` set through `--env-file`; the container was started with no other port exposure |
| Client | `qdrant-client` 1.19.1 in `.venv-embed` — the server tag was pinned to the client's minor version rather than to `latest` |
| Collection | `p16_synthetic_policy` — 9 points, vector size 768, distance COSINE, status green, 6 segments |
| Corpus | nine synthetic chunks written by the fixture script into its own policy directory (`C:\tmp\p16\policy`), `corpus_hash bf5d6fba5b6f504b…` |
| Embedded index | `runs/policy_local/qdrant_v2` (13 MB, the real 1,557-chunk index) — **not opened, not read, not written** by anything here |

The fixture corpus is synthetic on purpose. Rebuilding, re-embedding, migrating or overwriting the
production index is out of bounds this milestone, and serving the *real* corpus from a server would have
required exactly that: `validate_collection` compares the collection against the chunk set in
`chunks.jsonl`, so a server collection is only usable with the corpus it was built from. A separate
synthetic collection is the way to verify the architecture without touching the data.

Nine chunks, one distinctive token (`zephyr-quota`) that appears in no other corpus, and a payload spread
chosen so the filter has something to exclude:

| chunk | what it is | allowed under the `bajaj_finance` profile |
|---|---|---|
| `SYN-PL#000`, `SYN-PL#001` | BFL policy/terms, approved | yes |
| `SYN-RBI#000` | regulator, `lender_id: null`, `applies_to_entity: ["nbfc"]` | yes |
| `SYN-HIST#000` | approved_historical, superseded | only in historical mode |
| `SYN-COMP#000` | competitor lender (`HDFC`), approved | **no** |
| `SYN-BANK#000` | regulator, `applies_to_entity: ["bank"]` | **no** |
| `SYN-EDU#000` | `source_type: lender_education` (opt-in per query) | **no** |
| `SYN-PEND#000` | `approval_status: pending_review` | **no** |
| `SYN-EVIL#000` | instruction-shaped text, `pending_review` | **no** |

## 3. Live results — 14 of 14

`tests/test_qdrant_server_live.py`, run against the server above: **14 passed** in 199 s. They skip with
the setup command in the reason when `AGENT_QDRANT_URL` / `AGENT_QDRANT_COLLECTION` /
`P16_QDRANT_POLICY_DIR` are absent, so no service means no pass.

| §A verification point | Test | Result |
|---|---|---|
| 1 connectivity and authentication | `test_a1_the_server_is_reachable_and_the_key_is_the_one_it_accepts` | PASS — collection exists, 9 points |
| 1 authentication, the negative side | `test_a1_a_wrong_key_is_refused_rather_than_serving_an_empty_index` | PASS — HTTP 401 raises out of `open()`; a wrong key is not an empty index |
| 2 the runtime selects server mode | `test_a2_the_runtime_selects_server_mode_from_configuration_alone` | PASS — mode `server`, origin used verbatim |
| 2 query-only serving client | `test_a2_the_serving_handle_is_read_only_and_holds_no_management_surface` | PASS — exactly seven public names, `assert_reader` accepts it, `describe()` leaks no credential |
| 3 dense retrieval through the server | `test_a3_dense_search_returns_server_points` | PASS |
| 3 the application path, not a direct call | `test_a3_the_application_search_path_is_the_server_backed_one` | PASS — `PolicyTools.search` → hybrid fusion → rerank, dense leg from the server |
| 4 expected synthetic documents | `test_a4_the_document_that_holds_the_answer_is_returned` | PASS — `SYN-PL#000` ranked first |
| 4 the entity-filtered regulator chunk | `test_a4_a_regulator_chunk_for_this_entity_type_is_reachable` | PASS — `SYN-RBI#000` |
| 5 payload filters | `test_a5_payload_filters_are_applied_server_side` | PASS — see §4 below |
| 5 citation labels | `test_a5_citation_labels_map_to_the_same_fields_as_the_corpus` | PASS — label/document/title/section/approval status per source chunk, profile relationship on lender chunks only |
| 6 competitor and adversarial filtering | `test_a6_competitor_and_adversarial_content_never_reaches_the_borrower` | PASS — 10 searches, no out-of-scope chunk in any of them |
| 6 historical reachability without leakage | `test_a6_historical_mode_reaches_the_superseded_chunk_and_nothing_more` | PASS |
| 7 collection unchanged while serving | `test_a7_the_collection_is_identical_after_serving` | PASS — see §5 |
| 7 no write surface | `test_a7_the_serving_handle_exposes_no_write_operation_at_all` | PASS |

## 4. One finding worth more than the passes

The filter assertion had to be written twice, because the first version was wrong in a way that would
have been invisible on the embedded index.

`ReadOnlyDenseSearch.search(qvec, mode, k)` accepts a mode *string*. `_as_filter("current")` produces a
`RetrievalFilter` with only `mode="current"` set — which means the **approval-status condition alone**. The
lender, entity-type and source-type conditions come from `profile_filter(profile, mode)`, and that is what
`PolicyTools` passes down. So a direct `search(vec, "current")` on the server is *not* the agent's filter.
Asserting the profile's exclusions against it fails — the competitor, bank-only and education chunks all
come back, correctly, because nothing asked the server to exclude them.

The test now asserts both halves: with the profile `RetrievalFilter`, no out-of-scope chunk appears at any
`k`; without it, they do — and that second assertion is labelled as the reason the first one exists. The
behaviour is identical embedded and server-side (the same `qdrant_filter` builds both), so this is not a
server defect; it is a boundary that only becomes visible when someone queries the handle directly.

## 5. Before/after state, as measured

`test_a7_the_collection_is_identical_after_serving` snapshots, then runs six searches (three queries,
each once current and once historical), then snapshots again and compares dictionaries:

- `points_count`, `indexed_vectors_count`, `segments_count`, `status`;
- vector `size` and `distance`;
- the full collection config serialised and hashed (`config_sha256`), which covers HNSW/optimizer/replication
  parameters rather than trusting a hand-picked subset;
- every point id and every payload, canonical-JSON-sorted;
- the payload-schema key list — which reads back **empty** on this server even though the builder called
  `create_payload_index` for four keys, so "schema unchanged" here is asserted on the config hash and the
  point/payload sets rather than on a non-empty index list. Worth checking separately before relying on
  payload indexes for a large collection;
- a size-and-mtime fingerprint of `runs/policy_local/qdrant_v2`, identical before and after, which is how
  "the embedded index was not touched" is proved rather than promised.

## 6. Reproduce

```sh
# 1. disposable server, pinned to the client's version, loopback only, keyed
openssl rand -hex 16 > /tmp/qdrant-key            # then write QDRANT__SERVICE__API_KEY=… into an env file
docker run --rm -d --name p16-qdrant -p 127.0.0.1:6333:6333 -p 127.0.0.1:6334:6334 \
  --env-file /path/to/qdrant.env qdrant/qdrant:v1.19.1

# 2. setup client: isolated synthetic collection, built by the builder, not the serving runtime
export AGENT_QDRANT_URL=http://127.0.0.1:6333 AGENT_QDRANT_COLLECTION=p16_synthetic_policy
export AGENT_QDRANT_API_KEY=…                     # from that env file
.venv-embed/Scripts/python.exe tests/e2e/qdrant_server_fixture.py \
  --out /tmp/p16-policy --device cpu

# 3. the live verification
export P16_QDRANT_POLICY_DIR=/tmp/p16-policy
PYTHONIOENCODING=utf-8 .venv-embed/Scripts/python.exe -m pytest tests/test_qdrant_server_live.py -q

# teardown: delete the fixture collection (the embedded index is never part of this)
.venv-embed/Scripts/python.exe tests/e2e/qdrant_server_fixture.py --out /tmp/p16-policy --drop
docker rm -f p16-qdrant                            # --rm and no volume: the keyspace leaves with it
```

## 7. Residual gaps, named rather than smoothed over

1. **Server mode has no provenance sidecar.** `index_compat.json` is a directory artefact, so in server
   mode the identity check is `validate_collection` — vector size, distance, point count, `chunk_id` set.
   That would catch a different-dimension model or a stale corpus, but **not** the same-dimension model
   swap or the query-prompt change that the sidecar does catch in embedded mode. A server collection needs
   its own provenance store (collection metadata or a named sidecar key) before the production corpus is
   served from a server.
2. **The production corpus has never been served from a server.** Deliberate: doing it means building a
   server collection from the real 1,557 chunks, which this milestone forbids. The architecture is verified;
   the migration is not performed.
3. **Embeddings must match.** Any future server build must use the same `EMBED_MODEL`, `DOC_PREFIX` and
   `QuestionAnswering` query prompt as the serving process, or the vectors are silently incomparable — see
   gap 1.
4. **No auth beyond a key.** TLS is not configured here (the client warns on key-over-plaintext, which is
   correct for loopback and wrong for anything remote); API-key-only and RBAC behaviour of a real Qdrant
   Cloud/enterprise deployment is untested.
