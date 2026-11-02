# Saral design principles

How the borrower portal and the assistant island are designed, what rules they follow, where they
deliberately break them, and how we check. Brand basics (logo, colour tokens, type, voice) are in
[`BRAND.md`](BRAND.md); illustration sources and licences are in [`ASSETS.md`](ASSETS.md).

Scope: `apps/loan_advisory_portal/loan_advisory_portal/{www,templates,public/css,public/js}` and
`apps/web/assistant/src`. Underwriting, the decision engine and policy content are out of scope.

## 1. Rules applied

This is the **final** Saral system. Three public design skills were used as checklists during the
redesign (v2 and v3 passes):
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
     dialogs, toasts and the loading status card.
- **Key cards** (`.key-card`): the sign-in form, the dashboard next step, the application decision and
  the eligibility estimate are white with a 1 px `--line` hairline and a 12 px radius. No glow, no ring,
  no shadow: they sit on the page, they do not float.
  On the application result and the eligibility result the key card sits inside the raised work area:
  the one deliberate card-in-a-surface, kept so the decision or estimate reads first.
- **Radii 8 / 6 / 4** (`--radius`, `--radius-sm`, `--radius-xs`) by element size. Only buttons,
  badges and status pills are fully round (see deviations).
- **Hover and focus are tone, not glow.** Buttons darken (`--coral-2`) or gain a white surface (ghost);
  inputs get `--ring` (3 px deep-coral at 18%). The coral hover glow was removed. Transitions are
  `--dur` 180 ms with `--ease-out`; all of it stops under `prefers-reduced-motion`.
- **No decorative gradients, no animated art.** Flat cream, white and hairlines. No glass cards, no
  glows, no blobs, no emoji, no sparkle for "AI".
- **No coloured side stripes** on alerts or list items (impeccable "side-stripe borders"); alerts use a
  quiet tint and a full hairline.

### Calm states (final)
Work in progress and the assistant's states are shown with plain CSS, never with animated art. Each
treatment is decorative (`aria-hidden`); a sentence or label next to it always says what is happening.

| State | Treatment |
| --- | --- |
| Application checks running (submitted / checks running / with a reviewer) | `.status-bar` inside the decision key card: a 4 px `--paper-2` track with a short `--coral-3` segment sliding across (1.8 s); a still, 45%-tint full bar under reduced motion |
| Page loading (slow first reads) | the floating status card: the same status bar + "Getting your latest details…", with skeletons in the content underneath (§4) |
| Assistant empty state | the Saral mark scene on a plain, soft coral-tinted circle (`#FDEBE4`), no halo or glow |
| Assistant thinking | the thinking scene on a small soft circle with a gentle opacity + hairline-ring pulse, the three typing dots and the live activity trail; still under reduced motion |
| Assistant streaming | a 3 px CSS progress bar under the answer that is still arriving; still under reduced motion |
| Composer | the plain floating surface (the one soft shadow); keyboard focus shows the standard `--ring` |
| Voice drawer | a clean CSS circle that scales gently (up to 8%) with LiveKit's audio level, a solid coral core whose tone follows the state, and a static state label under it (Ready when you are, Connecting, Listening, Thinking, Speaking, Microphone off); no scaling under reduced motion |

The voice state machine (`apps/web/assistant/src/voice-orb.ts`) is kept: it turns the call status, mute
and LiveKit's own speaker detection (ActiveSpeakersChanged + participant audioLevel) into the state and
its label. There is no second microphone tap and the page records nothing.

**Iteration note.** Animated WebGL shaders (Paper Shaders: mesh-gradient washes and bands, glow rings
on key cards, a grain band for processing, an assistant orb, a smoke-ring voice orb) were tried in v4–v6.
They were **dropped at the user's request** on 2026-11-03 in favour of this calm, non-animated system;
the vendored bundles, the loader, their licence copies and the build scripts were removed with them.

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
- Skeletons breathe by opacity only. The only sliding motion is the thin indeterminate status bar
  (checks running, page loading) and the assistant's streaming bar. Everything stops under
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
| One soft shadow on floating layers | taste-skill `shadow` WARN ("elements at rest carry none") | Only floating things carry it (composer, menus, sheet, drawer, dialogs, toasts, the loading status card), which is what the rule allows. The remaining `shadow` WARNs are those, focus rings, and `none` resets. |
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
- **Loading status card.** When a page's first reads take longer than 300 ms, a small fixed card
  floats above the page with the thin CSS status bar and one sentence ("Getting your latest
  details…"). It overlays rather than pushes, so nothing shifts when the data lands; on phones it sits
  above the tab bar and never covers the page title. Skeletons stay in the content areas underneath.
  Still bar under reduced motion.

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

### Final results (2026-11-03, after the shaders were removed and origin/main merged)

- **axe-core, WCAG 2.2 AA:** all 29 pages at 1280 and at 390, run in small slices with every page
  covered once per width: **0 violations, 0 serious/critical**.
- **Rendered text contrast** (worst-case background pixel under each text box): 182 items over sign-in,
  dashboard, approved, checks running, not approved, products, help and documents at 1280 and 390;
  all AA, lowest **5.05:1**.
- **Scans:** taste-skill lint `--app` (73 files): **2 FAIL / 85 WARN**; impeccable detect (static, 42
  files): **0 findings**. No `taste-skill-ignore` lines remain in the app.
  - The two FAILs are deliberate or pre-existing: the reserved `example.com` test address (deviation
    above) and the `★` rating glyph in `feedback.js`.
  - WARNs: 45 `shadow` (floating layers, focus rings and `none` resets), 30 `mono` (the Sora-backed
    token name), 7 `glass` (the sticky top and tab bars, the dialog backdrop, resets), 1 `eyebrow` (a
    legacy selector no template uses), 1 `numbering` (`padStart` for a time in a test), 1 `em-dash`.

### Scan history

| Pass | taste-skill lint (`--app`) | impeccable detect (static) |
| --- | --- | --- |
| Before (origin/main) | 19 FAIL / 109 WARN | 0 findings, 1 advisory (`bounce-easing`) |
| v2 | 1 FAIL / 85 WARN | 0 findings |
| v3 | 1 FAIL / 87 WARN | 0 findings, 0 advisories |
| v4 (after the skill pass) | 1 FAIL / 77 WARN | 0 findings |
| v5 (shaders) | 2 FAIL / 77 WARN | 0 findings |
| v6 (shader placement, voice orb) | 2 FAIL / 85 WARN | 0 findings |
| **Final (no shaders)** | **2 FAIL / 85 WARN** | **0 findings** |

The live impeccable scan of the fixture render (v3/v4) reported `cream-palette` on every page (accepted
deviation) and `first-viewport-column-overflow` on the eligibility form, where the long form sits beside a
short, sticky result column (accepted). unslop has no detector CLI; its checklist was applied by hand to
the full-page shots (numbered circles, tiny uppercase labels, the coral hover glow and an em-dash were
removed in v4).
