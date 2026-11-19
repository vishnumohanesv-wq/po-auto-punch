# PO Punch Pro

Purchase-order processing and dispatch operations for B2B and quick-commerce buyers.
Turns buyer PO PDFs into EasyEcom-ready rows, tracks every PO from punch to delivery,
checks invoices against POs, and keeps the Master Dispatch Tracker in sync.

![PO Punch Pro dashboard](docs/screenshots/dashboard.png)

**Version 5.1** · single-file web app · runs entirely in the browser

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

**Buyer PO formats read automatically:** Reliance Retail, Tata 1mg, FirstCry, Purplle,
Health & Glow, DMart, FirstClub.

**Integrations** (optional, set up from the Integrations page): Google Sheets Master Tracker
sync, Gmail invoice collector and quick-commerce sync, all through your own Google Apps Script
web apps. The URLs and keys you enter are stored only in your browser, never in this repository.

Light, dark and auto (follows your system) themes: use the **Theme** button in the header.

## Screenshots

| Dark mode | Phone |
|---|---|
| ![Dark mode](docs/screenshots/dashboard-dark.png) | ![Phone](docs/screenshots/dashboard-mobile.png) |

![Dispatch Management](docs/screenshots/dispatch.png)

## Repository layout

```
index.html                      the app (built output; this is what users open)
source/po-punch-pro-v4.0.html   the original v4.0 app, input to the build
tools/                          build script, design system and regression tests
docs/                           audit notes and screenshots
```

`index.html` is generated. To change the design, edit `tools/ds.css` (or the build steps in
`tools/build.py`) and rebuild; don't hand-edit `index.html`, or the next build will overwrite it.

## Build and test

```bash
pip install -r tools/requirements.txt
python -m playwright install chromium
(cd tools && npm install)          # exact copies of the CDN libraries, for offline tests
bash tools/run_tests.sh            # rebuilds index.html, then runs every check
```

The suite opens all 25 modules at desktop, tablet and phone sizes and in dark mode, compares
outputs (processed rows, EasyEcom CSVs, KPIs, stored data) against v4.0 byte for byte, checks that
no button or control went missing, and tests backup and restore end to end.
It ends with `ALL CHECKS PASSED` or exits with an error.

## Licence

Proprietary. All rights reserved. Not for redistribution.
