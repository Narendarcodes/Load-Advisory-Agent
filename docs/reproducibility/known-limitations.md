# Known limitations

Everything here was confirmed by observation in the 2026-11-02 audit, not inferred. Each item says what
blocks it and whether a developer can resolve it locally.

## Blocks a clean reproduction

| Item | Status | What a developer must do |
| --- | --- | --- |
| **Frappe image** `loanrangers-frappe:16` | not published anywhere; no Dockerfile is vendored in this repository | build it: frappe_docker at `e08b50c`, `images/layered/Containerfile`, `apps.json` from this repo, ~20 minutes. On Windows the CRLF entrypoint trap in [setup.md](../development/setup.md) step 3 must be avoided or the containers restart-loop |
| **Policy RAG index** | `LOAN_POLICY_DIR` has no value in the repository and defaults to a path on the original author's machine. The vector index the primary environment uses lives outside git, in another checkout | either run without retrieval (`--no-rag`, the documented default) or build an index from `data/sources` with `requirements-rag.txt`. Until then, **citations cannot be reproduced on a clean machine** |
| **Embedding + reranker weights** | `google/embeddinggemma-2` and `BAAI/bge-reranker-v2-m3` come from Hugging Face on first use | multi-GB download; or a pre-populated local cache. Cached here, so a fresh download was not verified |
| **GPU** | only needed for retrieval | a 4 GB card holds embedder + reranker at ~2.6 GB provided no per-process fraction cap is applied; CPU works and is slow (~10 s a query). Not required for the portal at all |

## Product limitations that are design decisions, not bugs

No real credit bureau. The bureau is a loopback synthetic service; scores are not CIBIL or FICO, and
its data-quality staleness and variance gates are disabled.

No KYC verification. No identity document is checked, no OTP is sent, no camera or biometric path
exists, and no government system is contacted. The KYC workspace is a workspace.

No payments. There is no gateway, mandate, receipt or bank-account integration. The pay control on the
servicing page is disabled and the loan card there is generated demo data.

No OCR. Uploaded documents are stored and downloaded; nothing is read from them.

No email. There is no SMTP, so no password reset, no invitation delivery and no verification mail. The
login screen tells users to ask their advisor; that is the whole recovery path.

Accounts are invitation-only; there is no self-signup.

**Untrusted prototype policy.** The four underwriting thresholds are `synthetic-v1`, the team's own
assumption. Every decision card and assistant answer says so.

## Correctness caveats that survive into main

| Caveat | Detail |
| --- | --- |
| **Tracing does not work** | the Langfuse exporter is constructed with no span processor attached, so spans are created and dropped. The Langfuse server is healthy and its OTLP endpoint answers; `traces` stays empty. Do not demo this as trace coverage |
| **Old consent timestamps are wrong on purpose** | before the controller fix, any profile save restamped `consent_at`. Pre-fix rows mean "last save", not "consent", and were deliberately not repaired row by row. New behaviour is correct; history is not trustworthy. There is no append-only consent event store (deferred) |
| **Citation accuracy is measured, not asserted** | strict accuracy 0.59 by default, 0.80 in `primary_source` mode, 0.67 with the opt-in verifier. A citation can be a passage that does not support its sentence. Retrieval finds citable text; it never decides eligibility |
| **Policy corpus is mixed** | real published RBI/bank text alongside one synthetic reference-lender document. Some "current" rejection-reason answers rest on historical sources. Rejection of the corpus's own register sign-off is still open |
| **Screen-reader support unproven** | no NVDA pass has been run. Keyboard reachability and the accessibility tree are audited; that is not the same claim and must not be reported as one |
| **Voice cannot be deployed** | `livekit_url` is `wss://livekit.invalid`; there is no server, no worker credential and no per-session token path |
| **Not a production deployment** | single machine, self-signed, one Redis, one nginx, no load or real-device testing, and the seed writer holds System Manager. "Works here" is not "ready to deploy" |
| **CI covers one suite** | `ruff + pytest` only; the Frappe, island, runtime and browser gates are local |

## Open risks a developer should know about before trusting a check mark

The ruleset on `main` requires one approving review and configures **no** required status checks, so a
merge can be authorized with CI green while the local-only suites never ran. Treat "CI passed" as
"ruff and pytest passed".

`infra/frappe/loanrangers.yml` pins its volumes to `frappe_docker_*`, which do not carry the compose
project prefix. Starting a second stack without `loanrangers.isolated.yml` mounts a running stack's
live database. This was observed during the audit.

The repository is public. Anything pushed to it is published, including documentation and fixtures.
