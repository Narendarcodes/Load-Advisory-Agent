"""Typed input/output contracts of the advisory agent (handoff Phase 5 "Input/Output contract")."""
from typing import Literal

from pydantic import BaseModel, Field

Literacy = Literal["low", "medium", "high"]
Action = Literal["answer", "clarify", "simulate", "handoff", "refuse"]
Intent = Literal["explain", "improve", "what_if", "policy", "boundary", "greeting", "other"]


class Session(BaseModel):
    """Server-side authenticated identity. NEVER taken from the message or the LLM."""
    applicant_ref: str
    authenticated: bool = True


class AgentRequest(BaseModel):
    request_id: str
    conversation_id: str
    message: str = Field(min_length=1, max_length=4000)
    channel: Literal["text", "voice"] = "text"
    locale: str = "en"                      # en | hi | te (answer language)
    literacy: Literacy = "medium"           # applicant-chosen loan familiarity
    application_ref: str | None = None      # must be authorized server-side


class Citation(BaseModel):
    label: str
    chunk_id: str | None = None
    document_id: str
    title: str
    section: str | None = None
    page: int | None = None
    source_url: str | None = None
    approval_status: str | None = None
    publisher: str | None = None
    relationship: str | None = None         # e.g. "public reference lender, not a partner"
    applies_to_entity: list[str] | None = None


class AgentResponse(BaseModel):
    request_id: str
    trace_id: str
    intent: Intent
    action: Action
    answer: str
    abstained: bool = False
    citations: list[Citation] = []
    evidence_refs: list[str] = []
    missing_information: list[str] = []
    handoff_ref: str | None = None
    decision_card: dict | None = None
    improvement_plan: list[dict] = []
    what_if: dict | None = None
    guard_flags: list[str] = []
    timings: dict = {}
    error: str | None = None
