# TUCO PO Punch Converter Pro

Turn retail buyer purchase-order PDFs into **punch-ready EasyEcom rows**, **Master Dispatch Tracker rows** and **Purplle ASN files** in seconds. It runs entirely in the browser, with nothing to install.

**Live tool:** https://vishnumohanesv-wq.github.io/tuco-po-punch/

| Buyer | PO PDF → EasyEcom rows | Master sheet row | ASN file |
|---|:---:|:---:|:---:|
| Purplle | ✅ (batch mode) | ✅ | ✅ |
| FirstCry | ✅ | ✅ | – |
| Reliance Retail | ✅ | ✅ | – |
| Tata 1MG | ✅ | ✅ | – |

---

## Forty-one looks

Click **Style** in the header (or press **S**) to pick a design. Inside the picker, the arrow keys step through every design, keys **1** to **9** and **0** pick the first ten (use the arrows for the rest), and **Surprise me** picks one at random. Your choice is saved in your browser and is still there after a reload.

| # | Look | Mode | Feel |
|---|---|---|---|
| 1 | **Aurora** (default) | Dark | Futuristic glass with a slow gradient glow |
| 2 | **Material** | Light | Google-style tonal surfaces, pill buttons, four-colour top strip |
| 3 | **Neon** | Dark | Cyber terminal on a glowing grid |
| 4 | **Ember** | Dark | Carbon dashboard with orange heat |
| 5 | **Ink** | Light | Black on white, print-friendly |
| 6 | **Sakura** | Light | Soft rose glass with a peach glow |
| 7 | **Ocean** | Dark | Deep teal with a slow tide of light |
| 8 | **Sunset** | Dark | Synthwave violet, pink and orange |
| 9 | **Amber CRT** | Dark | Retro monochrome terminal |
| 10 | **Forest** | Dark | Deep green with fresh lime |
| 11 | **Royal** | Dark | Navy and gold with serif headings |
| 12 | **Mint** | Light | Fresh, rounded and friendly |
| 13 | **Indigo** | Light | Clean SaaS look with an indigo accent |
| 14 | **Midnight** | Dark | True black, one electric blue |
| 15 | **Glacier** | Light | Icy glass over a blue-cyan mesh |
| 16 | **Dock** | Dark | Floating bottom dock with magnifying icons and tooltips |
| 17 | **Console** | Light | Cloud-console top bar with underline tabs, dense and rectangular |
| 18 | **Rail** | Dark | Slim icon rail with tooltips and compact, IDE-style density |
| 19 | **Flip** | Light | Right-hand sidebar and a calm document-style page |
| 20 | **Split** | Dark | Sticky step timeline on the left, work area on the right |
| 21 | **Bento** | Light | Floating nav tile and pastel tiles with huge rounded corners |
| 22 | **Brutal** | Light | Thick outlines, hard shadows, buttons that press down |
| 23 | **Clay** | Light | Soft 3D: raised buttons, pressed inputs, pillowy cards |
| 24 | **Editorial** | Light | Newspaper masthead, serif headlines, ruled sections |
| 25 | **Zen** | Dark | Sidebar hides until you touch the left edge, one calm column |
| 26 | **Blueprint** | Dark | Engineering drafting sheet: cyan lines on blueprint blue, dashed frames, mono type |
| 27 | **Swiss Poster** | Light | International style: black top bar, heavy grotesk headlines, one red |
| 28 | **Kraft Warehouse** | Light | Cardboard and shipping label: kraft paper, stamp headlines, folder-tab navigation |
| 29 | **Candy Pop** | Light | Playful and chunky: round font, thick outlines, 3D buttons, floating bottom tabs |
| 30 | **Noir & Gold** | Dark | Black and brushed gold, serif display type, floating pill navigation |
| 31 | **Studio IDE** | Dark | Code-editor workspace with explorer panel and a live status bar |
| 32 | **Highway** | Dark | Road-sign logistics: asphalt, signal yellow, condensed caps, hazard-stripe dividers |
| 33 | **Retro 95** | Light | 1990s desktop: teal wallpaper, grey bevels, blue title bars on every window |
| 34 | **Graphite Lime** | Dark | Product-studio look: graphite, acid lime, oversized numerals, numbered menu |
| 35 | **Receipt** | Light | A thermal-printer receipt: one narrow paper column, typewriter type, dashed rules |
| 36 | **Ledger** | Light | Accounting-ledger look: crisp white, deep teal, uppercase table headers |
| 37 | **Porcelain Navy** | Light | Bright porcelain page with a deep navy sidebar and a strong blue |
| 38 | **Emerald Night** | Dark | Black-green dark mode with a bright emerald accent |
| 39 | **Plum** | Dark | Deep plum with magenta highlights |
| 40 | **Steel & Amber** | Dark | Industrial steel blue with one amber signal colour, square corners |
| 41 | **Lavender Mist** | Light | Soft lavender surfaces, round shapes, vivid violet |

