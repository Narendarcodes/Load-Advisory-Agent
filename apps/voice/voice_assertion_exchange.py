"""Exchange a verified `Voice Session` for a short-lived assertion.

Kept free of LiveKit imports so the security boundary is unit-testable on its own. The worker
authenticates to Frappe as an `Agent Integration` account, never as the borrower, and nothing is
cached: an expired or ended session stops issuing.
"""
import aiohttp

VOICE_ASSERTION_PATH = "/api/method/loan_advisory_portal.api.voice.voice_assertion"


class Assertions:
    def __init__(self, http: aiohttp.ClientSession, session_id: str, room: str, identity: str, *,
                 frappe_url: str, api_key: str, api_secret: str, timeout_s: float):
        self.http = http
        self.session_id, self.room, self.identity = session_id, room, identity
        self.frappe_url, self.api_key, self.api_secret = frappe_url, api_key, api_secret
        self.timeout_s = timeout_s

    async def fresh(self) -> dict:
        if not (self.api_key and self.api_secret):
            raise RuntimeError("voice worker has no Frappe integration credential")
        headers = {"Authorization": f"token {self.api_key}:{self.api_secret}"}
        body = {"session_id": self.session_id, "room": self.room, "identity": self.identity}
        async with self.http.post(f"{self.frappe_url.rstrip('/')}{VOICE_ASSERTION_PATH}", headers=headers, json=body,
                                  timeout=aiohttp.ClientTimeout(total=self.timeout_s)) as response:
            if response.status != 200:
                # Status only: the body may echo borrower data.
                raise RuntimeError(f"voice assertion refused: HTTP {response.status}")
            message = (await response.json()).get("message") or {}
        if not message.get("assertion"):
            raise RuntimeError("voice assertion response carried no assertion")
        return message
