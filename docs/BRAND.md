# Saral — brand sheet

**Saral** (Hindi/Telugu: *simple, easy*) is the borrower-facing name of the loan advisory portal.
Promise: **Understand your loan decision. A person decides.**

## Logo

| Asset | File (under `apps/loan_advisory_portal/loan_advisory_portal/public/brand/`) | Use |
| --- | --- | --- |
| Mark | `saral-mark.svg` | App rail, avatars, small spaces |
| Mark, mono | `saral-mark-mono.svg` | One-colour print, stamps, dark-on-light only contexts |
| Logo lockup | `saral-logo.svg` | Headers, documents, slides |
| Logo, mono | `saral-logo-mono.svg` | One-colour reproduction |
| Logo, reverse | `saral-logo-reverse.svg` | Wordmark in paper colour, for ink backgrounds |
| Wordmark | `saral-wordmark.svg` | Where the mark already appears nearby |
| Favicon | `favicon.svg`, `favicon-32.png` | Browser tab |
| App icons | `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Home screen, `site.webmanifest` |
| Social card | `og-image.png` (1200×630), source `og-image.svg` | Link previews |

**The mark** is a coral rounded square with a single ink stroke: a path that rises from the lower left
and finishes as a tick. It says "your way forward, confirmed" without showing money, arrows or charts.
It is original artwork drawn for this project (`scripts/brand/generate.py`).

**The wordmark** is "Saral" set in Sora SemiBold (600), converted to outlines. Sentence case, never all caps.

### Clear space and size
- Keep clear space around the mark equal to **¼ of the mark's width** (16 px at 64 px) on every side.
- In the lockup the gap between mark and wordmark is ¼ of the mark's height; do not tighten it.
- Minimum sizes: mark **20 px** on screen; lockup **96 px** wide. Below 20 px use `favicon-32.png`.

### Do
- Use the coral mark on paper (`#F7F3EE`) or white.
- Use the mono mark when only one colour is available.
- Scale proportionally.

### Don't
- Don't recolour the stroke white on coral (2.5:1 contrast — too weak).
- Don't rotate, outline, add shadows or gradients, or put the mark on a busy photo.
- Don't change the wordmark's font or set it in capitals.
- Don't use the mark as a decision badge or next to an outcome as if it approved something.

## Colour tokens (`public/css/portal.css`)

| Token | Hex | Role | Contrast notes |
| --- | --- | --- | --- |
| `--coral` | `#FE7D6B` | Primary accent: primary buttons (ink text), focus, highlights | Ink on coral 6.65:1. **White on coral 2.5:1 — never.** Coral **text** on white fails for small text — don't. |
| `--peach` | `#FF8F68` | Secondary accent: selection, soft borders, illustration fills | Decorative; never carries text alone |
| `--paper` | `#F7F3EE` | Page background | |
| `--ink` | `#241C1B` | Primary text | 15.1:1 on paper |
| `--deep` | `#B23A2E` | Links, small emphasis text, citation chips | 5.37:1 on paper, 5.94:1 on white — the only coral-family colour allowed for small text |
| `--peach-soft` | `#FDECE6` | Tinted surfaces (user bubble, chips) | Ink text on it 14.6:1 |

Semantic colours (`--ok`, `--warn`, `--bad`, `--info` and their `-soft` surfaces) are unchanged and
always ship with a text label — status is never colour alone.

Use coral sparingly: one primary action per view, highlights, the mark. No decorative gradients.

## Type
- **Sora** — headings, prominent labels, the wordmark, references and dates (tabular figures).
- **Manrope** — body, forms, descriptions, everything a borrower reads at length.
- Both are self-hosted OFL fonts in `public/fonts/`. Space Grotesk was removed in the Saral redesign.

## Voice
Plain, warm, no jargon.

- Say what happened, why, and what the borrower can do next — in that order.
- Short sentences. "Your credit score was below the minimum" not "The applicant failed rule MIN_CREDIT_SCORE".
- Never use internal terms in borrower-facing text: no *LangGraph, ZEN, RAG, API, embeddings, agent,
  orchestration, model, pipeline*. `tests/test_borrower_copy.py` guards this.
- One trust line, used in exactly two places — under the assistant's composer and in the footer:
  **"Understand your loan decision. A person decides."** Don't repeat disclaimers on every card.
- Simulations are always labelled **"Simulation, not your decision"**.
- Don't promise outcomes ("you will be approved"), and don't imply features that don't exist.
- Warm, not cute: no exclamation marks in error states; apologise once, then say what to do.
