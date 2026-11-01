# Borrower app: manual test checklist

Fill in **Actual result**, **Status** and **Defect notes** as you test. Do not change Expected.

Status values: `NOT TESTED` · `PASS` · `FAIL` · `BLOCKED` · `NOT APPLICABLE`

Everything starts at `NOT TESTED`. Automated tests passing is **not** a reason to mark anything PASS -
mark PASS only when you saw it happen in the browser with your own hands.

Guide with instructions: [manual-testing-guide.md](manual-testing-guide.md)

* Site: `http://127.0.0.1:8081/borrower` (disposable `loanportal.local` only)
* Account A: `manualqa1-borrower@example.invalid` - application `ACC-LOAP-2026-00025` (submitted, Not approved)
* Account B: `manualqa1-other@example.invalid` - application `ACC-LOAP-2026-00026` (draft)
* Passwords: `C:\Users\golla\AppData\Local\Temp\loanportal-manualqa\manualqa1.json` (`victim` = A, `other` = B)
* Prepared and browser-checked on 2026-11-02

### Priority journeys (do these first)

| Journey | Rows |
| --- | --- |
| 1. Login → Dashboard | `A2`, `B1`, `B2`, `B3` |
| 2. Eligibility → Application wizard | `C1`, `C5`, `D1`, `D6` |
| 3. Application → KYC → Documents | `D6`, `E1`, `F1`, `F5` |
| 4. Application status → Decision explanation | `G1`, `G2`, `G4` |
| 5. Assistant → What-if → Conversation reload | `H2`, `H4`, `H6` |
| 6. Profile update → Consent timestamp integrity | `J1`, `J2`, `J3` |
| 7. Two borrowers → Ownership and isolation | `K1`, `K2`, `K3`, `K7` |

---

## A. Public website and authentication

| ID | Module | Test scenario | Expected result | Actual result | Status | Defect notes |
|---|---|---|---|---|---|---|
| A1 | Public | Open `/borrower/products` as a guest | Page renders styled, real product figures, footer links work | | NOT TESTED | |
| A2 | Auth | Sign in as account A | Land on dashboard, greeted by name | | NOT TESTED | |
| A3 | Auth | Sign in with a wrong password | Stay on sign-in, no dashboard peek | | NOT TESTED | |
| A4 | Auth | Submit sign-in with empty fields | Browser validation blocks it, no request sent | | NOT TESTED | |
| A5 | Auth | Guest opens `/borrower/profile` directly | Redirect to `/login?redirect-to=…` | | NOT TESTED | |
| A6 | Auth | Guest opens `/borrower/assistant` directly | Redirect to login | | NOT TESTED | |
| A7 | Auth | Guest opens `/borrower/documents` directly | Redirect to login | | NOT TESTED | |
| A8 | Auth | Preview-mode notice on sign-in page | "Preview mode is on… synthetic accounts and data" visible | | NOT TESTED | |
| A9 | Auth | Sign out, then browser Back | Dashboard does not reappear | | NOT TESTED | |
| A10 | Auth | No password-reset path | Page tells user to ask their advisor; no broken reset link | | NOT TESTED | |

## B. Borrower dashboard

| ID | Module | Test scenario | Expected result | Actual result | Status | Defect notes |
|---|---|---|---|---|---|---|
| B1 | Dashboard | "At a glance" cards for A | Profile 100%, Applications 1, Latest "Not approved" | | NOT TESTED | |
| B2 | Dashboard | Applications table for A | One row `ACC-LOAP-2026-00025`, ₹5,00,000, 24 months, Home renovation, Not approved | | NOT TESTED | |
| B3 | Dashboard | Next-step card for a rejected applicant | "Your application was not approved" + Read the decision link | | NOT TESTED | |
| B4 | Dashboard | Loan card carries a DEMO badge | Badge present **and** "No real loan is attached to this account" | | NOT TESTED | |
| B5 | Dashboard | Applicant vs active-loan dashboard | Cannot be tested: no real loan exists on this site | | NOT APPLICABLE | demo fixture only |
| B6 | Dashboard | Dashboard as account B | Shows 1 application with status Open (draft), no rejection language | | NOT TESTED | |
| B7 | Dashboard | Bottom navigation links | Home / Apply / Assistant / Documents / Profile all load | | NOT TESTED | |
| B8 | Dashboard | Layout at ~400 px width | Reflows, no cut-off text or overlap | | NOT TESTED | |

## C. Eligibility checker

| ID | Module | Test scenario | Expected result | Actual result | Status | Defect notes |
|---|---|---|---|---|---|---|
| C1 | Eligibility | Default values, request estimate | An estimate appears carrying a "Demo data" flag | | NOT TESTED | |
| C2 | Eligibility | Income 90000 / obligations 10000 | Higher estimate | | NOT TESTED | |
| C3 | Eligibility | Income 90000 / obligations 60000 | Lower estimate, or "below the smallest amount supported" | | NOT TESTED | |
| C4 | Eligibility | Non-numeric / zero / negative income | Validation refuses it, no estimate from junk | | NOT TESTED | |
| C5 | Eligibility | Result is clearly not an approval | Indicative wording present; no approval language | | NOT TESTED | |
| C6 | Eligibility | Boundary values (min income, obligations > income, max values) | Handled sensibly, no crash or blank panel | | NOT TESTED | |
| C7 | Eligibility | Credit-score wording | Page states a score check does not affect your credit | | NOT TESTED | |

