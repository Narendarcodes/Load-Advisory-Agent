# Third-party and generated assets

## Illustrations: Open Peeps by Pablo Stanley (CC0 1.0), v4 cast

Folder: `apps/loan_advisory_portal/loan_advisory_portal/public/illustrations/` (35 SVGs, ~480 KB total,
optimised with `svgo --multipass`, config `scripts/brand/svgo.config.cjs`).

**Source and licence.** The art is Open Peeps by Pablo Stanley, https://www.openpeeps.com/, dedicated to
the public domain under **CC0 1.0** (https://creativecommons.org/publicdomain/zero/1.0/): it may be copied,
modified and used commercially without permission or attribution. The separate parts (hair, face,
accessory, body pose) are taken from the npm package **`react-peeps@0.1.10`** by CeamKrier
(https://www.npmjs.com/package/react-peeps, https://github.com/CeamKrier/react-peeps; MIT code, the
drawings are Open Peeps CC0), which ships every Open Peeps part as separate paths. A courtesy credit
("Illustrations: Open Peeps by Pablo Stanley, CC0") is shown on the Help page.

**Build.**

    npm i --no-save --prefix /tmp/castdeps react@18.3.1 react-dom@18.3.1 react-peeps@0.1.10 svgo@4
    NODE_PATH=/tmp/castdeps/node_modules node scripts/brand/cast_parts.cjs <cache>   # cast figures
    python scripts/brand/peeps.py <cache> <out>                                      # scenes
    /tmp/castdeps/node_modules/.bin/svgo --config scripts/brand/svgo.config.cjs <out>/*.svg

### The cast

Two people and one mark. Every appearance of a person uses the **same hair, face and accessory parts**;
only the body pose changes with the scene, so they read as the same person everywhere.

| Cast member | Hair | Face | Accessory | Body poses used (react-peeps names) | Used for |
| --- | --- | --- | --- | --- | --- |
| **The borrower** | `Long` (long dark hair) | `Smile`; `Serious` when reading a not-approved letter; `Calm` when listening to the advisor | none (no sunglasses, no patterns) | standing `PointingFingerWB`, `RestingWB`, `WalkingWB`, `CrossedArmsWB`, `ShirtPantsWB`; sitting `HandsBackWB`; busts behind a desk `Geek` (laptop), `Device` (phone; its shirt speckles removed by `cast_parts.cjs`), `Coffee` (cup), `Shirt` | Every borrower action |
| **The advisor / reviewer** | `Short` (short dark hair) | `Smile` | `GlassRound` (round glasses) | standing `BlazerPantsWB`; bust `BlazerBlackTee` | Only where a person reviews or the borrower talks to a person: with a reviewer, help, handoff, feedback |
| **The assistant** | — | — | — | No person: the Saral mark (coral rounded square, ink path ending in a tick, from `public/brand/saral-mark.svg`) | Assistant empty state and "thinking" |

All borrower body poses are from the white-top / dark-trousers family (`…WB`) or plain white busts, so
the clothing stays consistent too.

**Treatment.** Black ink line and white fills as drawn. One 320×240 canvas (4:3) for every slot, a soft
coral-tint ground (`#FDECE6`), and every figure drawn at **one scale** (`SCALE = 0.072` canvas px per
Open Peeps unit), so heads, line weight and heights match across scenes. Busts always sit on a chair
behind a desk edge, so no figure is cut off in mid-air. Coral (`#FE7D6B`, `#FF8F68`) appears only on the
simple props drawn in `peeps.py`. Each SVG has a `<title>` naming the scene. In the templates every
illustration is decorative (`alt=""`), because the heading beside it says what it shows. Loading
states have no scene (eligibility "Working out your estimate" holds the slot with a skeleton block).

Audit of the v3 scenes and why each changed: [`ILLUSTRATION_AUDIT.md`](ILLUSTRATION_AUDIT.md).
Every scene side by side: `illustrations_sheet.png` in the v4 evidence folder attached to PR #38 (evidence is kept outside git).

| File | Used on (display size) | Scene | Cast / parts |
| --- | --- | --- | --- |
| `login.svg` | Sign in (hero, 320×240) | Borrower at a desk on her laptop, small shield | borrower bust `Geek` |
| `products.svg` | Loan products hero (320×240) | Borrower pointing at loan option cards | borrower `PointingFingerWB` |
| `dashboard.svg` | Dashboard next step (160×120) | Borrower pointing at a checklist with one step left | borrower `PointingFingerWB` |
| `wizard-about.svg` | Apply stage 1 (120×90) | Borrower beside her profile card | borrower `ShirtPantsWB` |
| `profile-header.svg` | Profile header (160×120) | Borrower beside her profile card | borrower `ShirtPantsWB` |
| `wizard-loan.svg` | Apply stage 2 (120×90) | Borrower at a desk on her phone, calculator | borrower bust `Device` |
| `wizard-documents.svg` | Apply stage 3 (120×90); result: draft (160×120) | Borrower holding her documents | borrower `CrossedArmsWB` |
| `documents-header.svg` | Documents header (160×120) | Borrower holding her documents | borrower `CrossedArmsWB` |
| `kyc.svg` | Identity check header (160×120) | Borrower at a desk on her phone, identity card | borrower bust `Device` |
| `submitted.svg` | Result: submitted (160×120) | Borrower relaxed, envelope with a tick | borrower `RestingWB` |
| `checking.svg` | Result: checks running (160×120) | Borrower waiting with a cup; magnifier over her paper | borrower bust `Coffee` |
| `assessment-pending.svg` | Result fallback (160×120) | Borrower waiting with a cup; clock on the wall | borrower bust `Coffee` |
| `processing.svg` | Result: with a reviewer (160×120) | Reviewer at a desk reading the application | advisor bust `BlazerBlackTee` |
| `missing-info.svg` | Result: information needed (160×120) | Borrower beside a form with a question | borrower `ShirtPantsWB` |
| `approved.svg` | Result: approved (160×120) | Borrower relaxed beside her letter with a tick | borrower `RestingWB` |
| `not-approved.svg` | Result: not approved (160×120) | Borrower reading her letter thoughtfully | borrower `CrossedArmsWB`, face `Serious` |
| `withdrawn.svg` | Result: withdrawn (160×120) | Borrower walking on, folder closed | borrower `WalkingWB` |
| `eligibility.svg` | Eligibility, before a result (120×90) | Borrower at a desk on her phone, range bar | borrower bust `Device` |
| `eligibility-result.svg` | Eligibility: indicative range (120×90) | Range bar inside the range, tick | object only |
| `eligibility-outside.svg` | Eligibility: outside the range (120×90) | Range bar, marker outside | object only |
| `repayments.svg` | Repayments header, preview (160×120) | Borrower sitting beside her repayment calendar | borrower `HandsBackWB` |
| `repayments-empty.svg` | Repayments not open yet (180×135) | Empty calendar | object only |
| `help-header.svg` | Help header (160×120) | Advisor and borrower talking at a desk | advisor bust `BlazerBlackTee`, borrower bust `Shirt` (`Calm`) |
| `handoff.svg` | Assistant: a person will help (96×72) | Advisor and borrower talking at a desk | as help |
| `feedback.svg` | Feedback header (160×120) | Borrower telling the advisor what she thinks | borrower `PointingFingerWB`, advisor `BlazerPantsWB` |
| `feedback-sent.svg` | Feedback, nothing sent yet (180×135) | Envelope with a tick | object only |
| `empty-applications.svg` | Dashboard / assistant, no applications (180×135) | Empty dashed page with a plus | object only |
| `empty-documents.svg` | Documents, none attached (180×135) | Empty folder | object only |
| `service-unavailable.svg` | Service unavailable, failed loads, assistant error (180×135 … 96×72) | Unplugged cable | object only |
| `not-found.svg` | Not found (180×135) | Map pin | object only |
| `privacy.svg` | Privacy header (160×120) | Shield with a lock | object only |
| `terms.svg` | Terms header (160×120) | Page of terms and a pen | object only |
| `invite.svg` | Invitation header (160×120) | Envelope with a key | object only |
| `assistant.svg` | Assistant empty state / choose an application (160×120) | Saral mark and a chat bubble | the mark |
| `assistant-thinking.svg` | Assistant thinking (96×72) | Saral mark and a "…" bubble | the mark |

Removed in v4: `calculating.svg` (loading has no scene). The v3 per-slot figures (`peep-46`, `peep-2`, …)
are no longer used.

## No shaders or animation libraries

The final design ships **no WebGL, no shader library and no animation library**. Every state treatment
(key cards, the status bar for checks running and page loading, the assistant's empty / thinking /
streaming states, the voice circle) is plain CSS in `public/css/portal.css` and
`apps/web/assistant/src/assistant.css`, with no image assets of its own.

Paper Shaders (`@paper-design/shaders`, Apache-2.0) were bundled during the v4–v6 iterations and were
**removed** at the user's request on 2026-11-03, together with the loader (`public/js/shader.js`), the
bundles (`public/js/vendor/saral-shader*.js`, `saral-chunk-*.js`), their licence and NOTICE copies and
the build scripts (`scripts/brand/build_shader.sh`, `shader_entry.mjs`, `shader_extra.mjs`). No Paper
code or licence obligation remains in the repository.

The fixture-only fake LiveKit module used for captures (`tests/e2e/fake_livekit.mjs`) is test code and
never ships to the portal.

## Final asset and licence list

| Asset | Where | Licence |
| --- | --- | --- |
| Illustrations (35 SVGs, the v4 cast) | `public/illustrations/` | Open Peeps by Pablo Stanley, CC0 1.0; parts via `react-peeps@0.1.10` (MIT code, CC0 art). Courtesy credit on the Help page |
| Saral mark, favicon, social image, web manifest | `public/brand/` | Original artwork for this project (`docs/BRAND.md`, `scripts/brand/`) |
| Sora and Manrope webfonts | `public/fonts/` | SIL Open Font License 1.1 (`public/fonts/*-OFL.txt` ship beside them) |
| Assistant island bundle | `public/js/assistant/` | Built from `apps/web/assistant` (React, CopilotKit, livekit-client and their dependencies under their own licences, unchanged from main) |

## Brand assets
Original artwork for this project; see `docs/BRAND.md` and `scripts/brand/`.

## Fonts
Sora and Manrope, SIL Open Font License 1.1 (`public/fonts/*-OFL.txt`).

**Phones (≤ 640 px).** When an empty state with its own scene is on screen, the page-head and
dashboard next-step scenes are hidden, so one screen never stacks two drawings.
