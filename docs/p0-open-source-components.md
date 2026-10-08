# P0 Open-Source Components

| Project | URL | Version | License | Purpose | Modified |
|---|---|---|---|---|---|
| Frappe Framework | https://github.com/frappe/frappe | v16 (`version-16`) | MIT | Loan app platform (live install pending) | No |
| Frappe Lending | https://github.com/frappe/lending | v16 (`version-16` branch) | AGPL-3.0* | Loan DocTypes + API | No |
| ZEN Engine (Python) | https://github.com/gorules/zen | 2.1.2 (PyPI `zen-engine`) | MIT | Deterministic rules evaluation | No |
| pydantic | https://github.com/pydantic/pydantic | v2 | MIT | Canonical schema validation | No |
| requests | https://github.com/psf/requests | 2.31+ | Apache-2.0 | Frappe REST client | No |
| pytest | https://github.com/pytest-dev/pytest | 8+ | MIT | Tests | No |

\* Verify Lending's license file at install time; AGPL-3.0 has network-use
copyleft implications for P1 planning. No upstream source is copied into this
repo — everything is consumed as dependency/branch. No `node_modules`, bench,
or site data is committed.
