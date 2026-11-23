/* ===== Purplle bulk punch from the portal's "open PO master" Excel (v5.9) =====
   Sheet "SKU" (any sheet, any header row): PURCHASING DOCUMENT, DOCUMENT DATE, EAN CODE, SHORT/LONG TEXT,
   ORDER QUANTITY, MRP, NET PRICE (before GST), NET ORDER VALUE, CGST/SGST/IGST RATE + AMOUNT,
   STILL TO BE DELIVERED QTY, FOC IND. Optional sheet "PO": LINE ITEMS, SUM OF QUANTITY per PO (cross-check).
   Each PO becomes the same record the PDF reader makes, then flows through the existing Purplle batch. */
(function(){
  if (window.__ppXl) return; window.__ppXl = 1;
  var U = function(s){ return String(s == null ? '' : s).trim().toUpperCase(); };
  var N = function(v){ var x = parseFloat(String(v == null ? '' : v).replace(/[^\d.\-]/g, '')); return isNaN(x) ? 0 : x; };
  var r2 = function(v){ return Math.round(v * 100) / 100; };
  var NEED = ['PURCHASING DOCUMENT', 'EAN CODE', 'ORDER QUANTITY', 'NET PRICE', 'MRP'];

  function findTable(aoa, need){
    for (var i = 0; i < Math.min(aoa.length, 40); i++){ var h = (aoa[i] || []).map(U);
      if (need.every(function(n){ return h.indexOf(n) >= 0; })) return {hi: i, h: h}; }
    return null;
  }
  async function book(f){
    if (f.__ppBook !== undefined) return f.__ppBook;
    var out = null;
    try{
      if (!window.XLSX) throw 0;
      var wb = XLSX.read(await f.arrayBuffer(), {type: 'array', raw: false});
      var sku = null, po = null;
      wb.SheetNames.forEach(function(sn){ var a = XLSX.utils.sheet_to_json(wb.Sheets[sn], {header: 1, raw: false, defval: ''});
        if (!sku){ var t = findTable(a, NEED); if (t) sku = {aoa: a, t: t, name: sn}; }
        if (!po){ var p = findTable(a, ['PURCHASING DOCUMENT', 'LINE ITEMS', 'SUM OF QUANTITY']); if (p) po = {aoa: a, t: p}; } });
      if (sku) out = {sku: sku, po: po};
    }catch(e){ out = null; }
    f.__ppBook = out; return out;
  }
  window.ppIsOpenPo = async function(f){ return /\.xlsx?$/i.test(f.name || '') && !!(await book(f)); };

  function dmy(v){ var s = String(v || '').trim(), m;
    if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return m[3] + '.' + m[2] + '.' + m[1];
    if ((m = s.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/))) return ('0' + m[1]).slice(-2) + '.' + ('0' + m[2]).slice(-2) + '.' + (m[3].length === 2 ? '20' + m[3] : m[3]);
    return s; }

  function parse(B, fname){
    var a = B.sku.aoa, h = B.sku.t.h, ix = function(n){ return h.indexOf(n); };
    var c = {po: ix('PURCHASING DOCUMENT'), line: ix('LINE ITEM'), date: ix('DOCUMENT DATE'), ean: ix('EAN CODE'), mat: ix('MATERIAL'),
      st: ix('SHORT TEXT'), lt: ix('LONG TEXT'), q: ix('ORDER QUANTITY'), net: ix('NET PRICE'), val: ix('NET ORDER VALUE'), mrp: ix('MRP'),
      cr: ix('CGST RATE'), ca: ix('CGST AMOUNT'), sr: ix('SGST RATE'), sa: ix('SGST AMOUNT'), ir: ix('IGST RATE'), ia: ix('IGST AMOUNT'),
      still: ix('STILL TO BE DELIVERED QTY'), foc: ix('FOC IND')};
    var by = {}, order = [];
    a.slice(B.sku.t.hi + 1).forEach(function(r){ var po = String(r[c.po] == null ? '' : r[c.po]).trim(); if (!/^\d{6,}$/.test(po)) return;
      if (!by[po]){ by[po] = []; order.push(po); } by[po].push(r); });
    var poSum = {};
    if (B.po){ var ph = B.po.t.h, pi = function(n){ return ph.indexOf(n); };
      B.po.aoa.slice(B.po.t.hi + 1).forEach(function(r){ var p = String(r[pi('PURCHASING DOCUMENT')] || '').trim(); if (p) poSum[p] = {lines: N(r[pi('LINE ITEMS')]), qty: N(r[pi('SUM OF QUANTITY')])}; }); }
    return order.map(function(po){
      var rows = by[po], warn = [];
      var items = rows.map(function(r){
        var ean = String(r[c.ean] || '').replace(/\D/g, '') || String(r[c.mat] || '').replace(/^PPLB/i, '').replace(/\D/g, '');
        var qty = N(r[c.q]), net = N(r[c.net]), gst = N(c.cr >= 0 ? r[c.cr] : 0) + N(c.sr >= 0 ? r[c.sr] : 0) + N(c.ir >= 0 ? r[c.ir] : 0);
        var base = c.val >= 0 && r[c.val] !== '' ? N(r[c.val]) : r2(net * qty);
        var tax = (c.ca >= 0 || c.sa >= 0 || c.ia >= 0) ? N(r[c.ca]) + N(r[c.sa]) + N(r[c.ia]) : r2(base * gst / 100);
        var incl = r2(net * (1 + gst / 100)), amt = r2(base + tax);
        if (c.foc >= 0 && U(r[c.foc]) && U(r[c.foc]) !== 'NONFOC') warn.push(ean + ' is a free (FOC) line');
        if (!net) warn.push(ean + ' has no price');
        if (c.still >= 0 && r[c.still] !== '' && N(r[c.still]) < qty) warn.push(ean + ': only ' + N(r[c.still]) + ' of ' + qty + ' still to deliver');
        return [ean, qty, N(r[c.mrp]), net, incl, amt];
      });
      var q = items.reduce(function(s, i){ return s + i[1]; }, 0), v = r2(items.reduce(function(s, i){ return s + i[5]; }, 0));
      var S = poSum[po], ok = !S || (S.lines === items.length && S.qty === q);
      return {rec: {po: po, date: dmy(rows[0][c.date]), qty: q, val: v, items: items, src: 'excel'}, ok: ok, S: S, warn: warn, file: fname};
    });
  }

  window.ppLoad = async function(files){
    var ex = loExtra(), notes = [], fp = [], added = 0, tq = 0, tv = 0;
    ps.textContent = 'Reading ' + files.length + ' Purplle Excel file' + (files.length > 1 ? 's' : '') + '…';
    for (var k = 0; k < files.length; k++){ var f = files[k];
      try{ var B = await book(f); if (!B){ notes.push('⚠️ ' + esc(f.name) + ': not a Purplle open PO Excel'); continue; }
        var P = parse(B, f.name);
        if (!P.length){ notes.push('⚠️ ' + esc(f.name) + ': no PO rows found'); continue; }
        P.forEach(function(x){ var rec = x.rec, i = ex.findIndex(function(e){ return e.po === rec.po; });
          if (i >= 0) ex[i] = rec; else ex.push(rec); added++; fp.push(rec); tq += rec.qty; tv += rec.val;
          try{ var d = loDeleted().filter(function(p){ return p !== rec.po; }); localStorage.setItem('po_lo_deleted', JSON.stringify(d)); }catch(e){}
          notes.push((x.ok ? '✔' : '⚠') + ' ' + rec.po + ': ' + rec.items.length + ' lines · ' + rec.qty + ' pcs · ₹' + rec.val.toFixed(2)
            + (x.S ? ' vs PO sheet ' + x.S.lines + ' lines · ' + x.S.qty + ' pcs' : '') + (x.warn.length ? ' · <b>' + x.warn.map(esc).join('; ') + '</b>' : '')); });
      }catch(e){ notes.push('⚠️ ' + esc(f.name) + ': could not read'); }
    }
    try{ localStorage.setItem('po_lo_extra', JSON.stringify(ex)); }catch(e){}
    try{ var cg = loCfgGet(); fp.forEach(function(r){ dkEnsure({po: r.po, chan: cg.chan || 'Purplle', wh: canonOf(cg.wh || LO_CFG_DEF.wh, WHS), zone: canonOf(cg.zone || LO_CFG_DEF.zone, ZONES), to: cg.to || LO_CFG_DEF.to, val: r.val, qty: r.qty}); });
      if (fp.length) dkFocusSet(fp.map(function(r){ return r.po; })); }catch(e){}
    if (mode !== 'purplle') setMode('purplle'); loSel = null; renderLoBatch();
    ps.innerHTML = '📗 Purplle Excel: added/updated <b>' + added + '</b> PO(s) · ' + tq + ' pcs · ₹' + tv.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' incl GST.<br>' + notes.join('<br>');
    try{ $('loCard').scrollIntoView({behavior: 'smooth', block: 'start'}); }catch(e){}
    try{ showToast('📗 ' + added + ' Purplle PO' + (added === 1 ? '' : 's') + ' read from Excel'); }catch(e){}
  };
})();
