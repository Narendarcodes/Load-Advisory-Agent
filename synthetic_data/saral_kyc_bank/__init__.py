"""Saral synthetic KYC (Aadhaar e-KYC, PAN), employment, bank (AA FI) and bureau-linked
applicant universe. SYNTHETIC ONLY: no value here belongs to a real person.

    from synthetic_data.saral_kyc_bank import build_universe
    universe = build_universe(200, seed=20261103)

    python -m synthetic_data.saral_kyc_bank --count 20 --out data/synthetic/saral_v1
"""
from .generator import DEFAULT_SEED, build_applicant, build_universe

__all__ = ["DEFAULT_SEED", "build_applicant", "build_universe"]
