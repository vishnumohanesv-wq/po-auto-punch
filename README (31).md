# PO PUNCH PRO 4.0 — README

Single file: `index.html`. Open it in a browser or put it on GitHub Pages (repo `po-auto-punch`, replace `index.html`). Data stays in your browser. Keep `ORIGINAL_BACKUP_v2.0.html` as your rollback.

## Upgrade steps
1. Settings → Backup: download a backup first (the app also makes an automatic copy on first open).
2. Replace `index.html` on GitHub, wait a minute, hard refresh (Ctrl+Shift+R).
3. Saved warehouse names convert once to the Master Tracker names.

## Purplle, step by step (Convert a PO → Purplle)
1. **Load POs:** drop the Purplle PO Excel (EXECL_ATTACHED .XLS), CSV or PDFs into "Upload Purplle POs in bulk". Tick the POs you want.
2. **Download for EasyEcom:**
   - Download all: one CSV per PO (ZIP). Columns `Sku, Quantity, Price`, unchanged.
   - One combined CSV (merged by SKU and price). Use only if EasyEcom accepts a multi-PO import.
   - Line detail CSV, Excel (sheet per PO), Copy Master rows, Everything (ZIP).
   - While punching one by one, the bar has Copy SKU rows, ⬇ CSV, Sheet row, Vendor, PO no., Done & Next.
3. **Invoices:** drop the EasyEcom Invoice Report CSV. It matches invoice no, date and amount to each PO and saves them in PO tracking. Buttons: Copy PO + invoice details, Copy Invoice No (col U), Copy Invoice Date (col AY), Download CSV.

## Master Tracker names
Warehouses: Emiza BLR, Emiza GGN, Delhivery MUM, Delhivery KOL. Zone, channel, transporter and 66 distributor names are written in the Tracker's spelling on copy/send. Some similar spellings were merged to the most common one; tell me if any should stay separate.

## What also changed in 4.0
Command Center with PO lifecycle KPIs, Appointment Management, Delivery Tracking, 8-category menu, Organization & Branding, backup/rollback. Details in CHANGELOG.md, tests in TESTING.md.

## Known limits
- Master sync (Apps Script) still writes columns A–J only. Invoice columns U and AY are copy-paste until the script is extended.
- Invoice report "Amount" is shown as in the file; check once whether it includes GST.
- Not tested: invoice PDF parsing, importing the ZIP/combined CSV into EasyEcom, phone layouts.
- Not built from the 4.0 prompt: buyer/channel dashboards, warehouse/inventory dashboards, reports centre, appearance settings, IndexedDB working data.
- No live courier tracking; no API integrations beyond your own Apps Script.
