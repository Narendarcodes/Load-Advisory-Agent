# KYC identity card — contrast made measurable

Task: make the 12 indeterminate colour-contrast nodes on the identity (KYC) workspace measurable,
without faking a pass. Branch `feat/frappe-borrower-platform`, captured 2026-11-01.

## 1. What the previous report refused to claim

The 2026-11-01 accessibility run measured 96 text nodes at 1440 and 77 at 390 on
`/borrower/kyc` and reported **6 indeterminate nodes per width — 12 in total**
([manual-contrast.json](../2026-11-01/accessibility/manual-contrast.json)), every one of them inside
the identity card, every one for the same recorded reason: `background-image in the ancestor chain`.

| Node | Text |
| --- | --- |
| `span` | Identity summary |
| `div.identity-card__name` | Review Demo Borrower |
| `p#card-pan.identity-card__masked` | PAN •••••••••• |
| `p#card-aadhaar.identity-card__masked` | Aadhaar •••• •••• •••• |
| `span` | Not verified |
| `span` | Preview only |

The correct reading of that result is *unknown*, not *passed*, and the earlier report treated it that
way. Nothing in this document rounds those nodes upward.

## 2. Cause

`.identity-card` painted its text on a gradient:

```css
background: linear-gradient(150deg, #2c2321, #4a3a35 82%);
```

A gradient is a `background-image` in computed style. Neither axe-core nor an algorithm can reduce
text on it to a single ratio: the backdrop luminance varies across the glyph, from `#2c2321` at one
corner to `#4a3a35` at the other. axe lists the nodes as *incomplete*; a checker that guessed the
worst or the average case would be inventing a number.

## 3. Change

