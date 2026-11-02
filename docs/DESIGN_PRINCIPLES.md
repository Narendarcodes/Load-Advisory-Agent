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

### Surfaces and depth (v4)
- **Sections, not boxed cards.** A page is a column of sections split by 1 px hairlines
  (`--line`). No card grids, no cards inside cards, no icon-topped feature cards
  (impeccable "identical card grids", taste-skill "no rows of identical cards", unslop "equal cards").
  Lists of facts are definition rows (`dl`): label left, value right on wide screens, stacked on phones.
- **Two surface tones, three levels.** Fully flat read as cheap and "card everything" reads as AI slop,
  so depth is restrained and has exactly three levels:
  1. *Page*: cream `--paper`, flat. Most content lives here, split by hairlines.
  2. *Raised surface*: white `--surface` with a 1 px `--line` border and **no shadow**, only for the
     primary work areas: the sign-in form, the apply wizard panel, the eligibility form and result, the
     application result, and the assistant panel.
  3. *Floating*: `--shadow`, one soft, low shadow (`0 1px 2px` + `0 10px 24px -10px`, ink at 5–16%),
     only on things above the page: the assistant composer, menus, the mobile sheet and drawer,
     dialogs and toasts.
- **Radii 8 / 6 / 4** (`--radius`, `--radius-sm`, `--radius-xs`) by element size. Only buttons,
  badges and status pills are fully round (see deviations).
- **Hover and focus are tone, not glow.** Buttons darken (`--coral-2`) or gain a white surface (ghost);
  inputs get `--ring` (3 px deep-coral at 18%). The coral hover glow was removed. Transitions are
  `--dur` 180 ms with `--ease-out`; all of it stops under `prefers-reduced-motion`.
- **Gradients only inside shader zones** (see below and deviations). No glass, no glows, no blobs, no
  emoji, no sparkle for "AI".
- **No coloured side stripes** on alerts or list items (impeccable "side-stripe borders"); alerts use a
  quiet tint and a full hairline.

### Shader zones (v4)
- A slow Paper Shaders mesh gradient (`@paper-design/shaders`, Apache-2.0, vanilla build, 7.2 KB gzipped,
  `public/js/vendor/saral-shader.js`) in **three decorative art panels only**: the sign-in visual, the
  loan products hero art, and the approved result's scene. Never behind body text, the app shell or a form.
- Palette: cream `#F7F3EE`, peach `#FCE6DC` / `#F8D3C3`, a hint of sage on approved. Low contrast; only the
  illustration sits on it.
- Each zone first paints a **static CSS radial-gradient fallback**. `js/shader.js` loads the bundle with
  `import()` after `load` and idle, only when WebGL exists, Save-Data is off and reduced motion is not
  requested, then fades the canvas in (700 ms). Paper's `ShaderMount` pauses when the zone is off-screen
  or the tab is hidden. If reduced motion is switched on while the page is open, the shaders are disposed.

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
| Gradients in the three shader zones (and their static CSS fallback) | taste-skill `gradient` FAIL ("flat colour or a real image"); impeccable/unslop "no decorative gradients" | The user asked for a premium, shadcn-style shader look. It is limited to decorative art panels, never behind text, low contrast, lazy and still under reduced motion. The two fallback lines carry `taste-skill-ignore`. |
| One soft shadow on floating layers | taste-skill `shadow` WARN ("elements at rest carry none") | Only floating things carry it (composer, menus, sheet, drawer, dialogs, toasts), which is what the rule allows. The remaining `shadow` WARNs are those, focus rings, and `none` resets. |
| The assistant shown as the Saral mark in its illustrations | BRAND "don't use the mark next to an outcome" | Used only for the assistant itself (empty state, thinking), never beside a decision, so the assistant is never drawn as a person. |

## 3. Illustrations (v4 cast)

- **One cast, not 36 strangers.** v3 used a different Open Peeps figure in every slot; v4 uses two
  people built from **fixed Open Peeps parts** (via `react-peeps`, CC0 art) and one mark:
  - *The borrower*: hair `Long`, face `Smile` (`Serious` reading a not-approved letter, `Calm`
    listening), white top and dark trousers poses, or a plain bust on a chair behind a desk.
  - *The advisor / reviewer*: hair `Short`, face `Smile`, round glasses, white blazer. Only where a
    person reviews or the borrower talks to a person (with a reviewer, help, handoff, feedback).
  - *The assistant*: never a person; the Saral mark (coral square, ink path ending in a tick).
- **Every scene shows the screen's action** (documents → holding her documents; identity → phone and ID
  card; application → laptop; checks running → waiting with a cup, magnifier over the paper; approved →
  relaxed with a ticked letter; not approved → reading the letter thoughtfully; repayments → beside her
  calendar). Where a person adds nothing the scene is **objects only** (empty folder, empty page, map pin,
  shield, page and pen, envelope, unplugged cable, range bar). **Loading has no scene.**
- **One scale, one canvas.** 320×240 (4:3) for every slot, every figure at the same scale so heads,
  line weight and heights match; busts always sit behind a desk edge so nothing is cut off in mid-air.
  Black ink, white fills, coral only on props, soft coral-tint ground.
- **One scene per section**, and **one scene per screen on phones** (at 640 px and below the page-head
  and next-step scenes step aside when an empty state shows its own).
- **Decorative only:** every illustration has `alt=""`; the heading beside it says what it shows.
- No robots, brains, circuit lines or stock "AI" imagery. Sources, parts and the scene table are in
  `ASSETS.md`; the audit of the v3 scenes is `ILLUSTRATION_AUDIT.md`.

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
| v3 (7d1dd12) | 1 FAIL / 87 WARN | 0 findings, 0 advisories |
| v4 after illustration + depth, before the skill pass (4ee4eee) | 3 FAIL / 96 WARN | 0 findings |
| v4 after the skill pass (this pass) | 1 FAIL / 77 WARN | 0 findings |

v4 notes:
- The two new FAILs were the shader-zone fallback gradients (deliberate, now marked `taste-skill-ignore`).
  The one FAIL left is the reserved `example.com` test address.
- `shadow` WARNs fell 56 → 37 by deleting resting shadows at the source (the `--shadow-sm: none` token
  and its 17 uses, the coral hover glow, the assistant panel, identity card, plate and result card)
  instead of overriding them.
- Live impeccable scan, 8 pages (sign in, products, dashboard, eligibility, approved and not-approved
  results, documents, identity check): `cream-palette` on every page (accepted deviation),
  `first-viewport-column-overflow` on eligibility (the long form beside a short result column; the
  result column is sticky on desktop, accepted), and `wide-tracking` on the identity card (fixed: 0.14em
  → 0.04em). The application result no longer reports column overflow.
- unslop has no detector CLI; its `signs.md` checklist was applied by hand to full-page shots: removed
  numbered circles (identity check, documents), tiny uppercase tracked labels (demo flag, identity summary,
  repayment months), an em-dash in the feedback lead, and the coral hover glow. One bright element per
  screen is the scene (or its shader zone); the chrome stays quiet.

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
