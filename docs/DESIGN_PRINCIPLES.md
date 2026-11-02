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
- **Gradients only inside shader zones** (see below and deviations). No glass cards, no glows, no blobs,
  no emoji, no sparkle for "AI". The one frosted surface is the text plate on a shader zone.
- **No coloured side stripes** on alerts or list items (impeccable "side-stripe borders"); alerts use a
  quiet tint and a full hairline.

### Shader zones (v5): shaders are part of the brand
v4 put a pale mesh gradient behind three illustrations; it read as flat colour. In v5 the shaders are a
visible, intentional part of Saral, in the style of the shadcn shader blocks (Paper Shaders), and still
kept out of the work itself.

| Where | Shader (Paper Shaders) | Palette / motion |
| --- | --- | --- |
| Sign in: the whole right half, one tall panel | MeshGradient `brand` | cream `#FFF1E6` → peach `#FF8F68` → coral `#E25F4B` → deep plum `#4E2440`; speed 0.38, light grain |
| Dashboard: hero band with the greeting and the next step | MeshGradient `brand` | as above |
| Loan products hero | MeshGradient `brand` | as above |
| Eligibility estimate result head | MeshGradient `brand` (an estimate) / `muted` (none) | as above / muted |
| Application result banner, approved | MeshGradient `approved` | cream, apricot `#FFC98C`, peach, plum `#7E3550`; warm and a little brighter, not flashy |
| Application result banner, submitted / checks running / with a reviewer / information needed / draft | GrainGradient `calm` (wave) | neutral-warm cream, blush and lilac; slow drift that doubles as the "checks running" cue |
| Application result banner, not approved / withdrawn | MeshGradient `muted` | soft greige and rose, almost still (speed 0.12) |
| Assistant empty state | MeshGradient `orb`, blurred into a soft glow behind the Saral mark | peach, coral, plum |
| Assistant thinking | PulsingBorder `pulse`, a soft ring around the thinking scene | coral, peach, plum |

Rules:
- **Never behind work.** No shader behind form fields, tables, body text, the sidebar or the tab bar.
- **Text on a shader sits on a plate** (`.shader-plate`: cream at 94% with a light frost), so contrast is
  measured against the plate. Illustrations on a shader sit on a frosted tile so the ink line stays clear.
  Spot check of the rendered pixels (55 text items, 6 pages, 1280 and 390): lowest 4.99:1, all AA.
- **One loader** (`public/js/shader.js`, linked once from `base.html`). It imports Paper Shaders with
  `import()` only after `load` + idle (first paint is the static gradient), mounts at most **2 live
  shaders per page** (first in document order; the rest keep their static look), caps rendering at
  **1.5× device pixels** (`maxPixelCount` follows each zone's size), and relies on Paper's `ShaderMount`
  to pause off-screen and in hidden tabs. It watches the DOM, so zones that React or page scripts add
  later are mounted and zones that leave are disposed (the orb and the thinking ring never pile up).
- **Static fallback.** Every palette has a CSS radial-gradient look (`[data-shader="…"]` in portal.css)
  that is also what shows with reduced motion, Save-Data or no WebGL. Switching reduced motion on while
  a page is open disposes every shader.
- **Weight.** Bundled from `@paper-design/shaders@0.0.82` (Apache-2.0, the latest release; licence and
  notice in `public/js/vendor/`) by `scripts/brand/build_shader.sh`: the mesh core (`saral-shader.js` +
  shared chunk) is 8.4 KB gzipped; the extra chunk with GrainGradient, PulsingBorder and Paper's noise
  texture is 22.7 KB gzipped and loads only on pages that show `calm` or `pulse`. Loader 2.3 KB.
  All added JS: ~33 KB gzipped, under the 40 KB budget.
- Chromium under Xvfb (software GL, SwiftShader via ANGLE) renders the shaders without extra flags; the
  captures and `SHADERS.mp4` show the live canvases, not the fallback.

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
| v5 shaders as a brand surface: animated gradients in hero bands, result banners, the sign-in panel and the assistant mark (and their static CSS fallbacks) | taste-skill `gradient` FAIL ("flat colour or a real image"); impeccable/unslop "no decorative gradients" | The user asked for a visibly premium, shader-rich look (shadcn shader blocks / Paper Shaders) after v4's low-contrast version read as flat. Kept out of forms, tables, body text and the sidebar; text sits on a solid plate; lazy, capped at 2 live per page, still under reduced motion. Every fallback gradient line carries `taste-skill-ignore`. |
| Frosted text plate on shader zones (`backdrop-filter` on `.shader-plate`) | taste-skill `glass` WARN ("glass cards are a tell") | It is 94% opaque cream, used only where text must sit on a moving shader, so AA holds over any colour. Both lines carry `taste-skill-ignore`. |
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

v5 notes (shaders):
- taste-skill lint `--app` over www, templates, portal.css, page scripts, `shader.js` and the island
  source (72 files): 2 FAIL / 77 WARN. The FAILs are the reserved `example.com` test address and the
  `★` rating glyph in `feedback.js` (pre-existing, first included now that page scripts are linted). No
  `gradient` FAIL: every v5 fallback gradient line is marked `taste-skill-ignore`.
- axe WCAG 2.2 AA: 0 violations (0 serious/critical) on all 29 pages at 1280 and at 390.