One declaration, one selector, in [public/css/portal.css:3371-3382](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/css/portal.css#L3371-L3382):

```diff
 .identity-card {
 	position: relative;
 	display: grid;
 	gap: var(--s3);
 	padding: 22px;
 	border-radius: 18px;
-	background: linear-gradient(150deg, #2c2321, #4a3a35 82%);
+	/* Solid ink, not a gradient: a background-image behind text makes its contrast unmeasurable,
+	   and axe and every colour checker report those nodes as indeterminate rather than as a pass. */
+	background: var(--ink);
 	color: #f7f3ee;
 	box-shadow: var(--shadow);
 }
```

`--ink` is `#241c1b`, the existing design-token already used for body text and the page header
([public/css/portal.css:86](../../../../apps/loan_advisory_portal/loan_advisory_portal/public/css/portal.css#L86)). It is **darker** than either stop of the gradient it replaces, so every ratio on the card improved rather than being traded away.

What was deliberately not done: no `text-shadow`, no new colour, no `!important`, no global selector,
no DOM or template edit, no change to the card's text colours, padding, radius or shadow. The only
responsive rule for the card (portal.css:4121) sets `padding: 18px` and is untouched.

## 4. Structure and dimensions preserved

A live computed-style probe of `/borrower/kyc` after the change:

| Property | Value |
| --- | --- |
| `background-color` | `rgb(36, 28, 27)` — `--ink`, resolved |
| `background-image` | `none` |
| `color` | `rgb(247, 243, 238)` (unchanged) |
| `border-radius` | `18px` (unchanged) |
| `padding` | `22px` (unchanged) |
| `box-shadow` | `rgba(60, 40, 32, 0.09) 0px 18px 44px 0px` (unchanged) |
| card box | 320 × 202 px |
| page scroll height | **1621 px — identical before and after** |

Full-page screenshots of every view at every width were captured before and after the change — 85 in
each matrix, 0 console errors in each, 0 horizontal-overflow offenders in each —
[kyc-contrast/view-matrix-before/](kyc-contrast/view-matrix-before/) and
[kyc-contrast/view-matrix-after/](kyc-contrast/view-matrix-after/). The KYC workspace's `scrollWidth` is
unchanged at every width (390/768/1024/1280/1440 before and after). A side-by-side crop of the card at
1440 is [card-before-after-1440.png](kyc-contrast/card-before-after-1440.png): the illustration, the
masked PAN and Aadhaar rows, the badge positions and the card's proportions are the same; the surface
is flat instead of angled.

## 5. Measurements — five widths, node by node

[tests/e2e/manual_contrast.cjs](../../../../tests/e2e/manual_contrast.cjs) now reports every text node
inside `.identity-card` individually, with the computed foreground and background it used, instead of
only listing failures. Data: [kyc-contrast/manual-contrast.json](kyc-contrast/manual-contrast.json);
console: [contrast-console.txt](kyc-contrast/contrast-console.txt).

| Node | Text | Foreground | Background | Ratio | Required | Size | Pass |
| --- | --- | --- | --- | ---: | ---: | ---: | --- |
| `div.identity-card__name` | Review Demo Borrower | `rgb(247, 243, 238)` | `rgb(36, 28, 27)` | **15.12:1** | 4.5 | 16.8px | yes |
| `p#card-pan.identity-card__masked` | PAN •••••••••• | `rgb(255, 217, 207)` | `rgb(36, 28, 27)` | **12.79:1** | 4.5 | 16.0px | yes |
| `p#card-aadhaar.identity-card__masked` | Aadhaar •••• •••• •••• | `rgb(255, 217, 207)` | `rgb(36, 28, 27)` | **12.79:1** | 4.5 | 16.0px | yes |
| `span` (card head) | Identity summary | `rgb(232, 217, 205)` | `rgb(36, 28, 27)` | **12.12:1** | 4.5 | 10.56px | yes |
| `span` (footnotes) | Not verified | `rgb(217, 201, 189)` | `rgb(36, 28, 27)` | **10.37:1** | 4.5 | 11.84px | yes |
| `span` (footnotes) | Preview only | `rgb(217, 201, 189)` | `rgb(36, 28, 27)` | **10.37:1** | 4.5 | 11.84px | yes |
| `span.demo-flag` | Demo | `rgb(138, 90, 18)` | `rgb(247, 236, 216)` | **5.05:1** | 4.5 | 10.88px, bold | yes |

The last row is the badge, which sits on its own opaque light surface, not on the ink; it is included
because it is a card text node and it passes on its own numbers — the tightest of the seven, at 5.05:1,
with 0.55 of margin over the 4.5:1 AA threshold for normal text. It is not borderline by the harness's
own definition, and it was not rounded.

Totals across the run:

```
widths:                     1440, 1280, 1024, 768, 390
card text nodes measured:   7 at every width (35 in total)
card nodes indeterminate:   0 at every width
text nodes below AA (page): 0
indeterminate (page):       0
```

Previously 12 indeterminate; now 0. No node is counted as a pass without a computed background.

## 6. axe-core

Full audit after the change, five widths, [kyc-contrast/accessibility/accessibility-report.md](kyc-contrast/accessibility/accessibility-report.md)
and [accessibility-results.json](kyc-contrast/accessibility/accessibility-results.json):

| | before | after |
| --- | ---: | ---: |
| runs | 103 | 103 |
| runs with violations | 0 | 0 |
| distinct rules violated | 0 | 0 |
| states not reached | 0 | 0 |
| console errors | 0 | 0 |
| `.identity-card` nodes left in axe's incomplete list on `/borrower/kyc` | 6 | **0** |

axe still records 42 runs with colour-contrast nodes it cannot decide page-wide — selects, `<img>`-adjacent
text and layered backgrounds elsewhere in the portal, e.g. `.topbar__brand` and the `.tabbar` links at
390. Those are outside this finding, are listed for manual review rather than counted as passes, and
are covered by the harness above, which measured them to 0 failures and 0 indeterminate.

## 7. Focus indicators

The requirement was that the change must not make focus rings harder to see. Measured, not assumed:

- The card contains **0 focusable elements** (`a[href]`, `button`, `input`, `select`, `textarea`,
  `summary`, `[tabindex]`, `[role=button]`, `[role=link]`) — probed live in the browser. No focus ring
  is painted on the new surface, so nothing about focus visibility changed.
- The full keyboard walk after the change: 30 page/width walks, **605 tab stops, 605/605 with a visible
  focus indicator** (outline or box-shadow differs between focused and unfocused), 0 off-screen focus,
  0 unnamed controls, 0 dangling ARIA references, 0 heading-level jumps, no keyboard trap.
  Evidence: [kyc-contrast/keyboard/keyboard-and-ax-tree.json](kyc-contrast/keyboard/keyboard-and-ax-tree.json),
  console [keyboard-console.txt](kyc-contrast/keyboard-console.txt).

## 8. Status

| Claim | Status |
| --- | --- |
| The 12 indeterminate nodes are now measurable | **VERIFIED** — 0 indeterminate at all five widths |
| Each one passes AA on its own computed numbers | **VERIFIED** — 10.37:1 to 15.12:1 against ink, badge 5.05:1 on its own surface |
| No new colour, no text-shadow, no global CSS change | **VERIFIED** — one declaration, existing `--ink` token |
| Layout, illustration, dimensions and responsive behaviour preserved | **VERIFIED** — page height 1621 px identical; before/after matrices captured; only the card's paint changed |
| Focus indicators still distinguishable | **VERIFIED** — 605/605 stops, and no focusable inside the card |
| Screen-reader output of the card | **NOT VERIFIED** — see [screen-reader-blocker.md](screen-reader-blocker.md) |
