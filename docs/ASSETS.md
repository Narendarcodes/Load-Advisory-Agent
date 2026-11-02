# Third-party and generated assets

## Illustrations — original placeholders (not Storyset)

Folder: `apps/loan_advisory_portal/loan_advisory_portal/public/illustrations/` (14 SVGs, ~21 KB total,
optimised with `svgo --multipass`). Source: `scripts/brand/illustrations.py`.

**These are original, simple flat illustrations drawn for this project as clearly-labelled
placeholders. They are not Storyset artwork and are not derived from it.** Each SVG's `<title>` ends
with "(original placeholder illustration)".

### Why not Storyset yet
The design reference asks for Storyset's *Cuate* style. Storyset's Terms of Use (checked 2026-11-02,
https://storyset.com/terms, version dated February 2022) allow free use **with attribution**
("The authorization to use the Storyset Content shall be free provided that any use … is credited to
the Company/Website"; the FAQ at https://storyset.com/faqs repeats that attribution is always
required on the free tier). The same terms prohibit obtaining content with "robots, spiders or any
other mechanism, mobile application, program or tool" or "any method … which is not the ordinary
method of accessing the Website". Downloads are made through the site's editor. An automated run
fetching the SVGs would not be the ordinary method, so no Storyset file was downloaded or committed.

### Swapping in Storyset Cuate (manual, by a person)
1. On storyset.com, pick illustrations from **one** style (Cuate) for each slot below, set the colour
   to `#FE7D6B`, background "Hidden", and download SVG through the site.
2. Save each as the same filename (the templates already point at these paths), run
   `npx svgo --multipass *.svg`.
3. Record each source page URL in the table below and keep the attribution: the footer and Help page
   must carry a visible link, e.g. `<a href="https://storyset.com/business">Business illustrations by Storyset</a>`
   (use the category the artwork came from).
4. Update the `<title>` of each file to describe the new picture.

| File | Used on | Placeholder shows | Storyset source URL |
| --- | --- | --- | --- |
| `login.svg` | Sign in | Person at a laptop | — (placeholder) |
| `dashboard.svg` | Dashboard next-step card | Person with a rising chart | — |
| `wizard-about.svg` | Apply, stage 1 | Person beside a profile form | — |
| `wizard-loan.svg` | Apply, stage 2 | Person with a loan calculator | — |
| `wizard-documents.svg` | Apply, stage 3 note | Person uploading documents | — |
| `decision.svg` | Decision card (outcome) | Person reading a report | — |
| `assistant.svg` | Assistant empty state | Chat bubbles and the Saral mark | — |
| `empty-applications.svg` | Dashboard, no applications | Empty folder with plus | — |
| `empty-documents.svg` | Documents, none attached | Empty tray | — |
| `assessment-pending.svg` | Decision not yet available (draft) | Report with a clock | — |
| `processing.svg` | Under review / manual review | Documents moving along | — |
| `submitted.svg` | Submitted | Person with a ticked document | — |
| `missing-info.svg` | Information requested | Form with a question mark | — |
| `service-unavailable.svg` | No product / service down | Cloud with a broken link | — |

## Brand assets
Original artwork for this project — see `docs/BRAND.md` and `scripts/brand/`.

## Fonts
Sora and Manrope, SIL Open Font License 1.1 (`public/fonts/*-OFL.txt`).
