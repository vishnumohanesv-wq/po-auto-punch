# Changelog

## 5.3 — 19 Nov 2026
### Changed
- **Six looks instead of 42.** Kept: Graphite Lime (default), Pro, Emerald Night, Porcelain Navy,
  Indigo, Material. Each is identical to v4.0 in design and animation on all 25 modules.
- The Style picker lists the six; keys `1` to `6` select them.
- New users start on Graphite Lime. Anyone who had one of the removed looks saved lands on
  Graphite Lime; anyone on one of the six keeps it.
- File about 140 KB smaller (1,374 CSS selectors and 2 fonts used only by removed looks).

## 5.2 — 19 Nov 2026
### Changed
- **Original design and animations are back.** All 42 looks (Graphite Lime, Pro and the rest), the
  Style picker, fonts and animations are exactly as in v4.0. Verified element by element: every
  module's colours, fonts, sizes, spacing, shadows and animation definitions match v4.0.
- The v5.0 navy/violet redesign is no longer the default. It stays available as a build option
  (`--design enterprise`).
### Kept from 5.0 and 5.1
- Restore from backup works (see 5.1), and downloaded backups include report data.
- Action-button rows on Quick Commerce and FirstCry Weekly no longer scroll the page sideways on
  phones (applies below 900 px width only).

## 5.1 — 19 Nov 2026
### Fixed
- **Restore from backup did nothing.** A later importer had replaced the original one but expected a
  different argument, so the Restore button failed silently, and downloaded backups could not be
  restored anywhere. Restore now accepts downloaded backups from v4.0 and later. It replaces items
  with the same name, keeps everything else, and saves a safety copy of the device first so a restore
  can be rolled back. Safety-copy files still import as before.
- **Downloaded backups were incomplete.** They now include report and verification data
  (`rp_`, `vfy_`). Sheet links and keys are still never written to backup files.

## 5.0 — 19 Nov 2026
### Changed
- New design: slate canvas, midnight-navy sidebar, white panels, violet accent. Red is reserved for
  errors and delete actions; amber, green and blue keep their status meanings.
- Light, dark and auto themes. The old Style button and the `S` shortcut now switch these.
- The interface accent no longer changes with the selected buyer. Buyer colours remain on buyer tabs,
  history pills, dispatch stripes and the browser-tab icon.
- Dispatch rows waiting over 4 hours are amber instead of red. The rule itself is unchanged.
- Sentence-case labels, tabular figures, wider sidebar so labels are no longer cut off.
- Calmer motion: no blur-in pages, button shine, tilt or hover lifts; reduced-motion respected.
### Removed
- 41 alternative skins and their layout variants (1,781 CSS selectors).
- 8 unused font families. Manrope and IBM Plex Mono remain.
### Fixed
- Action-button rows scrolled sideways on phones (Quick Commerce, FirstCry Weekly).
### Unchanged
- All buyer parsers, SKU mappings, quantities, prices, GST, EasyEcom exports, invoice checks,
  Purplle ASN, packing lists, GRN, integrations, print and report templates, and stored data
  (schema 4). Opening v4.0 again works with the same data.

## 4.0
- Baseline: the original single-file app (`source/po-punch-pro-v4.0.html`).
