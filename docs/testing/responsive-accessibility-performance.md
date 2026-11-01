# Phase E — responsive, accessibility and lazy-load measurements (2026-10-31)

Closes audit findings **F-A05** and **F-T07**: the portal is measured at every required width, with
automated axe scans plus recorded manual checks, and the assistant island's Shiki/language grammar
payload is measured rather than assumed. Every number below was produced by the run recorded in this
document; no historical result is reused.

## 1. Environment

| Piece | Value |
| --- | --- |
| Site | disposable `loanportal.local` in `loanrangers-backend-1` (never `p1loan.local`) |
| Front door | temporary `loanportal-e2e-proxy` nginx on `127.0.0.1:8081` (`tests/e2e/nginx.loanportal.conf`) |
| Frappe dev server | `bench --site loanportal.local serve --port 8001` inside the backend container |
| CopilotKit runtime | `apps/runtime`, `127.0.0.1:4200` (island renders its real shell) |
| Agent | not started for this run; no assistant turn was sent, so these are layout/accessibility measurements of the island shell, not a chat test |
| Data | `e2e_seed.seed` tag `phaseE` (two synthetic borrowers, one application with evidence) |
| Browser | Chromium via Python Playwright |
| axe | axe-core 4.10.2, injected from a temporary copy outside the repository (not committed) |
| Runner | `python tests/e2e/phase_e_measure.py --seed <seed.json> --axe <axe.min.js>` |
| Output | `tests/e2e/out/phase-e/measurements.json`, 65 screenshots |

Screens measured: `/borrower`, `/borrower/apply`, `/borrower/application?name=<owned>`,
`/borrower/profile`, `/borrower/feedback`, `/borrower/assistant?application=<owned>`,
`/borrower/help`, `/borrower/products`, `/borrower/terms`, `/borrower/privacy`.
Widths: 390×844, 768×1024, 1024×768, 1360×900, 1920×1080, plus 320×640 as the WCAG 1.4.10 reflow
width.

## 2. Reflow (current run)

Horizontal document overflow was **0 px on every screen at every width**, including 320 px.

| Width | Home | Apply | Application | Profile | Feedback | Assistant | Help | Products | Terms | Privacy |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 390×844 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 768×1024 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1024×768 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1360×900 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1920×1080 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 320×640 (reflow) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

## 3. Automated accessibility (axe-core, current run)

Ten screens × two widths (390×844 and 1360×900) = **20 scans, 0 violations**. Each scan ran the
`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and `wcag22aa` rule tags (20–26 passing rules per page).

| Screen | Passes (mobile / laptop) | Violations |
| --- | ---: | ---: |
| Home | 22 / 21 | 0 |
| Apply | 24 / 24 | 0 |
| Application | 25 / 24 | 0 |
| Profile | 23 / 23 | 0 |
| Feedback | 25 / 25 | 0 |
| Assistant | 26 / 26 | 0 |
| Help | 23 / 23 | 0 |
| Products | 20 / 20 | 0 |
| Terms | 20 / 20 | 0 |
| Privacy | 20 / 20 | 0 |

One check per page is reported **incomplete**, not failed: `color-contrast` on `.brand__mark`, the
“LA” monogram in the header. It sits on a gradient background, so axe cannot compute the ratio. The
mark is `aria-hidden="true"` and carries no information (the brand name is adjacent text), so 1.4.3
does not apply to it. Every other text node was evaluated and passed.

### Defects found and fixed by this phase

| Where | Defect | Fix |
| --- | --- | --- |
| Assistant chat log (`.log`) | Scrollable region was not keyboard-reachable → axe `scrollable-region-focusable` (serious) | `tabIndex={0}` on the log in `chat-panel.tsx`; refreshed build committed |
| Page shell (`templates/portal/base.html`) | Skip link moved the URL to `#main` but did not move focus | `<main id="main" tabindex="-1">`; after Enter the active element is now `main` |
| Footer links | 19.3 px hit height | `.site-footer__links a` — inline-block, 4 px block padding |
| “Update your profile” card-head link | 20.8 px hit height | `.card__head a.small` — inline-block, 3 px block padding |

