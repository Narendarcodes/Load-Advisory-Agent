"""Application file reads must be explicit UTF-8: currency symbols and Indic text are valid in this domain."""
import json

from loan_advisory.agent.runtime import PersonaStore, load_chunks
from rag.retrieve import load_profile

TEXT = "₹47,000 ಮತ್ತು ಕನ್ನಡ"


def test_persona_store_reads_utf8_by_default(tmp_path):
    row = {"application_id": "SYN-APP-X", "applicant_id": "SYN-CUS-X", "loan_amount": 100000,
           "loan_tenure_months": 12, "monthly_income": 47000, "monthly_obligations": 1000,
           "credit_score": 750, "employment_months": 24, "note": TEXT}
    path = tmp_path / "personas.jsonl"
    path.write_text(json.dumps(row, ensure_ascii=False) + "\n", encoding="utf-8")
    store = PersonaStore(path=path)
    assert store.rows["SYN-APP-X"]["note"] == TEXT


def test_policy_chunks_are_read_as_utf8(tmp_path):
    (tmp_path / "chunks.jsonl").write_text(
        json.dumps({"chunk_id": "D#000", "title": "ಶೀರ್ಷಿಕೆ", "text": TEXT}, ensure_ascii=False) + "\n",
        encoding="utf-8")
    chunks = load_chunks(tmp_path)
    assert chunks[0]["text"] == TEXT and chunks[0]["title"] == "ಶೀರ್ಷಿಕೆ"


def test_lender_profile_is_read_as_utf8(tmp_path):
    (tmp_path / "utf8_profile.yaml").write_text(
        'profile_id: utf8_profile\nlender_id: X\nentity_type: nbfc\nrelationship: "₹ reference"\n'
        'default_source_types: [synthetic]\n', encoding="utf-8")
    profile = load_profile("utf8_profile", profiles_dir=tmp_path)
    assert profile["relationship"] == "₹ reference"
