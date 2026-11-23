/** GSTIN: 15 chars = state(2) + PAN(10) + entity(1) + "Z" + checksum(1). */
const CH = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const STATES = { "06": "Haryana", "07": "Delhi", "19": "West Bengal", "24": "Gujarat", "27": "Maharashtra", "29": "Karnataka", "33": "Tamil Nadu", "36": "Telangana" };
export function gstinChecksum(first14) { let sum = 0; for (let i = 0; i < 14; i++) { const v = CH.indexOf(first14[i]) * (i % 2 ? 2 : 1); sum += Math.floor(v / 36) + (v % 36); } return CH[(36 - (sum % 36)) % 36]; }
/** @returns {{ok:boolean, reason?:string, state?:string}} */
export function validateGstin(g) {
  g = String(g || "").trim().toUpperCase();
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return { ok: false, reason: "format" };
  if (gstinChecksum(g.slice(0, 14)) !== g[14]) return { ok: false, reason: "checksum" };
  return { ok: true, state: g.slice(0, 2) };
}
/** Intra-state → CGST+SGST, inter-state → IGST (place of supply = buyer ship-to state code). */
export function taxType(supplierState, placeOfSupplyState) { if (!supplierState || !placeOfSupplyState) throw new Error("state codes required"); return supplierState === placeOfSupplyState ? "CGST+SGST" : "IGST"; }
