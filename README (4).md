# PO Punch Pro

Purchase-order processing and dispatch operations for B2B and quick-commerce buyers.
Turns buyer PO PDFs into EasyEcom-ready rows, tracks every PO from punch to delivery,
checks invoices against POs, and keeps the Master Dispatch Tracker in sync.

![PO Punch Pro dashboard](docs/screenshots/dashboard.png)

**Version 6.2** · single-file web app · runs entirely in the browser

## Run it

Open `index.html` in Chrome or Edge. No install, no server.

Or host it with GitHub Pages (**Settings → Pages → Deploy from branch → `main` / root**).
Pages on a private repository needs a paid GitHub plan; see [SECURITY.md](SECURITY.md).

Everything you load stays on your device. Data is saved in the browser you use, so the same
browser on the same computer keeps your history. Use **Backup & Restore** to move data or keep copies.

## What it does

| Area | Modules |
|---|---|
| Purchase orders | PO Processing, Processing History, PO Hold & Cancellation, SKU Mapping |
| Warehouse & fulfilment | Dispatch Management, Packing List, Appointment Management, Delivery Tracking |
| Documents | Invoice Verification, Bulk Invoice Check (Gmail), Purplle ASN, GRN Synchronization |
| Channel operations | Quick Commerce Sync, FirstCry Weekly Report |
| Finance & compliance | Demurrage & Courier Charges |
| Analytics | Executive Overview, Performance Dashboard, Analytics & Reports, Master Dispatch Records, Operations Register |
| Administration | Integrations, Backup & Restore, Organization & Branding, Workspace Settings, Help Center |

**Appointments from your Master Tracker.** Appointment Management lists every appointment from the
synced Master Dispatch Tracker, with summary tiles (today, tomorrow, next 7 days, missed, requested,
on-time delivery %), a by-date strip, and tabs for today (including delivered), tomorrow, the next
7 days grouped by date, missed, delivered late, requested and not confirmed, and ready POs with no
appointment. Each row carries marks for the appointment (✅ 🕓 ❌) and the result (📦 🚚 ⚠️ ⏳). You get a once-a-day summary when
you open the app, a count on the menu item, bell notifications, optional desktop notifications,
search, and a one-click list to paste into WhatsApp. It refreshes after every Master sync.

**FirstCry: EasyEcom MRP is final.** When a FirstCry PO prints a different MRP from EasyEcom, the PO
error is shown and the line is corrected to the EasyEcom MRP, keeping the PO margin (rate × EasyEcom
MRP ÷ PO MRP). EasyEcom rows, CSV and totals use the corrected rate. MRPs come from your EasyEcom
inventory CSV when loaded (FirstCry rate fix → Load EasyEcom inventory CSV), else the built-in list.
Where the two disagree for an FCID (often a pack mapped to a single-unit SKU) the line is not changed
and is flagged for your decision. A "Before you punch" checklist shows corrections, the value change,
reminders and tick-boxes; "Download MRP check CSV" gives PO vs EasyEcom per line.

**Less scrolling.** A Compact layout (on by default; switch with the Compact button next to Style)
tightens spacing and the oversized page titles without changing colours, fonts or animations.
PO Processing shows Punch-ready rows right after the totals, has a sticky "Jump to" bar, fold
buttons on each section (remembered), and Quick copy chips behind a button. "Before you punch" and
the appointments board fold to one summary line; the checklist can be hidden completely.

**Purplle bulk punch from the portal Excel.** Drop the Purplle "open PO master" export (sheets PO + SKU)
on the PO upload box or on "Upload Purplle POs in bulk": every PO in it is read (EAN, qty, MRP, net
price, GST), cross-checked against the PO sheet's line count and quantity, added to the Purplle batch
and to Dispatch Management, ready for the per-PO or combined EasyEcom CSVs.

**Buyer PO formats read automatically:** Reliance Retail, Tata 1mg, FirstCry, Purplle,
Health & Glow, DMart, FirstClub.

**Integrations** (optional, set up from the Integrations page): Google Sheets Master Tracker
sync, Gmail invoice collector and quick-commerce sync, all through your own Google Apps Script
web apps. The URLs and keys you enter are stored only in your browser, never in this repository.

**6 looks**: Graphite Lime (default), Pro and Emerald Night (dark); Porcelain Navy, Indigo and
Material (light). Pick one with the **Style** button in the header, or press `S` then `1` to `6`.
Your choice is remembered in your browser.

## Screenshots

![PO Processing](docs/screenshots/po-processing.png)

| Dispatch Management | Phone |
|---|---|
| ![Dispatch Management](docs/screenshots/dispatch.png) | ![Phone](docs/screenshots/dashboard-mobile.png) |

All six looks:

![The six looks](docs/screenshots/looks.png)

## Repository layout

```
index.html                      the app (built output; this is what users open)
source/po-punch-pro-v4.0.html   the original v4.0 app, input to the build
tools/                          build script, fixes and regression tests
docs/                           audit notes and screenshots
```

`index.html` is generated from the v4.0 source plus the fixes in `tools/build.py`. The six looks
and their animations are the original ones, untouched; the other 36 looks are left out of the build.
To change which looks ship: `python3 tools/build.py src index.html
--looks graphite,pro,emerald,porcelain,indigo,material` (first one is the default; `--looks all`
keeps all 42). Don't hand-edit `index.html`; change the
build and rebuild, or the next build will overwrite your edit.

An alternative single-theme redesign (v5.0, navy and violet) is kept as an option:
`python3 tools/build.py src index.html --design enterprise`.

## Build and test

```bash
pip install -r tools/requirements.txt
python -m playwright install chromium
(cd tools && npm install)          # exact copies of the CDN libraries, for offline tests
bash legacy/tools/run_tests.sh            # rebuilds index.html, then runs every check
```

The suite opens all 25 modules at desktop, tablet and phone sizes and in dark mode, compares
outputs (processed rows, EasyEcom CSVs, KPIs, stored data) against v4.0 byte for byte, checks that
no button or control went missing, checks that every element's design and animations match v4.0
in each of the six looks, checks the Style picker, and tests backup and restore end to end.
It ends with `ALL CHECKS PASSED` or exits with an error.

## Licence

Proprietary. All rights reserved. Not for redistribution.
