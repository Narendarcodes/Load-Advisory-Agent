"""The only graph stages a client may see.

The browser owns the wording. A node not listed here can still run; it is simply never announced,
and nothing about its inputs, outputs or arguments is ever published.
"""

PUBLIC_STAGES = ("authenticate", "load_evidence", "retrieve_policy", "what_if", "compose")
