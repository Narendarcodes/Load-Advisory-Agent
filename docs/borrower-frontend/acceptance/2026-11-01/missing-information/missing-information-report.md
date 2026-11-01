# Part A — Missing Information GenUI card reproduced in a real browser

- Captured: 2026-11-01T14:11:08.525Z (final canonical run)
- Harness: [missing_information_e2e.cjs](../../../../../tests/e2e/missing_information_e2e.cjs) — `npm --prefix tests/e2e run missing-info`
- Browser: Playwright 1.63.0, Chromium headless, `reducedMotion: reduce`
- Page under test: `/borrower/assistant?application=ACC-LOAP-2026-00018` on the disposable site
  `loanportal.local`, served through the acceptance front door `http://127.0.0.1:8081`

## What was reused, not rebuilt

The card is the existing implementation. Nothing parallel was created:

| Stage | File | Function |
| --- | --- | --- |
| state parsing | [blocks.tsx](../../../../../apps/web/assistant/src/genui/blocks.tsx) | `parsePublicState` |
| block building | `apps/web/assistant/src/genui/blocks.tsx` | `buildBlocks` |
| rendering | `apps/web/assistant/src/genui/blocks.tsx` | `MissingInformationBlock` (heading `Information still needed`, `id="missing-heading"`, `aria-labelledby`) |
| registry dispatch | `apps/web/assistant/src/genui/` | `renderBlock` |

The browser walked the production render path end to end: Frappe page → built island bundle
(`public/js/assistant/assistant.js`) → CopilotKit runtime on `127.0.0.1:4200` → `mint_assertion`
bridge → AG-UI upstream. A component unit test was not treated as sufficient evidence; the
verification is DOM geometry, rendered text, computed focus and screenshots in a real browser.

## Fixture

[agui_stub.cjs](../../../../../tests/e2e/agui_stub.cjs) is a test-only deterministic AG-UI upstream bound to
`127.0.0.1:8096`. It replays the real event sequence
(`RUN_STARTED → TEXT_MESSAGE_START → STATE_SNAPSHOT(progress) → TEXT_MESSAGE_CONTENT* →
STATE_SNAPSHOT → TEXT_MESSAGE_END → RUN_FINISHED`, or `RUN_ERROR`) with fixed payloads, so no model
inference and no GPU is involved. It replaces only the agent upstream: authentication, the runtime
and the island bundle stay real. Every fixture answer is prefixed
`Acceptance fixture response: ` so a fixture string cannot be mistaken for product copy.

The missing-information payload is the shape the product already sends (three items: monthly income,
monthly obligations, credit score), each with the explanation sentence and the link
`/borrower/application?name=ACC-LOAP-2026-00018#info-request`. No fallback information was
synthesised for the card: when the state carries nothing missing, the harness requires that no card
renders (see `no_missing` below).

## Positive verification — five widths, 17 checks each

Every check is a real assertion against the rendered DOM; all 5 widths pass 17/17.

| Check | What it proves |
| --- | --- |
| `cardVisible` | `.missing` exists in the live DOM after the streamed state snapshot |
| `headingCopy` | heading text is exactly `Information still needed` |
| `headingLabelResolves` | the region's `aria-labelledby` resolves to that heading node |
| `itemCount` | the three fixture items render, none dropped |
| `labels` | each item label matches the fixture |
| `everyItemExplained` | each item carries its explanation sentence (no label-only rows) |
| `linksNamed` | each link has visible text (`Correct this in your application`) |
| `linkTargets` | each `href` is the application anchor the fixture sent |
| `noOverflow` | `document.documentElement.scrollWidth === viewport` (no horizontal page scroll) |
| `noClipping` | no ancestor clips the card: `clipped === null` |
| `noInnerOverflow` | no scrollable box inside the card |
| `cardInsideViewport` | card rect fully inside the viewport box |
| `visibleAfterScroll` | after `scrollIntoView`, the card is actually on screen |
| `noLeakage` | the 7 internal/attack needles (`missing_information`, `record_json`, `authorization`, `Bearer `, `assertion`, `window.__fixtureXss`, `<script`) are absent from `body.innerText`; 0 injected `img[src="x"]`; `window.__fixtureXss` never defined |
| `noConsoleErrors` | zero console errors and zero page errors during the run |
| `keyboardReachesCard` | a pure Tab walk reaches the card link (5 stops before it on the 1440 layout) |
| `focusVisible` | the focused link paints a `2px solid` outline |

