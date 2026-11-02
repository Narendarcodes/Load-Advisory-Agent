# Third-party and generated assets

## Illustrations: Open Peeps by Pablo Stanley (CC0 1.0)

Folder: `apps/loan_advisory_portal/loan_advisory_portal/public/illustrations/` (36 SVGs, ~740 KB total,
optimised with `svgo --multipass`, config `scripts/brand/svgo.config.cjs`).
Composer: `scripts/brand/peeps.py <cache-dir> <out-dir>`.

**Source and licence.** Every figure is an unmodified Open Peeps figure by Pablo Stanley,
https://www.openpeeps.com/, downloaded from the SVG links on that page (hosted on
`cdn.prod.website-files.com`). Open Peeps is dedicated to the public domain under
**CC0 1.0** (https://creativecommons.org/publicdomain/zero/1.0/): it may be copied, modified and used
commercially without permission or attribution, and scripted download is allowed. A courtesy credit
("Illustrations: Open Peeps by Pablo Stanley, CC0") is shown on the Help page.

**Treatment.** The black ink line and white fills of each figure are kept as drawn. Each slot places
the figure on a 320×240 canvas (4:3, the same ratio for every slot) with a soft coral-tint ground
(`#FDECE6`) and, where the scene needs it, a simple prop drawn in `peeps.py` (document, phone-side
coins, clock, chat bubble, folder, tray, profile card, unplugged cable; v3 adds magnifier, calendar,
shield and lock, envelope, confetti, pen, star bubble, thought bubble, range bar, calculator, product
cards, signpost, phone and identity card). Coral (`#FE7D6B`, `#FF8F68`)
appears only on those props. Each SVG carries a `<title>` naming the scene and the source.
In the templates every illustration is decorative (`alt=""`), because the heading next to it already
says what it shows.

| File | Used on (display size) | Scene | Open Peeps figure | Source URL |
| --- | --- | --- | --- | --- |
| `login.svg` | Sign in (hero, 320×240) | A person working on a laptop | `peep-46` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53570264109d16a7014c37_peep-46.svg |
| `dashboard.svg` | Dashboard next step (160×120) | A person pointing at a rising chart | `peep-standing-16` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53622ec67e7957fc9b32e0_peep-standing-16.svg |
| `wizard-about.svg` | Apply stage 1 (120×90) | A person beside their profile card | `peep-standing-18` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e536266c99250fe47cebfc0_peep-standing-18.svg |
| `wizard-loan.svg` | Apply stage 2 (120×90) | A person working out a monthly amount on their phone | `peep-10` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53515e2b568a43f515edd5_peep-10.svg |
| `wizard-documents.svg` | Apply stage 3 (120×90); application result: draft (160×120) | A person pointing to a stack of documents | `peep-standing-17` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53624b9b55b0127f5851cf_peep-standing-17.svg |
| `assistant.svg` | Assistant empty state; assistant “choose an application” header (160×120) | A person asking a question | `peep-60` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5358a764109d50aa01705d_peep-60.svg |
| `empty-applications.svg` | Dashboard and assistant, no applications (180×135) | A person with an empty folder | `peep-2` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e532a4c258ffe237b8ef2c1_peep-2.svg |
| `empty-documents.svg` | Documents, none attached (180×135) | A person beside an empty tray | `peep-68` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535997e35d380ada67ad80_peep-68.svg |
| `assessment-pending.svg` | Application result for a state the portal does not describe (fallback, 160×120) | A person waiting, with a clock | `peep-sitting-12` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535f438becbf2fab5619bb_peep-sitting-12.svg |
| `processing.svg` | Application result: with a reviewer (160×120) | A person waiting with a cup while documents are checked | `peep-102` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535d808becbf7162555033_peep-102.svg |
| `submitted.svg` | Application result: submitted (160×120) | A person who has just sent their application | `peep-standing-23` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5362fa8becbf1d50570b23_peep-standing-23.svg |
| `missing-info.svg` | Application result: information needed (160×120) | A puzzled person and a form with a question | `peep-80` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535b00550b76252bf719e6_peep-80.svg |
| `service-unavailable.svg` | Service unavailable; eligibility estimate unavailable; application failed to load; assistant error (180×135; 120×90; 96×72 in chat) | A worried person and an unplugged cable | `peep-93` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535c7a550b76084df7d544_peep-93.svg |
| `documents-header.svg` | Documents page header (160×120) | A person sitting with their papers | `peep-sitting-18` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e536006c67e7976719986dc_peep-sitting-18.svg |
| `profile-header.svg` | Profile page header (160×120) | A person standing at ease | `peep-standing-13` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5361ccd3992383f7595afc_peep-standing-13.svg |
| `help-header.svg` | Help page header (160×120) | A person explaining something | `peep-standing-24` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5363188becbffe8c57172c_peep-standing-24.svg |
| `approved.svg` | Application result: approved (160×120) | A delighted person with an approved letter | `peep-105` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535dd92b568a729c1c42f5_peep-105.svg |
| `not-approved.svg` | Application result: not approved (160×120) | A person sitting and thinking about what to do next | `peep-sitting-1` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e532c65d871315ee7fcae9e_peep-sitting-1.svg |
| `withdrawn.svg` | Application result: withdrawn (160×120) | A person walking on with a closed folder | `peep-standing-25` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53633a7371bbe22da4c986_peep-standing-25.svg |
| `checking.svg` | Application result: checks running, after submit (160×120) | A person thinking while a document is checked under a magnifier | `peep-77` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535aa1d871310896104715_peep-77.svg |
| `eligibility.svg` | Eligibility result panel before a calculation (120×90) | A person pointing at a borrowing range | `peep-standing-22` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5362e2f5fa1aefa7ffe47c_peep-standing-22.svg |
| `eligibility-result.svg` | Eligibility result: indicative range (120×90) | A person in a wheelchair pleased with an estimate | `peep-sitting-14` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535f7d9b55b097be57089f_peep-sitting-14.svg |
| `eligibility-outside.svg` | Eligibility result: outside the range (120×90) | A person shrugging at an estimate outside the range | `peep-7` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5350f9d399238698511b2f_peep-7.svg |
| `calculating.svg` | Eligibility: working out the estimate, loading (120×90) | A person working something out on a phone beside a calculator | `peep-103` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535da59588e079598123fc_peep-103.svg |
| `products.svg` | Loan products hero (320×240) | A person looking over loan options | `peep-standing-19` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e536281c992503d98cecdc1_peep-standing-19.svg |
| `kyc.svg` | Identity check page header (160×120) | A person holding a phone next to an identity card | `peep-67` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53596f8e24933d7a06b0c7_peep-67.svg |
| `repayments.svg` | Repayments page header, preview mode (160×120) | A person sitting beside a repayment calendar and a coin | `peep-sitting-17` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535fd95197054606a88bd2_peep-sitting-17.svg |
| `repayments-empty.svg` | Repayments not open yet (180×135) | A person beside an empty calendar | `peep-sitting-6` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535e9fc992502f35cd7902_peep-sitting-6.svg |
| `feedback.svg` | Feedback page header (160×120) | A person in a wheelchair sharing what they think | `peep-sitting-15` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535f96c67e7961f5994532_peep-sitting-15.svg |
| `feedback-sent.svg` | Feedback history, nothing sent yet (180×135) | A person whose message has been sent | `peep-standing-10` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53613f9b55b0a5a457c452_peep-standing-10.svg |
| `privacy.svg` | Privacy notice header (160×120) | A person with a cup next to a shield and lock | `peep-38` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53560d9b55b04007535350_peep-38.svg |
| `terms.svg` | Terms of use header (160×120) | A person reading terms with a pen nearby | `peep-26` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5353e82b568af2d916cbbd_peep-26.svg |
| `invite.svg` | Invitation / set up your account header (160×120) | A person with an invitation and a key | `peep-standing-14` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5361e9f3aa4be48230418f_peep-standing-14.svg |
| `not-found.svg` | Application not found (180×135) | A person looking for a page with a magnifier | `peep-8` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53510f2b568ad72715a304_peep-8.svg |
| `assistant-thinking.svg` | Assistant thinking, before the first words (96×72) | A person thinking, with a thought bubble | `peep-sitting-11` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535f2ad39923f7d558435b_peep-sitting-11.svg |
| `handoff.svg` | Assistant: human help requested (96×72) | A person asking for a person to help | `peep-59` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5358878e2493fbea064dd9_peep-59.svg |

## Brand assets
Original artwork for this project; see `docs/BRAND.md` and `scripts/brand/`.

## Fonts
Sora and Manrope, SIL Open Font License 1.1 (`public/fonts/*-OFL.txt`).

**Phones (≤ 640 px).** When an empty state with its own scene is on screen, the page-head and
dashboard next-step scenes are hidden, so one screen never stacks two drawings.
