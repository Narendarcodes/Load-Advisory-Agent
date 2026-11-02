# Reproducibility

Can another developer, on another machine, clone this repository and run the Frappe borrower platform
without asking how the original laptop was configured?

**Answer, as of 2026-11-02: yes for the portal, with two named gaps.** Details in
[final-reproducibility-report.md](final-reproducibility-report.md); the run record is
[clean-clone-audit.md](clean-clone-audit.md).

## Start here

| If you want to | Go to |
| --- | --- |
| install and run everything | [../development/setup.md](../development/setup.md) — the procedure executed from the clean clone |
| run it day to day, start and stop services | [../development/local-development.md](../development/local-development.md) |
| know what a variable does, or why a service refuses to start | [../development/environment-variables.md](../development/environment-variables.md) |
| fix something that broke | [../troubleshooting/README.md](../troubleshooting/README.md) |
| deploy it | [../deployment/README.md](../deployment/README.md) |
| run the tests | [../testing/README.md](../testing/README.md) |
| see versions, manifests and what is pinned | [dependency-matrix.md](dependency-matrix.md) |
| know what is *not* reproducible and why | [known-limitations.md](known-limitations.md) |
| understand the architecture and diagrams | [../architecture/README.md](../architecture/README.md) and [diagram-inventory.md](diagram-inventory.md) |

## What this folder holds

| File | Purpose |
| --- | --- |
| [clean-clone-audit.md](clean-clone-audit.md) | the actual clone run: commands, results, every failure and its root cause, and what was not verified |
| [dependency-matrix.md](dependency-matrix.md) | component by component: version, manifest, install command, verification, mandatory vs optional |
| [final-reproducibility-report.md](final-reproducibility-report.md) | the verdict against the definition of done |
| [known-limitations.md](known-limitations.md) | external prerequisites, unpinned artefacts and the two gaps |
| [database-reproducibility.md](database-reproducibility.md) | how schema and synthetic data are recreated, and what stays outside git |
| [diagram-inventory.md](diagram-inventory.md) | every diagram, its source, and whether it matches the code |
| [test-results.md](test-results.md) | fresh numbers, separated from historical baselines |
| [security-audit.md](security-audit.md) | secret and public-repository scan summary |
| [evidence/EVIDENCE.md](evidence/EVIDENCE.md) | the artefacts of the one clean-clone run: checksummed screenshots, the two machine-readable result files, the exact commands, and what was withheld |

Installation validation, service startup, service shutdown and environment variables are deliberately
**not duplicated here**; `docs/development/setup.md`, `docs/development/local-development.md` and
`docs/development/environment-variables.md` are the single sources for those subjects.

## A rule, not a suggestion

Where an installation step failed, the fix went into the repository — a manifest, a script, a compose
override or a corrected harness — and the documentation then described what actually worked. No entry
in this folder was written from inspection alone, and no number here is a historical baseline presented
as a fresh result.

## Do not duplicate

These subjects already have one authoritative home. This folder points at them rather than restating
them, so there is never a second source of truth to fall out of date:

- setup and startup → `docs/development/setup.md`, `docs/development/local-development.md`
- variables → `docs/development/environment-variables.md`
- disposable-site operations → `docs/development/frappe-disposable-environment.md`
- test plans and counts → `docs/testing/borrower-platform-test-plan.md`
- production contract → `docs/audit/frappe-hardening-report.md`
- release history → `docs/release/`
