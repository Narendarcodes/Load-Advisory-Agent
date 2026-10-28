# Research note: regulation and published design references (question bank s.40, 41, 44, 45, 20, 22)

Status: research note for the investigation question bank. Written Oct 15, 2026. External claims are quoted or closely paraphrased
from the source linked beside them. This is research for a student prototype, not legal advice. Indian rules apply to Indian
lenders; EU and US rules are listed only as design references. What a particular lender (for example Bajaj Finance, used here only
as a public reference lender) does internally is not known to the project.

## 1. India: what applies to digital lenders (s.40)

### RBI (Digital Lending) Directions, 2025 (May 8, 2025)
Source: https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12848&Mode=0 (register id `RBI-DLD-2025`)
- **Who:** all commercial banks, co-operative banks, NBFCs (including HFCs) and All-India Financial Institutions, for their digital
  lending (para 3). Digital lending means "a remote and automated lending process, largely by use of seamless digital technologies for
  customer acquisition, credit assessment, loan approval, disbursement, recovery, and associated customer service" (para 4(iii)).
- **Creditworthiness:** the lender must obtain the borrower's economic profile, "at a minimum, age, occupation and income details",
  and keep it on record for audit (para 7(i)).
- **Disclosures:** a Key Fact Statement (para 8(i)); KFS, sanction letter, terms, privacy policies etc. flow automatically to the
  borrower's verified email/SMS (para 8(iii)).
- **Grievance redressal:** lender and LSP must designate nodal grievance redressal officers, with contact details on websites, the
  app and the KFS (para 11(i)-(ii)). If a complaint is rejected, unsatisfactory, or not answered "within 30 days", the borrower can
  complain on RBI's CMS portal under the Integrated Ombudsman Scheme (para 11(iv)).
- **Data consent (s.40 q "data-consent requirements", s.20):** data collection must be "need-based and with prior and explicit
  consent of the borrower having audit trail" (para 12(i)); the borrower can give or deny consent for specific data, restrict
  disclosure to third parties, data retention, revoke consent and have data deleted (para 12(ii)); the purpose of consent must be
  disclosed at each stage (para 12(iii)); explicit consent before sharing with third parties (para 12(iv)).
- **Storage and retention (s.20 "how long should conversation data be stored"):** lenders must have and disclose clear policy on
  "the type of data that can be stored, the length of time for which data can be stored, restrictions on the use of data, data
  destruction protocol, standards for handling security breach" (para 13(ii)); data stored only on servers in India (para 13(iv));
  no biometric data unless allowed by statute (para 13(iii)). The Directions set no fixed retention period; the lender's policy does.
- **Not found in these Directions:** any requirement specific to automated decision-making, model explainability or AI, or a rule on
  how rejection reasons must be worded. (Reading of the full text on Oct 15, 2026.)

### Reasons for rejection
- RBI's Fair Practices Code guidance on conveying reasons for rejection is in the register as `RBI-FPC-2007` (banks),
  `RBI-FPC-NBFC-2015` (NBFCs, historical) and the 2025 Responsible Business Conduct Directions (`RBI-RBC-CB-2025`, `RBI-RBC-NBFC-2025`).
  The project's answer guard forbids claiming that RBI obliges an NBFC to give *written* reasons (`guards.py`
  `nbfc_written_reason_promise`), because the project found that the written-reasons rule differs by lender type (see
  `docs/policy/bajaj_reference_lender.md`, point 3).
- As recorded in that doc: for **banks**, RBC-CB para 331 says "the bank shall convey in writing, the main reason(s) … led to
  rejection of the loan applications"; the **NBFC** RBC Fair Practices Code has no equivalent clause, but NBFC para 12 requires an
  acknowledgement for every loan application. So "are there restrictions/requirements on how reasons are communicated" has a
  lender-type-dependent answer, and the agent is built not to over-claim it.