Rendered geometry (card bounding rect, left → right, width):

| Width | Card rect | Page overflow | Clipping | Console errors |
| --- | --- | --- | --- | --- |
| 1440 | 595 → 1093, w=498 | 0 px | none | 0 |
| 1280 | in flow, chat column | 0 px | none | 0 |
| 1024 | stacked layout | 0 px | none | 0 |
| 768 | stacked layout | 0 px | none | 0 |
| 390 | 39 → 351, w=312 | 0 px | none | 0 |

## Defect found in the browser and fixed

At 390 px the card was **clipped**: the island's `1fr` grid track was sized by the decision table's
min-content width, because the design system sets `white-space: nowrap` on `thead th`
([portal.css:1773-1780](../../../../../apps/loan_advisory_portal/loan_advisory_portal/public/css/portal.css)).
The oversized track pushed the card past the panel and its `overflow: hidden` ancestor severed it.

Fix, both declarations scoped to the island and only below the existing `1300px` breakpoint
([assistant.css:630-641](../../../../../apps/web/assistant/src/assistant.css)):

```css
.assistant__grid { grid-template-columns: minmax(0, 1fr); }   /* 1fr = minmax(auto,1fr) by default */
.assistant thead th { white-space: normal; }                   /* stop nowrap inflating min-content */
```

Geometry at 768/1024/1280/1440 is byte-identical before and after, so no wider layout moved. The
island was rebuilt (`npm --prefix apps/web/assistant run build`) and the served file verified by md5
on host and inside the container: `assistant.css` `c704f8d31ef41ae75f6d7d3253cbf394`,
`assistant.js` unchanged at `d341d9f87bc43b593c5d99080c04562e`.

## Negative cases (6, all pass)

Driven through the same browser path by asking the stub to send a broken state.

| Scenario | Fixture sends | Required behaviour | Result |
| --- | --- | --- | --- |
| `malformed` | state with a non-array/invalid missing-information record | no card renders | PASS (`missingCards: 0`) |
| `unknown` | an unsupported component type next to a known card | unknown channel ignored, known card still renders | PASS (`missingCards: 1`) |
| `absent_fields` | items with no explanation and no link | no card rendered from partial/invalid items | PASS (`missingCards: 0`) |
| `no_missing` | a valid state that reports nothing missing | no card (nothing fabricated) | PASS (`missingCards: 0`) |
| `no_key` | a state snapshot with no missing-information key at all | no card | PASS (`missingCards: 0`) |
| `error` | `RUN_ERROR` mid-stream | friendly alert, no card, no stack leak | PASS (`errorAlerts: 1`) |

Each negative also asserts the earlier valid answer stays on screen and that no console error is
produced by the malformed payload.

## Evidence

21 PNGs in this directory: full page, viewport and card-only crops at each of the five widths
(`missing-information-*.png`), plus one screenshot per negative scenario
(`negative-<scenario>-1440.png`), and the machine-readable
[missing-information-results.json](missing-information-results.json) with every check value, the
rendered card content, the layout measurements and the keyboard walk.

## Status

**VERIFIED.** The existing card renders in a real browser through the production render path at all
five widths with zero console errors, is reachable and visibly focused by keyboard alone, survives
all six negative payloads, and the one layout defect found at 390 px is fixed and re-verified.
