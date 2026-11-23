# Changelog

## 7.2 — 23 Nov 2026
### Added: PO Register & Control Tower (the "one operational record")
- New page **PO Register** (Command Center): one row per PO assembled from Master rows, Processing History, Record Book,
  Dispatch board, Purplle batch, Hold list, PO Inbox and the PO lifecycle record. Read-only on existing data.
- 16 milestones (PO Received → … → GRN Completed), each with actual date and source, or "not recorded". Nothing invented.
- Next action = first required milestone not done (physical flow implies earlier steps), owner, ageing, and who it waits on
  (Tuco / buyer / courier); a "Buyer appointment delay" reason counts as buyer-side.
- Duplicate checks: same PO punched twice; same buyer + qty + value (±₹1) within 3 days under different PO numbers.
- PO panel: timeline + owner, team, verified / customer master / inventory blocked dates, planned dispatch and delivery,
  delay reason, escalation, remarks. Saved through the app's own lcSave (field history) plus an **audit log** (user, time,
  field, old → new, reason). Search (PO, buyer, SKU/EAN, invoice, AWB, GRN ref, distributor), filters, saved view, CSV/Excel.
- Safe migration: a safety copy is taken before the first run; new keys only (po_audit, po_erp_user, po_erp_schema, po_erp_view).

## 7.1 — 23 Nov 2026
- PO Inbox: FirstCry mails with only the Excel are flagged **PDF missing** with **Re-fetch files** (one or all); auto-process skips them.
  Action buttons no longer hide off-screen (narrower subject/file columns, file type badges).
- PO Mail Watcher script **v1.2**: recognises downloaded files by their content (%PDF / PK), so FirstCry PDFs sent as
  "text/html" are saved; new `refetch` action. Update the script (same key and URL) to use it.
### Added
- **PO Inbox** is its own menu item and page (was a card on PO Processing): tiles New / Needs a look / Not read /
  Processed, channel filters, search, select + "Check & process selected", **"Not a PO"** (dismiss), and an
  **In Master** check per PO. PO Processing shows a one-line "📬 N new POs → Open PO Inbox" banner.
- **Master overview** at the top of Executive Overview, all from the Master: open POs/value, packing pending,
  packed/ready, in transit, delivered 30 d, GRN pending, appointments today/tomorrow, missed, inbox, cancelled;
  open-PO ageing; tables by channel and warehouse; alerts (missed, tomorrow not dispatched, open > 14 d,
  GRN > 15 d). Tiles open the right screen. Sync master now button.
### Fixed
- Mail watcher saved only the FirstCry Excel, not the PDF: the file type is now taken from the file's first
  bytes (%PDF / PK), not the server's content-type. Requires redeploying the script (new version).

## 7.0 (Phase 0) — 23 Nov 2026
### Fixed
- **Record Book CSV/Excel export did nothing** (duplicate `bkRows`; v6.3 L4310 vs L4766). Now exports all shown entries.
- **Purplle ASN builder "Clear all"/"Clear" did not clear** loaded POs/invoices (duplicate `asnClear`; L4448 vs L6822).
### Changed (behaviour identical, proven by the regression suite)
- `navTo`: 10 stacked wrappers → `po:nav-base` / `po:nav` listeners in the same order with the same arguments; the page router stays.
- 12 DOM pollers (1–6 s) → `poWatch`: runs on data change, navigation and user input (+10 s safety). Idle work −41%.
- `eval()` removed (`PO_STATE.get`, allow-listed names).
- Source split into 47 modules (`legacy/src`), byte-identical reassembly, build from modules.
### Added
- `packages/parsers` (zero dependencies): money in paise, strict ISO dates (ambiguous dd/mm rejected), GSTIN checksum + CGST/SGST vs IGST,
  FirstCry parser (parity-tested against the app), EasyEcom-MRP rule, MOQ/freight rule, Purplle open PO master. 9 tests.
- docs: analysis, ERD, API, ADRs, OPEN_QUESTIONS; CI workflow.

Earlier versions: see legacy/CHANGELOG.md (v5.0–v6.3).
