"""One vocabulary, three consumers: the config, the portal copy and the agent contract.

`config/borrower_preferences.json` is the borrower-facing contract; the portal vendors a
byte-identical copy and validates/stores only these values; the FastAPI agent contract
declares the same locale codes and literacy levels for typing. A change on one side
without the others fails here.
"""
import json
from pathlib import Path
from typing import get_args

from loan_advisory.agent.contracts import LOCALES, Literacy

ROOT = Path(__file__).resolve().parents[1]
REPO_COPY = ROOT / "config" / "borrower_preferences.json"
APP_COPY = ROOT / "apps" / "loan_advisory_portal" / "loan_advisory_portal" / "borrower_preferences.json"
PROFILE_DOCTYPE = (
    ROOT / "apps" / "loan_advisory_portal" / "loan_advisory_portal" / "loan_advisory_portal"
    / "doctype" / "borrower_profile" / "borrower_profile.json"
)


def _table() -> dict:
    return json.loads(REPO_COPY.read_text(encoding="utf-8"))


def test_the_portal_vendored_copy_is_byte_identical():
    assert APP_COPY.read_bytes() == REPO_COPY.read_bytes()


def test_the_table_is_internally_consistent():
    table = _table()
    assert table["schema"] == "borrower-preferences/1"
    locale_codes = [item["code"] for item in table["locales"]]
    literacy_values = [item["value"] for item in table["literacy"]]
    assert len(locale_codes) == len(set(locale_codes))
    assert len(literacy_values) == len(set(literacy_values))
    assert all(item["label"].strip() for item in table["locales"] + table["literacy"])
    aliases = table.get("aliases", {})
    for key, target in aliases["locale"].items():
        assert target in locale_codes, f"locale alias {key} -> {target} is not offered"
        assert key not in locale_codes, f"locale alias {key} shadows an offered code"
    for key, target in aliases["literacy"].items():
        assert target in literacy_values, f"literacy alias {key} -> {target} is not offered"
        assert key not in literacy_values, f"literacy alias {key} shadows an offered value"


def test_the_agent_contract_declares_the_same_vocabulary():
    table = _table()
    assert tuple(item["code"] for item in table["locales"]) == LOCALES
    assert tuple(item["value"] for item in table["literacy"]) == get_args(Literacy)


def test_the_profile_doctype_offers_only_the_table():
    table = _table()
    fields = {
        field["fieldname"]: field
        for field in json.loads(PROFILE_DOCTYPE.read_text(encoding="utf-8"))["fields"]
    }
    locale_options = fields["preferred_locale"]["options"].split("\n")
    literacy_options = fields["literacy"]["options"].split("\n")
    assert locale_options[0] == ""  # the empty choice Frappe prepends
    assert locale_options[1:] == [item["code"] for item in table["locales"]]
    assert literacy_options[0] == ""
    assert literacy_options[1:] == [item["value"] for item in table["literacy"]]
    assert fields["preferred_locale"]["default"] == "en"
    assert fields["literacy"]["default"] == "medium"