## D. Application wizard

| ID | Module | Test scenario | Expected result | Actual result | Status | Defect notes |
|---|---|---|---|---|---|---|
| D1 | Wizard | Step 1 with a required field left blank | Step blocked, field named | | NOT TESTED | |
| D2 | Wizard | Back then forward on step 1 | Entered values preserved | | NOT TESTED | |
| D3 | Wizard | Progress indicator through 5 steps | Current step and total always visible | | NOT TESTED | |
| D4 | Wizard | Reload mid-way through the wizard | Draft restored, no lost work | | NOT TESTED | |
| D5 | Wizard | Name longer than the limit | Field stops input at 140 characters | | NOT TESTED | |
| D6 | Wizard | Complete all 5 steps and submit | Application leaves draft; status visible on tracking page | | NOT TESTED | creates real records |
| D7 | Wizard | Documents lock once submitted | Editing documents after submit is refused | | NOT TESTED | |
| D8 | Wizard | Draft never shows as submitted | New draft status is Open, not Submitted | | NOT TESTED | |

## E. KYC workspace

| ID | Module | Test scenario | Expected result | Actual result | Status | Defect notes |
|---|---|---|---|---|---|---|
| E1 | KYC | Open `/borrower/kyc` | Identity card shows masked digits only (last 4) | | NOT TESTED | |
| E2 | KYC | Verification disclaimers | States no document is checked and no OTP is sent | | NOT TESTED | |
| E3 | KYC | Camera / biometric paths | Explicitly labelled not implemented; no fake "verify" flow | | NOT TESTED | |
| E4 | KYC | KYC state wording | A failed check is never presented as a rejection | | NOT TESTED | |
| E5 | KYC | Layout at ~400 px | Card reflows correctly | | NOT TESTED | |

## F. Documents

| ID | Module | Test scenario | Expected result | Actual result | Status | Defect notes |
|---|---|---|---|---|---|---|
| F1 | Documents | Upload a small dummy PDF | Upload succeeds, file listed, opens/downloads | | NOT TESTED | creates a record |
| F2 | Documents | Upload a file over 10 MB | Refused with a clear message; no partial row | | NOT TESTED | |
| F3 | Documents | Exceed 12 documents | 13th refused with a message | | NOT TESTED | |
| F4 | Documents | Upload a non-document file | Rejected or clearly flagged, not accepted silently | | NOT TESTED | |
| F5 | Documents | Privacy: A's files as B | B never sees A's documents | | NOT TESTED | |
| F6 | Documents | OCR / auto-extraction | Not integrated: preview shows demo fields or "person review" | | NOT TESTED | known limitation |

## G. Application tracking and decisions

| ID | Module | Test scenario | Expected result | Actual result | Status | Defect notes |
|---|---|---|---|---|---|---|
| G1 | Tracking | Timeline of `ACC-LOAP-2026-00025` | States shown match the "Not approved" status | | NOT TESTED | |
| G2 | Decisions | Reasons on the rejected application | Plain-language reasons are present and specific | | NOT TESTED | |
| G3 | Decisions | Draft shows no decision | `ACC-LOAP-2026-00026` shows no rejection shell | | NOT TESTED | |
| G4 | Decisions | No browser-side thresholds | Numbers come from the stored record, not invented | | NOT TESTED | |
| G5 | Decisions | Missing-information / manual-review states | No fixture exists in these states on this site | | NOT APPLICABLE | fixture gap |
| G6 | Tracking | Status changes appear after new actions | Dashboard, table and detail page agree | | NOT TESTED | |

## H. AI Advisory Workspace

