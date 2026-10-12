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
- Rows with a blank or 0 quantity are left out of the downloaded file.

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
