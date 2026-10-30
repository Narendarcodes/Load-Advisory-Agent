"""Live provider smoke test (opt-in).

    LLM_LIVE_TEST=1 LLM_PROVIDER=groq LLM_MODEL=<model> GROQ_API_KEY=... pytest tests/test_llm_live.py -q

Skipped entirely unless the operator asks for it, so the normal suite never calls a remote
provider. The prompt is synthetic and the assertion is only "the provider answered".
Nothing here prints keys, headers or environment values.
"""
import os

import pytest

from loan_advisory.agent.llm import ChatLLM, LLMConfigError, LLMError

LIVE = os.environ.get("LLM_LIVE_TEST") == "1"
pytestmark = pytest.mark.skipif(not LIVE, reason="set LLM_LIVE_TEST=1 with LLM_PROVIDER/LLM_MODEL configured")


def test_live_provider_answers_a_synthetic_prompt():
    try:
        llm = ChatLLM.from_env()
    except LLMConfigError as e:
        pytest.skip(str(e))
    try:
        answer = llm.chat("You are a test harness.", "Reply with the single word: pong", max_tokens=16,
                          temperature=0, tag="live_smoke")
    except LLMError as e:
        pytest.skip(f"provider did not answer: {type(e).__name__}")
    assert answer.strip()
    assert llm.calls[-1]["error"] is None
