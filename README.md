<div align="center">

# 📦 TUCO PO Punch Converter Pro

**Buyer PO in → EasyEcom rows, tracker row and Purplle ASN out. In seconds.**

Runs fully in your browser. Nothing to install. Nothing uploaded.

[![Open the tool](https://img.shields.io/badge/▶_Open_the_tool-6B3FD0?style=for-the-badge)](https://vishnumohanesv-wq.github.io/po-auto-punch/)
![Buyers](https://img.shields.io/badge/Buyers-5-8F7CFF?style=flat-square)
![Formats](https://img.shields.io/badge/PO_formats-PDF_·_Excel_·_ZIP-43E0FF?style=flat-square)
![Looks](https://img.shields.io/badge/Looks-42-FF7AB8?style=flat-square)
![Privacy](https://img.shields.io/badge/Data-stays_in_your_browser-2FAA5F?style=flat-square)

**Live link (click the box on GitHub to copy):**

```
https://vishnumohanesv-wq.github.io/tuco-po-punch/
```

</div>

---

## 🧭 Jump to

[⚡ 60-second start](#-60-second-start) · [🛍 Buyers](#-buyers-and-what-you-can-drop) · [🟣 Purplle Excel](#-purplle-po-from-excel-new) · [🧾 Tax check](#-tax-check-per-line-new) · [📤 Purplle ASN](#-purplle-asn-filler) · [🆚 PO vs Invoice](#-po-vs-invoice) · [⌨ Shortcuts](#-keyboard-shortcuts) · [🎨 Looks](#-42-looks) · [🔒 Privacy](#-privacy) · [🔄 Update](#-update-the-tool) · [📣 Share](#-share-it)

---

## ⚡ 60-second start

| Step | Do this | You get |
|:---:|---|---|
| **1** | Open the tool | |
| **2** | Drop the **PO PDF, PO Excel or portal ZIP** on the upload box | Buyer is detected automatically |
| **3** | Read the green / amber status line | Quantity, value and SKU-match checks |
| **4** | Click **Copy** on the rows | `SKU · Qty · Price` ready for EasyEcom |
| **5** | Copy the **Master Sheet row** | One line for your Master Dispatch Tracker |

> 💡 Every card in the reference panel (PO number, vendor, dates, GSTIN, address) is **click-to-copy**. Click it and paste.

---

## 🛍 Buyers and what you can drop

| Buyer | PDF | Excel | ZIP | EasyEcom rows | Tracker row | ASN |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Purplle** | ✅ | ✅ **new** | – | ✅ batch mode | ✅ | ✅ |
| **FirstCry** | ✅ | – | – | ✅ | ✅ | – |
| **Health & Glow** | ✅ | ✅ | ✅ | ✅ | ✅ | – |
| **Reliance Retail** | ✅ | – | – | ✅ | ✅ | – |
| **Tata 1MG** | ✅ | – | – | ✅ | ✅ | – |

Drop several files at once. Each PO becomes its own chip, so you can switch between them.

---

## 🟣 Purplle PO from Excel (new)

Purplle sends the PO email with a PDF **or** with `EXECL_ATTACHED.XLS`. Both now work the same way.

**What to do**

1. Download `EXECL_ATTACHED.XLS` from the PO email.
2. Drop it on the upload box (or into the Bulk ASN or ASN filler boxes).
3. Done. The PO appears in **Purplle POs**, the **Dispatch Desk** and the **Convert** page.

> ℹ️ The `.XLS` Purplle sends is really tab-separated text with padding. The tool reads that, and real `.xls` / `.xlsx`, correctly.

**What it reads from the sheet**

| Sheet column | Used for |
|---|---|
| PO Document Number | PO number (several POs in one sheet are split) |
| EAN Number | SKU mapping (the `000008906…'` format is cleaned to 13 digits) |
| Qty | Quantity |
| Price | Ex-GST rate, converted to the GST-inclusive EasyEcom price |
| MRP | MRP |
| PO Date / Expiry Date | Validity warning (30-day PO life) |
| Plant / Address / Storage location / Purchasing group | Reference card |

### 🧮 How GST is worked out

The Purplle Excel has **no GST column**, so the tool works it out line by line:

| Rule | Result |
|---|---|
| Price × 1.18 is a whole or half rupee | **18%** |
| Only another rate gives a whole or half rupee | That rate (for example **5%**) |
| EAN is on the known list | The known rate |
| Anything unclear | 18% |

Known 5% lines: `8906191252261` and `8908022401404`.

Any line **not at 18%** is listed after upload. Compare it with the CGST / SGST columns on the Purplle portal. **The portal always wins.**

To save your own rates, run this once in the browser console on the tool page:

```js
localStorage.setItem('po_pur_gst', JSON.stringify({ "EAN_HERE": 5 }))
```

### ✅ PO Value check

Type the **PO Value from the email** in the box under the status line.

| Result | Meaning |
|---|---|
| ✔ Matches exactly | Sheet taxable value equals the email |
| ✔ Matches within rounding | Difference is ₹1 or less |
| ⚠ Differs by ₹X | Check quantities and prices before punching |

---

## 🧾 Tax check per line (new)

After a Purplle Excel upload, the Convert page shows a result panel where **every number is one click to copy**.

| Do this | You get |
|---|---|
| Click any box or table cell | That value copied (PO number, price, qty, SKU, taxable…) |
| **Copy all rows** | `SKU ⇥ Qty ⇥ Price` for every line |
| **Copy SKUs / Qty / Prices** | One column, one value per line, for pasting a column at a time |
| **Shift + click** a row | That row copied |
| **⬇ EasyEcom CSV** | `Sku, Quantity, Price` file |

The table shows the tax per line:

| EAN | Qty | EasyEcom price (incl. GST) | GST | Taxable | CGST | SGST | Line total |
|---|---:|---:|:---:|---:|---:|---:|---:|
| 8906191250212 | 3 | 210.00 | 18% | 533.90 | 48.05 | 48.05 | 630.00 |
| 8906191252261 | 11 | **220.50** | **5%** | 2,310.00 | 57.75 | 57.75 | 2,425.50 |
| … | | | | | | | |

Compare it with the portal's **List of PO** screen. Taxable, CGST and SGST should match to the paisa.

> ⚠️ EasyEcom takes the tax rate from each SKU's own setting. A SKU that is 5% on the PO must also be **5% in EasyEcom**.

---

## 📤 Purplle ASN filler

Purplle needs an **ASN** for every PO before an appointment can be booked. This fills the portal's Excel for you.

### Steps

1. Purplle portal → **PO → select the PO → Get ASN**. `SKU_Data.xlsx` downloads.
2. In the tool: **Invoices → Fill Purplle ASN** → **Import SKU_Data Excel** (several files are fine).
3. *(Recommended)* **Import Inventory CSV** from EasyEcom (columns `name`, `mrp`, `sku`).
4. **Import Invoice PDF** (the EasyEcom `BOINV…` tax invoice). It is matched by PO number.
5. Review the table, then **⬇ Download filled ASN Excel**.
6. Portal → **ASN → Add New → Upload Excel** → **Upload** → **Save**.

### What is filled

| Column | Behaviour |
|---|---|
| SUPPLIER MATERIAL CODE | From your SKU mapping or the invoice |
| QTY SHIPPED | From the invoice, whole numbers only |
| MRP SHIPPED | Copied exactly from the PO (the portal needs them equal) |
| INVOICE NO / SHIP DATE | From the invoice |
| Everything else | Left untouched, including fonts, filters and your GSTIN |

Short-shipped lines are kept with **qty 0** by default, or removed if you choose *Remove from file*.

### Checks before download

- Quantity not above the PO pending quantity, and a whole number
- Supplier Material Code not blank
- Seller and Purplle GSTIN, invoice date, MRP, rate and HSN against the PO
- Invoice arithmetic (qty × rate, GST, totals)
- Warning near or past the 30-day PO expiry

### If the portal rejects the file

| Message | Fix |
|---|---|
| MRP Shipped must equal PO MRP | Don't change the MRP. Ask Purplle sourcing to correct the PO. |
| Shipped Qty more than PO quantity | Lower the quantity. |
| Vendor GSTIN missing | Ask Purplle onboarding to update your GSTIN. |
| PO expired | POs older than 30 days cannot get an ASN. Ask for a fresh PO. |

Purplle sourcing: `sourcingteam@purplle.com`

---

## 🆚 PO vs Invoice

**Invoices → Compare PO vs Invoice.** Select the PO PDF and its invoice PDF together, in any order. Several pairs at once are fine. Works for Purplle, FirstCry, Reliance and Tata 1MG.

You get a verdict, tiles for quantity, lines, taxable and value, only the items that need attention, and a line-by-line table. **⬇ Report (Excel)** and **⬇ Invoice PDF (portal name)** are one click.

---

## 🧰 Everything in the sidebar

| Page | What it does |
|---|---|
| **Convert a PO** | Upload, check, copy EasyEcom rows and the tracker row |
| **Dispatch Desk** | Track each PO from punched to packed to labelled; copy packing and label messages |
| **Invoices** | PO vs Invoice, Purplle ASN filler, check a punched PO |
| **History** | Every conversion saved on this device, searchable and hideable |
| **Master Sheet** | Running log of punched lines, exportable |
| **Record Book** | Daily record of POs, units and value; CSV or Excel |
| **Sheet & Mapping** | Workspace and branding, SKU mappings, Google Sheet link, backup and restore |
| **Help & Guide** | Step-by-step help, welcome tour and a sample PO |

---

## ⌨ Keyboard shortcuts

Off while you type in a box. Press **`?`** in the tool for this list.

| Key | Action | Key | Action |
|:---:|---|:---:|---|
| `C` | Convert a PO | `M` | Master Sheet |
| `D` | Dispatch Desk | `R` | Record Book |
| `I` | Invoices | `G` | Sheet & Mapping |
| `H` | History | `V` | Copy vendor name |
| `S` | Choose a look | `P` | Copy PO number |
| `Ctrl` + `K` | Command palette | `?` | Shortcut list |

> 💡 **EasyEcom tip:** press `V` for the vendor name (Wholesale Customers search) and `P` for the PO number (Add Bulk Orders → Reference Number).

---

## 🎨 42 looks

Press **`S`** (or click **Style**). Use the arrow keys, `1`–`9` and `0`, or **Surprise me**. Your pick is saved in your browser.

Every look has its own layout, fonts and motion, and all of them run the same tool, so conversion and checks are never affected. On phones every look falls back to the bottom navigation bar.

<details>
<summary><b>See all 42 looks</b></summary>

**Dark:** Pro · Aurora · Neon · Ember · Ocean · Sunset · Amber CRT · Forest · Royal · Midnight · Dock · Rail · Split · Zen · Blueprint · Noir & Gold · Studio IDE · Highway · Graphite Lime · Emerald Night · Plum · Steel & Amber

**Light:** Material · Ink · Sakura · Mint · Indigo · Glacier · Console · Flip · Bento · Brutal · Clay · Editorial · Swiss Poster · Kraft Warehouse · Candy Pop · Retro 95 · Receipt · Ledger · Porcelain Navy · Lavender Mist

</details>

<details>
<summary><b>Add your own look</b></summary>

Each look is a block of colour variables in the `<style id="skins">` sections of `index.html`. Copy one block, rename `data-skin="..."`, change the colours, then add an entry to the `LOOKS` list in the first `<script>`.

</details>

---

## 🏷 Make it yours (other companies)

Under **Sheet & Mapping → Workspace** set your company name, signature, zones and warehouses. The tool, the messages it writes and the tracker row then use your names.

---

## 🔒 Privacy

- Everything runs **in your browser**. PO, invoice, inventory and ASN files are **never uploaded**.
- History, mappings, inventory and settings stay in your own browser only.
- The optional Google Sheet link and key are stored only in your browser, never in this repository.
- **Back up** under *Sheet & Mapping → Pro tools* before clearing your browser or changing computers.

---

## 💡 Tips

- A Purplle EAN not recognised? Add it once under **Sheet & Mapping**. It is remembered for every future PO and ASN.
- Keep your inventory CSV current. Re-import it when you add SKUs.
- Make the ASN soon after the PO arrives. Appointments need an ASN, and POs expire in **30 days**.
- Buyers change PO layouts now and then. Always glance at the extracted values against the document.

---

## 🔄 Update the tool

1. Open the repository on GitHub.
2. **Add file → Upload files**, drop the new `index.html` (and `README.md`).
3. **Commit changes**. The live link updates in a minute or two.
4. Everyone using it: refresh the page (`Ctrl` + `F5`).

---

## 📣 Share it

Copy and paste this into WhatsApp, Slack or LinkedIn:

```
📦 TUCO PO Punch Converter Pro
Drop a buyer PO (PDF, Excel or ZIP) and get EasyEcom rows, tracker row and Purplle ASN in seconds.
Purplle · FirstCry · Reliance · Tata 1MG · Health & Glow
Free, runs in your browser, nothing uploaded.
👉 https://vishnumohanesv-wq.github.io/tuco-po-punch/
```

---

## 🛠 Built with

Plain HTML, CSS and JavaScript, plus [pdf.js](https://mozilla.github.io/pdf.js/), [SheetJS](https://sheetjs.com/), [ExcelJS](https://github.com/exceljs/exceljs) and [JSZip](https://stuk.github.io/jszip/). Hosted free on GitHub Pages.

<div align="center">

Made for fast, error-free PO punching at **Tuco Kids**.

</div>
