/** Money is integer paise (₹1 = 100). Never floats in storage or arithmetic. */
const RX = /^-?\d+(\.\d{1,2})?$/;
/** Parse "₹1,05,962.65", "1105.5", 450 → paise. Rejects >2 decimals and garbage (throws). @returns {number} */
export function toPaise(v) {
  if (typeof v === "number") { if (!Number.isFinite(v)) throw new Error("bad amount"); v = v.toFixed(2); }
  const s = String(v).replace(/[₹,\s]/g, "").replace(/^Rs\.?/i, "");
  if (!RX.test(s)) throw new Error(`bad amount: ${v}`);
  const neg = s.startsWith("-"), [r, d = ""] = s.replace("-", "").split(".");
  const p = Number(r) * 100 + Number((d + "00").slice(0, 2));
  if (!Number.isSafeInteger(p)) throw new Error("amount too large");
  return neg ? -p : p;
}
/** Round-half-up division for paise arithmetic. */
export function divRound(n, d) { if (d === 0) throw new Error("divide by zero"); const q = Math.floor(Math.abs(n) * 2 / Math.abs(d) + 1) >> 1; return (n < 0) !== (d < 0) ? -q : q; }
/** paise × qty (qty integer). */
export function lineTotal(pricePaise, qty) { if (!Number.isInteger(qty)) throw new Error("qty must be an integer"); return pricePaise * qty; }
/** Add GST percent (e.g. 18 or 2.5+2.5) to an amount in paise, rounded half-up to the paisa. */
export function addGst(paise, pct) { return paise + divRound(paise * Math.round(pct * 100), 10000); }
/** Indian grouping: 10596265 → "1,05,962.65". */
export function formatINR(paise, symbol = true) {
  const neg = paise < 0, a = Math.abs(paise), r = String(Math.floor(a / 100)), d = String(a % 100).padStart(2, "0");
  const head = r.length > 3 ? r.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + r.slice(-3) : r;
  return (neg ? "-" : "") + (symbol ? "₹" : "") + head + "." + d;
}
