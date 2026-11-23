/* ===== FirstCry: EasyEcom MRP is final (v5.6) =====
   UI for the auto-correct inside fcFixItem(): on/off switch, EasyEcom inventory CSV as MRP source,
   MRP check CSV for the current PO, built-in vs CSV comparison, and a "Before you punch" checklist. */
(function(){
  if (window.__fcMrp) return; window.__fcMrp = 1;
  function $(i){ return document.getElementById(i); }
  function E(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function ls(k, v){ try{ if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){ return null; } }
  function toast(m){ try{ window.showToast ? showToast(m) : alert(m); }catch(e){} }
  function rs(n){ return '₹' + (+n || 0).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
  function g(name){ try{ return eval(name); }catch(e){ return undefined; } }       // read app globals declared with let/const
  function items(){ var L = g('lastItems'), m = g('lastItemsMode'); return (L && L.length && m === 'firstcry') ? L : null; }
  function poNo(){ var H = g('lastHeader'); var f = H && H.fields ? H.fields.filter(function(x){ return /po (number|no)/i.test(x[0]); })[0] : null; return f ? String(f[1]) : ''; }
  function dl(name, rows){
    var csv = rows.map(function(r){ return r.map(function(c){ c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], {type: 'text/csv'})); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function refresh(){ try{ if (typeof g('fcFixRefresh') === 'function') g('fcFixRefresh')(); }catch(e){} paintCard(); paintChk(); }

  /* ---------- EasyEcom inventory CSV (mrp + sku columns) ---------- */
  function parseCsv(t){
    var rows = [], row = [], f = '', q = false;
    for (var i = 0; i < t.length; i++){ var c = t[i];
      if (q){ if (c === '"'){ if (t[i + 1] === '"'){ f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true; else if (c === ','){ row.push(f); f = ''; } else if (c === '\n'){ row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c; }
    if (f !== '' || row.length){ row.push(f); rows.push(row); } return rows;
  }
  window.fcEeLoad = function(inp){
    var f = inp && inp.files && inp.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function(){
      var A = parseCsv(String(r.result).replace(/^\ufeff/, '')), H = (A[0] || []).map(function(h){ return String(h).trim().toLowerCase(); });
      var iS = H.indexOf('sku'), iM = H.indexOf('mrp'), iN = H.indexOf('name');
      if (iS < 0 || iM < 0){ toast('That file has no "sku" and "mrp" columns. Use the EasyEcom inventory report.'); inp.value = ''; return; }
      var m = {}, n = {}, k = 0;
      A.slice(1).forEach(function(x){ var s = String(x[iS] || '').replace(/^[`'\s]+|\s+$/g, ''), v = parseFloat(String(x[iM] || '').replace(/[^\d.]/g, ''));
        if (s && v > 0){ m[s] = v; if (iN >= 0) n[s] = String(x[iN] || '').trim(); k++; } });
      if (!k){ toast('No SKUs with an MRP found in that file.'); inp.value = ''; return; }
      ls('po_ee_mrp', JSON.stringify({at: Date.now(), file: f.name, n: k, m: m, names: n}));
      inp.value = ''; toast('EasyEcom MRPs loaded: ' + k + ' SKUs. They now take priority over the built-in list.'); refresh();
    };
    r.readAsText(f);
  };
  window.fcEeClear = function(){ if (!confirm('Remove the loaded EasyEcom MRP list? The built-in list is used again.')) return; ls('po_ee_mrp', null); refresh(); };
  window.fcAutoToggle = function(on){ ls('po_fc_auto_mrp', on ? '1' : '0'); toast(on ? 'Auto-correct on: EasyEcom MRP is used when the PO differs' : 'Auto-correct off: PO prices are used'); refresh(); };

  /* ---------- reports ---------- */
  window.fcMrpReport = function(){
    var L = items(); if (!L){ toast('Load a FirstCry PO first'); return; }
    var out = [['PO number', 'FCID', 'EasyEcom SKU', 'Product', 'Qty', 'PO MRP', 'EasyEcom MRP', 'MRP source', 'PO rate incl GST', 'Rate used', 'PO line value', 'Value used', 'Change', 'Status']];
    var po = poNo(), t0 = 0, t1 = 0;
    L.forEach(function(i){ var o = i._o || i, e = window.eeMrpFor ? eeMrpFor(i.code) : null;
      var st = !e ? 'Not in EasyEcom list' : Math.abs(o.mrp - e.mrp) < 0.005 ? 'OK' : (e.conflict != null && !i._o) ? 'CHECK: EasyEcom CSV ' + e.mrp + ' vs built-in ' + e.conflict : i.auto ? 'Corrected to EasyEcom MRP' : i._o ? 'Manual rate fix' : 'MISMATCH (not corrected)';
      t0 += +o.amt || 0; t1 += +i.amt || 0;
      out.push([po, i.code, e ? e.sku : '', i.name, i.qty, o.mrp, e ? e.mrp : '', e ? e.src : '', o.main, i.main, o.amt, i.amt, (+(i.amt - o.amt).toFixed(2)), st]); });
    out.push(['', '', '', 'TOTAL', L.reduce(function(s, i){ return s + (+i.qty || 0); }, 0), '', '', '', '', '', t0.toFixed(2), t1.toFixed(2), (t1 - t0).toFixed(2), '']);
    dl('FirstCry_MRP_check_' + (po || 'PO').replace(/[^\w-]/g, '') + '.csv', out);
  };
  window.fcMrpCompare = function(){
    var ee = null; try{ ee = JSON.parse(ls('po_ee_mrp') || 'null'); }catch(e){}
    var db = g('FC_DB'); if (!ee || !ee.m){ toast('Load the EasyEcom inventory CSV first'); return; } if (!db){ toast('Built-in list not available'); return; }
    var out = [['FCID', 'EasyEcom SKU', 'Product', 'Built-in MRP', 'EasyEcom CSV MRP', 'Status']], diff = 0;
    db.forEach(function(r){ var v = ee.m[String(r[1])]; var s = v == null ? 'Not in EasyEcom CSV' : Math.abs(v - r[4]) < 0.005 ? 'Same' : 'Different (CSV is used)';
      if (s !== 'Same') diff++; out.push([r[0], r[1], r[2], r[4], v == null ? '' : v, s]); });
    dl('FirstCry_MRP_builtin_vs_EasyEcom.csv', out); toast(diff ? diff + ' FCIDs differ or are missing; see the file' : 'Built-in list matches your EasyEcom CSV');
  };

  /* ---------- controls inside the FirstCry rate fix card ---------- */
  function paintCard(){
    var card = $('fcFixCard'); if (!card) return;
    var box = $('fcMrpBox'); if (!box){ box = document.createElement('div'); box.id = 'fcMrpBox'; box.style.marginTop = '10px'; card.appendChild(box); }
    var ee = null; try{ ee = JSON.parse(ls('po_ee_mrp') || 'null'); }catch(e){}
    var on = ls('po_fc_auto_mrp') !== '0';
    box.innerHTML = '<div class="hint" style="margin:0 0 6px"><b>EasyEcom MRP is final.</b> When a FirstCry PO prints a different MRP, the line is corrected to the EasyEcom MRP and the rate keeps the PO margin '
      + '(rate × EasyEcom MRP ÷ PO MRP). The PO error is still shown. A saved rate fix above always wins.</div>'
      + '<div class="row" style="gap:10px;align-items:center;flex-wrap:wrap;margin:0">'
      + '<label style="display:flex;align-items:center;gap:6px"><input type="checkbox" id="fcAutoChk" ' + (on ? 'checked' : '') + ' onchange="fcAutoToggle(this.checked)"> Auto-correct with EasyEcom MRP</label>'
      + '<label class="btn-ghost btn-sm" style="cursor:pointer">Load EasyEcom inventory CSV<input type="file" accept=".csv" style="display:none" onchange="fcEeLoad(this)"></label>'
      + '<button class="btn-ghost btn-sm" onclick="fcMrpReport()">Download MRP check CSV (this PO)</button>'
      + (ee ? '<button class="btn-ghost btn-sm" onclick="fcMrpCompare()">Compare built-in list with EasyEcom CSV</button>' : '') + '</div>'
      + '<div class="hint" style="margin:6px 0 0">MRP source: ' + (ee ? '<b>EasyEcom inventory CSV</b> · ' + E(ee.n) + ' SKUs · ' + E(ee.file || '') + ' · loaded ' + E(new Date(ee.at).toLocaleString('en-IN', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}))
        + ' · <a href="#" onclick="fcEeClear();return false">remove</a>' : '<b>built-in list</b>. Load your latest EasyEcom inventory report (Inventory → Download) to use current MRPs.') + '</div>';
  }

  /* ---------- "Before you punch" checklist ---------- */
  var STEPS = ['PO number and PO date checked', 'Delivery location / FirstCry warehouse checked', 'PO expiry and delivery date noted',
               'All SKUs mapped (no unmapped rows)', 'MRP matches EasyEcom (or corrected above)', 'Qty and total match the PDF (after corrections)',
               'Rows pasted into EasyEcom and saved', 'PO added to the Master Tracker', 'Appointment requested'];
  function chkState(po){ try{ return (JSON.parse(ls('po_checklist') || '{}')[po]) || {}; }catch(e){ return {}; } }
  window.fcChk = function(po, i, v){ var all = {}; try{ all = JSON.parse(ls('po_checklist') || '{}'); }catch(e){}
    all[po] = all[po] || {}; all[po][i] = v ? 1 : 0; all[po]._t = Date.now();
    var ks = Object.keys(all); if (ks.length > 60) ks.sort(function(a, b){ return (all[a]._t || 0) - (all[b]._t || 0); }).slice(0, ks.length - 60).forEach(function(k){ delete all[k]; });
    ls('po_checklist', JSON.stringify(all)); paintChk(); };
  function paintChk(){
    var host = $('pdfStatus'); if (!host) return;
    var box = $('poChk'), L = items();
    if (!L){ if (box) box.remove(); return; }
    if (!box){ box = document.createElement('div'); box.id = 'poChk'; box.className = 'card'; box.style.marginTop = '12px'; host.parentNode.insertBefore(box, host.nextSibling); }
    var po = poNo() || 'current', st = chkState(po), done = STEPS.filter(function(_, i){ return st[i]; }).length;
    var fixed = L.filter(function(i){ return i._o; }), auto = fixed.filter(function(i){ return i.auto; });
    var t0 = L.reduce(function(s, i){ return s + (+((i._o || i).amt) || 0); }, 0), t1 = L.reduce(function(s, i){ return s + (+i.amt || 0); }, 0);
    var miss = L.filter(function(i){ var e = window.eeMrpFor ? eeMrpFor(i.code) : null; return e && e.conflict == null && !i._o && Math.abs(i.mrp - e.mrp) > 0.005; });
    var conf = L.filter(function(i){ var e = window.eeMrpFor ? eeMrpFor(i.code) : null; return e && e.conflict != null && !i._o && Math.abs(i.mrp - e.mrp) > 0.005; });
    var unk = L.filter(function(i){ return !(window.eeMrpFor && eeMrpFor(i.code)); });
    var notes = [];
    if (fixed.length) notes.push('<div class="lc-note" style="color:var(--warn,#d98a00)"><b>⚠ ' + fixed.length + ' line' + (fixed.length > 1 ? 's' : '') + ' corrected to the EasyEcom MRP.</b> Punch these rates, not the PO rates:<br>'
      + fixed.map(function(i){ return '• <b>' + E(i.code) + '</b>' + (window.eeMrpFor && eeMrpFor(i.code) ? ' (' + E(eeMrpFor(i.code).sku) + ')' : '') + ' ' + E(i.name) + ': MRP ' + i._o.mrp + ' → <b>' + i.mrp + '</b>, rate ' + rs(i._o.main) + ' → <b>' + rs(i.main) + '</b>, value ' + rs(i._o.amt) + ' → <b>' + rs(i.amt) + '</b>' + (i.auto ? '' : ' (saved rate fix)'); }).join('<br>') + '</div>');
    if (fixed.length) notes.push('<div class="lc-note"><b>PO value ' + rs(t0) + ' → EasyEcom value ' + rs(t1) + '</b> (' + (t1 >= t0 ? '+' : '−') + rs(Math.abs(t1 - t0)) + '). '
      + '<b>Important:</b> ask FirstCry to amend the PO MRP' + (fixed.length > 1 ? 's' : '') + ' before invoicing. If the PO is not amended, the invoice and the PO will not match and GRN or payment can be held or short-paid.</div>');
    if (miss.length) notes.push('<div class="lc-note" style="color:var(--danger,#e5484d)"><b>❌ ' + miss.length + ' MRP mismatch' + (miss.length > 1 ? 'es are' : ' is') + ' NOT corrected</b> (auto-correct is off): ' + miss.map(function(i){ return E(i.code); }).join(', ') + '. Turn it on in FirstCry rate fix.</div>');
    if (conf.length) notes.push('<div class="lc-note" style="color:var(--danger,#e5484d)"><b>❗ ' + conf.length + ' line' + (conf.length > 1 ? 's need' : ' needs') + ' your decision, not corrected:</b><br>'
      + conf.map(function(i){ var e = eeMrpFor(i.code); return '• <b>' + E(i.code) + '</b> (' + E(e.sku) + ') ' + E(i.name) + ': PO MRP ' + i.mrp + ', EasyEcom CSV ' + e.mrp + ', built-in list ' + e.conflict + '. Often a pack mapped to a single-unit SKU. Save a Rate fix with the right MRP and rate.'; }).join('<br>') + '</div>');
    if (unk.length) notes.push('<div class="lc-note"><b>ℹ ' + unk.length + ' FCID' + (unk.length > 1 ? 's are' : ' is') + ' not in the EasyEcom MRP list</b> (' + unk.slice(0, 6).map(function(i){ return E(i.code); }).join(', ') + (unk.length > 6 ? '…' : '') + '): check their MRP by hand.</div>');
    if (!notes.length) notes.push('<div class="lc-note" style="color:var(--accent2,#1fa971)"><b>✅ All MRPs match EasyEcom.</b> PO value ' + rs(t0) + '.</div>');
    var hidden = ls('po_chk_hidden') === '1', open = ls('po_chk_open') === '1';
    if (hidden){ box.innerHTML = '<button class="btn-ghost btn-sm" onclick="fcChkHide(false)">Show “Before you punch”' + (fixed.length || miss.length || conf.length ? ' · ⚠ ' + (fixed.length + miss.length + conf.length) + ' to check' : '') + '</button>'; box.style.padding = '8px 12px'; return; }
    box.style.padding = '';
    var sumBits = [];
    if (fixed.length) sumBits.push('<span style="color:var(--warn,#d98a00)">⚠ ' + fixed.length + ' corrected · ' + (t1 >= t0 ? '+' : '−') + rs(Math.abs(t1 - t0)) + '</span>');
    if (conf.length) sumBits.push('<span style="color:var(--danger,#e5484d)">❗ ' + conf.length + ' need a decision</span>');
    if (miss.length) sumBits.push('<span style="color:var(--danger,#e5484d)">❌ ' + miss.length + ' not corrected</span>');
    if (unk.length) sumBits.push('ℹ ' + unk.length + ' not in MRP list');
    if (!sumBits.length) sumBits.push('<span style="color:var(--accent2,#1fa971)">✅ MRPs match EasyEcom</span>');
    sumBits.push(done + '/' + STEPS.length + ' ticked');
    box.innerHTML = '<details' + (open ? ' open' : '') + ' ontoggle="fcChkOpen(this.open)"><summary style="cursor:pointer;display:flex;align-items:center;gap:10px;flex-wrap:wrap;list-style-position:inside">'
      + '<b style="font-size:16px">Before you punch</b><span class="h2-sub">PO ' + E(po) + '</span><span class="h2-sub" style="display:flex;gap:10px;flex-wrap:wrap">' + sumBits.join(' · ') + '</span>'
      + '<a href="#" onclick="fcChkHide(true);return false" style="margin-left:auto;font-size:12px">Hide</a></summary><div style="margin-top:10px">' + notes.join('')
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:6px 16px;margin-top:10px">'
      + STEPS.map(function(s, i){ return '<label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer"><input type="checkbox" ' + (st[i] ? 'checked' : '') + ' onchange="fcChk(\'' + E(po).replace(/'/g, '') + '\',' + i + ',this.checked)"><span' + (st[i] ? ' style="text-decoration:line-through;opacity:.7"' : '') + '>' + E(s) + '</span></label>'; }).join('')
      + '</div><div class="row" style="margin:10px 0 0"><button class="btn-ghost btn-sm" onclick="fcMrpReport()">Download MRP check CSV</button></div></div></details>';
  }
  window.fcChkOpen = function(o){ ls('po_chk_open', o ? '1' : '0'); };
  window.fcChkHide = function(h){ ls('po_chk_hidden', h ? '1' : '0'); paintChk(); };

  /* repaint when the PO status area changes (new PO, re-render, fix saved) */
  function css(){ if ($('fcMrpCss')) return; var s = document.createElement('style'); s.id = 'fcMrpCss';
    s.textContent = '.flag.flag-fix{background:var(--warn-soft,rgba(217,138,0,.16));color:var(--warn,#d98a00);white-space:nowrap}'
      + '.flag.flag-conf{background:var(--danger-soft,rgba(229,72,77,.15));color:var(--danger,#e5484d);white-space:nowrap}'
      + 'tr.fixed-row>td{background:color-mix(in srgb,var(--warn,#d98a00) 9%,transparent)}'
      + 'tr.fixed-row>td:first-child{box-shadow:inset 3px 0 0 var(--warn,#d98a00)}';
    document.head.appendChild(s); }
  function boot(){
    css(); paintCard(); paintChk();
    var host = $('pdfStatus');
    if (host && window.MutationObserver){ var t = null; new MutationObserver(function(){ clearTimeout(t); t = setTimeout(paintChk, 60); }).observe(host, {childList: true, subtree: true, characterData: true}); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
  window.fcMrpPaint = function(){ paintCard(); paintChk(); };
})();
