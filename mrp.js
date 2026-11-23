import { divRound } from "./money.js";
/**
 * FirstCry rule (v5.6): EasyEcom MRP is final. If the PO MRP differs, keep the PO margin:
 * rate = PO rate × EasyEcom MRP ÷ PO MRP. If the EasyEcom inventory MRP and the built-in list disagree for the FCID,
 * do not correct ("conflict", often a pack mapped to a single-unit SKU).
 * @param {{poMrpPaise:number, poRatePaise:number, qty:number, eeMrpPaise:number|null, builtInMrpPaise?:number|null}} x
 */
export function correctMrp(x) {
  const { poMrpPaise, poRatePaise, qty, eeMrpPaise, builtInMrpPaise = null } = x;
  if (eeMrpPaise == null) return { action: "unknown" };
  if (builtInMrpPaise != null && builtInMrpPaise !== eeMrpPaise && poMrpPaise !== eeMrpPaise) return { action: "conflict", eeMrpPaise, builtInMrpPaise };
  if (poMrpPaise === eeMrpPaise) return { action: "ok" };
  const ratePaise = divRound(poRatePaise * eeMrpPaise, poMrpPaise);
  return { action: "corrected", mrpPaise: eeMrpPaise, ratePaise, amountPaise: ratePaise * qty, marginPct: Math.round(poRatePaise * 10000 / poMrpPaise) / 100 };
}
