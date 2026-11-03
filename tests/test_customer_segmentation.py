"""Tests for the customer communication segmentation system and AI agent integration."""

import json
import unittest
from pathlib import Path

from decision_engine.segmentation.classifier import classify_applicant, derive_features
from decision_engine.segmentation.guidance import GUIDANCE, SEGMENT_NAMES
from decision_engine.segmentation.customer_segmentation import load_applicants, find_applicant
from loan_advisory.agent.segmentation import get_customer_segmentation, format_persona_guidance

try:
    from loan_advisory.agent.contracts import AgentResponse
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False


class TestCustomerSegmentation(unittest.TestCase):

    def setUp(self):
        self.demo_path = Path(__file__).resolve().parent.parent / "data" / "synthetic" / "demo_applicants.json"

    def test_segment_names_and_guidance(self):
        expected_segments = {
            "Guided Explanation Required",
            "Simple Explanation Required",
            "Standard Explanation Required",
            "Technical Explanation Required"
        }
        self.assertEqual(set(SEGMENT_NAMES), expected_segments)
        for seg in expected_segments:
            self.assertIn(seg, GUIDANCE)
            self.assertGreaterEqual(len(GUIDANCE[seg]), 3)

    def test_zero_sensitive_data_in_output(self):
        """CRITICAL PRIVACY TEST: Ensure output contains ONLY 'segment' and 'how_to_explain'."""
        applicant = {
            "applicant_id": "APP_SENSITIVE_001",
            "profile": {
                "name": "Jane Doe",
                "phone": "+919876543210",
                "salary": 150000,
                "pan_number": "ABCDE1234F"
            },
            "cibil_report": {
                "cibil_score": 780,
                "credit_history_months": 48,
                "accounts": [
                    {"account_type": "Personal Loan", "status": "Closed"},
                    {"account_type": "Home Loan", "status": "Active"},
                    {"account_type": "Car Loan", "status": "Closed"},
                    {"account_type": "Education Loan", "status": "Closed"}
                ]
            }
        }
        result = classify_applicant(applicant)
        # Ensure only allowed keys
        self.assertEqual(set(result.keys()), {"segment", "how_to_explain"})
        # Ensure no sensitive values leaked in text
        dumped = json.dumps(result)
        for sensitive in ["Jane", "Doe", "9876543210", "150000", "ABCDE1234F", "780"]:
            self.assertNotIn(sensitive, dumped)

    def test_guided_segment_no_history(self):
        applicant = {
            "applicant_id": "APP_NEW_001",
            "cibil_report": {
                "cibil_score": None,
                "credit_history_months": 0,
                "accounts": []
            }
        }
        res = classify_applicant(applicant)
        self.assertEqual(res["segment"], "Guided Explanation Required")
        self.assertTrue(any("numbered steps" in step for step in res["how_to_explain"]))

    def test_simple_segment_limited_loans(self):
        applicant = {
            "applicant_id": "APP_LIMITED_001",
            "cibil_report": {
                "cibil_score": 680,
                "credit_history_months": 24,
                "accounts": [
                    {"account_type": "Personal Loan", "status": "Closed"}
                ]
            }
        }
        res = classify_applicant(applicant)
        self.assertEqual(res["segment"], "Simple Explanation Required")
        self.assertTrue(any("everyday language" in step for step in res["how_to_explain"]))

    def test_technical_segment_experienced(self):
        applicant = {
            "applicant_id": "APP_TECH_001",
            "cibil_report": {
                "cibil_score": 760,
                "credit_history_months": 72,
                "accounts": [
                    {"account_type": "Vehicle Loan", "status": "Closed"},
                    {"account_type": "Business Loan", "status": "Closed"},
                    {"account_type": "Gold Loan", "status": "Closed"},
                    {"account_type": "Personal Loan", "status": "Active"}
                ]
            }
        }
        res = classify_applicant(applicant)
        self.assertEqual(res["segment"], "Technical Explanation Required")
        self.assertTrue(any("FOIR" in step for step in res["how_to_explain"]))

    def test_demo_applicants_dataset(self):
        self.assertTrue(self.demo_path.exists(), f"Demo file not found at {self.demo_path}")
        applicants = load_applicants(self.demo_path)
        self.assertEqual(len(applicants), 8)

        # Check known segments for demo applicants
        app1001 = find_applicant(applicants, "APP1001")
        self.assertEqual(classify_applicant(app1001)["segment"], "Guided Explanation Required")

        app1002 = find_applicant(applicants, "APP1002")
        self.assertEqual(classify_applicant(app1002)["segment"], "Simple Explanation Required")

        app1006 = find_applicant(applicants, "APP1006")
        self.assertEqual(classify_applicant(app1006)["segment"], "Technical Explanation Required")

        app1008 = find_applicant(applicants, "APP1008")
        self.assertEqual(classify_applicant(app1008)["segment"], "Guided Explanation Required")

    def test_agent_segmentation_adapter(self):
        seg = get_customer_segmentation(applicant_id="APP1006")
        self.assertEqual(seg["segment"], "Technical Explanation Required")
        self.assertEqual(set(seg.keys()), {"segment", "how_to_explain"})

        formatted = format_persona_guidance(seg)
        self.assertIn("Communication Persona (Technical Explanation Required):", formatted)
        self.assertIn("FOIR", formatted)

    @unittest.skipUnless(HAS_PYDANTIC, "pydantic not installed in this python env")
    def test_agent_response_contains_customer_segmentation(self):
        seg = get_customer_segmentation(applicant_id="APP1001")
        resp = AgentResponse(
            request_id="REQ-001",
            trace_id="TRACE-001",
            intent="explain",
            action="answer",
            answer="Here is your decision explanation.",
            customer_segmentation=seg
        )
        data = resp.model_dump()
        self.assertIn("customer_segmentation", data)
        self.assertEqual(data["customer_segmentation"]["segment"], "Guided Explanation Required")
        self.assertIn("how_to_explain", data["customer_segmentation"])


if __name__ == "__main__":
    unittest.main()
