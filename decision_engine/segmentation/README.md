# Customer Communication Segmentation for Loan Advisory Agent

A rule-based customer segmentation engine that classifies loan applicants into communication personas for explaining loan decisions.

## Personas & Communication Guidance

Based on credit history, borrowing diversity, and repayment indicators, applicants are categorized into four communication personas:

1. **Guided Explanation Required**
   - *Target*: First-time borrowers or applicants without prior loan history.
   - *Communication Style*: Step-by-step numbered steps, simple everyday language, clear explanations of banking terms and documents, actionable next steps.

2. **Simple Explanation Required**
   - *Target*: Applicants with limited borrowing experience ($\le 3$ loans, $\le 2$ loan types).
   - *Communication Style*: Everyday language, avoiding jargon, explaining one point at a time with simple examples.

3. **Standard Explanation Required**
   - *Target*: Experienced retail borrowers with standard credit histories.
   - *Communication Style*: Professional banking language, brief explanations of financial terms, practical examples, clear explanation of rejection reasons.

4. **Technical Explanation Required**
   - *Target*: Experienced borrowers with diverse portfolios or extensive credit records ($>10$ loans or $\ge 4$ loans across $\ge 2$ types with $\ge 36$ months history).
   - *Communication Style*: Precise financial metrics (FOIR, DTI, credit utilization, repayment history), detailed rejection analysis, and measurable improvement targets.

## Critical Privacy Guarantee

The segmentation output contains **only**:
- `segment`: The persona classification label.
- `how_to_explain`: Actionable communication guidelines for the AI agent.

**Zero sensitive personal information** (PII, applicant names, PAN, phone numbers, raw incomes, or demographic details) is exposed in the output or sent to the AI agent.

## CLI Usage

### Segment a single applicant by ID
```bash
python decision_engine/segmentation/customer_segmentation.py --application-id APP1001
```

### Segment all applicants from demo dataset
```bash
python decision_engine/segmentation/customer_segmentation.py --all --data data/synthetic/demo_applicants.json
```

## AI Agent Integration

The advisory agent (`apps/api/src/loan_advisory/agent/graph.py`) incorporates the customer segmentation:
- During evidence evaluation, `get_customer_segmentation()` analyzes the applicant's bureau/credit record.
- The derived persona directives configure the agent prompt (`prompts.SEGMENT_STYLE`).
- The response object (`AgentResponse.customer_segmentation`) returns the sanitized segment and explanation guidelines.
