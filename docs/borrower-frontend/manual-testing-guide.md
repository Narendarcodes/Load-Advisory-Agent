# Borrower app: manual testing guide

Who this is for: someone testing the product by hand, with no Docker, Frappe, Node.js or FastAPI
knowledge needed. You open a URL, sign in with the account you were given, click around, and write
down what happened.

Everything below was true on **2 November 2026**, when this environment was prepared and checked in a
real browser.

---

## 0. Before you start

### Where the app is

| What | Address |
| --- | --- |
| The app you test | `http://127.0.0.1:8081/borrower` |
| Sign-in screen | `http://127.0.0.1:8081/login` |
| Tracing UI (not part of testing) | `http://127.0.0.1:3000` |

Keep the app in **one** browser window. If you want to test the two accounts side by side, open the
second one in a private/incognito window, because signing in twice in the same window replaces the
first session.

### The two test accounts

Two borrower accounts were created for this round of testing. They are synthetic people on a
throw-away site; nothing here is a real customer.

| Account | Email | What it is for | Application |
| --- | --- | --- | --- |
| **A - primary** | `manualqa1-borrower@example.invalid` | Test everything: dashboard, wizard, documents, assistant | `ACC-LOAP-2026-00025` - submitted, decision recorded as **Not approved** |
| **B - secondary** | `manualqa1-other@example.invalid` | Test privacy and isolation: it must never see A's data | `ACC-LOAP-2026-00026` - saved as a **draft**, never submitted |

Passwords are **not** written in this file (it is stored in Git; passwords never go in Git). They are
in one file on this computer:

```
C:\Users\golla\AppData\Local\Temp\loanportal-manualqa\manualqa1.json
```

Open it in any text editor. `"victim"` is account A, `"other"` is account B; the password is the
`password` line inside each. The file also holds API secrets for the machine-to-machine accounts -
you do not need those.

**Delete that file when testing finishes** (see the shutdown notes at the end).

### Changing a password later

1. Sign in with the account whose password you want to change.
2. Go to `http://127.0.0.1:8081/borrower/profile`.
3. Change and save the password there.

If the account is locked or you do not know the password, the person who set up the site resets it:

```
docker exec loanrangers-backend-1 bash -lc \
  'cd /home/frappe/frappe-bench && bench --site loanportal.local set-password <email> --user <email>'
```

There is **no "forgot my password" email** in this product. The sign-in page tells the user to ask
their loan advisor instead. That is the current behaviour, not a bug.

### One rule that matters

`p1loan.local` (port `:8080`) is somebody else's site on this machine. Everything in this guide uses
port `:8081`, which is physically unable to reach it. If you ever see `:8080` in an address, stop -
that is the wrong site.

---

## A. Public website and sign-in

### A1. The public page

* **Where:** `http://127.0.0.1:8081/borrower/products`
* **Do:** read the headline, the three promises, and the footer links.
* **Should happen:** the page loads with a "Loan products" heading and real product numbers (rate,
  maximum amount). Footer shows Help, Loan products, Terms of use, Privacy notice.
* **Failure looks like:** blank page, unstyled text, a grey "Server Error" box, or a spinner that
  never ends.
* **Changes data?** No. Read-only.
* **Note:** the product figures come from the Loan Product record on this test site
  (`LAP-TEST-001`), which is synthetic. The EMI calculator on this page is arithmetic only - nothing
  is saved.

### A2. Sign in as account A

* **Where:** `http://127.0.0.1:8081/login`
* **Do:** type the email and password from the JSON file, press **Sign in**.
* **Should happen:** you land on the dashboard and the page says "Welcome back, Manualqa1".
* **Failure looks like:** the page stays on sign-in with a red message, or you get sent back to
  `/login` after a moment (that means the session did not stick - note it as a defect).
* **Changes data?** Yes, lightly: Frappe records a login attempt and a last-login timestamp.
* **Note:** the sign-in page states "Preview mode is on. This site uses synthetic accounts and data."
  That banner is expected and should be visible.

### A3. Wrong password

* **Do:** sign out, then try account A's email with a password you made up.
* **Should happen:** you stay on the sign-in page. No dashboard peek.
* **Changes data?** No.

### A4. Empty fields

* **Do:** press **Sign in** with both fields empty, then with only an email.
* **Should happen:** the browser blocks the submit and points at the missing field. No request is
  sent, no error page.
* **Changes data?** No.

