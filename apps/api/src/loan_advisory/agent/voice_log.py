"""The per-turn voice log row: timings and metrics only, never the applicant's words (P0d)."""
DROPPED = {"transcript"}


def turn_row(info: dict, marks: dict, now: float) -> dict:
    base = marks["user_stopped"]
    return {"ts": now, **{k: v for k, v in info.items() if k not in DROPPED},
            **{f"{k}_ms": round((v - base) * 1000, 1) for k, v in marks.items() if k != "user_stopped"}}


__all__ = ["turn_row"]
