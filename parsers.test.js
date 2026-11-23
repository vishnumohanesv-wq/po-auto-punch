import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import * as P from "../src/index.js";
const fx = n => new URL("./fixtures/" + n, import.meta.url);

test("money: paise parsing, rounding, Indian format", () => {
  assert.equal(P.toPaise("₹1,05,962.65"), 10596265); assert.equal(P.toPaise(450), 45000); assert.equal(P.toPaise("162.5"), 16250);
  assert.throws(() => P.toPaise("1.234")); assert.throws(() => P.toPaise("abc"));
  assert.equal(P.formatINR(10596265), "₹1,05,962.65"); assert.equal(P.formatINR(47487299), "₹4,74,872.99"); assert.equal(P.formatINR(-5000), "-₹50.00");
  assert.equal(P.addGst(26695, 18), 31500);          // Purplle: 266.95 net + 18% = 315.00
  assert.equal(P.addGst(16667, 5), 17500);           // 166.67 + 5% = 175.00
  assert.equal(P.divRound(5, 2), 3); assert.equal(P.divRound(-5, 2), -3);
  assert.equal(0.1 + 0.2 === 0.3, false); assert.equal(P.toPaise("0.10") + P.toPaise("0.20"), P.toPaise("0.30"));   // why paise
});
test("dates: ISO out, ambiguous dd/mm rejected", () => {
  assert.equal(P.parseBusinessDate("2026-11-20"), "2026-11-20");
  assert.equal(P.parseBusinessDate("12-Nov-2026"), "2026-11-12");
  assert.equal(P.parseBusinessDate("20.11.2026", { format: "DMY" }), "2026-11-20");
  assert.throws(() => P.parseBusinessDate("03/04/2026"), /ambiguous/);
  assert.throws(() => P.parseBusinessDate("31.02.2026", { format: "DMY" }), /invalid/);
  assert.equal(P.displayIST("2026-11-20"), "20 Nov 2026");
});
test("gst: GSTIN checksum, intra vs inter state", () => {
  const g = "27ABCDE1234F1Z"; const ok = g + P.gstinChecksum(g);
  assert.deepEqual(P.validateGstin(ok), { ok: true, state: "27" });
  assert.equal(P.validateGstin(g + (ok[14] === "A" ? "B" : "A")).reason, "checksum");
  assert.equal(P.validateGstin("27AAAAA0000A1Z5").ok, false);            // the DMart placeholder in legacy fails the checksum (see OPEN_QUESTIONS)
  assert.equal(P.taxType("27", "27"), "CGST+SGST"); assert.equal(P.taxType("29", "27"), "IGST");
});
test("firstcry: golden PO parses, reconciles to the printed total", () => {
  const r = P.parseFirstcry(fs.readFileSync(fx("firstcry_po.synthetic.txt"), "utf8"));
  assert.equal(r.items.length, 3); assert.equal(r.reconciles, true); assert.deepEqual(r.unparsed, []);
  const s = r.items[1]; assert.deepEqual([s.fcid, s.ean, s.style, s.qty, s.ratePaise, s.mrpPaise, s.amountPaise], ["22439293", "8908022401022", "64474", 72, 16250, 25000, 1170000]);
  assert.deepEqual(r.totals, { qty: 144, amountPaise: 2230800 });
});
test("firstcry: a row that does not parse is flagged, never dropped silently", () => {
  const t = fs.readFileSync(fx("firstcry_po.synthetic.txt"), "utf8").replace("4 ", "x ").replace("Sub Total", "4 22439299 BROKEN ROW abc Sub Total");
  const r = P.parseFirstcry(t); assert.ok(r.unparsed.includes("22439299")); assert.equal(r.items.length, 3);
});
test("firstcry: parser pattern is identical to the app (parity with legacy/src)", () => {
  const dir = new URL("../../../legacy/src/", import.meta.url);
  const src = fs.existsSync(dir)                         // legacy/src is generated; fall back to the original file
    ? fs.readdirSync(dir).filter(f => f.endsWith(".js")).map(f => fs.readFileSync(new URL(f, dir), "utf8")).find(s => s.includes("function extractFirstcryItems"))
    : fs.readFileSync(new URL("../../../legacy/source/po-punch-pro-v4.0.html", import.meta.url), "utf8");
  const m = src.match(/function extractFirstcryItems\(text\)\{[\s\S]*?const re = \/(.+?)\/g;/); assert.ok(m, "legacy parser found");
  assert.equal(m[1], P.FIRSTCRY_LINE.source);
});
test("mrp: EasyEcom MRP is final, margin kept; conflicts are not corrected", () => {
  const c = P.correctMrp({ poMrpPaise: 25000, poRatePaise: 16250, qty: 72, eeMrpPaise: 45000, builtInMrpPaise: 45000 });
  assert.equal(c.action, "corrected"); assert.equal(c.ratePaise, 29250); assert.equal(c.amountPaise, 2106000); assert.equal(c.marginPct, 65);
  assert.equal(P.correctMrp({ poMrpPaise: 60000, poRatePaise: 39000, qty: 10, eeMrpPaise: 30000, builtInMrpPaise: 60000 }).action, "conflict");
  assert.equal(P.correctMrp({ poMrpPaise: 25000, poRatePaise: 16250, qty: 1, eeMrpPaise: 25000 }).action, "ok");
  assert.equal(P.correctMrp({ poMrpPaise: 25000, poRatePaise: 16250, qty: 1, eeMrpPaise: null }).action, "unknown");
});
test("hold: MOQ near/far/Purplle and freight cap", () => {
  assert.equal(P.moqFor({ channel: "Purplle" }).moqPaise, 2000000);
  assert.equal(P.moqFor({ channel: "FirstCry", locationText: "Hoskote, Bengaluru", nodeKeywords: "bengaluru|bangalore" }).moqPaise, 1500000);
  assert.equal(P.moqFor({ channel: "FirstCry", locationText: "Chennai", nodeKeywords: "bengaluru|bangalore" }).moqPaise, 2500000);
  const h = P.holdCheck({ channel: "FirstCry", locationText: "Chennai", nodeKeywords: "bengaluru", poValuePaise: 2000000, freightPaise: 250000 });
  assert.deepEqual([h.belowMoq, h.moqGapPaise, h.freightPct, h.overFreightCap], [true, 500000, 12.5, true]);
});
test("purplle open PO master: same results as the app (golden)", () => {
  const A = JSON.parse(fs.readFileSync(fx("purplle_open_po.synthetic.json"), "utf8")), E = JSON.parse(fs.readFileSync(fx("purplle_open_po.expected.json"), "utf8"));
  const r = P.parseOpenPoMaster(A.SKU, A.PO);
  assert.equal(r.length, Object.keys(E.pos).length);
  for (const po of r) { const e = E.pos[po.po]; assert.equal(po.items.length, e[0]); assert.equal(po.qty, e[1]); assert.equal(po.valuePaise, P.toPaise(e[2])); assert.equal(po.check.ok, true); assert.equal(po.date, "2026-01-02"); }
  const f = r[0].items[0]; assert.deepEqual([f.ean, f.qty, f.mrpPaise, f.netPaise, f.priceInclGstPaise], ["8908022401732", 19, 45000, 26695, 31500]);
  assert.throws(() => P.parseOpenPoMaster([["x"]]), /not a Purplle/);
});
