# P0 Versions (verified 2026-10-08)

| Component | Version | Source |
|---|---|---|
| OS | Windows 11 Home Single Language, 64-bit (x86-64) | `Get-ComputerInfo` |
| WSL | Ubuntu (v2, default distribution present) | `wsl --status` |
| Docker | 29.8.1, Compose v5.5.1 | `docker --version` |
| Python | 3.14.4 | `python --version` |
| Node | v24.15.0, npm 11.9.0 | `node --version` |
| Frappe Framework | v16 line (stable since 2026-01-12; e.g. v16.30.0 Aug 2026) | frappe.io blog + release feed |
| Frappe Lending | v16 line (released 2026-06-15, `version-16` branch) | frappe.io blog; repo uses branch-based distribution — `latest` API returns CI asset tags, no numeric release tags |
| ERPNext (bundled dep of Lending) | v16 line (e.g. v16.36.0 Sep 2026) | release feed |
| ZEN Engine (`zen-engine` PyPI) | **2.1.2** (pinned in `requirements.txt`) | `pip index versions zen-engine` (2.1.x: 2.1.2/2.1.1/2.1.0; 2.0.0 first stable 2026-08-20) |
| pydantic / requests / pytest | pydantic>=2, requests>=2.31, pytest>=8 | `requirements.txt` |

Install approach: ZEN + Python deps via pip (prebuilt wheels, no Rust toolchain).
Frappe via official Docker/bench flow on WSL2 Ubuntu (see `p0-environment.md`).
Compatibility: ZEN 2.x Python binding ships Windows wheels — verified working on
this machine (Python 3.14). Frappe v16 requires Linux containers — hence WSL2.
