"""ChatLLM SSE decoding: text/event-stream is UTF-8 even when the server sends no charset (Groq omits it)."""
import json

from loan_advisory.agent import llm as L


class _StreamResp:
    """Mimics requests.Response.iter_lines: decodes with self.encoding, which defaults to ISO-8859-1 for text/*."""

    status_code = 200
    headers = {"content-type": "text/event-stream"}

    def __init__(self, lines):
        self.lines = lines
        self.encoding = "ISO-8859-1"

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def iter_lines(self, decode_unicode=False):
        for line in self.lines:
            yield line.decode(self.encoding) if decode_unicode else line


def test_utf8_sse_without_charset_is_not_mangled(monkeypatch):
    texts = ("Rupee: ₹47,000. ", "कर्ज़")
    payload = [("data: " + json.dumps({"choices": [{"delta": {"content": t}}]}, ensure_ascii=False)).encode("utf-8")
               for t in texts]
    payload.append(b"data: [DONE]")
    monkeypatch.setattr(L.requests, "post", lambda *a, **k: _StreamResp(payload))

    out = L.ChatLLM(base="https://api.groq.com/openai/v1").chat("s", "u")
    assert out == "".join(texts)
    assert "₹" in out and "â" not in out