Looks 1 to 15 change colours and effects. Looks 16 to 35 also change the navigation position, page layout, spacing and the shape of every button, input, table and card. Looks 26 to 35 also bring their own fonts, loaded from Google Fonts. On phones, every look falls back to the bottom navigation bar.

All thirty-five run the same tool, so PO conversion, ASN filling and invoice checks are not affected.

### Add your own look

Each look is a block of colour variables in the `<style id="skins">`, `<style id="skins2">` or `<style id="skins3">` or `<style id="skins4">` section of `index.html`. Copy one block, rename `data-skin="..."`, change the colours, then add an entry to the `LOOKS` list and the colour list in the first `<script>` in the head.

---

## FirstCry rate fix (new)

Some FirstCry POs print a wrong MRP or rate, which later leads to a debit note. In **Convert → 💲 FirstCry rate fix**, enter the **FCID**, the correct **MRP** and the correct **rate incl. GST** (the PO's Landing Rate). The base cost is worked out from the GST % on the PO. **Qty** is optional: leave it empty to keep the PO quantity.

Example: FCID `23840093` (Oat Body Lotion 300ml, SKU 64470). The PO prints MRP 500 and rate 325. The fix gives MRP **375**, rate **243.75** and base cost **206.57**, which match the debit note (375 less 35% margin = 243.75; ÷ 1.18 = 206.57). This fix is saved by default.

The fix applies to every FirstCry PO and to PO vs Invoice compare. The status line shows what was changed and the adjusted PO total, so the qty and amount checks do not give a false warning. Fixes are stored only in your browser.

---

## Quick copy (vendor name, PO number and more)

Open a converted PO and find **Quick copy** inside the **Master Dispatch Tracker row** card.

| What | How |
|---|---|
| **One value** | Click a chip: vendor name, PO number, PO date, order date (dd-mm-yyyy), PO value, qty, channel, zone, warehouse, transporter or boxes |
| **Everything at once** | **Text lines**, **Excel row**, **WhatsApp**, **Email**, **CSV** or **JSON** |
| **EasyEcom bulk order helper** | Three steps that match the EasyEcom screens: **1** copy the vendor name for *Wholesale Customers → Search*, **2** copy the PO number for *Add Bulk Orders → Reference Number*, **3** copy the order date |
| **PO details card** | **Copy all** copies every detail shown as `label: value` lines. Clicking a single detail still copies just that one |
| **Purplle punch bar** | **Vendor** and **PO no.** buttons next to *Sheet row*, plus **Copy vendor name** under the Purplle list |
| **History** | **Vendor** and **PO** buttons on every entry |

Shortcuts: **V** copies the vendor name, **P** copies the PO number, and Ctrl+K has *Copy vendor name*, *Copy PO number*, *Copy order date* and *Copy all PO details*.

---

## Pro tools

| Tool | Where | What it does |
|---|---|---|
| **PO vs Invoice report to Excel** | Invoices → Compare | Downloads the summary and the line-by-line table as an Excel file to forward to accounts or the buyer |
| **Short-shipped value** | Invoices → Compare | Shows the value, including GST, of every unit short-shipped against the PO |
| **Copy note to buyer** | Invoices → Compare | Writes a ready-to-send mail: what was supplied, what was short, and any price, MRP or GST differences |
| **Back up / Restore** | Sheet & Mapping → Pro tools | Saves your SKU mappings, inventory list, history, desk and look to one file and restores it on any device. The Google Sheet key is never included |
| **Daily handover** | Sheet & Mapping → Pro tools, or Ctrl+K | Copies today's POs, quantity, value and stage as a WhatsApp-ready summary |
| **Keyboard shortcuts** | Press **?** | **V** copy vendor name, **P** copy PO number, **C** Convert, **D** Dispatch Desk, **I** Invoices, **H** History, **M** Master Sheet, **R** Record Book, **G** Mapping, **S** looks, **Ctrl+K** command palette |

---

## Quick start

1. Open the live tool.
2. Drop a PO PDF on the upload box. The buyer is detected automatically.
3. Check the status line (items read, quantity and value match).
4. Copy the SKU / Qty / Price rows into EasyEcom.
5. Copy the Master Sheet row into column A of your Master Dispatch Tracker.

---

## Purplle ASN filler

Purplle requires an **ASN (Advance Shipping Notice)** for every PO before an appointment can be booked. This feature fills the portal's Excel for you.

### Steps

1. On the Purplle Vendor Portal, open **PO → select the PO → Get ASN**. An Excel file named `SKU_Data.xlsx` downloads.
2. In this tool, switch to the **🟣 Purplle** tab and find **📤 Purplle ASN filler**.
3. Click **Import SKU_Data Excel**. You can import several files, one per PO.
4. *(Optional, recommended)* Click **📦 Import Inventory CSV** and choose your EasyEcom inventory report (columns `name`, `mrp`, `sku`). It is remembered in your browser and used to check SKU codes.
5. Review the table:
   - **Supplier Material Code** is filled from your EAN → SKU mapping. You can edit it.
   - **QTY SHIPPED** defaults to the full pending quantity, or to blank if you pick that in the Default qty box. Change it per row.
   - **MRP SHIPPED** is copied from the PO MRP (the portal requires them to match).
   - Enter **Invoice No** and **Ship date** if you have them.
6. Click **⬇️ Download filled ASN Excel** (or **📤 Share**).
7. On the portal, go to **ASN → Add New → Upload Excel**, choose the file and click **Upload**, then **Save**.

### Invoice import (new)

After importing the SKU_Data Excel, click **🧾 Import Invoice PDF** and choose the Purplle tax invoice (the EasyEcom `BOINV…` PDF). The tool matches it to the ASN file by **PO number**, in either order.

**Filled from the invoice**

- Invoice No and Ship date (the invoice date)
- Qty shipped for each EAN
- Supplier Material Code, from the invoice SKU

**Checked against the PO**

- Seller GSTIN against the vendor GSTIN on the portal
- Purplle GSTIN against the PO
- Invoice date against the PO date and the 30-day limit
- Every invoice line exists on the PO
- Invoice quantity against the PO pending quantity
- MRP, rate (net price) and HSN against the PO
- The invoice's own arithmetic: qty × MRP, qty × rate, GST amounts and totals

PO lines that are not on the invoice (for example an out-of-stock item you short-ship) are kept in the ASN with **QTY SHIPPED = 0** by default, so the short shipment is recorded. Use the **Short-shipped lines** selector to choose *Remove from file* instead. Use **⬇ Invoice PDF (portal name)** to download the invoice with a clean file name for the portal's **Upload** tab, or **📤 Share ASN + invoice** to send both files together.

### Invoices page (new)

The **Invoices** page in the sidebar has three clear options: **Compare PO vs Invoice**, **Fill Purplle ASN** (opens the ASN filler) and **Check a punched PO**. Results animate in, and the compare report has a **⬇ Invoice PDF (portal name)** button.

### PO vs Invoice (all buyers)

Open **PO vs Invoice**, select the PO PDF and its invoice PDF together (any order, several pairs are fine). It works for Purplle, FirstCry, Reliance and Tata 1MG, and the PO does not need to be punched first. Pairs are matched by PO number. The older **Invoice check** box below it checks an invoice against a PO you already punched.

The report shows a verdict, quantity / lines / taxable / value tiles, only the items that need attention, and a line-by-line table. The same view applies to the older box: drop the tax invoice PDF and the tool compares it with the punched PO. The report shows a verdict, quantity / lines / taxable / value tiles, only the items that need attention, and a line-by-line table (PO qty, invoice qty, rate, MRP, GST and a result chip per SKU). Checks that passed are collapsed. If the inventory report is loaded, each SKU is also checked for existence, MRP and stock.

### What is filled and what is left alone

| Column | Behaviour |
|---|---|
| SUPPLIER MATERIAL CODE | Filled from the SKU mapping or inventory |
| QTY SHIPPED \* | Filled, as a whole number |
| MRP SHIPPED \* | Copied exactly from the PO MRP |
| INVOICE NO / SHIP DATE | Filled only if you enter them |
| Everything else | Untouched, including the header rows, Purplle GSTIN and your Vendor GSTIN |

The tool edits Purplle's **own file**, so fonts, header colours, column widths and filters are identical to what the portal gave you.

### Checks before download

- Quantity cannot exceed the PO pending quantity.
- Quantity must be a whole number.
- Supplier Material Code cannot be blank.
- Warning if the code is missing from your inventory, or the inventory MRP differs from the PO MRP.
- Warning when a PO is close to, or past, its **30-day expiry**.
- Short-shipped rows (blank or 0 quantity) are kept with qty 0 by default, or removed if you choose *Remove from file*.

### File name

Downloads are named like this:

```
TucoKids_Purplle_ASN_PO4200054051_INV-1234_2026-10-12.xlsx
```

The invoice part is added only when you enter an invoice number.

### If the portal rejects the file

| Message | Fix |
|---|---|
| MRP Shipped must equal PO MRP | Don't change the MRP. If the printed MRP is different, ask Purplle sourcing to correct the PO. |
| Shipped Qty more than PO quantity | Lower the quantity. |
| Vendor GSTIN missing | Ask Purplle onboarding to update your GSTIN on the portal. |
| PO expired | POs older than 30 days cannot get an ASN. Ask Purplle for a fresh PO. |

For portal or login help, contact the Purplle sourcing team at sourcingteam@purplle.com.

---

## Bulk ASN and appointments (Purplle)

For many Purplle POs at once. Open **🟣 Purplle** and use **Bulk ASN + Appointment** under the single ASN filler (the single-PO flow is unchanged and shares the same files).

1. On the Purplle portal, download **Get ASN** (`SKU_Data.xlsx`) for each PO.
2. Drop **everything at once**: all SKU_Data Excel files, all tax invoice PDFs and, optionally, the Purplle PO PDFs. Files are sorted automatically and matched by PO number.
3. Read the **checklist**. Each PO shows **READY**, **REVIEW** or **FIX**, with units shipped vs pending, the invoice and a ✓ / ⚠ / ✕ count. Open a PO to see every item: quantity above pending, MRP / rate / HSN differences, GSTIN, invoice dates, invoice arithmetic, short-shipped lines and PO expiry.
4. Add the **appointment date** (and boxes) per PO, or set one date and slot for all POs.
5. Click **⬇ Download ASN files (ZIP)** or **⬇ ASN + invoices (ZIP)**. Only ticked POs that are not in the FIX state are included.

**One Excel for all POs (new)**

If you dropped a multi-PO `SKU_Data` sheet, **⬇ ALL POs in ONE Excel** gives you that same sheet with every PO filled (qty shipped, MRP shipped, supplier code, invoice no and ship date from each PO's own invoice). **📤 Share ALL-in-one** sends it through the share menu. Only POs that are ticked and not in the FIX state are included. **⬇ Single ASN per PO (ZIP)** is still there when you want to upload one PO at a time, and the ZIP also contains the all-in-one file.

**What the ZIP contains**

| File | Content |
|---|---|
| `TucoKids_Purplle_ASN_ALL_<n>POs_<date>.xlsx` | The original sheet with every PO filled, one file for all POs |
| `TucoKids_Purplle_ASN_PO…xlsx` | One filled portal Excel per PO, ready for **ASN → Add New → Upload Excel** |
| `TucoKids_Purplle_Invoice_…pdf` | The invoice for each PO, with a clean file name (only in the ASN + invoices ZIP) |
| `Checklist.csv` | One line per PO: status, units, invoice value and every note |
| `Appointments.csv` | PO, invoice, units, value, boxes, date and slot for booking |

**Appointment checks:** the date cannot be in the past or before the invoice date, cannot be after the PO's 30-day expiry, and gets a warning on Sundays. Purplle accepts deliveries from 9:00 AM to 3:30 PM and only with a confirmed appointment, so book each slot after its ASN is uploaded.

**Out of stock for all POs (new):** in the **🚫 Out of stock (all POs)** box type an item name (every word must match, for example `lip tint cherry`) or an EAN, then click **Mark OOS in all POs**. That item gets qty 0 on every PO and every other line ships as per its invoice. Several items can be separated by commas. The list is remembered in your browser and applies to files you load later. Remove an item with ✕.

**Shipping qty accuracy (new):**

- If the PO lists the same EAN on several rows, the invoice quantity is split across those rows in order, capped at each row's pending qty. It is no longer repeated on every row.
- EANs are matched as digits only, so spaces or `.0` do not break the match.
- PO numbers printed with a trailing `_` or `-` on the invoice are cleaned before matching.
- If the main invoice reader misses a line, a backup reader looks for it and marks it ⚠ to confirm. An EAN on the invoice that still cannot be read is shown in red.
- Red check if the invoice's own total qty differs from the lines read.
- Check that the ASN shipping qty equals the invoice qty (minus any out-of-stock units).

**Files with many POs:** a SKU_Data Excel that contains several POs is split automatically, so every PO becomes its own ASN with only its own lines. Each invoice is matched to its PO and the quantities come from the invoice.

**When something is red:** open the PO's checklist row. **Edit by hand** shows every line with errors or warnings and lets you change *Qty to ship* and *Supplier code*; **Edit every line** opens the full list. **Cap qty at pending** and **Set error lines to 0 (skip)** fix the common cases in one click. A red item that is only about the invoice (for example a GSTIN or arithmetic difference you have checked) can be **included anyway** by ticking the PO's box. Red line errors must be edited first, because the portal would reject them. **⬇ ASN** on a row downloads just that PO.

**Missing pieces are called out:** an invoice with no SKU_Data file, and a SKU_Data file with no invoice, are listed above the table. **📋 Copy checklist** and **📅 Copy appointment list** paste straight into Excel or WhatsApp.

---

## All features

- PDF reading for multiple buyers, with auto-detection
- SKU mapping (buyer code to your SKU), remembered after the first time
- GST-aware pricing so the EasyEcom total matches the PO value
- One-row Master Dispatch Tracker output with exact zone and warehouse names
- Purplle batch mode: many POs, punched one at a time
- **Purplle ASN filler** (see above)
- **Bulk ASN + appointments for many Purplle POs**, including **one Excel for all POs** and an **out-of-stock list** (see above)
- **FirstCry rate fix** per FCID (see above)
- Searchable, hideable history with one-click copy of master rows
- Daily Record Book with summary and CSV / Excel export
- Optional: send rows straight to a Google Sheet through Apps Script

---

## Privacy

- Everything runs in your browser. PO files, inventory files and ASN files are **not uploaded anywhere**.
- History, mappings, the inventory list and settings are stored only in your own browser.
- The optional Google Sheet URL and key are stored only in your browser, never in this repository.

---

## Tips

- If a Purplle EAN is not recognised, add it once under **Sheet & Mapping**. It is then remembered for every future PO and ASN.
- Keep your inventory CSV up to date. Re-import it whenever you add new SKUs.
- Create the ASN soon after the PO arrives. Appointments can only be booked once an ASN exists, and POs expire after 30 days.
- Always check the extracted values against the PDF, because buyers sometimes change their PO layout.

---

## Built with

Plain HTML, CSS and JavaScript, plus [pdf.js](https://mozilla.github.io/pdf.js/), [SheetJS](https://sheetjs.com/) and [ExcelJS](https://github.com/exceljs/exceljs). Hosted free on GitHub Pages.

## Updating the tool

1. Open the repository on GitHub.
2. Click **Add file → Upload files** and drop the new `index.html` (and `README.md`).
3. Click **Commit changes**. The live link updates in a minute or two.
