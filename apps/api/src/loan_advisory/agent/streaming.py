"""Sentence streaming behind the validation guard (voice latency).

The LLM's draft is cut into sentences as tokens arrive. Each complete sentence runs the same deterministic answer
guards as the full draft (guarantee / decision language, NBFC written-reason claims, ungrounded numbers) before it is
released to the speaker. The first sentence that fails stops the stream for the rest of the turn: nothing after it is
released, the graph's full-answer `validate` still runs, and the final (rewritten or template) answer decides what is
spoken next. Pure functions; no I/O.
"""
import json
import re

from loan_advisory.agent import guards as G

# A sentence ends at . ! ? or the Devanagari danda (।) followed by whitespace, or at a line break. A '.' inside a
# number (64.8) is not followed by whitespace, and a list marker ("1. ") is kept with the words after it.
_END = re.compile(r"([.!?।]+)(\s+)|\n+")


def split_sentences(text: str) -> tuple[list[str], str]:
    """Split `text` into complete sentences and an unfinished tail."""
    out, start = [], 0
    for m in _END.finditer(text):
        end = m.end(1) if m.group(1) else m.start()
        piece = text[start:end].strip()
        if m.group(1) and re.fullmatch(r"\d{1,2}\.", piece):  # list marker "1." — keep with the next words
            continue
        if piece:
            out.append(piece)
        start = m.end()
    return out, text[start:].lstrip()


def sentence_flags(sentence: str, allowed: set[str]) -> list[str]:
    flags = G.answer_flags(sentence)
    bad = G.ungrounded_numbers(sentence, allowed)
    if bad:
        flags.append("ungrounded_numbers:" + ",".join(bad[:5]))
    return flags


class SentenceGate:
    """Feed text deltas with push(); clean complete sentences go to emit(sentence) in order."""

    def __init__(self, allowed: set[str], emit, precheck=None):
        self.allowed, self.emit = set(allowed), emit
        self.precheck = precheck  # optional callable -> list of flags that blocks streaming entirely (e.g. no citation)
        self.buf, self.released, self.flags, self.tainted = "", [], [], False

    def _check_pre(self):
        if self.precheck is not None:
            pf = self.precheck()
            self.precheck = None
            if pf:
                self.flags.extend(pf)
                self.tainted = True

    def _offer(self, sentence: str):
        if self.tainted or not sentence.strip():
            return
        self._check_pre()
        if self.tainted:
            return
        f = sentence_flags(sentence, self.allowed)
        if f:
            self.flags.extend(f)
            self.tainted = True
            return
        self.released.append(sentence)
        self.emit(sentence)

    def push(self, delta: str):
        if not delta:
            return
        self.buf += delta
        done, self.buf = split_sentences(self.buf)
        for snt in done:
            self._offer(snt)

    def close(self):
        tail, self.buf = self.buf.strip(), ""
        if tail:
            self._offer(tail)

    @property
    def text(self) -> str:
        return " ".join(self.released)


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def remainder(spoken: list[str], final: str, bridge: str = "") -> str:
    """What is left to say once `spoken` sentences were already released and the turn's final answer is `final`."""
    said, fin = _norm(" ".join(spoken)), _norm(final)
    if not said:
        return fin
    if fin.startswith(said):
        return fin[len(said):].strip()
    return f"{bridge} {fin}".strip() if bridge else fin


class JSONFieldStreamer:
    """Incrementally extract one top-level string field (e.g. "answer") from a streamed JSON object.

    Also reports the other top-level keys that were fully parsed before that field started (e.g. "citations"
    placed before "answer"), so citation checks can run before the first sentence is spoken.
    """

    def __init__(self, field: str = "answer"):
        self.field, self.raw, self.pos, self.started, self.done = field, "", 0, False, False
        self._esc = ""

    def head(self) -> dict:
        """Best-effort parse of the keys before the streamed field."""
        i = self.raw.find(f'"{self.field}"')
        if i < 0:
            return {}
        frag = self.raw[:i].rstrip().rstrip(",")
        s = frag[frag.find("{"):] if "{" in frag else ""
        try:
            return json.loads(s + "}") if s else {}
        except ValueError:
            return {}

    def feed(self, delta: str) -> str:
        """Return the newly available decoded characters of the field's value."""
        self.raw += delta
        if self.done:
            return ""
        if not self.started:
            m = re.search(r'"%s"\s*:\s*"' % re.escape(self.field), self.raw)
            if not m:
                return ""
            self.started, self.pos = True, m.end()
        out = []
        while self.pos < len(self.raw):
            ch = self.raw[self.pos]
            if self._esc:
                self._esc += ch
                if self._esc.startswith("\\u") and len(self._esc) < 6:
                    self.pos += 1
                    continue
                try:
                    out.append(json.loads(f'"{self._esc}"'))
                except ValueError:
                    pass
                self._esc = ""
            elif ch == "\\":
                self._esc = "\\"
            elif ch == '"':
                self.done = True
                self.pos += 1
                break
            else:
                out.append(ch)
            self.pos += 1
        return "".join(out)


async def speakable(events, filler_after_s: float, filler_text: str, on_final, failure_text: str = ""):
    """Turn the NDJSON event stream of /api/chat/stream into text to speak (voice worker).

    Yields every guarded sentence as it arrives; says `filler_text` once if nothing arrived within `filler_after_s`;
    calls on_final(response) for the final event; if the stream breaks, yields `failure_text` (never goes silent);
    if the final response arrives without any sentence (older server), yields its whole answer.
    """
    import asyncio
    it = events.__aiter__()
    said_any = filler_done = False
    nxt = None
    loop = asyncio.get_running_loop()
    t_deadline = loop.time() + filler_after_s
    while True:
        if nxt is None:
            nxt = asyncio.ensure_future(it.__anext__())
        try:
            timeout = None if (said_any or filler_done) else max(0.0, t_deadline - loop.time())
            ev = await asyncio.wait_for(asyncio.shield(nxt), timeout=timeout)
            nxt = None
        except asyncio.TimeoutError:
            filler_done = True
            yield filler_text
            continue
        except StopAsyncIteration:
            if not said_any and failure_text:
                yield failure_text
            return
        except Exception:
            if failure_text:
                yield failure_text
            return
        kind = ev.get("type")
        if kind == "sentence" and ev.get("text", "").strip():
            said_any = True
            yield ev["text"]
        elif kind == "final":
            resp = ev.get("response") or {}
            on_final(resp)
            if not said_any and resp.get("answer"):
                yield resp["answer"]
            return
        elif kind == "error":
            if failure_text:
                yield failure_text
            return
