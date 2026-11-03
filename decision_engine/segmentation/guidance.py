"""Explanation tones: HOW the agent explains a recorded decision, never WHAT it says.

Four tone levels, from the most guided to the most detailed. Each line is an instruction
the model reads while writing to the borrower, so every line is plain language (ADR-0006):
no internal terms, no thresholds or cut-offs, no targets or gaps, no rule ids and no
numbers. The tone never changes the decision or which facts are shown, and its name is
never shown to the borrower.
"""

GUIDANCE: dict[str, list[str]] = {
    "Guided": [
        "Explain in short numbered steps, one step per line.",
        "Explain every money word in everyday words and assume no banking knowledge.",
        "Say what they can do next, one action at a time.",
        "End with one clear next step and offer to answer questions.",
    ],
    "Simple": [
        "Use everyday words and very short sentences.",
        "Explain one point at a time.",
        "Use a simple everyday example only if it helps.",
        "Do not assume they know banking words.",
    ],
    "Standard": [
        "Use clear, everyday professional language.",
        "If you use a common money word such as EMI, say what it means in a few words.",
        "Explain the recorded reason in plain words, then the next step.",
    ],
    "Detailed": [
        "They are comfortable with money matters, so you may add a little more context in plain words.",
        "You may say in general terms why a reason matters, for example how existing EMIs affect what "
        "someone can repay each month.",
        "Keep to plain words and general advice; do not add figures for them to aim for.",
    ],
}

SEGMENT_NAMES = list(GUIDANCE.keys())
