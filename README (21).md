# PO Punch Converter Pro

Turn retail buyer purchase-order PDFs into **EasyEcom rows**, a **Master Dispatch Tracker row** and a **checked invoice**, in seconds. For Purplle it also fills the **ASN Excel** for the vendor portal. It runs entirely in your browser. There is nothing to install and nothing is uploaded.

**Live tool:** https://vishnumohanesv-wq.github.io/po-auto-punch/

| Buyer | PO → EasyEcom rows | Master sheet row | PO vs Invoice check | Extras |
|---|:---:|:---:|:---:|---|
| Purplle | ✅ PDF or Excel, batch | ✅ | ✅ | ASN filler, bulk ASN + appointments, 30-day expiry warning |
| FirstCry | ✅ | ✅ | ✅ | Rate fix for a wrong MRP or rate on the PO |
| FirstClub | ✅ Bangalore and Hyderabad POs together | ✅ | ✅ | Shows FirstClub's rules, checks the PO's own arithmetic |
| Reliance Retail | ✅ | ✅ | ✅ | GST-inclusive price for EasyEcom (see below) |
| Tata 1MG | ✅ | ✅ | ✅ | |
| Health & Glow | ✅ PDF, Excel or portal ZIP | ✅ | ✅ | |
| DMart | ✅ | ✅ | ✅ | Seller GSTIN and CGST + SGST rule |

---

## What's new

**FirstClub (new buyer)**
- Pick **FirstClub** on *Convert a PO*, or drop the PDF. It is detected from "Firstclub Technology Pvt Ltd".
- Drop the **Bangalore and Hyderabad** POs together. A queue appears and each PO loads in turn, with a one-click log of all of them.
- The PO has FirstClub's own **SKU Code** and no EAN, so each code is matched to your EasyEcom SKU (add new codes once under *Sheet & Mapping*).
- Price source: **Unit Cost + GST** (matches the PO total, default), **Unit Cost ex-GST**, or **MRP**.
- Checks on the PO itself: line arithmetic (qty × unit cost + GST = line total), **amount in words against the grand total** (catches a typo on the PO), IGST against CGST + SGST for the supply, your dispatch GSTIN (29AADCU0627M1Z1), and PO expiry.
- Shows FirstClub's rules on screen: book the appointment before dispatch, send at least 70% shelf life, invoice must carry the PO number, **invoiced unit cost must not exceed the PO**, **HSN and GST must match the PO**, collect the POD.
- In *Invoices → Compare PO vs Invoice*, an invoice rate above the PO unit cost and an HSN that differs from the PO are marked as errors.
- Master row defaults: channel *FirstClub*, zone *South - KA*, WH from *Emiza BLR*.

**Reliance fix: the right price for EasyEcom**
- On a Reliance PO the **Base Cost is the price before GST**. CGST + SGST are added on top, and the PO's *Total Order Value* is basic value + tax.
- EasyEcom treats the price you type as **including GST**. Typing the Base Cost gave an EasyEcom total of the basic value, about 12% to 18% below the PO value.
- The tool now defaults to **Price incl. GST**, worked out from each PO line (line base value + CGST + SGST, divided by qty). Choose *Base Cost ex-GST* or *MRP* if you need them.
- The status line checks quantity, base value, order value including GST, and the EasyEcom total (price × qty). EasyEcom rounds each price to 2 decimals, so expect a difference of a few paise to a rupee.
- Worked example, PO 5000498942: PO Total Order Value ₹169,313.55. EasyEcom now shows base ₹148,910, tax ₹20,404 and total ₹169,313, with the same unit prices and tax rates as the PO.
- A pasted Reliance table has no GST column, so its price stays before GST. Upload the PDF for the GST-inclusive prices.

**Exact customer names for EasyEcom and the master**

The *Vendor name* chip, *Copy vendor name* and the **DELIVERY TO** column of the master row now use the exact EasyEcom customer name:

