# PO PUNCH PRO 4.0 (Phase 1 and 4 release)

Enterprise Supply Chain Operations & Intelligence Platform. Single file, browser only. Nothing is uploaded.
Built on your original v2.0 source: all 42 skins and the Style picker are kept. No buyer parser, SKU mapping, EasyEcom column, Purplle ASN, invoice check, packing list, GRN, Quick Commerce or Google Sheet code was changed.

## What is in this release
**Phase 1: safe upgrade, backup and rollback (done)**
- On first open, a full copy of your saved data is stored in the browser (IndexedDB) before anything else. The data version is stamped 4 only after that copy succeeds.
- Old records are never edited by the upgrade. All new lifecycle data lives in its own store (`po_life`).
- Backup & Restore now has "Safety copies, upgrade and rollback": save a copy any time, download it as JSON, add a backup file, roll back to any copy, delete copies. Rolling back first saves a copy of the current state, so it can be undone. The last 10 copies are kept.

**Phase 4: PO lifecycle, appointments and delivery (done)**
- **PO details panel.** Click any PO number in Dispatch Management. It has a 13-step timeline (PO Received to GRN Completed), all the lifecycle fields (invoice, appointment, dispatch, courier, AWB/LR, vehicle, driver, OFD, delivery, POD, failed-delivery reason, reattempt, GRN, delay reason, remarks, courier escalation), rescheduling history, and a log of every change you save. PO Verified, Customer Master Created and Inventory Blocked are manual dates because the app has no data source for them.
- **Appointment Management** (Warehouse & Fulfilment): ready but not requested, waiting for buyer, confirmed upcoming, confirmed but not dispatched, rejected, buyer-side delays. Delays are split into buyer side, warehouse and courier, with thresholds you can change.
- **Delivery Tracking:** shipments with courier, AWB/LR, ageing buckets (0 to 2, 3 to 5, 6 to 10, above 10 days) with green/amber/red marks, in transit, OFD, delivered, failed, courier delayed, GRN completed and pending, courier-wise summary, and bulk AWB input (PO, AWB, courier per line).
- **Executive Overview:** a PO lifecycle row with date filters (All time, Today, Yesterday, Last 7 days, Last 30 days, This month, Custom). Tiles: POs received, PO value, units, POs pending, packing pending, ready for dispatch, pending appointments, dispatched, OFD, delivered, GRN completed, delayed shipments. Each tile opens the matching list. All numbers are counted from saved records.
- **Search (Ctrl+K)** also finds AWB, invoice number, appointment ID, courier, GRN reference and POD.
- **Copy-ready WhatsApp and email updates** built from the PO's real details. Nothing is sent automatically.

Earlier in this build line (3.0): Command Center, validation centre, notifications, Organization & Branding, eight-category menu with pins, warehouses Bengaluru, Gurugram, Mumbai, Kolkata, Emiza, Delhivery.

## Not built yet (planned phases)
- Buyer & Channel Intelligence profiles (Phase 3), warehouse dashboards, inventory (available, blocked, OOS). The app has no inventory data source.
- SKU mapping upgrades: suggestions, history, audit log, bulk Excel import/export, MRP and pack-size checks.
- Multi-file upload queue with PDF preview and retry. Packing assistant extras (expiry, batch, labels). GST/HSN/GSTIN invoice checks.
- Reports centre with Excel, CSV and PDF export. Notification thresholds for the alert bell. Light mode, custom accent, font and density settings.
- Moving large data to IndexedDB. Only safety copies use it today; working data stays in localStorage.
- OOS / shortage KPI: not tracked, so it is not shown.

## Needs external APIs or credentials
- Google Sheet sync (your Apps Script URL and key, saved in your browser only, never in this file).
- Live courier tracking: not built. Delivery status comes from the dates and AWB numbers you type. The app says so on screen.

## Known limitations
- Appointment and delivery data is entered by you. Nothing is fetched from buyers or couriers.
- Browser storage is about 5 MB. Safety copies use separate IndexedDB space, but very large histories may still fill localStorage. Check Backup & Restore.
- Dispatch Management stage "Dispatched" is set automatically when you save an actual dispatch date. It never moves a PO backwards.
- The 3.0 limits for Excel exports and icons still apply (see CHANGELOG).

## Deploy on GitHub Pages
1. Replace `index.html` in your `po-auto-punch` repo. Commit and push.
2. Settings, Pages, Source: main branch, root. Wait about a minute.
3. Open the live link and hard refresh (Ctrl+Shift+R). On first open the safety copy is made automatically.
4. Do not commit your Google Sheet URL or key.

## Migration and rollback
- Upgrading: just open the new file in the same browser. Nothing to do. Check Backup & Restore, "Safety copies": the first entry reads "Automatic copy before upgrade to 4.0".
- Rolling back data: Backup & Restore, pick a copy, Roll back. The page reloads with that copy's data.
- Going back to the old app version: put `ORIGINAL_BACKUP_v2.0.html` back as `index.html`. Your old records are untouched by 4.0, so they are still there.
- Moving to another browser or device: Download a copy, open the new browser, "Add a backup file", then Roll back to it.