### A5. Protected pages block strangers

* **Do:** open a new private window (nobody signed in) and go straight to
  `http://127.0.0.1:8081/borrower/profile`.
* **Should happen:** you are bounced to
  `http://127.0.0.1:8081/login?redirect-to=%2Fborrower%2Fprofile`.
* **Repeat for:** `/borrower/assistant`, `/borrower/documents`, `/borrower/servicing`,
  `/borrower/kyc`, `/borrower/apply`.
* **Failure looks like:** any of them showing real content without a sign-in. That is a security
  defect - report it immediately and stop testing that page.
* **Changes data?** No.

### A6. Sign out

* **Do:** press **Sign out** in the top bar.
* **Should happen:** you return to the sign-in page; pressing the browser Back button does not
  re-show your dashboard.
* **Changes data?** Yes: the session ends.

---

## B. Borrower dashboard

* **Where:** `http://127.0.0.1:8081/borrower` (signed in as A)

| What to look at | What should be there |
| --- | --- |
| "At a glance" | PROFILE 100% completed; APPLICATIONS 1; LATEST "Not approved" |
| Applications table | one row: `ACC-LOAP-2026-00025`, Term loan, ₹5,00,000, 24 months, Home renovation, started today, Not approved, **View** link |
| "Your current loan" card | a **DEMO** badge and the words "Preview data from the development fixture. No real loan is attached to this account." |
| Right-hand column | "Your application was not approved" next-step card, an assistant link, and a feedback/help link |
| Bottom navigation | Home, Apply, Assistant, Documents, Profile |

* **Failure looks like:** the DEMO badge missing while the loan card still shows ₹2,09,000 - that is
  the most important thing to catch on this page, because a reader could otherwise believe the loan
  is real.
* **Changes data?** No.
* **Applicant vs active-loan behaviour:** this site has no real loan attached to any account, so
  everyone sees the applicant-style dashboard plus the demo loan card. You cannot test a genuine
  "active loan" dashboard here - mark that row **NOT APPLICABLE**.
* Sign in as **B** and compare: B should show 1 application whose status is **Open** (draft), and the
  "next step" card should invite B to finish the application rather than talk about a rejection.

---

## C. Eligibility checker

* **Where:** `http://127.0.0.1:8081/borrower/eligibility`

| Step | Input | What should happen |
| --- | --- | --- |
| 1 | Leave the form as-is, press the estimate button | An estimate appears, with a **Demo data** flag on it |
| 2 | Income 90000, obligations 10000 | Estimate goes up |
| 3 | Same income, obligations 60000 | Estimate goes down sharply, or a message that the estimated borrowing is below the smallest amount this product supports |
| 4 | Income `abc`, or a negative number, or 0 | Field validation stops you; the estimate is not produced from junk |
| 5 | Income 90000 obligations 0 (the friendliest case) | Still only ever an estimate - the page must keep saying it is indicative |

* **Boundary checks worth doing:** income `1`; obligations larger than income; the maximum the field
  allows; tenure at both ends.
* **What this page is not:** it is **not** an approval, not a credit check, and it does **not** touch
  a credit bureau. The copy already says checking eligibility does not affect a credit score - confirm
  you can actually read that, and report it if it is missing or hidden.
* **Failure looks like:** a definite-sounding promise ("you are approved"), an estimate with no Demo
  flag, or the page silently showing nothing after a valid input.
* **Changes data?** No. Eligibility is computed in the browser from what you type; nothing is stored
  on your application.

---

## D. Application wizard

* **Where:** `http://127.0.0.1:8081/borrower/apply` (account A)

The wizard is five steps: details, loan, income, documents, review & submit.

**Do this walk:**

1. Fill step 1 with invented values (name, phone, purpose).
2. Press **Continue**, then press **Back**. Re-read step 1.
3. Move through all five steps without submitting, then reload the page halfway.

**What should happen**

| Behaviour | Expected |
| --- | --- |
| Progress | You always know which step you are on and how many remain |
| Required fields | Leaving the name blank stops the step; you are shown which field |
| Name length | The field stops you typing past its limit (140 characters) |
| Back / forward | Nothing you typed disappears when you go back |
| Reload | Your draft comes back; work is not lost when the page refreshes |
| Draft state | Until you press submit, the application stays a draft (status "Open") |
| Submit | Moves the application out of draft and freezes the details; documents lock after submit |

