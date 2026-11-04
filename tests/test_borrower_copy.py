"""Guard: borrower-facing pages never show internal technical vocabulary.

Reads the Frappe portal templates as text (no Frappe needed), removes Jinja logic, <script> and
<style> blocks, comments and tag attributes, and checks the words a borrower can actually read.
The island's visible strings are guarded separately in apps/web/assistant/src/copy.test.tsx.
"""

import re
from pathlib import Path

import pytest

PORTAL = Path(__file__).resolve().parents[1] / "apps" / "loan_advisory_portal" / "loan_advisory_portal"
TEMPLATES = sorted([*PORTAL.glob("www/*.html"), *PORTAL.glob("www/borrower/*.html"), *PORTAL.glob("templates/portal/*.html")])

# Case-sensitive acronyms, case-insensitive words.
ACRONYMS = re.compile(r"\b(ZEN|RAG|API|APIs|LLM|JDM|AG-UI)\b")
WORDS = re.compile(r"\b(langgraph|embeddings?|orchestrat\w*|agent(?:ic|s)?|vector|qdrant|copilotkit|pipeline)\b", re.I)


def visible_text(source: str) -> str:
    text = re.sub(r"\{#.*?#\}", " ", source, flags=re.S)
    text = re.sub(r"\{%.*?%\}", " ", text, flags=re.S)
    text = re.sub(r"<script\b.*?</script>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<style\b.*?</style>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<!--.*?-->", " ", text, flags=re.S)
    # Keep alt/title/aria-label/placeholder values: assistive tech reads them out.
    readable = " ".join(re.findall(r'\b(?:alt|title|aria-label|placeholder)="([^"]*)"', text))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\{\{.*?\}\}", " ", text, flags=re.S)
    return f"{text} {readable}"


def test_templates_were_found():
    assert len(TEMPLATES) >= 15


@pytest.mark.parametrize("path", TEMPLATES, ids=lambda p: p.name)
def test_no_internal_jargon_in_borrower_templates(path):
    text = visible_text(path.read_text(encoding="utf-8"))
    hits = sorted({m.group(0) for m in ACRONYMS.finditer(text)} | {m.group(0) for m in WORDS.finditer(text)})
    assert not hits, f"{path.relative_to(PORTAL)} shows internal terms to borrowers: {hits}"


def test_the_guard_catches_jargon():
    assert ACRONYMS.search(visible_text("<p>Answers come from the ZEN engine via the API.</p>"))
    assert WORDS.search(visible_text("<p>Our LangGraph agent uses embeddings.</p>"))
    assert not WORDS.search(visible_text('<script>const agent = 1;</script><a href="/api/x" class="agent">Help</a>'))


def test_one_trust_line_in_the_shell():
    base = (PORTAL / "templates" / "portal" / "base.html").read_text(encoding="utf-8")
    assert visible_text(base).count("Understand your loan decision. A person decides.") == 1
    repeats = re.compile(r"never decides|a lender decides|never approves|explains; it", re.I)
    for path in TEMPLATES:
        assert not repeats.search(visible_text(path.read_text(encoding="utf-8"))), path.name
