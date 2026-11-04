"""E2E D-17 (A5 live, 2026-11-04): a Telugu borrower asking about a 'more information needed' decision got the English
info_requested template (and, before facts mapped them, a rule id as the missing item). The info_requested and
manual_review templates now exist in Hindi and Telugu, in plain words."""
import re

import pytest

from loan_advisory.agent import prompts as P

NATIVE = {"hi": re.compile(r"[\u0900-\u097F]"), "te": re.compile(r"[\u0C00-\u0C7F]")}


@pytest.mark.parametrize("locale", ["hi", "te"])
def test_info_requested_is_localised(locale):
    txt = P.template("info_requested", locale, missing="X")
    assert "X" in txt and NATIVE[locale].search(txt)
    assert "could not be assessed" not in txt


@pytest.mark.parametrize("locale", ["hi", "te"])
def test_manual_review_is_localised(locale):
    txt = P.template("manual_review", locale)
    assert NATIVE[locale].search(txt) and "verify" not in txt