- **Internal scoring models and confidential information (s.40 "what must not be disclosed", "are internal scoring models
  protected"):** no RBI source in the register addresses disclosure of a lender's internal scorecard. The project does not hold one
  and its `not_available` guard says so. Whether a lender's model is confidential is the lender's call — UNKNOWN, a partner lender
  must answer.

### Digital Personal Data Protection Act, 2023
Registered as `IN-DPDP-2023` (https://www.meity.gov.in/data-protection-framework) but **not ingested**; the project makes no claims
from it.

## 2. Design references from other jurisdictions (s.40 "useful as design references", s.41, s.22)

- **EU GDPR Art. 22:** a person has "the right not to be subject to a decision based solely on automated processing, including
  profiling, which produces legal effects ... or similarly significantly affects him or her"; where the contract/consent exceptions
  apply, the controller must give "at least the right to obtain human intervention ..., to express his or her point of view and to
  contest the decision." https://gdpr-info.eu/art-22-gdpr/ — design reading: the agent's dispute → human-reviewer handoff is the
  closest built analogue to "human intervention / contest".
- **EU AI Act Annex III, 5(b):** AI systems "intended to be used to evaluate the creditworthiness of natural persons or establish
  their credit score, with the exception of AI systems used for the purpose of detecting financial fraud" are high-risk.
  https://artificialintelligenceact.eu/annex/3/ — design reading: this project's agent does not evaluate creditworthiness (ZEN rules
  decide; the agent explains), so under that wording the explainer itself would not be the Annex III system, while the decision
  engine would be. Article 14 (human oversight) and Article 86 (right to explanation of individual decision-making) are listed in the
  Act's table of contents at the same URL; not analysed further here.
- **US ECOA / Regulation B and CFPB Circular 2022-03:** specific principal reasons, no "internal standards" boilerplate, and
  validation of post-hoc approximations — summarised with sources in `docs/research/xai-and-reason-codes.md`.

### Fairness of explanations (s.41)
What can legitimately vary between applicants in the built system: the answer language (en/hi/te), the applicant-chosen literacy
level (`contracts.py` `Literacy`), and the applicant's own recorded facts. The decision itself is made by ZEN rules before the agent
runs and the agent cannot change it (`graph.py` boundary guards), so wording cannot change the decision. Whether different wording
leads to different *understanding or later outcomes* is not measured — needs user research with real applicants. The eval harness's
A2 set compares low vs high literacy answers for the same persona (paired), which is the nearest built test of unequal treatment by
adaptation; it does not test protected attributes.

## 3. Published metric families for the evaluation questions (s.44, s.45)

- **RAG evaluation without labels:** Ragas proposes reference-free metrics for "the ability of the retrieval system to identify
  relevant and focused context passages, the ability of the LLM to exploit such passages in a faithful way, or the quality of the
  generation itself". Es et al., 2023, https://arxiv.org/abs/2309.15217
- **Unsupported-claim / hallucination rate:** FActScore "breaks a generation into a series of atomic facts and computes the
  percentage of atomic facts supported by a reliable knowledge source". Min et al., EMNLP 2023, https://arxiv.org/abs/2305.14251
- **Explanation faithfulness / actionability:** counterfactual explanations (Wachter et al.) and reason-code rules — see
  `docs/research/xai-and-reason-codes.md`.
- How the project already measures these: `docs/research/design-decisions-in-code.md` §6.

### Baselines (s.45)
The project compares against: (a) the conventional workflow with no LLM (ZEN decision + deterministic templates, see
`docs/architecture/conventional-workflow.md`), which every agent answer must stay faithful to; (b) retrieval variants (dense vs hybrid vs reranked) with a paired bootstrap in the RAG evaluation reports
(`docs/policy/rag_eval_bajaj_v1_report.json`, `docs/policy/bajaj_reference_lender.md`). A static FAQ or human-support baseline was not run. What counts as a "meaningful improvement" for a deployment
is a product decision — UNKNOWN, VaaniLabs must answer.
