# Changelog

## 6.3 — 20 Nov 2026
- Mail alerts and reports go to **vishnu@tucokids.com only** (empty NOTIFY_TO = no emails, app only).
- Fixed: mail POs were reported "no punch rows" because the result was read before the PDF finished;
  the app now waits for the reader's real result (up to 45 s).
- A mail PO that cannot be read is never marked processed or emailed: it stays with "⚠ not read · Retry".
- "Put a mail PO back as new" (script action reopen) for POs wrongly marked processed.
- Tighter filters: GRN/GrnCode, receipt notices, appointment scheduled/cancelled, "ship now", returns,
  notices and the script's own emails are ignored. Link downloads follow a page that points to the file.

## 6.2 — 20 Nov 2026
- **ops@tucokids.com is the main PO mailbox**: the PO Mail Watcher is installed there; alerts and
  check/process reports go to vishnu@tucokids.com and ops@tucokids.com.
- Replies on PO threads (stockist appointment confirmations quoting the PO mail) are never counted as new POs.
- FirstCry warehouse/JIT POs (sent to chitra@/anshuman@, not ops@) are accepted when forwarded to ops@.

## 6.1 — 20 Nov 2026
### New POs from mail (all channels)
- **PO Mail Watcher** (Google Apps Script, `tools/PO_Mail_Watcher.gs`, also copyable inside the app): every
  10 minutes finds new PO emails per channel (FirstCry stockist + JIT with their download links; Purplle,
  Reliance, DMart, Health & Glow, Tata 1mg, FirstClub by attachment; a catch-all for unknown senders),
  skips GRN / payment / pending-list / consolidated mails, saves the PO file to Drive, labels the mail
  PO-Punch/New, logs it, and emails **vishnu@tucokids.com** the list of new POs.
- **In the app**: "📬 New POs from mail" card on PO Processing, bell + menu badge, optional desktop
  notification. Check & process (one or all) downloads the PO and runs the normal reader and spot check;
  the result goes back to the script, which labels the mail PO-Punch/Processed and emails the report
  (✅ checked & processed / ⚠ check, with totals and issues). Auto check & process is on by default and
  never takes over PO Processing while someone is working on a PO there.

## 6.0 — 20 Nov 2026
### Dispatch Management follows the Master Tracker
- After every Master sync (and when Dispatch Management opens) each PO's board stage is set from the
  Master: delivered/dispatched → Dispatched · label → Ready for Dispatch · packed → Packing Completed ·
  not packed → Processing / Packing Pending · cancelled/RTO → removed from the board.
- A board change made after the last Master sync is kept until it reaches the Master (Update Master).
- Open Master POs (not dispatched, not cancelled, PO date within 45 days) are added to the board.
- Channel, warehouse, zone, distributor, qty, value and boxes come from the Master.
- Summary bar above the list: what moved, added, removed, kept; POs not in the Master; ⟳ Sync with Master.

## 5.9 — 20 Nov 2026
### Purplle: bulk punch from the "open PO master" Excel
- The PO upload box and the Purplle batch card's "Upload Purplle POs in bulk" box now read Purplle's
  portal export (sheets **PO** and **SKU**; header row found automatically below the filter lines).
- Each PO becomes the same record a Purplle PO PDF makes: EAN, qty, MRP, net price, GST-inclusive
  price (net × (1 + CGST + SGST + IGST)), line total incl. GST; date as DD.MM.YYYY.
- Cross-check per PO against the PO sheet (line items and total quantity): ✔ / ⚠ in the result.
- Flags free (FOC) lines, lines with no price, and lines only partly still to be delivered.
- POs go into the Purplle batch (tick, download one CSV per PO, combined CSV, Excel, Master rows) and
  into Dispatch Management, exactly like Purplle PDFs. Other Excel formats are routed as before.
- Checked with a real export: 10 POs, 110 lines, 2,348 pcs, ₹4,74,872.99 incl. GST.

## 5.8 — 20 Nov 2026
### Less scrolling, same look
- **Compact layout** (default; "▤ Compact / ☰ Comfortable" button next to Style): tighter cards, tiles,
  tables and sidebar, smaller oversized page titles. Colours, fonts, shapes and animations unchanged.
- **Before you punch** folds to one line (corrections, value change, ticks done) and starts folded;
  "Hide" shrinks it to a single "Show" button. Choices are remembered.