| Buyer | Name |
|---|---|
| Reliance | `Reliance Retail Limited - BPC MH Kukse Bhiwandi Vinculum_S4ZD` (built from the PO's receiving site and site code, so other sites follow the same pattern) |
| Purplle | `MANASH E-COMMERCE PRIVATE LTD ( Purplle ) - BLR` |
| DMart | `IFC- Kukse Bhiwandi Avenue E-Commerce Limited (D-Mart)` (another DC gives `IFC- <DC name> Avenue E-Commerce Limited (D-Mart)`) |

**Earlier additions**
- **Pro look** is the default, with 42 looks in total (see below).
- **Auto-send to Master** (optional, off by default) sends every punched PO to your Google Sheet.
- **Invoice check:** a GSTIN printed with fewer than 15 characters is flagged as incomplete.
- **Restore a backup** opens the backup (`.json`) picker.

---

## Quick start

1. Open the live tool.
2. Drop a PO PDF on the upload box. The buyer is detected automatically. Wrong buyer? Pick it at the top.
3. Read the status line. Quantity and value should match the PDF (a green ✔).
4. Copy the **SKU / Qty / Price** rows into EasyEcom (or download the EasyEcom CSV).
5. Copy the **Master Dispatch Tracker row** into column A of your tracker.

### Which price goes into EasyEcom

The first option of the *Price source* box is the one that matches the PO total. Use it unless you know you need another.

| Buyer | Default price | Matched to your SKU by |
|---|---|---|
| Purplle | Rate incl. GST | EAN |
| FirstCry | Landing Rate (incl. tax) | FirstCry code or EAN |
| FirstClub | Unit Cost + GST | FirstClub SKU Code |
| Reliance Retail | **Price incl. GST** (Base Cost × (1 + GST)) | EAN / barcode |
| Tata 1MG | Cost Per Unit (with GST) | Supplier Item Code |
| Health & Glow | Purchase Cost (incl. GST) | EAN |
| DMart | Landed Price (incl. GST) | EAN |

A code that is not in your mapping shows as *unmapped*. Add it once under **Sheet & Mapping** and it is remembered.

---

## Quick copy

Find **Quick copy** inside the **Master Dispatch Tracker row** card.

| What | How |
|---|---|
| One value | Click a chip: vendor name, PO number, PO date, order date (dd-mm-yyyy), PO value, qty, channel, zone, warehouse, transporter or boxes |
| Everything | **Text lines**, **Excel row**, **WhatsApp**, **Email**, **CSV** or **JSON** |
| EasyEcom bulk order helper | **1** copy the vendor name for *Wholesale Customers → Search*, **2** copy the PO number for *Add Bulk Orders → Reference Number*, **3** copy the order date |
| History | **Vendor** and **PO** buttons on every entry |

Shortcuts: **V** copies the vendor name and **P** copies the PO number.

> EasyEcom adds an underscore to a reference number that already exists (for example `5000498942_`). If you see one, the PO is in EasyEcom twice. Cancel the older order.

---

## Invoices

Open **Invoices** in the sidebar. There are three options.

**1. Compare PO vs Invoice** (all buyers)
Select the PO PDF and its invoice PDF together, in any order. Several pairs at once are fine, and they are matched by PO number. The PO does not need to be punched first.

It checks:
- every invoice line exists on the PO
- quantity per line: excess, short or not invoiced
- rate, MRP, GST rate and tax type (IGST or CGST + SGST)
- seller and buyer GSTIN, place of supply, incomplete GSTINs
- invoice date against the PO date and expiry
- the invoice's own arithmetic and totals
- buyer rules: DMart seller GSTIN 27AADCU0627M1Z5 with CGST + SGST, and FirstClub's unit cost and HSN rules
- SKU, MRP and stock, if the inventory CSV is loaded

The report gives a verdict (*Ready to send*, *Review* or *Fix*), quantity, lines, taxable and value tiles, only the items that need attention, and a line-by-line table. A price that differs only because of the GST rate is explained instead of flagged as an error.

Buttons: **Copy report**, **Report (Excel)**, **Copy note to buyer** (a ready mail: supplied, short, price/MRP/GST differences), **Invoice PDF (portal name)**, and the **short-shipped value** including GST.

**2. Fill Purplle ASN**: opens the ASN filler (below).

**3. Check a punched PO**: drop only the invoice and the tool finds the PO you already punched by its number.

---

## Purplle ASN filler

Purplle needs an **ASN** for every PO before an appointment can be booked.

1. On the Purplle Vendor Portal open **PO → select the PO → Get ASN** and download `SKU_Data.xlsx`.
2. In the tool open the Purplle tab, then **Purplle ASN filler**, and click **Import SKU_Data Excel** (several files are fine).
3. Optional but recommended: **Import Inventory CSV** (EasyEcom inventory report with `name`, `mrp`, `sku`). It is kept in your browser and used to check SKU, MRP and stock.
4. Click **Import Invoice PDF** (the EasyEcom `BOINV…` file). It is matched to the ASN by PO number.
5. Review the table, then **Download filled ASN Excel** (or **Share ASN + invoice**).
6. On the portal: **ASN → Add New → Upload Excel**, choose the file, **Upload**, **Save**. Upload the invoice in the *Upload* tab.

**Filled from the invoice:** invoice number, ship date, quantity per EAN, supplier material code.
**Left alone:** the portal's header rows, Purplle GSTIN and your vendor GSTIN. The tool edits Purplle's own file, so formatting stays identical.

**Short shipping:** a PO line missing from the invoice (for example an out-of-stock SKU) stays in the ASN with **QTY SHIPPED = 0** by default. Use *Short-shipped lines → Remove from file* to drop it.

**Checks before download:** quantity within the PO pending quantity and a whole number, supplier code not blank, MRP shipped equals PO MRP, PO close to or past its 30-day expiry, inventory warnings.

**Bulk ASN + Appointment:** drop many SKU_Data Excel files, invoice PDFs and PO PDFs at once. They are sorted and matched by PO number. Add appointment dates and slots (09:00 to 12:00 or 12:00 to 15:30), then download everything as one Excel or a ZIP of single ASNs and invoices.

File names look like `TucoKids_Purplle_ASN_PO4200054051_INV-1234_2026-10-12.xlsx`.

| Portal message | Fix |
|---|---|
| MRP Shipped must equal PO MRP | Don't change the MRP. Ask Purplle sourcing to correct the PO. |
| Shipped Qty more than PO quantity | Lower the quantity. |
| Vendor GSTIN missing | Ask Purplle onboarding to update your GSTIN. |
| PO expired | POs older than 30 days cannot get an ASN. Ask for a fresh PO. |

Purplle sourcing: sourcingteam@purplle.com

---

## Dispatch Desk, History, Record Book

- **Dispatch Desk:** a live board of today's POs by stage: *Punched → Packing asked → Packed → Label shared → Done*. Select POs to copy the **packing message**, the **label message** and the **label-sheet rows**, or to **Update Master**.
- **History:** every conversion saved on this device. Search it, hide entries, copy master rows in one click, or click an entry to reload it.
- **Master Sheet:** a running log of all punched lines, ready to export.
- **Record Book:** a daily record of POs, units and value, with CSV and Excel export.
- **Google Sheet (optional):** under *Sheet & Mapping → Google Sheet*, save your Apps Script URL and key to send rows to your master. Tick **Auto-send to Master** to do it for every PO. It is off by default, and a PO already in the sheet is never duplicated: only its blank cells are filled.

## Pro tools

| Tool | Where | What it does |
|---|---|---|
| Back up / Restore | Sheet & Mapping → Pro tools | Saves mappings, inventory list, history, desk and look to one file. The Google Sheet key is never included. |
| Daily handover | Pro tools, or Ctrl+K | Copies today's POs, quantity, value and stage as a WhatsApp-ready summary |
| Command palette | **Ctrl+K** | Search every action |
| Keyboard shortcuts | Press **?** | **C** Convert · **D** Desk · **I** Invoices · **H** History · **M** Master Sheet · **R** Record Book · **G** Mapping · **V** vendor name · **P** PO number · **S** looks |

Shortcuts are off while you type in a box.

---

## 42 looks

Click **Style** (or press **S**). The arrow keys step through the looks, keys **1** to **9** and **0** pick the first ten, and **Surprise me** picks one at random. Your choice is saved in the browser. Each look has its own menu position, font, card and button shape, page header, entry animation, hover effect and background. Animations switch off if your device asks for reduced motion. On phones every look uses the bottom navigation bar.

| # | Look | Mode | Feel |
|---|---|---|---|
| 1 | **Pro** (default) | Dark | Midnight glass with gradient icon tiles, glowing KPI tiles, a stepper header |
| 2 | Aurora | Dark | Futuristic glass with a slow gradient glow |
| 3 | Material | Light | Google-style tonal surfaces and pill buttons |
| 4 | Neon | Dark | Cyber terminal on a glowing grid |
| 5 | Ember | Dark | Carbon dashboard with orange heat |
| 6 | Ink | Light | Black on white, print-friendly |
| 7 | Sakura | Light | Soft rose glass |
| 8 | Ocean | Dark | Deep teal with a slow tide of light |
| 9 | Sunset | Dark | Synthwave violet, pink and orange |
| 10 | Amber CRT | Dark | Retro monochrome terminal |
| 11 | Forest | Dark | Deep green with fresh lime |
| 12 | Royal | Dark | Navy and gold with serif headings |
| 13 | Mint | Light | Fresh, rounded and friendly |
| 14 | Indigo | Light | Clean SaaS look |
| 15 | Midnight | Dark | True black, one electric blue |
| 16 | Glacier | Light | Icy glass over a blue-cyan mesh |
| 17 | Dock | Dark | Floating bottom dock with magnifying icons |
| 18 | Console | Light | Cloud-console top bar, dense and rectangular |
| 19 | Rail | Dark | Slim icon rail, IDE-style density |
| 20 | Flip | Light | Right-hand sidebar, document-style page |
| 21 | Split | Dark | Sticky step timeline on the left |
| 22 | Bento | Light | Floating nav tile, pastel tiles |
| 23 | Brutal | Light | Thick outlines, hard shadows |
| 24 | Clay | Light | Soft 3D buttons and pillowy cards |
| 25 | Editorial | Light | Newspaper masthead, serif headlines |
| 26 | Zen | Dark | Sidebar hides until you touch the left edge |
| 27 | Blueprint | Dark | Engineering drafting sheet |
| 28 | Swiss Poster | Light | International style, one red |
| 29 | Kraft Warehouse | Light | Cardboard and shipping label |
| 30 | Candy Pop | Light | Playful, chunky, 3D buttons |
| 31 | Noir & Gold | Dark | Black and brushed gold |
| 32 | Studio IDE | Dark | Code-editor workspace |
| 33 | Highway | Dark | Road-sign logistics |
| 34 | Retro 95 | Light | 1990s desktop |
| 35 | Graphite Lime | Dark | Graphite and acid lime |
| 36 | Receipt | Light | Thermal-printer receipt |
| 37 | Ledger | Light | Accounting-ledger look |
| 38 | Porcelain Navy | Light | Porcelain page, deep navy sidebar |
| 39 | Emerald Night | Dark | Black-green with bright emerald |
| 40 | Plum | Dark | Deep plum with magenta |
| 41 | Steel & Amber | Dark | Industrial steel with an amber signal |
| 42 | Lavender Mist | Light | Soft lavender, round shapes |

Looks 27 to 36 load their own fonts from Google Fonts. Every look runs the same tool, so conversion and checks are identical.

**Add your own look:** each look is a block of colour variables in the `<style id="skins">`, `skins2`, `skins3` or `skins4` section of `index.html`. Copy a block, rename `data-skin="..."`, change the colours, then add it to the `LOOKS` list and the colour list in the first `<script>` in the head.

---

## Use it for your own company

1. On the first visit, a welcome screen asks for your company name. Choose **Try a sample PO**, **Take the 1-minute tour** or **Start using it**.
2. Under **Sheet & Mapping → Workspace** set your company name, sub-title, e-mail sign-off, and your own **zones** and **warehouses**. The name also prefixes every downloaded file.
3. Add your SKU mappings once under **Sheet & Mapping**.
4. Share the link with your team. Data is stored per browser, so use **Back up** and **Restore** to move settings to another device.

Some defaults are built for Tuco Kids / UNBOTTLE: the buyer vendor names above, the DMart and FirstClub dispatch GSTINs, and the zone and warehouse defaults. Change them in `index.html` if you use the tool for another company.

The built-in **Help & Guide** page covers all of this with a searchable FAQ, a sample PO and a printable guide.

---

## Privacy

- Everything runs in your browser. PO, invoice, inventory and ASN files are **not uploaded anywhere**.
- History, mappings, inventory and settings stay in your own browser.
- The optional Google Sheet URL and key stay in your browser and are never in this repository.

## Tips

- Always compare the status line with the PDF. Buyers sometimes change their PO layout.
- Re-import the inventory CSV when you add new SKUs.
- Create a Purplle ASN soon after the PO arrives. Appointments need an ASN, and POs expire after 30 days.
- For Reliance, type the **incl. GST** price in EasyEcom, then check that EasyEcom's *Total Invoice Amount* matches the PO's *Total Order Value*.

## Built with

Plain HTML, CSS and JavaScript, plus [pdf.js](https://mozilla.github.io/pdf.js/), [SheetJS](https://sheetjs.com/), [ExcelJS](https://github.com/exceljs/exceljs) and [JSZip](https://stuk.github.io/jszip/). Hosted free on GitHub Pages.

## Updating the tool

1. Open the repository on GitHub.
2. Click **Add file → Upload files** and drop the new `index.html` and `README.md`.
3. Click **Commit changes**. The live link updates in a minute or two.
