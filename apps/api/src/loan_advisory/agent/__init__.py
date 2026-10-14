"""Loan Advisory Agent (phase 5): ONE controlled LangGraph graph over the existing decision core.

The agent explains recorded decisions; it never decides. Decisions come only from the conventional
workflow (lifecycle.process_application -> ZEN -> Decision Evidence record). What-if answers are
in-memory simulations through the same ZEN path (lifecycle.simulate), never persisted.
"""
