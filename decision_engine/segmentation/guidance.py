"""Persona-based communication guidance rules.

Defines the 4 communication segments for loan applicants and their explanation instructions.
Contains zero sensitive personal information.
"""

GUIDANCE: dict[str, list[str]] = {
    "Simple Explanation Required": [
        "Use everyday language and avoid unnecessary technical terms.",
        "Explain one point at a time.",
        "Use a simple example where useful.",
        "Explain the rejection reason clearly without assuming prior banking knowledge."
    ],
    "Standard Explanation Required": [
        "Use normal professional language.",
        "Briefly explain financial and banking terms.",
        "Use practical examples where useful.",
        "Explain the recorded rejection reason and relevant next steps."
    ],
    "Technical Explanation Required": [
        "Use relevant terms such as FOIR, DTI, credit utilization and repayment history.",
        "Provide a detailed explanation of the recorded rejection reason.",
        "Explain only the financial metrics relevant to this application.",
        "Give measurable improvement suggestions where supported by lender data."
    ],
    "Guided Explanation Required": [
        "Explain the loan process in numbered steps.",
        "Use simple language and explain unfamiliar terms.",
        "Explain the documents and requirements relevant to this application.",
        "Give clear, actionable next steps."
    ]
}

SEGMENT_NAMES = list(GUIDANCE.keys())
