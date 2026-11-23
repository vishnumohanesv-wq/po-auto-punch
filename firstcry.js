import { toPaise } from "./money.js";
/** The exact line pattern of PO Punch Pro extractFirstcryItems() (legacy/src). A parity test guards drift. */
export const FIRSTCRY_LINE = /\b(\d{1,3})\s+(\d{8})\s+(.+?)\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+\.\d{2})(?=\s+(?:\d{1,3}\s+\d{8}\s|Sub Total|Sr No))/g;
const SUBTOTAL = /Sub Total\s+(\d+)\s+(\d+)\s+(\d+)\s+([\d,]+\.\d{2})/;
/**
 * Parse FirstCry vendor-PO text. Money in paise. Lines that look like item rows but do not parse are reported, never dropped.
 * @returns {{items:Array, totals:{qty:number, amountPaise:number}|null, reconciles:boolean|null, unparsed:string[]}}
 */
export function parseFirstcry(text) {
  const n = String(text).replace(/\s+/g, " "), items = [], re = new RegExp(FIRSTCRY_LINE.source, "g"); let m;
  while ((m = re.exec(n))) {
    const tok = m[3].split(" "); let i = 0, D = "";
    while (i < tok.length && /^\d+$/.test(tok[i])) D += tok[i++];
    items.push({ sr: Number(m[1]), fcid: m[2], ean: D.length >= 21 ? D.slice(8, 21) : "", style: D.length > 21 ? D.slice(21) : "",
      name: tok.slice(i).join(" ").slice(0, 70), mrpPaise: toPaise(m[4]), basePaise: toPaise(m[5]), gstPct: Number(m[6]),
      ratePaise: toPaise(m[7]), qty: Number(m[10]), amountPaise: toPaise(m[11]) });
  }
  const st = n.match(SUBTOTAL), totals = st ? { qty: Number(st[3]), amountPaise: toPaise(st[4]) } : null;
  const got = new Set(items.map(x => x.sr)), unparsed = [];
  for (const mm of n.matchAll(/\b(\d{1,3})\s+(\d{8})\s/g)) if (!got.has(Number(mm[1])) && !unparsed.includes(mm[2])) unparsed.push(mm[2]);
  const reconciles = totals ? totals.qty === items.reduce((s, x) => s + x.qty, 0) && totals.amountPaise === items.reduce((s, x) => s + x.amountPaise, 0) : null;
  return { items, totals, reconciles, unparsed };
}
