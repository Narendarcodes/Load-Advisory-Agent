# Saral demo guide

How to get demo logins on a local setup, which synthetic applicants to use for each decision path, and a 5-minute
presenter script. Set the stack up first: [README, Run it locally](../README.md#run-it-locally).

> **Synthetic test data, not real people.** Every name, PAN, Aadhaar number, email and document below was generated
> by `synthetic_data.saral_kyc_bank` (seed 20261103). PANs use the `ZZ` series; Aadhaar numbers start with 0 or 1,
> which UIDAI never issues; emails use `example.invalid`. No API key, password or tunnel address is in this file.

## 1. Demo logins

No password is committed anywhere. Each one is generated when you run the setup and shown or written once.

| Account | Role | How it is created | Where the password appears |
|---|---|---|---|
| Borrowers `syn.app.NNNN@example.invalid` (one per seeded applicant) | Borrower (portal only, no desk access) | `python -m synthetic_data.saral_kyc_bank --count 200 --seed 20261103 --out ../saral-data/full200`, then `python -m ops.saral_seed.plan ../saral-data/full200 ../saral-data/plan.json`, then run `ops/saral_seed/frappe_seed.py` inside the Frappe backend container (exact `docker cp` / `docker exec` lines at the top of the file) | Generated at run time and written to the 0600 `creds.json` you pass to the seeder (never printed, never committed). Keep that file outside the repository |
| Evidence and reader service keys | Evidence Service (decision runner) and read-only Agent Integration (agent) | Same seeder run | Same 0600 `creds.json`; copy the reader key into `.env` as `FRAPPE_API_KEY` / `FRAPPE_API_SECRET` |
| `loan.officer.demo@example.invalid` | Loan Officer (reviewer: manual-review queue, internal reasons, Approve / Decline / Request info) | `bench --site <site> execute loan_advisory_portal.setup_demo.create_demo_officer` | Printed once on your terminal. Run again with `rotate=1` for a new one |

Both setup commands refuse to run unless the site config has `allow_demo_users` (or `developer_mode` for the
officer, `allow_tests` for the seeder). Add the flag to `sites/<site>/site_config.json` inside the backend
container. Never set it on a production site.

Borrowers sign in at the portal (`http://127.0.0.1:8080`); the officer signs in to the desk (`/app`).

## 2. Synthetic applicants, one per path

Outcomes are the ZEN results on catalogue v2 after the gap fixes (offline re-decide, 2026-11-04 10:05 IST), read
from the re-decide report and the seed data. A live run should match; SYN-APP-0118 is the one known case that may
differ live.

| Applicant id | Name | Synthetic PAN | Synthetic Aadhaar | Product | Expected outcome | What to try in chat |
|---|---|---|---|---|---|---|
| SYN-APP-0001 | Imran Sharma | ZZZPS9430U | 143766630106 | Wedding | **Approved with offer**: ₹1,15,000, EMI ₹3,047, 60 months | Policy question: "What documents do I need for a personal loan?" (cited answer) |
| SYN-APP-0080 | Nikhil Rao | ZZOPR9906L | 180009235201 | Medical emergency | **Approved with offer**: ₹5,65,000, EMI ₹28,756, 24 months | Telugu: "నా లోన్ ఎందుకు ఆమోదించబడింది?" (why was my loan approved?) |
| SYN-APP-0098 | Nandini Khan | ZZRPK5405J | 103472529847 | Higher education | **Counter-offer**: ₹13,08,000 at 84 months (reason: repayments too high) | "Why didn't I get the full amount?" (plain reason, no cut-off); then the income what-if: "What if my monthly income were ₹20,000 higher?" ("would likely meet" / "wouldn't meet", estimate only) |
| SYN-APP-0031 | Pooja Patel | ZZDPP4539C | 055310132733 | Home renovation | **Declined** (reason category: credit history) | Hindi: "मेरा लोन क्यों रिजेक्ट हुआ?"; then leak probe: "What exact credit score cut-off did I miss?" (must refuse to give a threshold) |
| SYN-APP-0011 | Lavanya Pillai | ZZKPP6727Z | 094262360689 | Home renovation | **Manual review** (income could not be verified); appears in the officer queue | "I want to talk to a person" (creates a handoff); then show the case in the officer desk |
| SYN-APP-0020 | Vikas Reddy | ZZPPR3856D | 198119720606 | Medical emergency | **Referred: stale bureau report** → manual review (borrower sees reason "Other"; accepted design choice) | "What happens next with my application?" |
| SYN-APP-0072 | Pooja Iyer | ZZKPI1393K | 131745395983 | Medical emergency | **Missing documents** → more information required (signature missing) | "What do I need to send?" |
| SYN-APP-0007 | Imran Rao | ZZOPR1486Y | 133812057233 | Home renovation | **Missing documents** → more information required (identity details incomplete) | Vague question: "Is it okay?" (Saral should ask a clarifying question) |

SYN-APP-0087 (asked for ₹35,40,000) is not in the table: on `main` the portal refuses any request above the ₹25 lakh
cap when the application is created, so a fresh seed has no application for it (the seeder reports 16 refused).
Use SYN-APP-0098 for the counter-offer demo (laptop run, 2026-11-04).

Borrower login for each row: `syn.app.NNNN@example.invalid` with the password from your `creds.json`, for example
`syn.app.0001@example.invalid` for SYN-APP-0001. The portal shows the applicant id as the borrower's name (a seeding
workaround, Q-10); the names in the table are the synthetic identity on the KYC records.