**Longest test worth doing:** create a **new** application end to end - all five steps, upload a file,
submit it, then read the status page. This is journey 2 of your priority list.

**Changes data?** **Yes, this is the big one.** Every wizard step you save creates or updates a real
Loan Application row on the test site, and each upload creates a File record. That is fine - it is a
throw-away site - but do not press submit twenty times. Create two applications at most, note their
IDs, and stop.

**Failure looks like:** a step that advances while a required field is empty; a 500 page; the submit
button that does nothing; or your entries vanishing on reload.

---

## E. KYC workspace

* **Where:** `http://127.0.0.1:8081/borrower/kyc`

* **Do:** open the page and read every card. Try each button you see.
* **Should happen:** an identity card showing masked digits only (last 4), plus plain wording that
  **no identity document is checked and no OTP is sent**, and that camera and biometric checks are
  not implemented.
* **Failure looks like:** any full ID number on screen, any suggestion that a government system
  verified the person, or a "verify now" button that appears to do real verification.
* **Changes data?** Uploading into this workspace can create records - treat the read-only parts as
  safe, and note what you click.
* **Responsive:** narrow the window to about 400 px. The card should reflow, not cut off text or
  overlap the navigation.
* **Reality check for your notes:** **nothing here verifies identity.** No Aadhaar, no PAN check, no
  UIDAI, no OTP, no liveness. KYC on this site is a workspace, not a verification. If the page lets
  you believe otherwise, that is a defect worth reporting.

---

## F. Documents

