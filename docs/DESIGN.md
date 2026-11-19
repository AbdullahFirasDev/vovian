# Design system

VOVIAN should read as a fashion house first and a shop second. Photography carries the experience, typography gives it a voice, and everything else stays quiet.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `ink` | `#000000` | Text, primary buttons, the wordmark |
| `night` | `#0A0A0A` | Campaign section, admin sidebar |
| `white` | `#FFFFFF` | Page |
| `paper` | `#F7F7F5` | Image placeholders, newsletter, summary panels |
| `mist` | `#E8E8E8` | Hairlines, input borders |
| `stone` | `#777777` | Inactive navigation, large secondary text (≥ 18 px) |
| `graphite` | `#5E5E5E` | Small meta text. Added because `#777` fails AA contrast (4.48:1) at small sizes |
| `error` | `#B3261E` | Form errors only. Sale prices stay black, with the original price struck through |

Defined as Tailwind v4 `@theme` tokens in `apps/storefront/app/assets/css/main.css` (mirrored in the admin).

## Typography

- **Bodoni Moda** (variable optical size) for display: headlines, product names on PDPs, the wordmark. High contrast, a Didone in the fashion-house tradition.
- **Hanken Grotesk** for the interface and body.
- **IBM Plex Sans Arabic** for all Arabic text; display weight 300 keeps the contrast. The wordmark stays Latin in every language.
- Scale after *The Elements of Typographic Style*: 12 / 14 / 16 / 18 / 21 / 24 / 36 / 48 / 72, plus fluid display utilities (`display-xl`, `display-lg`, `display-md`).
- Sentence case throughout; no tracked-out uppercase labels.

## Layout

- `shell` provides a gutter of 16, 24 or 40 px by breakpoint. `grid-editorial` gives 4 columns on mobile and 12 from `md`.
- Asymmetric compositions: text and imagery offset across the grid rather than centred.
- Product grids: 2, 3 or 4 columns with 40–56 px row gaps. Cards have no borders, radius or shadows.

## Signature: the wordmark

The hero sets **VOVIAN** at 22.5 vw across two monochrome photographs, cropped by the bottom edge, with `mix-blend-difference`, so each letter shows a negative of the image behind it. The footer closes with the same mark at the same scale.

## Motion

| Moment | Behaviour |
| --- | --- |
| Hero entrance | One GSAP timeline: images open bottom-up, the wordmark rises letter by letter, then the copy settles. CSS sets the initial state before hydration; a fallback reveals everything after 2.5 s if JS never runs. |
| Editorial imagery | A single clip-path reveal when scrolled into view (`data-reveal`). Never applied to product grids. |
| Campaign | Three.js lens: monochrome photograph, colour revealed under the pointer with a faint ripple. Fine-pointer devices only, renders only while visible, static fallback image underneath. |
| User actions | Drawers and menus open with curtain easing; hover image swaps on product cards. |

Under `prefers-reduced-motion: reduce`, all of the above is skipped (GSAP never loads) and CSS transitions collapse to instant.

## Components (storefront)

`VButton`, `VField` (input, textarea, select with visible labels and inline errors), `VCheckbox`, `VDrawer`, `VModal` (focus trap, Escape, scroll lock, focus restore), `VImage` (aspect box, no CLS), `VPrice`, `VQuantity`, `VBreadcrumbs` (with JSON-LD), `VPagination`, `VEmpty`, `VIcon` (custom 1.25 px line set, mirrored in RTL), `ToastStack`, `ProductCard` (hover image, swatches, quick add, wishlist), `ProductGrid`, `ProductRail`, `ProductGallery` + `ZoomViewer`, `SizeGuide`, `FilterPanel`, `CatalogView`, `AppHeader` + `MegaMenu`, `MobileMenu`, `SearchOverlay`, `CartDrawer`, `AppFooter`.

## Admin

The same palette and type: a black navigation rail, a Bodoni page title, hairline sections, and tabular numerals. Charts are single-series in ink on recessive grids, with tooltips, a table view and no dual axes.
