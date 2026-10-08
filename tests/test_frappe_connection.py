"""Frappe connection test: live REST when configured, mock store otherwise.

Skips live assertions unless FRAPPE_URL/FRAPPE_API_KEY/FRAPPE_API_SECRET are set.
"""
import os

import pytest

from prototype_0.integration.frappe_adapter import (
    FrappeClient,
    FrappeUnavailable,
    MockStore,
    UnknownApplication,
)


def test_mock_store_roundtrip():
    store = MockStore()
    doc = store.get("APP-TEST-001")
    assert doc["name"] == "APP-TEST-001"
    with pytest.raises(UnknownApplication):
        store.get("APP-NOPE-999")


LIVE = all(os.environ.get(k) for k in ("FRAPPE_URL", "FRAPPE_API_KEY", "FRAPPE_API_SECRET"))


@pytest.mark.skipif(not LIVE, reason="no live Frappe env configured")
def test_live_frappe_roundtrip():
    try:
        client = FrappeClient()
    except FrappeUnavailable as e:
        pytest.skip(str(e))
    # Live fixture name comes from the P1 setup (Frappe autoname blocks APP-TEST-001).
    doc = client.get(os.environ.get("FRAPPE_P1_APP", "ACC-LOAP-2026-00001"))
    assert doc["applicant"] == "CUS-TEST-001"
