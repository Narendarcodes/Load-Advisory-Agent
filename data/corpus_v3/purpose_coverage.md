# Personal-loan purpose coverage in `saral_nbfc_policy` (corpus v3)

Method: I ran a word-pattern scan over all 329 Bajaj chunks (`purpose_mentions.json`) and then read every hit. A **mention** describes what the money can be used for. A **purpose-specific rule** would be an amount, tenure, eligibility, document or rate that applies only to that purpose. Nothing here is inferred from general figures.

The amount, tenure, rate and eligibility figures that apply to **every** personal loan are:
- ₹40,000 to ₹75 lakh (see conflict C1);
- 12 to 108 months;
- 10% to 30.5% p.a.;
- processing fee up to 4.13%;
- age 21 to 80;
- CIBIL 650 or higher.

These come from OVERVIEW, ELIG-DOCS, RATES-FEES and SALARIED.

One end-use rule covers all purposes: `BFL-PL-DETAILED-TNC#020` (d) says "The usage of the loan amount shall be for the purpose as mentioned in the Application Form/request only and shall not be diverted/ utilized for investment in capital market or for any other speculative, prohibited, fraudulent or unlawful purposes."

| Purpose | Bajaj docs → chunks that mention it | What the text says | Purpose-specific amount / tenure / eligibility rule? | Status |
|---|---|---|---|---|
| Wedding | `BFL-PL-OVERVIEW#002` ("Personal loan for wedding" section), `#016` (list + link label); `BFL-PL-SALARIED#002` (use list) | Can cover venue, caterers, photographers, decorators and other vendors | **None** | Mention only. No purpose-specific rule. |
| Higher education | `BFL-PL-OVERVIEW#002` ("Personal loan for higher education"), `#016`; `BFL-PL-ELIG-DOCS#002`; `BFL-PL-SALARIED#002` | Covers travel, tuition, extra courses and accommodation, "despite an education loan" | **None** | Mention only. No purpose-specific rule. |
| Home renovation | `BFL-PL-OVERVIEW#002` (heading), `#003` (section), `#016`, `#026`†; `BFL-PL-ELIG-DOCS#002` ("home improvements"); `BFL-PL-SALARIED#002` ("home repairs or furniture") | Covers repairs, painting, flooring, kitchen upgrades and bathroom improvements, spread across EMIs | **None** | Mention only. No purpose-specific rule. |
| Medical emergency | `BFL-PL-OVERVIEW#002` ("Personal loan for medical emergencies"), `#016`, `#025`†; `BFL-PL-ELIG-DOCS#002`, `#008`; `BFL-PL-SALARIED#002` | "hassle-free application and quick disbursal". ELIG-DOCS#008: "Rs. 40,000 to Rs. 75 lakh which can be used to pay for all your big or small medical expenses" | **None.** The ₹40k–₹75 lakh in #008 is the general range restated, not a medical rule. | Mention only. No purpose-specific rule. (OVERVIEW#012 "keep funds for emergencies" and SALARIED#008/#009 "healthcare professionals" are false positives.) |
| Travel | `BFL-PL-OVERVIEW#001` (heading "Personal loan for travel"), `#002` (section body), `#016`; `BFL-PL-SALARIED#002` | Covers a family vacation, honeymoon or international trip: flights, accommodation, visa fees and sightseeing | **None** | Mention only. No purpose-specific rule. (BFL-GRIEVANCE and SALARIED#009 hits are false positives: "public holidays" and "travel staff".) |
| Debt consolidation | `BFL-PL-OVERVIEW#016` only: the link label "Personal Loan For Debt Consolidation" (next to "Personal Loan Balance Transfer" and "Top Up Personal Loan") | No description at all. `BFL-PL-DETAILED-TNC#010/#021` cover consolidation and balance transfer only of a customer's **existing Bajaj consumer-durable (CD) loans**, at BFL's sole discretion. That is not a general debt-consolidation product. | **None** | **Unsupported.** Only a link label, with no description and no rule. |

† `#025` / `#026` are customer testimonials, not policy (flag F3). The site's machine-generated review summary, which also listed these purposes, was removed.

Reading for the product decision:
- Five purposes (wedding, higher education, home renovation, medical emergency, travel) each have a **dedicated descriptive section** on the overview page.
- Debt consolidation does not; it has only a link label.
- **No purpose has its own amount, tenure or eligibility rule.** Every purpose inherits the general personal-loan terms.
- Any per-purpose limit would therefore be invented, and must not be stated.
