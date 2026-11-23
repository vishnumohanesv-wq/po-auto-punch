import { toPaise, addGst } from "./money.js";
import { parseBusinessDate } from "./dates.js";
const U = s => String(s ?? "").trim().toUpperCase();
const NEED = ["PURCHASING DOCUMENT", "EAN CODE", "ORDER QUANTITY", "NET PRICE", "MRP"];
function table(aoa, need) { for (let i = 0; i < Math.min(aoa.length, 40); i++) { const h = (aoa[i] || []).map(U); if (need.every(n => h.includes(n))) return { hi: i, h }; } return null; }
const num = v => { const s = String(v ?? "").replace(/,/g, "").trim(); return s === "" ? 0 : Number(s); };
/**
 * Purplle portal "open PO master" export (sheets SKU + PO as arrays of rows). Money in paise.
 * Price for EasyEcom = net price incl. GST, rounded to the paisa (same as the PO PDF reader).
 */
export function parseOpenPoMaster(skuAoa, poAoa = null) {
  const t = table(skuAoa, NEED); if (!t) throw new Error("not a Purplle open PO master (SKU sheet header not found)");
  const c = n => t.h.indexOf(n), by = new Map();
  for (const r of skuAoa.slice(t.hi + 1)) { const po = String(r[c("PURCHASING DOCUMENT")] ?? "").trim(); if (!/^\d{6,}$/.test(po)) continue; if (!by.has(po)) by.set(po, []); by.get(po).push(r); }
  const sums = new Map(); const pt = poAoa && table(poAoa, ["PURCHASING DOCUMENT", "LINE ITEMS", "SUM OF QUANTITY"]);
  if (pt) for (const r of poAoa.slice(pt.hi + 1)) { const p = String(r[pt.h.indexOf("PURCHASING DOCUMENT")] ?? "").trim(); if (p) sums.set(p, { lines: num(r[pt.h.indexOf("LINE ITEMS")]), qty: num(r[pt.h.indexOf("SUM OF QUANTITY")]) }); }
  return [...by.entries()].map(([po, rows]) => {
    const warn = [];
    const items = rows.map(r => {
      const ean = String(r[c("EAN CODE")] ?? "").replace(/\D/g, ""), qty = num(r[c("ORDER QUANTITY")]);
      if (!Number.isInteger(qty)) warn.push(`${ean}: fractional quantity ${qty}`);
      const net = toPaise(String(r[c("NET PRICE")] || "0")), gst = ["CGST RATE", "SGST RATE", "IGST RATE"].reduce((s, k) => s + (c(k) >= 0 ? num(r[c(k)]) : 0), 0);
      const base = c("NET ORDER VALUE") >= 0 && r[c("NET ORDER VALUE")] !== "" ? toPaise(String(r[c("NET ORDER VALUE")])) : net * qty;
      const tax = ["CGST AMOUNT", "SGST AMOUNT", "IGST AMOUNT"].reduce((s, k) => s + (c(k) >= 0 && r[c(k)] !== "" ? toPaise(String(r[c(k)])) : 0), 0);
      if (c("FOC IND") >= 0 && U(r[c("FOC IND")]) && U(r[c("FOC IND")]) !== "NONFOC") warn.push(`${ean} is a free (FOC) line`);
      if (!net) warn.push(`${ean} has no price`);
      if (c("STILL TO BE DELIVERED QTY") >= 0 && r[c("STILL TO BE DELIVERED QTY")] !== "" && num(r[c("STILL TO BE DELIVERED QTY")]) < qty) warn.push(`${ean}: only ${num(r[c("STILL TO BE DELIVERED QTY")])} of ${qty} still to deliver`);
      return { ean, qty: Math.round(qty), mrpPaise: toPaise(String(r[c("MRP")] || "0")), netPaise: net, gstPct: gst, priceInclGstPaise: addGst(net, gst), lineTotalPaise: base + tax };
    });
    const S = sums.get(po), qty = items.reduce((s, i) => s + i.qty, 0);
    return { po, date: parseBusinessDate(rows[0][c("DOCUMENT DATE")]), items, qty, valuePaise: items.reduce((s, i) => s + i.lineTotalPaise, 0),
      check: S ? { ok: S.lines === items.length && S.qty === qty, lines: S.lines, qty: S.qty } : null, warnings: warn };
  });
}
