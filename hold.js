/** Hold / MOQ rule (legacy hdMoq + hdCfg defaults). Values in paise. */
export const HOLD_DEFAULTS = { nearPaise: 1500000, farPaise: 2500000, purpllePaise: 2000000, freightCapPct: 10, ageingAmberDays: 3, ageingRedDays: 7 };
/** @param {string} nodeKeywords e.g. "bangalore|bengaluru|hoskote" for the dispatch node */
export function moqFor({ channel = "", locationText = "", nodeKeywords = "" }, cfg = HOLD_DEFAULTS) {
  if (/purplle/i.test(channel)) return { moqPaise: cfg.purpllePaise, near: false, flat: true };
  let near = false; if (nodeKeywords) { try { near = new RegExp(`\\b(${nodeKeywords})\\b`, "i").test(locationText); } catch { near = false; } }
  return { moqPaise: near ? cfg.nearPaise : cfg.farPaise, near, flat: false };
}
export function holdCheck({ poValuePaise, freightPaise = 0, ...loc }, cfg = HOLD_DEFAULTS) {
  const m = moqFor(loc, cfg), freightPct = poValuePaise ? Math.round(freightPaise * 10000 / poValuePaise) / 100 : 0;
  return { ...m, belowMoq: poValuePaise < m.moqPaise, moqGapPaise: Math.max(0, m.moqPaise - poValuePaise), freightPct, overFreightCap: freightPct > cfg.freightCapPct };
}