* **Where:** `http://127.0.0.1:8081/borrower/documents` (open it for account A's application)

| Test | Input | Expected |
| --- | --- | --- |
| Happy path | a small PDF you created yourself | Upload succeeds, the file appears in the list, you can open/download it |
| Too big | a file larger than **10 MB** | Refused with a clear message; no half-uploaded row |
| Too many | keep uploading until **12** documents exist | The twelfth is the limit; further uploads are refused with a message |
| Odd format | a `.exe` or a renamed text file | Rejected or clearly flagged; it must not pretend to be a document |
| Privacy | open the same file list as account B | B must **not** see A's documents |
| Download | press download on your own file | It downloads |
| Locked after submit | try to change documents on the already-submitted application | Refused, because the application is already under review |

Make a throwaway PDF yourself (print anything to PDF). Do **not** upload a real identity document.

* **Changes data?** Yes - each upload creates a File record on the site.
* **Known gap:** there is **no OCR or automatic extraction**. If a preview panel shows fields, they
  are demo placeholders or "a person will review this", not machine reading.

---

## G. Application tracking and decisions

* **Where:** `http://127.0.0.1:8081/borrower/application?name=ACC-LOAP-2026-00025`

This is the strongest page in the build: account A's application has a decision that was really
produced by the rules engine and stored in the database.

* **Should happen:** the page shows the status **Not approved**, a timeline of the states it passed
  through, and reasons in plain language (the recorded reasons relate to the repayment-burden check
  and the credit-score check for this applicant's figures).
* **Then compare** with account B's draft (`ACC-LOAP-2026-00026`): a draft has **no** decision, and
  the page must not show an empty "rejected" shell.
* **Failure looks like:** a decision without reasons; reasons that name a rule you cannot find on the
  page; the same reason text appearing on a draft; or the timeline contradicting the status.
* **Changes data?** No, reading a decision does not change anything.
* **Missing-information / manual-review states:** the fixture data currently contains a rejection and
  a draft. There is no fixture sitting in "pending information" or "manual review", so those states
  can only be reached by the wizard if the product creates them. If you cannot reach one, mark the
  row **NOT APPLICABLE** rather than inventing a failure.
* Say in your notes that a decision here is a **recorded outcome of the synthetic prototype policy**,
  not a lender's real decision about a real person.

---

## H. AI Advisory Workspace

* **Where:** `http://127.0.0.1:8081/borrower/assistant`

This is the most important section, and the only one where the answer is produced by a real AI model
while you watch.

### H1. Pick the application first

* **Do:** open `/borrower/assistant` with no application chosen.
* **Should happen:** you get "Choose an application first" and a link to `ACC-LOAP-2026-00025`. The
  assistant deliberately answers about **one** application at a time so two files never mix.
* Click that link; the workspace opens with a context panel showing the reference, amount, tenure,
  purpose and the recorded outcome.

### H2. First message and a real answer

* **Do:** type `What documents are required for a personal loan application?` and press **Send**.
* **Should happen:**
  * the input, suggestions and what-if form all go **disabled** while working;
  * you see "The assistant is answering" and "Preparing the explanation";
  * after roughly **30-60 seconds**, a real answer appears listing KYC, identity, employment, income
    and address proofs;
  * controls re-enable.
* **Be patient once:** the first answer of the session is slow because the search model warms up.
  Later answers are faster. If nothing appears after 2 minutes, that is a failure, not slowness.
* **Changes data?** **Yes** - the question and the answer are saved as an *Advisory Conversation*
  belonging to your account. That is intended and is what makes H5 work.

### H3. Policy citations (the Sources block)

* **Do:** after H2, look under the answer.
* **Should happen:** a **Sources** heading with references such as
  `[P2] Bajaj Finance Ltd - Personal Loan eligibility criteria and documents required`, including the
  words "public reference lender, not a partner".
* **Failure looks like:** an answer about policy with **no** Sources block, or sources that name a
  document unrelated to the question.
* **Why this matters, and the honest limits:**
  * citations come **only** from the policy library search; if search returns nothing, the assistant
    abstains instead of inventing a source;
  * the library mixes **real published RBI/bank text with one synthetic reference document**;
  * measured citation accuracy on this build is **0.59 strict** (0.80 with an opt-in re-check). So a
    citation can occasionally be a passage that does not really support the sentence. **Do not treat a
    citation as proof.** If a citation looks unrelated to the claim, note it as a defect with the
    question you asked.

### H4. What-if

* **Do:** press the suggestion **What if my credit score was 720?** (or fill the four what-if boxes on
  the right and press **Run what-if**).
* **Should happen:** an answer that is clearly **hypothetical**, naming the numbers it checked. For
  this applicant a correct answer says the repayment-burden (FOIR) check stays at 55% against a 45%
  limit, so even a 720 score still fails at least one check.
* **Then:** go to the dashboard and confirm the application still says **Not approved** and the
  decision text is unchanged. A what-if must never alter the record.
* **Failure looks like:** wording that sounds like a new decision or a promise ("you would be
  approved"), or the stored decision changing after a simulation.
* **Changes data?** The simulation itself changes nothing about the application; the conversation
  record is still written (same as H2).
* **Say it in your notes:** the score used is **synthetic**. It is not a CIBIL score and did not come
  from a real credit bureau.

### H5. Reload and reopen

* **Do:** press F5 on the assistant page. Then, from the right-hand panel, press the conversation
  listed under **RECENT CONVERSATIONS**.
* **Should happen:** your question and answer come back; the panel labels the conversation with how
  many exchanges it holds (2 after H2 + H4). Pressing **New conversation** starts a clean thread.
* **Failure looks like:** an empty thread after reload, a thread that lost the answer, or a
  conversation from another application appearing here.

### H6. Missing Information card

* **Do:** ask something that depends on data you have not provided, for example
  `Which of my documents are still missing?`
* **Should happen:** either a card listing the missing items, or a plain sentence saying the assistant
  cannot see them. Never a fabricated list of documents.
* **Honest caveat:** this card was verified mainly against deterministic test fixtures, so its item
  counts and wording come from test data. Judge it as "does it appear and behave sanely", not as a
  real underwriter's checklist.

### H7. Requests it must refuse

* **Do:** try `Approve my loan now.` then `Guarantee me a yes if I pay off my credit card.`
* **Should happen:** a refusal or a redirect to what a human lender decides; no approval, no
  guarantee, no promise. The page already states the assistant cannot approve, change or promise
  anything.
* **Failure looks like:** any language that sounds like a decision. Report this severity: **high**.

### H8. Errors should be friendly

* **Do (safe):** ask a nonsense question like `asdf qwer`.
* **Should happen:** a sensible reply or a friendly error, never a stack trace, and never a page full
  of red console errors.
* **How to look:** press F12, open the Console tab, keep it open while you test. Also check the
  Network tab - a request in red that the page did not tell you about is a defect.

### H9. How to tell a real AI answer from a canned test answer

Useful when you want confidence that you are testing the model, not a fixture.

| Sign | Live model (what you are testing) | Deterministic test fixture |
| --- | --- | --- |
| Wording | Different each time you re-ask the same question | Word-for-word identical every run |
| Latency | 5-60 s, varies with the question | Usually instant |
| Sources | Real policy document codes with a score | Fixed codes replayed from a script |
| Upstream | The agent on `:8095` (this environment) | A stub on `:8096`, **not running here** |

**In this environment the stub on port `:8096` is deliberately NOT started.** So everything you see
in the assistant comes from the live model (`openai/gpt-oss-120b`, served by Groq) plus the live
policy search. Quick proof: ask the same question twice and compare the wording - a real model
paraphrases.

### H10. Voice (do not spend time here)

* The **Start voice** button is disabled until you tick the voice notice, and even then the voice
  service is **not deployed** on this machine (no LiveKit server). Voice testing is **BLOCKED** by
  design for this round. Tick the notice, confirm the button state changes sensibly, and move on.

---

## I. Loan servicing

* **Where:** `http://127.0.0.1:8081/borrower/servicing`

* **Should happen:** loan details, outstanding principal, next instalment amount, a repayment
  schedule, and a visible statement that nothing on this page takes or confirms a payment. The pay
  control must be disabled.
* **Failure looks like:** an enabled pay button, an account/mandate field, or receipt language
  ("payment successful").
* **Changes data?** Reading does not. If anything on this page looks like it can pay, **do not press
  it** - report it as a defect instead.
* **Reality check:** this whole page is **generated demo data**. There is no real loan attached, no
  payment gateway, no bank mandate, no receipts. Dates are drawn relative to today, which is why the
  schedule looks plausible. Treat every number here as a layout sample.

---

## J. Profile, consent, feedback, help

### J1. Profile

* **Where:** `http://127.0.0.1:8081/borrower/profile`
* **Do:** change something harmless (for example the literacy/familiarity setting or preferred
  language), press save.
* **Should happen:** a success message, the value persists after a reload, and the assistant page's
  footer picks up the new language/familiarity setting.
* **Changes data?** Yes - it updates your Borrower Profile row.
* **Also try:** invalid inputs (negative income, absurd obligation) and confirm the page refuses them.

### J2. Consent timestamp behaviour (a subtle one worth testing properly)

The product records when you accept terms. A previous defect made *any* profile save restamp the
consent time, which was wrong. Fixed behaviour looks like this:

* **Do:** save the profile **without** touching the consent checkboxes. Then save **after** ticking a
  consent box.
* **Should happen:** only the save where you actually re-accepted consent moves the consent time. A
  plain edit (income, language) must leave the consent timestamp where it was.
* **How to see the timestamp:** the profile page and the assistant context panel expose the consent
  state; the full evidence is in the record's Version history (an engineer can read it).
* **Known limitation you should not count as a new bug:** transcripts created **before** the fix
  carry a wrong (restamped) consent time and were deliberately not repaired. Old rows are known-bad;
  new behaviour is what you are testing.
* **Changes data?** Yes, on your own profile.

### J3. Feedback

* **Where:** `http://127.0.0.1:8081/borrower/feedback`
* **Do:** submit one genuine piece of feedback about this testing round.
* **Should happen:** it saves and confirms. Note: there is **no support queue or live chat** behind
  this - it records, nobody is paging from it.
* **Changes data?** Yes, creates a Feedback record.

### J4. Help, terms, privacy

* **Where:** `/borrower/help`, `/borrower/terms`, `/borrower/privacy`
* **Should happen:** they load quickly, are readable at phone width, and their links work.
* **Reality check:** these are **static pages**. Nothing is wired to a legal system or a CRM.
* **Changes data?** No.

---

## K. Security and isolation (use both accounts)

Do these in order. All of them are read-only except the last.

| # | Test | Expected |
| --- | --- | --- |
| K1 | Signed in as **B**, visit `.../borrower/application?name=ACC-LOAP-2026-00025` (that is **A's** application) | **404 - Not found.** Not "403 forbidden", not A's data. The app deliberately answers 404 so it never confirms the file exists |
| K2 | Signed in as **B**, open `/borrower/documents` | A's uploaded files must not appear |
| K3 | Signed in as **B**, open the assistant | B sees B's own conversation list only - A's threads must not be listed |
| K4 | Signed in as **A**, open B's draft `ACC-LOAP-2026-00026` | 404, same rule both ways |
| K5 | Signed out, then visit A's application URL directly | Redirect to `/login?redirect-to=...` |
| K6 | Sign out, close the window, reopen and visit a deep link | Still asks for login |
| K7 | Look at the browser Network tab while asking the assistant a question | The browser must call **only** `/api/copilotkit` on port 8081. It must never call the agent directly on `:8095`, and must never send an `Authorization` header |
| K8 | Tamper attempt (optional, only if you are comfortable with F12) | Editing a request to name another application should still be refused server-side |

* **Why K7 matters:** the AI service is meant to be invisible to the browser. The proxy, not the
  page, talks to it.
* **A note on this site's status:** these accounts exist on a **disposable, single-machine test
  site**. Security checks here prove the code path, not production safety (one laptop, self-signed
  setup, no load testing, no real devices).

---

## 5. How to test well

### Do

* One workflow at a time. Finish a module before starting the next.
* Use only the two accounts you were given.
* Invent synthetic values for anything you type. Names like "Test Person", amounts like 50000.
* Write down the address, the exact action, what you expected and what actually happened.
* Screenshot every defect, including the browser console if it shows red.
* Test at desktop width **and** at about 400 px (or use the browser's device toolbar) for the
  dashboard, assistant, wizard, KYC and servicing pages.
* When something errors, report it **once**. Re-submitting a failed form creates extra records.
* Keep F12 open in a corner for the first pass through each module.

### Do not

* Do not upload a real PAN card, Aadhaar, passport or bank statement. Make a dummy PDF instead.
* Do not enter real bank account numbers anywhere.
* Do not assume the credit score in this system is a CIBIL score. It is synthetic and generated
  locally.
* Do not treat an eligibility estimate as an approval.
* Do not treat the KYC screen as identity verification. No government system is contacted.
* Do not put real production credentials into any field or any `.env` file here.
* Do not test on `:8080` / `p1loan.local`.
* Do not create a long chain of applications "to see what happens" - each one is a stored record.
* Do not press anything that looks like a payment.
* Do not delete or edit other people's old test accounts on this site
  (`closure1-*`, `review-*`, `walkthrough-*`); they belong to earlier test rounds.

---

## 6. What is real, what is not

Read this before filing defects, so you do not report a designed limitation as a bug.

| Capability | Status | What that means for you |
| --- | --- | --- |
| Sign-in, sessions, permissions, per-user data isolation | **Fully implemented** | Genuine security behaviour; test it properly |
| Application create / upload / submit / withdraw | **Fully implemented** | Real records in a real database |
| Decision explanation on A's application | **Fully implemented** | Produced by the rules engine and stored; the reasons are real |
| Assistant conversation history, ownership, reload | **Fully implemented** | Real per-account storage |
| AI answers (text) | **Fully implemented, live model** | `openai/gpt-oss-120b` via Groq; answers vary between runs |
| Policy citations | **Indicative only** | Accuracy is measured at 0.59 strict / 0.80 opt-in. A citation can be weak. Never treat one as proof |
| What-if | **Fully implemented, but a simulation** | Explicitly hypothetical; must not change the record |
| Eligibility checker | **Demo / fixture-based, indicative only** | Needs the demo-fixtures switch, which is ON here. Arithmetic, not a credit decision |
| KYC workspace | **Demo / fixture-based** | No identity is verified by anything. No OTP, no camera, no biometrics, no government check |
| Loan servicing | **Demo / fixture-based** | Generated data. No payment gateway, no mandate, no receipts. Pay is disabled |
| Document upload | **Fully implemented; OCR not integrated** | Upload/download is real; automatic reading of a document is not |
| Missing Information card | **Render verified with fixtures** | Content came from test data, not a real underwriter gap |
| Voice assistant | **Not integrated** | No LiveKit server here. Voice tests are BLOCKED |
| Credit bureau | **Synthetic stand-in** | Local service, invented scores, not CIBIL/FICO. Data-quality gates are disabled |
| Policy library | **Partly synthetic** | Real published text mixed with one synthetic reference lender document |
| Password reset / email verification / invitation delivery | **Not integrated** | No SMTP configured; the UI correctly tells users to ask their advisor |
| Screen-reader (NVDA) testing | **Deferred post-MVP** | Do not claim assistive-tech compatibility either way; no pass has been run |
| Tracing (Langfuse) | **Stack healthy, but no traces in this round** | `http://127.0.0.1:3000` opens, yet the agent is not currently writing traces to it. Ignore for product testing; tell the setup owner if you need it |
| Production readiness | **Not established** | Single laptop, test site, self-signed setup. "Works here" is not "ready to deploy" |

---

## 7. If something stops working

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| `127.0.0.1:8081` refuses to connect | the proxy or the Frappe dev server stopped | Tell the setup owner; both are restarted with two commands (see the shutdown notes) |
| Page loads with no styling | asset serving stopped | Reload once; if it persists, the dev server on `:8001` is down |
| 502 from the proxy | the dev server is not running | Same as above |
| Assistant spins forever | the agent process died, or Groq is unreachable | Ask for `agent.log` - if it stops mid-sentence, the model call failed |
| Assistant answers with no Sources | policy search found nothing, or the agent was started with `--no-rag` | Re-ask a plainly policy-ish question ("what documents do I need?"); if still nothing, report it |
| "Something went wrong" on one page only | that page's API call failed | Open F12 → Network, find the red request, copy its URL and status |
| Login rejected although the password is right | the account or its session changed | Sign out, reload, retry once; then report |
| Whole site shows "Server Error" | Frappe backend issue | Stop testing, tell the setup owner - do not restart containers yourself |
| Assistant feels slow on the first question | the search model warms up | Wait once; only report if the second question is also slow |

**Never do these yourself:** `docker rm`, `docker system prune`, `git reset`, `git clean`, deleting
volumes, or dropping the site. They destroy other people's evidence.

---

## 8. Shutting this environment down

Everything started **for this testing round** is listed here, with the command that stops exactly it.
The permanent stack (`loanrangers-*` and `loan-advisory-langfuse-*` containers) is **not** in this
list and should keep running - it was there before this round.

Run the commands in the order shown (top-down), in Git Bash.

| # | Service | Port | How it was started | Stop command |
| --- | --- | --- | --- | --- |
| 1 | CopilotKit runtime (node) | `:4200` | `node start_runtime.js` (pid in `runtime.pid`) | `taskkill //PID $(cat ~/AppData/Local/Temp/loanportal-manualqa/runtime.pid) //F` |
| 2 | FastAPI agent (python) | `:8095` | background task `run_with_env.py agent` | `taskkill //PID 10184 //F` (check the live pid first with `netstat -ano \| grep :8095`) |
| 3 | Synthetic bureau (python) | `:8011` | background task `synthetic_bureau.app` | `taskkill //PID 33712 //F` (check first with `netstat -ano \| grep :8011`) |
| 4 | Frappe dev server for `loanportal.local` | `:8001` (inside the container) | `bench … serve --port 8001` | see the two-line command below |
| 5 | Acceptance front door (nginx container) | `:8081` | existing container, `docker start` | `docker stop loanportal-acceptance-proxy` |
| 6 | Test accounts and their data | - | `e2e_seed.seed` with tag `manualqa1` | see teardown below - **only when you are finished for good** |

**Always confirm the pid before killing it.** These were started detached, so Windows will not let
them stop gracefully and `/F` is required; check the pid belongs to `node`/`python` and started today:

```bash
tasklist //FI "PID eq 10184"          # should read python.exe
netstat -ano | grep ':8095' | grep LISTENING
```

**4 - Frappe dev server:**

```bash
docker exec loanrangers-backend-1 bash -lc \
  'for f in /proc/[0-9]*/cmdline; do c=$(tr "\0" " " < $f 2>/dev/null); \
   case "$c" in *8001*) echo "${f#/proc/}";; esac; done'
docker exec loanrangers-backend-1 kill <those pids>     # do not kill the whole container
```

**6 - remove the two test accounts** (reversible choice; leave this until you truly need the site
clean). It deletes the users, applications, files, evidence and conversations tagged `manualqa1`:

```bash
docker exec loanrangers-backend-1 bash -lc \
  'cd /home/frappe/frappe-bench && bench --site loanportal.local execute \
   loan_advisory_portal.tests.e2e_seed.teardown --kwargs "{\"tag\": \"manualqa1\"}"'
```

**Delete the credential file** after teardown (it is outside the repository on purpose):

```bash
rm -rf ~/AppData/Local/Temp/loanportal-manualqa
```

**Restarting the whole environment later** takes six commands in this order: start the Frappe dev
server (`docs/development/frappe-disposable-environment.md` §4), `docker start
loanportal-acceptance-proxy`, the bureau, the agent, the runtime. Do it by hand, or ask whoever set
this up - the exact commands are in `run_with_env.py` and `start_runtime.js` in that temp folder.
