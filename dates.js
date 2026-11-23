/** Business dates are ISO "YYYY-MM-DD". Ambiguous numeric day/month input needs an explicit format. */
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function iso(y, m, d) {
  y = Number(y); m = Number(m); d = Number(d); if (y < 100) y += 2000;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) throw new Error(`invalid date ${y}-${m}-${d}`);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
/**
 * @param {string} s  "2026-11-20", "20-Nov-2026", "20.11.2026" (format "DMY"), "11/20/2026" (format "MDY")
 * @param {{format?: "DMY"|"MDY"}} [opt] required for all-numeric day/month input, otherwise it is rejected as ambiguous
 */
export function parseBusinessDate(s, opt = {}) {
  s = String(s ?? "").trim(); let m;
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/))) return iso(m[1], m[2], m[3]);
  if ((m = s.match(/^(\d{1,2})[-\s/.]([A-Za-z]{3})[A-Za-z]*[-\s/.,]+(\d{2,4})$/))) { const mo = MON[m[2].toLowerCase()]; if (!mo) throw new Error(`bad month in ${s}`); return iso(m[3], mo, m[1]); }
  if ((m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/))) {
    if (opt.format === "DMY") return iso(m[3], m[2], m[1]);
    if (opt.format === "MDY") return iso(m[3], m[1], m[2]);
    throw new Error(`ambiguous date "${s}": pass {format:"DMY"} or {format:"MDY"}`);
  }
  throw new Error(`unrecognised date "${s}"`);
}
/** Display in Asia/Kolkata, e.g. "20 Nov 2026". */
export function displayIST(isoDate) { return new Date(isoDate + "T00:00:00+05:30").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }); }
