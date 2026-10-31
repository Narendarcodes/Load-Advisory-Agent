"""Agent-only HTTP surface.

Frappe owns borrower identity and data; this package accepts exactly one credential —
a short-lived assertion minted by the portal — and exposes only what the agent runtime
needs: AG-UI, the voice chat routes, the bureau pipeline and a health probe.
"""