- **Appointments board** folds to one line with today / tomorrow / next 7 days / missed counts.
- **PO Processing rearranged**: Punch-ready rows now come straight after the totals (before PO details
  and the Master row). Sticky **Jump to** bar: Check, Before you punch, Totals, Rows, Copy all rows,
  PO details, Master row, Summary. **↑ Top** button when scrolled down.
- **Fold buttons** (▾ Hide / ▸ Show) on Punch-ready rows, PO details, Master row and PO summary;
  PO summary and the Quick copy chips start folded. Choices are remembered.
- PO Processing with a PO loaded: 3,581 px → 2,567 px tall (28% less scrolling); Appointments 20% less.

## 5.7 — 20 Nov 2026
- **Punch-ready rows mark every changed line**: amber stripe and tint on the row, and a flag next to
  the SKU, e.g. "✏️ MRP 250→450 · was ₹162.50" (hover for MRP, rate and value before → after).
  Saved rate fixes are marked "rate fix"; pack conflicts that were not corrected show "❗ check MRP".

## 5.6 — 20 Nov 2026
### FirstCry: EasyEcom MRP is final
- PO MRP ≠ EasyEcom MRP → the PO error is still shown, and the line is **corrected automatically**:
  MRP = EasyEcom, rate = PO rate × EasyEcom MRP ÷ PO MRP (same margin), base, GST and value recalculated.
  Example: 22439293 / 64474 Shampoo 300ml: MRP 250 → 450, rate ₹162.50 → ₹292.50, 72 pcs ₹11,700 → ₹21,059.88.
- EasyEcom rows, EasyEcom CSV, totals and the PDF check all use the corrected values.
- **EasyEcom inventory CSV** can be loaded as the MRP source (sku + mrp columns; backtick prefixes handled).
- **Safety rule**: if the EasyEcom CSV and the built-in list disagree for an FCID, the line is not
  corrected and is flagged "needs your decision" (often a pack mapped to a single-unit SKU).
- "Auto-correct with EasyEcom MRP" switch (on by default). A saved Rate fix always wins.
- **Before you punch** checklist under the PO check: corrected lines, PO → EasyEcom value change,
  "ask FirstCry to amend the PO" reminder, uncorrected or unknown MRPs, and 9 tick-boxes saved per PO.
- **Download MRP check CSV** (this PO) and **Compare built-in list with EasyEcom CSV**.

## 5.5 — 19 Nov 2026
### Appointments board
- **Today shows every appointment for today**, delivered ones included, with the result of each.
- **Missed**: date passed and not delivered, flagged in red at the top with a link to review.
- **Delivered late (30 days)** tab and an **on-time delivery %** tile.
- Summary tiles (today, tomorrow, next 7 days, missed, requested, on-time %); click to open.
- **By-date strip** for the next 7 days with counts; click a date to see only that day.
- Next 7 days grouped by date with PO and qty totals per day.
- Marks: appointment ✅ Confirmed · 🕓 Requested · ❌ Rejected · ➖ Not set;
  result 📦 Delivered (on time / late) · 🚚 Dispatched · 📋 Ready · ⏳ Packing pending · ⚠️ Missed.
- Alerts (daily popup, bell, menu badge) now count missed appointments and today's undelivered ones.
- WhatsApp list includes the result of each PO.

## 5.4 — 19 Nov 2026
### Added
- **Appointments from the Master Tracker** at the top of Appointment Management, read from the
  Master the app already syncs. Tabs: Today, Tomorrow, Next 7 days, Date passed and not delivered,
  Requested and not confirmed, Ready with no appointment. Cancelled, RTO and delivered POs are left out.
- Columns as in the sheet's Appointment & Delivery tab: PO, distributor, channel, zone, WH from,
  appointment date (with Today / Tomorrow / In N days), AWB, qty, boxes, transporter, appointment
  status, stage.
- **Daily alert**: a summary card once per day when the app opens; optional desktop notification
  (turn on from the section). Menu badge = appointments today + dates passed. Bell notifications
  for passed, today and tomorrow.
- Search, "Copy list for WhatsApp", and "Sync master now". Refreshes after each Master sync.
### Unchanged
- The manual appointment tracking below it, all six looks, and every other screen.

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
