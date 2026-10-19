# TUCO PO Punch Converter Pro

Turn retail buyer purchase-order PDFs into **punch-ready EasyEcom rows**, **Master Dispatch Tracker rows** and **Purplle ASN files** in seconds. It runs entirely in the browser, with nothing to install.

**Live tool:** https://vishnumohanesv-wq.github.io/po-auto-punch/

| Buyer | PO PDF → EasyEcom rows | Master sheet row | ASN file |
|---|:---:|:---:|:---:|
| Purplle | ✅ (batch mode) | ✅ | ✅ |
| FirstCry | ✅ | ✅ | – |
| Health & Glow | ✅ (PDF, Excel or portal ZIP) | ✅ | – |
| Reliance Retail | ✅ | ✅ | – |
| Tata 1MG | ✅ | ✅ | – |

---

## Twenty-five looks

Click **Style** in the header (or press **S**) to pick a design. Inside the picker, the arrow keys step through every design, keys **1** to **9** and **0** pick the first ten, and **Surprise me** picks one at random. Your choice is saved in your browser.

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

Looks 1 to 15 change colours and effects. Looks 16 to 25 also change the navigation position, page layout, spacing and the shape of every button, input, table and card. On phones, every look falls back to the bottom navigation bar.

All twenty-five run the same tool, so PO conversion, ASN filling and invoice checks are not affected.

### Add your own look

Each look is a block of colour variables in the `<style id="skins">`, `<style id="skins2">` or `<style id="skins3">` section of `index.html`. Copy one block, rename `data-skin="..."`, change the colours, then add an entry to the `LOOKS` list and the colour list in the first `<script>` in the head.

---

## Health & Glow (HG)

Health & Glow POs now have their own channel button next to Purplle.

**What you can drop on the upload box**

- the PO **PDF**
- the PO **Excel** (`.xlsx`, `.xls` or `.csv`)
- the **ZIP** you download from the HG portal. The tool opens it and reads every PDF and Excel inside
- several of these at once. Each PO appears as a chip under the upload box, so you can switch between them

If a PDF and an Excel for the same PO are both present, the PDF is used and the Excel is cross-checked against it (quantity and value).

**What it reads**

| From the PO | Used for |
|---|---|
| EAN | SKU mapping to your EasyEcom SKU |
| Qty | Quantity |
| Purchase Cost (incl. GST) | Default EasyEcom price, so the total equals the PO Total Value |
| Base Cost (ex-GST), MRP | Other price sources in the Price source list |
| PO No, PO Date, expiry, store, GSTIN | Reference card and the Master Dispatch Tracker row |

**Checks shown after reading**

- quantity against the PO's Total Qty
- value against the PO Total Value
- SKU count
- how many EANs matched your SKU mapping

**Master Dispatch Tracker row**

Channel is `Health & Glow`. Delivery To is the HG store name (for example `HG-DC-CHE`). Zone and WH From are filled automatically and you can edit them. **Copy all master rows** copies one line per PO when you load several.

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

## All features

- PDF reading for multiple buyers, with auto-detection
- SKU mapping (buyer code to your SKU), remembered after the first time
- GST-aware pricing so the EasyEcom total matches the PO value
- One-row Master Dispatch Tracker output with exact zone and warehouse names
- Purplle batch mode: many POs, punched one at a time
- **Purplle ASN filler** (see above)
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
