# Saral design principles

How the borrower portal and the assistant island are designed, what rules they follow, where they
deliberately break them, and how we check. Brand basics (logo, colour tokens, type, voice) are in
[`BRAND.md`](BRAND.md); illustration sources and licences are in [`ASSETS.md`](ASSETS.md).

Scope: `apps/loan_advisory_portal/loan_advisory_portal/{www,templates,public/css,public/js}` and
`apps/web/assistant/src`. Underwriting, the decision engine and policy content are out of scope.

## 1. Rules applied

Three public design skills were used as checklists during the Saral redesign (v2 and v3 passes):
[pbakaus/impeccable](https://github.com/pbakaus/impeccable),
[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) and
[heydamir/unslop](https://github.com/heydamir/unslop) (CC BY 4.0, Damir Sokolovsky). Where they
disagree, the brand sheet and the borrower's task win.

### Surfaces and depth
- **Sections, not boxed cards.** A page is a column of sections split by 1 px hairlines
  (`--line`). No card grids, no cards inside cards, no icon-topped feature cards
  (impeccable "identical card grids", taste-skill "no rows of identical cards", unslop "equal cards").
  Lists of facts are definition rows (`dl`): label left, value right on wide screens, stacked on phones.
- **Radii 8 / 6 / 4** (`--radius`, `--radius-sm`, `--radius-xs`) by element size. Only buttons,
  badges and status pills are fully round (see deviations).
- **No resting shadows** (`--shadow-sm: none`). `--shadow` is kept for things that float: menus,
  dialogs, the mobile sheet and drawer. Hover and focus may lift; nothing at rest glows.
- **No gradients, no glass, no glows, no blobs, no emoji, no sparkle for "AI".**
- **No coloured side stripes** on alerts or list items (impeccable "side-stripe borders"); alerts use a
  quiet tint and a full hairline.

### Colour and emphasis
- **One coral primary action per page.** Every other action is a ghost button, a quiet button or a
  `link-quiet` text link. In-flight result states (submitted, checks running, with a reviewer) show
  no coral at all, because the borrower has nothing to do.
- Coral is never text; small emphasis and links use `--deep` (5.37:1 on paper).
- Status is never colour alone: every badge and status line carries words.

### Type and copy
- **Sentence case** for headings, labels, buttons and nav. No tiny uppercase tracked labels.
- **No eyebrows** or kicker labels above headings; no pill badge above a headline.
- **No index numbering** (01 / 02 / 03, "Step 2", numbered circles). Order is carried by position and
  words; a sequence that matters is a plain list.
- Two families only: Sora (headings, figures) and Manrope (reading text). Tabular figures for money
  and dates.
- Plain borrower language, guarded by `tests/test_borrower_copy.py` (portal) and
  `apps/web/assistant/src/copy.test.tsx` (island). One trust line: "Understand your loan decision.
  A person decides."
- Headlines say what happened; the next sentence says why; the actions say what to do next.

### Motion
- No bounce or elastic easing (the old `saral-bounce` was removed after impeccable flagged it).
- Loading motion is a slow opacity breath, never a sliding shimmer band. Everything stops under
  `prefers-reduced-motion: reduce`.

### Responsive
- Checked at 1280, 820 and 390 px. No horizontal scroll at any width (the capture records
  `horizontalOverflowPx` for every frame).
- On phones the form comes before its summary, page actions go full width, and the sticky composer
  and tab bar never cover the newest content.

## 2. Deliberate deviations

These go against at least one of the three skills on purpose. Keep them unless the brand changes.

| Deviation | Rule it breaks | Why we keep it |
| --- | --- | --- |
| Cream brand paper `#F7F3EE` (`--paper`) | impeccable `cream-palette`; taste-skill "no assistant palette (cream with terracotta)" | It is the Saral brand ground in `BRAND.md`, chosen with the coral mark; ink on it is 15.1:1. The live impeccable scan reports it on every page and we accept that finding. |
| Pill buttons and badges (`border-radius: 999px`) | unslop "every element a full pill"; impeccable "pills are for small controls" | Only buttons, badges and status pills are round, decided once for the whole product (taste-skill allows "square or fully round, decided once"). Sections, inputs and tables stay 8/6/4. |
| Tinted alerts | taste-skill "surfaces separated by tone, never a line" | An error or warning must be found at a glance on a long form. The tint is soft, always paired with a heading and words, and never a side stripe. |
| `--font-mono` token resolves to **Sora** | taste-skill "no monospace outside code" (the lint still WARNs on the token name) | The token is a legacy name for "figures and references". No monospace face ships; the WARNs are on the variable name, not on monospace type. |
| `example.com` in test data (`apps/web/assistant/src/turns.test.ts`) | taste-skill `placeholder-data` (the only remaining FAIL) | `example.com` is reserved by RFC 2606 for documentation and tests, so it can never reach a real inbox. It is test-only and never rendered to a borrower. |
| Hairline dividers between sections | taste-skill "no thin rules, no hairline dividers" | Kept by user request: hairlines replaced the boxed cards and read as calm structure on cream paper. |

## 3. Illustrations

- **Source:** Open Peeps by Pablo Stanley, **CC0 1.0** (openpeeps.com). Figures are used as drawn;
  every file, figure and source URL is listed in `ASSETS.md`. A courtesy credit is on the Help page.
- **Treatment:** black ink line and white fills kept; coral (`#FE7D6B`, `#FF8F68`) appears only on the
  simple props drawn by `scripts/brand/peeps.py` (document, magnifier, calendar, signpost and so on)
  and on the soft coral-tint ground. One 4:3 canvas (320×240) for every slot, optimised with svgo.
- **One scene per section.** A section gets at most one drawing, next to its heading.
- **One scene per screen on phones.** At 640 px and below, when an empty state shows its own scene,
  the page-head and next-step scenes step aside (`portal.css`, "one scene per screen") so two
  drawings never stack in one view.
- **Decorative only:** every illustration has `alt=""`; the heading beside it says what it shows.
  A drawing never carries information the text does not.
- No robots, brains, circuit lines or stock "AI" imagery.

## 4. Loading pattern

- **Skeletons in the final layout.** Application, dashboard and documents pages render skeleton
  rows, titles, amounts and badges in the same grid as the loaded page (`.skeleton--*`), in flat
  `--paper-2`, breathing by opacity (`calm-pulse`, 1.8 s). No shimmer, no gradient; still under
  reduced motion. The busy region carries `aria-busy="true"` until it is filled.
- **Pending buttons keep their width** and change their label to say what is happening
  (`portal.js` `busy()`); they are disabled while busy so nothing is sent twice.
- **After submit** a processing view shows a dated progress list built from the record. It never
  promises a time, and re-checks every 15 s only while the page is visible.
- **Assistant:** a thinking scene and a plain-language activity trail ("What I checked") while an
  answer streams; markdown is formatted while streaming; errors appear inline with Retry.
- A load failure shows what failed and a "Try again" ghost button, never a blank column.

## 5. Result pattern

Every result (eligibility estimate and each application lifecycle state: approved, not approved,
information needed, submitted, checks running, with a reviewer, withdrawn, draft) has the same shape:

1. **One scene and a status badge with a date** ("Information needed · Assessed 12 Oct 2026").
2. **A headline that says what happened** and one sentence on what it means.
3. **The real reasons** from the record (rules that applied, values to correct, why this range).
   Simulations are labelled "Simulation, not your decision".
4. **What happens next** as a short list.
5. **One coral primary action** plus at most one quiet link. On the information-needed result the
   coral action is "Resubmit application" in the form; the "Update details" jump link is a ghost.
6. A one-line scope note ("Only checks recorded on this application appear here").

The eligibility result shows an indicative ₹ range, what the estimate leaves out, and steps the form
button back to "Recalculate" once a result shows, so one coral action remains.

## 6. How we check

- **Shots:** `tests/e2e/redesign_capture.cjs` (`MODE=v3`) against the test-only fixture render
  (`tests/e2e/fixture_portal.py`: real templates, CSS, JS and island; stubbed API and stub assistant
  answers). Every frame is viewed at 1280, 820 and 390.
- **Accessibility:** axe-core, WCAG 2.2 AA tags, per route slice (`MODE=axe`).
- **Scans:** taste-skill `lint.mjs --app` over `public/css`, `www`, `templates` and
  `apps/web/assistant/src`; impeccable `detect` over the same paths (static, regex rules), plus a
  live-page impeccable scan of the fixture render in v3.

### Scan counts

| Pass | taste-skill lint (`--app`) | impeccable detect (static) |
| --- | --- | --- |
| Before (origin/main) | 19 FAIL / 109 WARN | 0 findings, 1 advisory (`bounce-easing`) |
| v2 (e8a272d) | 1 FAIL / 85 WARN | 0 findings |
| v3 (this pass) | 1 FAIL / 87 WARN | 0 findings, 0 advisories |

v3 notes:
- The one FAIL is the reserved `example.com` test address (deviation above).
- WARNs: 30 `mono` (the Sora-backed token name), 47 `shadow` (all are `none` resets, hover/focus
  rings, overlays such as the dialog, drawer and sheet, or shadows overridden later; two more than v2), 7 `glass`
  (the sticky top and tab bars, the dialog backdrop, and `none` resets), 1 `eyebrow` (a legacy selector no template uses), 1 `numbering` (`padStart` for
  date formatting in a test), 1 `em-dash`.
- Live impeccable scan (products, dashboard, eligibility, info-needed and not-approved results):
  `cream-palette` on every page (accepted deviation) and `first-viewport-column-overflow` on the
  eligibility form and the application result, where a long form or record is the content.
- axe WCAG 2.2 AA: 0 violations on all 29 pages at 1280 and at 390.
