# PO Punch Pro

Browser tool for supply-chain teams. Drop a buyer's **PO PDF** and get clean rows for EasyEcom and your master tracker, an invoice-vs-PO check, and (for Reliance) a ready packing list.

Buyers: Purplle, FirstCry, FirstClub, Reliance Retail, Tata 1MG, Health & Glow, DMart.

**Live:** https://vishnumohanesv-wq.github.io/po-auto-punch/

## What it does
- PO PDF (or Purplle Excel) to EasyEcom rows and Master Dispatch Tracker rows
- Invoice vs PO check for every buyer: quantity, price, MRP, GST and HSN differences
- Purplle ASN filler
- **Reliance packing list** (details below)
- FirstCry GRN to Master Tracker sync through a Google Apps Script (optional)

Everything runs in your browser. Nothing is uploaded to a server. History and code mappings are kept in your browser's local storage only.

## Reliance packing list
1. Open the **Packing list** tab.
2. Drop the Reliance **tax invoice PDF** and its **PO PDF**. Quantities, batches, expiry, MRP, SAP codes, PO line numbers and the PO delivery date come from these two files.
3. Drop the **packer's list** for the box numbers (NAME, EAN, QTY, BOX). Excel, CSV or pasted text is read exactly, including merged box cells.
4. Download or share the Excel.

Rules the tool follows:
- One row per invoice batch. If the packer gives no batch or mfg date, packed quantities are shared out so every invoice batch is filled by whole boxes.
- Mfg date is the expiry minus 24 months (36 if that would fall after the invoice date). Edit a date and the tool remembers that shelf life for the SKU.
- Delivery date is the invoice appointment date, else the PO delivery date.
- A photo or screenshot of the packer list is read with OCR and is **not reliable** on tilted phone photos. If the photo total does not match the invoice, the invoice quantity is kept, Box Details is left empty and a warning is shown. Ask the packer for Excel or pasted text.

## FirstCry GRN sync (optional)
The Apps Script is included in the tool. Before you deploy it, edit the first line of its config:

```js
const TW_ID = 'PASTE-YOUR-SHEET-ID-HERE', TW_GID = 559272851, TW_KEY = 'PASTE-YOUR-KEY-HERE';
```

Use your own Google Sheet ID and a long random key. **Never commit the real values to a public repo.** Gmail label for the FirstCry GRN mails is set in `FC_CFG.LABEL` (nested labels are written `Parent/Child`).

## Run it
No build step. Open `index.html` in a browser, or host the folder on GitHub Pages (Settings > Pages > Deploy from branch > `main` / root). Libraries (pdf.js, SheetJS, ExcelJS, Tesseract.js) load from public CDNs.

The share image `og-image.png` is expected next to `index.html` for link previews.

## Privacy
No Google Sheet ID, access key, email address or phone number is stored in this repo. The sample PO and company GSTINs inside the tool are business registration numbers used for the GSTIN checks; replace them with your own if you fork it.

## Licence
MIT. See `LICENSE`.
