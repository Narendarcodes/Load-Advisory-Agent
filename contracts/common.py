"""Shared building blocks for the Saral contracts.

Everything here is a development contract for SYNTHETIC data. Nothing in this
package decides a loan; it only fixes the shape of the data that moves between
the applicant record, OCR, the synthetic bureau, ZEN and the agent.

Two invariants live here because every contract needs them:

* identifiers are synthetic (``SYN-<KIND>-<SUFFIX>``), and
* no string anywhere in a contract may carry a full PAN or a full 12-digit
  Aadhaar number. PAN is stored masked (``XXXXX1234X``, the PR #41 format) and
  Aadhaar as its last four digits only.
"""
from __future__ import annotations

import re
from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# --------------------------------------------------------------------------- lender label

LENDER_NAME = "Bajaj Finance Ltd"
LENDER_RELATIONSHIP = "public reference lender, not a partner"

# --------------------------------------------------------------------------- identifiers

SYNTHETIC_ID_PATTERN = r"^SYN-[A-Z]{2,6}-[0-9A-Z]{3,16}$"
"""Every id in a fixture or test is synthetic: SYN-APP-000101, SYN-DOC-PAN0101 ..."""

MASKED_PAN_PATTERN = r"^XXXXX[0-9]{4}X$"
AADHAAR_LAST4_PATTERN = r"^[0-9]{4}$"
MASKED_AADHAAR_PATTERN = r"^XXXX XXXX [0-9]{4}$"

# A PAN that is not masked: five letters (4th is the holder-type letter), 4 digits, 1 letter.
_FULL_PAN = re.compile(r"(?<![A-Z0-9])(?!XXXXX)[A-Z]{5}\s?[0-9]{4}\s?[A-Z](?![A-Z0-9])", re.IGNORECASE)
# Twelve digits in the Aadhaar grouping, or any unbroken 12-digit run.
_FULL_AADHAAR = re.compile(r"(?<!\d)\d{4}[ -]?\d{4}[ -]?\d{4}(?!\d)")


# Keys whose values are digests, not identifiers (a sha256 hex can hold 12 digits in a row).
DIGEST_KEYS = frozenset({"sha256", "content_sha256", "snapshot_sha256"})


def find_raw_identifiers(value: Any, path: str = "$") -> list[str]:
    """Return the JSON paths of strings that look like a full PAN or a full Aadhaar.

    Walks dicts, lists and strings. Numbers are ignored (amounts are numbers), and so are
    the digest keys in ``DIGEST_KEYS``.
    """
    hits: list[str] = []
    if isinstance(value, str):
        if _FULL_PAN.search(value) or _FULL_AADHAAR.search(value):
            hits.append(path)
    elif isinstance(value, dict):
        for k, v in value.items():
            if k in DIGEST_KEYS:
                continue
            hits.extend(find_raw_identifiers(v, f"{path}.{k}"))
    elif isinstance(value, (list, tuple)):
        for i, v in enumerate(value):
            hits.extend(find_raw_identifiers(v, f"{path}[{i}]"))
    return hits


class StrictModel(BaseModel):
    """Base for every contract: unknown keys are rejected, so nothing extra rides along."""

    model_config = ConfigDict(extra="forbid", use_enum_values=False)


class NoRawIdentifiers(StrictModel):
    """A contract that refuses any full PAN / full Aadhaar anywhere in its strings."""

    @model_validator(mode="after")
    def _no_raw_identifiers(self):
        hits = find_raw_identifiers(self.model_dump(mode="json"))
        if hits:
            raise ValueError(
                "full PAN or Aadhaar-like number found at " + ", ".join(hits)
                + "; store PAN masked (XXXXX1234X) and Aadhaar as last 4 digits only"
            )
        return self


# --------------------------------------------------------------------------- provenance tags

class ThresholdBasis(str, Enum):
    """Where a rule's threshold comes from. Exactly one per rule row."""

    BAJAJ_SOURCED = "BAJAJ-SOURCED"
    ASSUMPTION = "ASSUMPTION"


class ApprovalStatus(str, Enum):
    PENDING = "PENDING"      # proposed, waiting for the owner's approval; must not go live
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Citation(StrictModel):
    """A pointer into the Saral corpus (corpus_v3 collections).

    ``chunk_id`` uses the corpus_v3 form ``<DOC-ID>#<NNN>``. The excerpt mirrors the
    PR #38 source-chip excerpt: plain text, at most 320 characters.
    """

    doc_id: str = Field(pattern=r"^(BFL|RBI)-[A-Z0-9-]+$")
    chunk_id: str = Field(pattern=r"^(BFL|RBI)-[A-Z0-9-]+#[0-9]{3}$")
    collection: Literal["saral_nbfc_policy", "rbi_regulatory"]
    excerpt: str = Field(min_length=1, max_length=320)
    relationship: str | None = None

    @model_validator(mode="after")
    def _consistent(self):
        if not self.chunk_id.startswith(self.doc_id + "#"):
            raise ValueError("chunk_id must belong to doc_id")
        if self.doc_id.startswith("BFL-"):
            if self.collection != "saral_nbfc_policy":
                raise ValueError("Bajaj documents live in saral_nbfc_policy")
            if self.relationship != LENDER_RELATIONSHIP:
                raise ValueError(f"Bajaj citations must carry relationship={LENDER_RELATIONSHIP!r}")
        if self.doc_id.startswith("RBI-") and self.collection != "rbi_regulatory":
            raise ValueError("RBI documents live in rbi_regulatory")
        return self

    @field_validator("excerpt")
    @classmethod
    def _plain(cls, v: str) -> str:
        if v != " ".join(v.split()):
            raise ValueError("excerpt must be whitespace-collapsed plain text")
        return v


class SyntheticMarker(StrictModel):
    """Stamped on every record so nothing synthetic is ever mistaken for real data."""

    synthetic: Literal[True] = True
    warning: str = "SYNTHETIC DEVELOPMENT DATA. Never use for a real lending decision."