## 4. Manual checks (current run)

- **Keyboard entry.** First `Tab` reaches “Skip to content”, which becomes visible with a solid 3 px
  focus outline. `Enter` sets `#main` and moves focus to `main`. The first twelve tab stops (header
  brand, four nav links, Sign out, two home actions, profile link, application row) all render a
  visible `solid 3px` outline.
- **Text resize.** At 1360×900 with `html { font-size: 200% }`, no horizontal overflow on home,
  application, profile, feedback or help.
- **Tap targets.** Footer and card-head links are now ≥24 px tall. The elements still under 24 px are
  checkbox/radio inputs (13–17 px squares inside their labels: two consent checkboxes on profile, the
  five rating radios on feedback, the voice toggle in the assistant) and application-name links
  inside table cells (20 px tall). axe's WCAG 2.2 `target-size` rule passes all of them through the
  spacing exception; the labels around the inputs are larger than the controls. Recorded rather than
  hidden.
- **Not covered by this phase:** a screen-reader (NVDA/VoiceOver/TalkBack) session and real-device
  testing. axe-plus-manual review is not a substitute; Phase H keeps the browser regression, and AT
  testing remains an open verification item.

## 5. Lazy-load measurement (current run)

The assistant island is served from the committed build. The run counted every script response on a
fresh context:

| Measure | Value |
| --- | ---: |
| Initial island JS requests | 8 files |
| Initial island JS, uncompressed | 3,157,229 bytes |
| Initial island JS, gzip (measured locally) | 778,908 bytes |
| Further chunks on disk, not requested | 400 files |
| Further chunks, uncompressed / gzip | 16,346,165 / 3,288,638 bytes |
| Navigation timing (localhost) | DOMContentLoaded 309 ms, load 309 ms |
| Transfer with the test front door | 3,167,026 bytes (front door sends assets uncompressed) |

Requested at load: `assistant.js` (1,189,253) and seven chunks — rolldown runtime, content schema,
random-id, v4, Streamdown-related `chunk-JAPRZBRM` (700,269), `directive` (778,585 — TanStack Pacer),
`katex` (360,758).

Not requested at load: the Shiki grammar set (`cpp` 668,641, `emacs-lisp` 782,326, `wolfram`
266,940, …), `code-block` 252,564, `mermaid`/`cytoscape` 565,721, `wasm` 622,415, the 1,266,768-byte
`dist` chunk and **`livekit-client` 658,233**. The voice SDK is therefore proven lazy: it is absent
from a page load that never starts a call.

Reading:

- Shiki **grammars** are lazy; the **markdown renderer that pulls in Shiki** (`chunk-JAPRZBRM`,
  containing streamdown/hast/micromark/shiki references) is eager, as is `katex`. That is why the
  initial island payload is 3.16 MB uncompressed even though no message is rendered.
- The test front door does not compress assets. Production must gzip/brotli at the proxy; the build's
  own gzip estimate for this set is ~779 KB. Compression is part of **Phase F** (production-like
  proxy), not a code change made here.
- Follow-up candidate, not done in E: code-split Streamdown so the markdown renderer is only loaded
  when an answer is rendered. It changes island startup behavior, so it belongs with a release
  decision rather than this measurement phase.

## 6. Verification commands run

| Suite | Command | Result |
| --- | --- | --- |
| Frappe L1 | `bench --site loanportal.local run-tests --app loan_advisory_portal` | `Ran 162 tests in 44.794s` — **OK** |
| Island | `npm test` in `apps/web/assistant` | **33 passed** (6 files) |
| Island typecheck | `npm run typecheck` | clean |
| Island build | `npm run build` | built, output committed under `public/js/assistant/` |
| Lint | `ruff check apps/loan_advisory_portal tests/e2e/phase_e_measure.py` | **All checks passed!** |

The host (`pytest`) suite was not touched by E; its last run is Addendum C in the test plan. The
browser journeys and security regression remain scheduled for **Phase H**.
