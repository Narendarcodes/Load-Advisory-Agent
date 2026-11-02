# Third-party and generated assets

## Illustrations: Open Peeps by Pablo Stanley (CC0 1.0)

Folder: `apps/loan_advisory_portal/loan_advisory_portal/public/illustrations/` (17 SVGs, ~345 KB total,
optimised with `svgo --multipass`, config `scripts/brand/svgo.config.cjs`).
Composer: `scripts/brand/peeps.py <cache-dir> <out-dir>`.

**Source and licence.** Every figure is an unmodified Open Peeps figure by Pablo Stanley,
https://www.openpeeps.com/, downloaded from the SVG links on that page (hosted on
`cdn.prod.website-files.com`). Open Peeps is dedicated to the public domain under
**CC0 1.0** (https://creativecommons.org/publicdomain/zero/1.0/): it may be copied, modified and used
commercially without permission or attribution, and scripted download is allowed. A courtesy credit
("Illustrations: Open Peeps by Pablo Stanley, CC0") is shown on the Help page.

**Treatment.** The black ink line and white fills of each figure are kept as drawn. Each slot places
the figure on a 320×240 canvas (4:3, the same ratio for every slot) with a soft coral-tint ground
(`#FDECE6`) and, where the scene needs it, a simple prop drawn in `peeps.py` (document, phone-side
coins, clock, chat bubble, folder, tray, profile card, unplugged cable). Coral (`#FE7D6B`, `#FF8F68`)
appears only on those props. Each SVG carries a `<title>` naming the scene and the source.
In the templates every illustration is decorative (`alt=""`), because the heading next to it already
says what it shows.

| File | Used on (display size) | Scene | Open Peeps figure | Source URL |
| --- | --- | --- | --- | --- |
| `login.svg` | Sign in (hero, 320×240) | A person working on a laptop | `peep-46` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53570264109d16a7014c37_peep-46.svg |
| `dashboard.svg` | Dashboard next step (160×120) | A person pointing at a rising chart | `peep-standing-16` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53622ec67e7957fc9b32e0_peep-standing-16.svg |
| `wizard-about.svg` | Apply stage 1 (120×90) | A person beside their profile card | `peep-standing-18` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e536266c99250fe47cebfc0_peep-standing-18.svg |
| `wizard-loan.svg` | Apply stage 2 (120×90) | A person working out a monthly amount on their phone | `peep-10` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53515e2b568a43f515edd5_peep-10.svg |
| `wizard-documents.svg` | Apply stage 3 (120×90) | A person pointing to a stack of documents | `peep-standing-17` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e53624b9b55b0127f5851cf_peep-standing-17.svg |
| `decision.svg` | Decision outcome (120×90) | A person reading a decision letter | `peep-39` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535637d87131637b0e4379_peep-39.svg |
| `assistant.svg` | Assistant empty state (160×120) | A person asking a question | `peep-60` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5358a764109d50aa01705d_peep-60.svg |
| `empty-applications.svg` | Dashboard, no applications (180×135) | A person with an empty folder | `peep-2` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e532a4c258ffe237b8ef2c1_peep-2.svg |
| `empty-documents.svg` | Documents, none attached (180×135) | A person beside an empty tray | `peep-68` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535997e35d380ada67ad80_peep-68.svg |
| `assessment-pending.svg` | Decision not yet available (180×135) | A person waiting, with a clock | `peep-sitting-12` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535f438becbf2fab5619bb_peep-sitting-12.svg |
| `processing.svg` | Under review / manual review (180×135) | A person waiting with a cup while documents are checked | `peep-102` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535d808becbf7162555033_peep-102.svg |
| `submitted.svg` | Submitted (180×135) | A person who has just sent their application | `peep-standing-23` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5362fa8becbf1d50570b23_peep-standing-23.svg |
| `missing-info.svg` | Information requested (180×135) | A puzzled person and a form with a question | `peep-80` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535b00550b76252bf719e6_peep-80.svg |
| `service-unavailable.svg` | Service unavailable; assistant error (180×135; 96×72 in chat) | A worried person and an unplugged cable | `peep-93` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535c7a550b76084df7d544_peep-93.svg |
| `documents-header.svg` | Documents page header (160×120) | A person sitting with their papers | `peep-sitting-18` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e536006c67e7976719986dc_peep-sitting-18.svg |
| `profile-header.svg` | Profile page header (160×120) | A person standing at ease | `peep-standing-13` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5361ccd3992383f7595afc_peep-standing-13.svg |
| `help-header.svg` | Help page header (160×120) | A person explaining something | `peep-standing-24` | https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e5363188becbffe8c57172c_peep-standing-24.svg |

## Brand assets
Original artwork for this project; see `docs/BRAND.md` and `scripts/brand/`.

## Fonts
Sora and Manrope, SIL Open Font License 1.1 (`public/fonts/*-OFL.txt`).