| ID | Module | Test scenario | Expected result | Actual result | Status | Defect notes |
|---|---|---|---|---|---|---|
| H1 | Assistant | Open assistant with no application | "Choose an application first" and a link to A's app | | NOT TESTED | |
| H2 | Assistant | First question gets an answer | Real answer in ~30-60 s; controls disabled meanwhile | | NOT TESTED | |
| H3 | Assistant | Progress indicators | "The assistant is answering" / "Preparing the explanation" shown | | NOT TESTED | |
| H4 | Assistant | Policy answer shows Sources | Citation codes with document titles under the answer | | NOT TESTED | accuracy 0.59/0.80 - indicative |
| H5 | Assistant | Citation actually supports the claim | Source is relevant to the sentence it backs | | NOT TESTED | |
| H6 | Assistant | What-if returns a hypothetical | Labelled simulation, cites FOIR 55% vs 45% staying failed at score 720 | | NOT TESTED | |
| H7 | Assistant | What-if leaves the record alone | Application still "Not approved", decision text unchanged | | NOT TESTED | |
| H8 | Assistant | Reload restores the conversation | Question and answer come back | | NOT TESTED | |
| H9 | Assistant | Reopen from RECENT CONVERSATIONS | Thread listed with exchange count; reopens correctly | | NOT TESTED | |
| H10 | Assistant | New conversation starts clean | Empty thread, old one still available | | NOT TESTED | |
| H11 | Assistant | Missing Information card | Card or honest "cannot see them"; never a fabricated list | | NOT TESTED | fixture-verified rendering |
| H12 | Assistant | Request an approval | Refused; no approve/reject language | | NOT TESTED | high severity if it fails |
| H13 | Assistant | Request a guarantee | Refused; no promise of an outcome | | NOT TESTED | high severity if it fails |
| H14 | Assistant | Nonsense question | Friendly reply or friendly error, no stack trace | | NOT TESTED | |
| H15 | Assistant | Console is clean while testing | No red errors in F12 Console during the session | | NOT TESTED | |
| H16 | Assistant | Live model vs test fixture | Answers vary between runs; no stub on `:8096` here | | NOT TESTED | |
| H17 | Assistant | Foreign conversation cannot be reopened | Another borrower's thread cannot be loaded | | NOT TESTED | |
| H18 | Voice | Start voice | Button stays unusable; LiveKit is not deployed here | | BLOCKED | voice not integrated |
| H19 | Voice | Voice consent notice checkbox | Ticking changes button state sensibly | | NOT TESTED | |

## I. Loan servicing

| ID | Module | Test scenario | Expected result | Actual result | Status | Defect notes |
|---|---|---|---|---|---|---|
| I1 | Servicing | Page loads with schedule | Outstanding, next instalment and schedule render | | NOT TESTED | |
| I2 | Servicing | No-payment statement | Page says nothing takes or confirms a payment | | NOT TESTED | |
| I3 | Servicing | Pay control is disabled | Cannot press any payment action | | NOT TESTED | |
| I4 | Servicing | Demo vs live labelling | Data is generated fixture data, presented as such | | NOT TESTED | |
| I5 | Servicing | Layout at ~400 px | Schedule reflows without breaking | | NOT TESTED | |

## J. Profile, consent, feedback, help

| ID | Module | Test scenario | Expected result | Actual result | Status | Defect notes |
|---|---|---|---|---|---|---|
| J1 | Profile | Save a harmless profile change | Success message; value persists after reload | | NOT TESTED | |
| J2 | Consent | Save **without** touching consent boxes | Consent timestamp does **not** move | | NOT TESTED | the fixed defect |
| J3 | Consent | Save **after** re-accepting consent | Consent timestamp moves for that acceptance | | NOT TESTED | |
| J4 | Profile | Invalid values (negative income, obligations > income) | Refused with a field message | | NOT TESTED | |
| J5 | Profile | Language/familiarity feeds the assistant | Assistant footer reflects the new setting | | NOT TESTED | |
| J6 | Feedback | Submit one feedback entry | Saves and confirms | | NOT TESTED | creates a record |
| J7 | Help | Help page links | Links work; no live chat or support queue promised | | NOT TESTED | |
| J8 | Legal | Terms and privacy pages | Both load, readable at phone width | | NOT TESTED | static pages |

## K. Security and isolation

| ID | Module | Test scenario | Expected result | Actual result | Status | Defect notes |
|---|---|---|---|---|---|---|
| K1 | Isolation | B opens A's application URL | **404**, not A's data and not 403 | | NOT TESTED | |
| K2 | Isolation | B opens documents | A's files absent | | NOT TESTED | |
| K3 | Isolation | B opens the assistant | Only B's conversations listed | | NOT TESTED | |
| K4 | Isolation | A opens B's draft | 404, rule holds both ways | | NOT TESTED | |
| K5 | Session | Signed out, deep link to A's app | Redirect to login with redirect-to | | NOT TESTED | |
| K6 | Session | Sign out, new window, deep link | Login still required | | NOT TESTED | |
| K7 | Boundary | Network tab during an assistant turn | Only `/api/copilotkit` on :8081; no `:8095` call; no Authorization header | | NOT TESTED | |
| K8 | Boundary | Edit a request to name another application | Server still refuses | | NOT TESTED | |
| K9 | Auth | Authenticated POST without CSRF token | Refused with a CSRF error | | NOT TESTED | |
| K10 | Privacy | Assistant never sees full ID numbers | Identity numbers and document contents not surfaced in answers | | NOT TESTED | |

---

## Sign-off

| Item | Value |
| --- | --- |
| Rows in this checklist | 92 |
| Tested by | |
| Date finished | |
| Rows marked FAIL | |
| Highest-severity defect found | |
| Overall verdict | |

Rule of thumb for the verdict: a FAIL in section **K** (isolation) or **H12/H13** (the assistant
approving or promising) matters more than any cosmetic problem elsewhere.