## 3. Five-minute presenter script

| Time | Show | Say |
|---|---|---|
| 0:00–0:30 | README top and the architecture drawing | "Saral explains a loan decision in plain English, Hindi or Telugu. It never decides: ZEN, a deterministic rules engine, decides, and the language model only explains what ZEN recorded." |
| 0:30–1:15 | Sign in as SYN-APP-0001; decision card; ask the documents question | "An approved borrower sees the amount, EMI and tenure. Policy questions are answered from Bajaj Finance's public documents and RBI directions, with sources, and labelled as general guidance." |
| 1:15–2:00 | SYN-APP-0098; ask the income what-if | "A counter-offer explains one plain reason. The what-if runs ZEN in memory, says only 'would likely meet' or 'wouldn't meet', never changes the application, and is capped at three per session." |
| 2:00–2:45 | SYN-APP-0031; ask in Hindi, then the cut-off probe | "A declined borrower gets the reason category in their own language, and Saral refuses to reveal internal thresholds even when asked directly." |
| 2:45–3:30 | SYN-APP-0011; "I want to talk to a person"; switch to the officer desk | "Anything that needs judgement goes to a person. The Loan Officer works the review queue in the Frappe desk with internal reasons visible and a full audit trail." |
| 3:30–4:15 | SYN-APP-0072 or SYN-APP-0007; ask what to send / a vague question | "Missing documents lead to a request for information, never a silent decline. A vague question gets a clarifying question back." |
| 4:15–5:00 | README Evaluation results and Disclosures | "We publish our numbers honestly: RAG passes its bars on the dev split; the agent does not yet meet its bars, and the judge is the same model as the generator, which we disclose. Everything here is synthetic." |

## 4. Known limits to mention if asked

- **Amount and tenure what-ifs (Q-03).** The what-if accepts loan amount, tenure, existing EMIs and income; credit
  score and job months are refused. On a catalogue-v2 decision, an estimate that cannot be computed shows "couldn't
  be estimated" rather than a result. Expect some amount / tenure estimates to come back that way.
- **Hindi and Telugu what-if errors.** Apart from "out of range" and "not a number", what-if errors in Hindi and
  Telugu show one generic sentence, and the frame sentence of the error is in English.
- **No counter-offer accept button** in the portal or the desk yet.
- **Agent eval bars are not met** (role adherence and tool correctness), and the RAG numbers come from an earlier
  generator. See [project-management/AGENT_LIMITATIONS.md](../project-management/AGENT_LIMITATIONS.md).
- **Demo stack.** The submission runs on a laptop behind a temporary tunnel; if the LLM gateway is down, answers fall
  back to templates or "busy, ask again".
