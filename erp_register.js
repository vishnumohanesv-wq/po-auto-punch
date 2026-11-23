/* ===== PO Register & Control Tower (v7.2): one operational record per PO =====
   Reads every existing store (never rewrites them): Processing History, Record Book, Dispatch board, Master rows,
   Hold list, Purplle batch, PO Inbox log and the PO lifecycle record (po_life). Edits go through the app's own
   lcSave() (which keeps per-PO field history) plus a user-stamped audit log (po_audit). New keys only: po_audit,
   po_erp_user, po_erp_schema, po_erp_view. A safety copy is taken before the first run. */
(function(){
  if (window.__poRegister) return; window.__poRegister = 1;
  function $(i){ return document.getElementById(i); }
  function E(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function J(k, d){ try{ var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; }catch(e){ return d; } }
  function ls(k, v){ try{ if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; } }
  function toast(m){ try{ showToast(m); }catch(e){} }
  function key(po){ return String(po || '').trim().toLowerCase(); }
  function ymd(d){ return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function tsY(t){ var d = new Date(t); return isNaN(d) ? '' : ymd(d); }
  function dmy2iso(s){ var m = String(s || '').match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/); return m ? m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2) : ''; }
  function iso(s){ s = String(s || ''); return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : dmy2iso(s); }
  function dd(a){ var d = iso(a); if (!d) return null; var p = d.split('-'); var t = new Date(+p[0], p[1] - 1, +p[2]); var n = new Date(); n.setHours(0, 0, 0, 0); return Math.round((n - t) / 864e5); }
  function rs(v){ v = +v || 0; return '₹' + Math.round(v).toLocaleString('en-IN'); }
  function fmt(d){ d = iso(d); if (!d) return '—'; var p = d.split('-'); return new Date(+p[0], p[1] - 1, +p[2]).toLocaleDateString('en-IN', {day: '2-digit', month: 'short', year: '2-digit'}); }
  function closedM(r){ return /cancel|\brto\b/i.test(((r && r.stat) || '') + ' ' + ((r && r.issue) || '')); }
  var BUYER = {reliance: 'Reliance Retail', '1mg': 'Tata 1MG', firstcry: 'FirstCry', purplle: 'Purplle', hg: 'Health & Glow', dmart: 'DMart', firstclub: 'FirstClub'};
  var STEPS = ['PO Received', 'PO Verified', 'Customer Master', 'EasyEcom Punch', 'Inventory Blocked', 'Packing', 'Packing Completed', 'Appointment Requested',
               'Appointment Confirmed', 'Dispatch Ready', 'Pickup', 'Dispatched', 'OFD', 'Delivered', 'POD', 'GRN Completed'];
  var OWNER = {'PO Received': 'Supply Chain', 'PO Verified': 'Supply Chain', 'Customer Master': 'Supply Chain', 'EasyEcom Punch': 'Supply Chain', 'Inventory Blocked': 'Supply Chain',
               'Packing': 'Warehouse', 'Packing Completed': 'Warehouse', 'Appointment Requested': 'Supply Chain', 'Appointment Confirmed': 'Buyer', 'Dispatch Ready': 'Warehouse',
               'Pickup': 'Courier', 'Dispatched': 'Warehouse', 'OFD': 'Courier', 'Delivered': 'Courier', 'POD': 'Courier', 'GRN Completed': 'Buyer'};

  /* ---------- assemble the register from every store ---------- */
  function build(){
    var R = {}, M = J('ms_master', null), life = J('po_life', {}) || {};
    function rec(po){ var k = key(po); if (!k) return null; return R[k] || (R[k] = {po: String(po).trim(), k: k, src: {}, m: {}, skus: {}, hist: 0, flags: []}); }
    function src(r, name){ r.src[name] = 1; }
    function set(r, f, v){ if (v != null && v !== '' && (r[f] == null || r[f] === '' || r[f] === 0)) r[f] = v; }
    function mile(r, step, date, by){ if (!r.m[step]) r.m[step] = {date: date || '', by: by}; else if (!r.m[step].date && date) r.m[step].date = date; }
    ((M && M.rows) || []).forEach(function(x){ var r = rec(x.po); if (!r) return; src(r, 'Master'); r.mrow = x;
      set(r, 'buyer', x.ch); set(r, 'wh', x.wh); set(r, 'zone', x.zone); set(r, 'dist', x.dist); set(r, 'date', iso(x.d)); set(r, 'val', +x.val || 0); set(r, 'qty', +x.qty || 0);
      set(r, 'awb', x.awb); set(r, 'inv', x.inv); set(r, 'car', x.car); set(r, 'boxes', x.boxes);
      mile(r, 'PO Received', iso(x.d), 'Master');
      if (x.packed) mile(r, 'Packing Completed', '', 'Master');
      if (x.apSt || x.apOk) mile(r, 'Appointment Requested', '', 'Master');
      if (x.apOk) mile(r, 'Appointment Confirmed', iso(x.apD), 'Master');
      if (x.lbl) mile(r, 'Dispatch Ready', '', 'Master');
      if (x.dsp) mile(r, 'Dispatched', iso(x.dspD), 'Master');
      if (x.del) mile(r, 'Delivered', iso(x.delD), 'Master');
      if (x.pod) mile(r, 'POD', '', 'Master');
      if (x.grn) mile(r, 'GRN Completed', iso(x.grnD), 'Master');
      if (closedM(x)) r.closed = x.stat || x.issue || 'Cancelled'; });
    (J('po_all_history', []) || []).forEach(function(h){ var f = ((h.header && h.header.fields) || []).filter(function(x){ return /^po (number|no)/i.test(x[0]); })[0], po = f && f[1]; var r = rec(po); if (!r) return;
      src(r, 'History'); r.hist++; set(r, 'buyer', BUYER[h.mode] || h.mode); set(r, 'val', +h.value || 0); set(r, 'qty', +h.qty || 0);
      (h.data || []).forEach(function(d){ if (d.sku) r.skus[d.sku] = 1; if (d.code) r.skus[d.code] = 1; });
      mile(r, 'PO Received', tsY(h.ts), 'History'); mile(r, 'PO Verified', tsY(h.ts), 'PO Processing'); });
    (J('po_record_book', []) || []).forEach(function(b){ var r = rec(b.po); if (!r) return; src(r, 'Record Book');
      set(r, 'buyer', BUYER[b.mode] || b.mode); set(r, 'val', +b.val || 0); set(r, 'qty', +b.qty || 0); mile(r, 'EasyEcom Punch', b.day || tsY(b.ts), 'Record Book'); mile(r, 'PO Received', b.day || tsY(b.ts), 'Record Book'); });
    ((J('po_desk', {}) || {}).items || []).forEach(function(x){ var r = rec(x.po); if (!r) return; src(r, 'Dispatch'); var t = x.t || [];
      set(r, 'buyer', x.chan); set(r, 'wh', x.wh); set(r, 'zone', x.zone); set(r, 'dist', x.to); set(r, 'val', +x.val || 0); set(r, 'qty', +x.qty || 0); r.stage = x.stage;
      mile(r, 'PO Received', t[0] ? tsY(t[0]) : '', 'Dispatch');
      if (x.stage >= 1) mile(r, 'Packing', t[1] ? tsY(t[1]) : '', 'Dispatch'); if (x.stage >= 2) mile(r, 'Packing Completed', t[2] ? tsY(t[2]) : '', 'Dispatch');
      if (x.stage >= 3) mile(r, 'Dispatch Ready', t[3] ? tsY(t[3]) : '', 'Dispatch'); if (x.stage >= 4) mile(r, 'Dispatched', t[4] ? tsY(t[4]) : '', 'Dispatch'); });
    (J('po_lo_extra', []) || []).forEach(function(x){ var r = rec(x.po); if (!r) return; src(r, 'Purplle batch'); set(r, 'buyer', 'Purplle'); set(r, 'date', iso(x.date)); set(r, 'val', +x.val || 0); set(r, 'qty', +x.qty || 0);
      (x.items || []).forEach(function(i){ if (i[0]) r.skus[i[0]] = 1; }); mile(r, 'PO Received', iso(x.date), 'Purplle batch'); });
    (J('po_hold_list', []) || []).forEach(function(h){ var r = rec(h.po); if (!r) return; src(r, 'Hold'); set(r, 'buyer', h.chan); set(r, 'val', +h.val || 0); set(r, 'qty', +h.qty || 0);
      if (/cancel/i.test(h.st || '') || /cancel/i.test(h.res || '')) r.closed = 'Cancelled (hold list)'; else if (/hold/i.test(h.st || '') && !/released/i.test(h.res || '')) r.hold = (h.cat || 'On hold'); });
    var pm = J('po_pm_done', {}) || {}; Object.keys(pm).forEach(function(id){ var x = pm[id]; if (!x || x.dismissed) return; var r = rec(x.po); if (!r) return; src(r, 'PO Inbox'); set(r, 'buyer', x.ch); mile(r, 'PO Received', tsY(x.at), 'PO Inbox'); });
    Object.keys(life).forEach(function(po){ var l = life[po], r = rec(po); if (!r || !l) return; src(r, 'Lifecycle'); r.life = l;
      [['ck_verified', 'PO Verified'], ['ck_master', 'Customer Master'], ['ck_blocked', 'Inventory Blocked'], ['apReq', 'Appointment Requested'], ['apConf', 'Appointment Confirmed'],
       ['pickup', 'Pickup'], ['disp', 'Dispatched'], ['ofd', 'OFD'], ['deliv', 'Delivered'], ['grn', 'GRN Completed']].forEach(function(p){ if (l[p[0]]) mile(r, p[1], iso(l[p[0]]), 'Lifecycle'); });
      if (l.pod) mile(r, 'POD', '', 'Lifecycle'); set(r, 'inv', l.inv); set(r, 'awb', l.awb); set(r, 'car', l.courier); set(r, 'grnRef', l.grnRef); });
    var out = Object.keys(R).map(function(k){ return derive(R[k]); });
    dupes(out); return out;
  }
  /* ---------- status, next action, delay side ---------- */
  function derive(r){
    var last = -1; STEPS.forEach(function(s, i){ if (r.m[s]) last = i; });
    r.done = STEPS.filter(function(s){ return r.m[s]; }).length; r.cur = last >= 0 ? STEPS[last] : 'PO Received';
    var REQ = ['PO Received', 'Packing Completed', 'Appointment Requested', 'Appointment Confirmed', 'Dispatch Ready', 'Dispatched', 'Delivered', 'GRN Completed'];
    var has = function(s){ return !!r.m[s]; }, imp = {};                      // later physical steps imply earlier ones (for the blocker only, the timeline stays as recorded)
    if (has('GRN Completed')) imp['Delivered'] = 1;
    if (has('Delivered') || imp['Delivered']) imp['Dispatched'] = 1;
    if (has('Dispatched') || imp['Dispatched']){ ['PO Received', 'Packing', 'Packing Completed', 'Appointment Requested', 'Appointment Confirmed', 'Dispatch Ready'].forEach(function(s){ imp[s] = 1; }); }
    if (has('Appointment Confirmed')) imp['Appointment Requested'] = 1;
    var next = null; for (var i = 0; i < REQ.length; i++){ if (!r.m[REQ[i]] && !imp[REQ[i]]){ next = REQ[i]; break; } }   // first required milestone not done = the real blocker
    if (next === 'Packing Completed' && !r.m['Packing']) next = 'Packing'; r.next = next;
    var lastDate = ''; for (var j = last; j >= 0; j--){ if (r.m[STEPS[j]] && r.m[STEPS[j]].date){ lastDate = r.m[STEPS[j]].date; break; } }
    r.ageDays = dd(r.date || (r.m['PO Received'] && r.m['PO Received'].date)); r.stepDays = dd(lastDate);
    r.status = r.closed ? 'Cancelled' : r.hold ? 'On hold' : r.m['GRN Completed'] ? 'Completed' : 'Open';
    var why = r.life && r.life.delay;
    r.side = r.status !== 'Open' ? '' : /buyer/i.test(why || '') ? 'Buyer' : /courier/i.test(why || '') ? 'Courier' : why ? 'Tuco' :
      next === 'Appointment Confirmed' || next === 'GRN Completed' ? 'Buyer' : next === 'Pickup' || next === 'OFD' || next === 'Delivered' || next === 'POD' ? 'Courier' : 'Tuco';
    r.owner = (r.life && r.life.owner) || OWNER[next] || '';
    if (r.hist > 1) r.flags.push('punched ' + r.hist + '×');
    return r;
  }
  function dupes(L){   // same buyer, same qty, value within ₹1, PO dates within 3 days, different PO numbers
    var by = {}; L.forEach(function(r){ if (!r.qty || !r.val || r.status === 'Cancelled') return; var g = key(r.buyer) + '|' + r.qty; (by[g] = by[g] || []).push(r); });
    Object.keys(by).forEach(function(g){ var a = by[g]; for (var i = 0; i < a.length; i++) for (var j = i + 1; j < a.length; j++){
      var x = a[i], y = a[j], dx = iso(x.date), dy = iso(y.date);
      if (Math.abs(x.val - y.val) <= 1 && dx && dy && Math.abs(Date.parse(dx) - Date.parse(dy)) <= 3 * 864e5){ x.flags.push('possible duplicate of ' + y.po); y.flags.push('possible duplicate of ' + x.po); } } });
  }
  window.poRegister = build;

  /* ---------- audit + edits ---------- */
  function user(){ var u = ls('po_erp_user'); if (!u){ u = (prompt('Your name for the audit log (stored on this device):') || '').trim(); if (u) ls('po_erp_user', u); } return u || 'unknown'; }
  function audit(po, field, from, to, reason){ var a = J('po_audit', []) || []; a.push({t: Date.now(), u: ls('po_erp_user') || 'unknown', po: po, f: field, from: from, to: to, why: reason || ''}); ls('po_audit', JSON.stringify(a.slice(-5000))); }
  var EDIT = [['owner', 'Owner', 'text'], ['team', 'Responsible team', 'select', ['', 'Supply Chain', 'Warehouse', 'Courier', 'Buyer', 'Finance']],
              ['ck_verified', 'PO verified on', 'date'], ['ck_master', 'Customer master created on', 'date'], ['ck_blocked', 'Inventory blocked on', 'date'],
              ['plan', 'Planned dispatch date', 'date'], ['planDel', 'Planned delivery date', 'date'],
              ['delay', 'Delay reason', 'select', ['', 'Buyer appointment delay', 'Warehouse processing', 'Courier delay', 'Stock / OOS', 'Documents / invoice', 'Other']],
              ['escal', 'Escalation', 'text'], ['remarks', 'Remarks', 'text']];
  window.regSave = function(po){
    var who = user(), cur = (J('po_life', {}) || {})[po] || {}, patch = {}, n = 0, why = (($('regWhy') || {}).value || '').trim();
    EDIT.forEach(function(f){ var el = $('regF_' + f[0]); if (!el) return; var nv = String(el.value || '').trim(), ov = String(cur[f[0]] || ''); if (nv !== ov){ patch[f[0]] = nv; audit(po, f[0], ov, nv, why); n++; } });
    if (!n){ toast('Nothing changed'); return; }
    var r = window.lcSave ? lcSave(po, patch) : -1;
    if (r === -1){ toast('Could not save: browser storage is full'); return; }
    toast('Saved ' + n + ' change' + (n > 1 ? 's' : '') + ' · audited as ' + who); render(); regOpen(po);
  };

  /* ---------- UI ---------- */
  var V = Object.assign({q: '', buyer: '', wh: '', side: '', step: '', show: 'open', tab: 'reg'}, J('po_erp_view', {}) || {}), CUR = [];
  function save(){ ls('po_erp_view', JSON.stringify({buyer: V.buyer, wh: V.wh, side: V.side, step: V.step, show: V.show})); }
  window.regSet = function(k, v){ V[k] = v; save(); render(); if (k === 'q'){ var q = $('regQ'); if (q){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); } } };
  function match(r){
    if (V.show === 'open' && r.status !== 'Open') return false; if (V.show === 'hold' && r.status !== 'On hold') return false; if (V.show === 'dup' && !r.flags.some(function(f){ return /duplicate|punched/.test(f); })) return false;
    if (V.buyer && r.buyer !== V.buyer) return false; if (V.wh && r.wh !== V.wh) return false; if (V.side && r.side !== V.side) return false; if (V.step && r.next !== V.step) return false;
    if (!V.q) return true; var q = V.q.toLowerCase();
    return [r.po, r.buyer, r.wh, r.dist, r.inv, r.awb, r.grnRef, r.car, Object.keys(r.skus).join(' ')].join(' ').toLowerCase().indexOf(q) >= 0;
  }
  function page(){
    var w = document.querySelector('.wrap'); if (!w) return null; var v = $('viewRegister');
    if (!v){ v = document.createElement('div'); v.id = 'viewRegister'; v.innerHTML = '<div class="card" id="regCard"></div>'; var vc = $('viewConvert'); w.insertBefore(v, vc || null);
      var s = document.createElement('style'); s.textContent = '#viewRegister{display:none}body[data-page="register"] #viewRegister{display:block}'
        + 'body[data-page="register"] .wrap>[id^="view"]:not(#viewRegister),body[data-page="register"] #jumpBar{display:none!important}'
        + '#regCard .reg-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:10px 0}#regCard .reg-tiles .kpi{cursor:pointer;text-align:left}'
        + '#regCard .reg-bar{height:6px;border-radius:9px;background:var(--border,rgba(127,127,127,.25));overflow:hidden;min-width:70px}#regCard .reg-bar i{display:block;height:100%;background:var(--accent,#8f7cff)}'
        + '#regCard tbody tr{cursor:pointer}#regTl{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px;margin:8px 0}'
        + '#regTl .st{border:1px solid var(--border,rgba(127,127,127,.3));border-radius:10px;padding:6px 8px;font-size:12.5px}#regTl .st.ok{border-color:var(--accent2,#1fa971)}#regTl .st.nx{border-color:var(--warn,#d98a00);border-style:dashed}'
        + '#regEdit{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px 14px;margin-top:8px}#regEdit label{font-size:12px;display:block;opacity:.8;margin-bottom:2px}#regEdit input,#regEdit select{width:100%}';
      document.head.appendChild(s); }
    return $('regCard');
  }
  function navItem(){
    if ($('niRegister')) return; var src = document.querySelector('#side button[data-n="dash"]'); if (!src) return;
    var ni = src.closest('.ni'), c = ni.cloneNode(true); c.id = 'niRegister';
    var b = c.querySelector('button'); b.dataset.n = 'register'; b.setAttribute('onclick', "navTo('register')"); b.title = 'PO Register & Control Tower: every PO, every milestone';
    var q = b.querySelector('q'); if (q) q.remove(); var sp = b.querySelector('span'); if (sp) sp.textContent = 'PO Register';
    var svg = b.querySelector('svg'); if (svg) svg.outerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h12"/><circle cx="19" cy="18" r="2"/></svg>';
    var st = c.querySelector('.nstar'); if (st){ st.dataset.star = 'register'; st.setAttribute('onclick', "navStar('register',event)"); }
    ni.parentNode.insertBefore(c, ni.nextSibling);
  }
  function opts(list, cur, all){ return '<option value="">' + all + '</option>' + list.map(function(x){ return '<option' + (x === cur ? ' selected' : '') + '>' + E(x) + '</option>'; }).join(''); }
  function render(){
    var c = page(); if (!c || document.body.dataset.page !== 'register') return;
    var L = build(), open = L.filter(function(r){ return r.status === 'Open'; });
    var cnt = function(f){ return L.filter(f).length; };
    var buyers = Object.keys(L.reduce(function(a, r){ if (r.buyer) a[r.buyer] = 1; return a; }, {})).sort(), whs = Object.keys(L.reduce(function(a, r){ if (r.wh) a[r.wh] = 1; return a; }, {})).sort();
    CUR = L.filter(match).sort(function(a, b){ return (b.ageDays || 0) - (a.ageDays || 0); });
    var M = J('ms_master', null), when = M && M.at ? new Date(+M.at).toLocaleString('en-IN', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}) : '';
    var tile = function(label, n, sub, col, act){ return '<button class="kpi" style="--kc:' + col + '" onclick="' + act + '"><small>' + label + '</small><b>' + n + '</b><span>' + sub + '</span></button>'; };
    var tbl = CUR.length ? '<div class="lc-tw"><table class="lc-t"><thead><tr><th>PO</th><th>Buyer</th><th>Warehouse</th><th>PO date</th><th>Qty</th><th>Value</th><th>Progress</th><th>Next action</th><th>Owner</th><th>Waiting on</th><th>Age</th><th>Flags</th></tr></thead><tbody>'
      + CUR.slice(0, 500).map(function(r){ return '<tr onclick="regOpen(\'' + E(r.po).replace(/'/g, '') + '\')"><td><b class="mono">' + E(r.po) + '</b></td><td>' + E(r.buyer || '—') + '</td><td>' + E(r.wh || '—') + '</td><td>' + E(fmt(r.date || (r.m['PO Received'] || {}).date)) + '</td>'
        + '<td>' + (r.qty || '—') + '</td><td>' + (r.val ? rs(r.val) : '—') + '</td><td><div class="reg-bar" title="' + r.done + ' of 16 milestones"><i style="width:' + Math.round(r.done / 16 * 100) + '%"></i></div><small>' + E(r.cur) + '</small></td>'
        + '<td>' + (r.status === 'Open' ? E(r.next || '—') : '<span class="lc-p ' + (r.status === 'Completed' ? 'g' : 'a') + '">' + E(r.status) + '</span>') + '</td><td>' + E(r.owner) + '</td>'
        + '<td>' + (r.side ? '<span class="lc-p ' + (r.side === 'Buyer' ? 'v' : r.side === 'Courier' ? 'a' : 'r') + '">' + r.side + '</span>' : '') + '</td><td>' + (r.ageDays != null && r.status === 'Open' ? r.ageDays + ' d' : '') + '</td>'
        + '<td>' + r.flags.map(function(f){ return '<span class="lc-p r" title="' + E(f) + '">' + (/duplicate/.test(f) ? 'dup?' : E(f)) + '</span>'; }).join(' ') + (r.hold ? ' <span class="lc-p a">' + E(r.hold) + '</span>' : '') + '</td></tr>'; }).join('')
      + '</tbody></table></div>' + (CUR.length > 500 ? '<div class="hint">Showing 500 of ' + CUR.length + '. Narrow the filters or export.</div>' : '')
      : '<div class="lc-empty">' + (L.length ? 'No PO matches these filters.' : 'No POs yet. Process a PO, sync the Master or load the Purplle batch and they appear here.') + '</div>';
    var A = (J('po_audit', []) || []).slice(-200).reverse();
    var aud = '<div class="lc-tw"><table class="lc-t"><thead><tr><th>When</th><th>User</th><th>PO</th><th>Field</th><th>Old</th><th>New</th><th>Reason</th></tr></thead><tbody>'
      + (A.length ? A.map(function(a){ return '<tr><td>' + E(new Date(a.t).toLocaleString('en-IN', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})) + '</td><td>' + E(a.u) + '</td><td class="mono">' + E(a.po) + '</td><td>' + E(a.f) + '</td><td>' + E(a.from || '—') + '</td><td>' + E(a.to || '—') + '</td><td>' + E(a.why || '') + '</td></tr>'; }).join('') : '<tr><td colspan="7">No edits yet.</td></tr>')
      + '</tbody></table></div>';
    var focus = document.activeElement && document.activeElement.id === 'regQ';
    c.innerHTML = '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><h2 style="margin:0">PO Register <span class="h2-sub">' + L.length + ' POs from ' + Object.keys(L.reduce(function(a, r){ Object.keys(r.src).forEach(function(s){ a[s] = 1; }); return a; }, {})).length + ' sources'
      + (when ? ' · Master synced ' + E(when) : ' · Master not synced') + '</span></h2><span style="flex:1"></span>'
      + '<button class="btn-ghost btn-sm" onclick="regExport(\'csv\')">CSV</button><button class="btn-ghost btn-sm" onclick="regExport(\'xlsx\')">Excel</button></div>'
      + '<div class="reg-tiles">' + tile('Open POs', open.length, rs(open.reduce(function(s, r){ return s + (r.val || 0); }, 0)), '#8f7cff', "regSet('show','open')")
      + tile('Waiting on Tuco', cnt(function(r){ return r.side === 'Tuco'; }), 'packing, punching, dispatch', '#e5484d', "regSet('side','Tuco')")
      + tile('Waiting on buyer', cnt(function(r){ return r.side === 'Buyer'; }), 'appointment, GRN', '#7c8cff', "regSet('side','Buyer')")
      + tile('Waiting on courier', cnt(function(r){ return r.side === 'Courier'; }), 'pickup, OFD, delivery, POD', '#d98a00', "regSet('side','Courier')")
      + tile('On hold', cnt(function(r){ return r.status === 'On hold'; }), 'hold list', '#f5a300', "regSet('show','hold')")
      + tile('Possible duplicates', cnt(function(r){ return r.flags.some(function(f){ return /duplicate|punched/.test(f); }); }), 'same PO twice or same buyer/qty/value', '#e5484d', "regSet('show','dup')")
      + tile('Completed', cnt(function(r){ return r.status === 'Completed'; }), 'GRN done', '#1fa971', "regSet('show','all')") + '</div>'
      + '<div class="lc-tabs"><button class="lc-tab ' + (V.tab === 'reg' ? 'on' : '') + '" onclick="regSet(\'tab\',\'reg\')">Register</button><button class="lc-tab ' + (V.tab === 'aud' ? 'on' : '') + '" onclick="regSet(\'tab\',\'aud\')">Audit log <b>' + (J('po_audit', []) || []).length + '</b></button></div>'
      + (V.tab === 'aud' ? aud : '<div class="hx-tools" style="flex-wrap:wrap;gap:6px;margin:8px 0">'
        + '<input id="regQ" type="search" style="flex:1;min-width:220px" placeholder="Search PO, buyer, SKU, invoice, AWB, GRN, distributor" value="' + E(V.q) + '" oninput="regSet(\'q\',this.value)">'
        + '<select onchange="regSet(\'show\',this.value)">' + [['open', 'Open'], ['all', 'All'], ['hold', 'On hold'], ['dup', 'Duplicates']].map(function(o){ return '<option value="' + o[0] + '"' + (V.show === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'
        + '<select onchange="regSet(\'buyer\',this.value)">' + opts(buyers, V.buyer, 'All buyers') + '</select><select onchange="regSet(\'wh\',this.value)">' + opts(whs, V.wh, 'All warehouses') + '</select>'
        + '<select onchange="regSet(\'side\',this.value)">' + opts(['Tuco', 'Buyer', 'Courier'], V.side, 'Waiting on: all') + '</select><select onchange="regSet(\'step\',this.value)">' + opts(STEPS, V.step, 'Next action: all') + '</select>'
        + '<button class="btn-ghost btn-sm" onclick="regClear()">Clear filters</button></div><div id="regDetail"></div>' + tbl);
    if (focus){ var q = $('regQ'); if (q){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
  }
  window.regClear = function(){ V = {q: '', buyer: '', wh: '', side: '', step: '', show: 'open', tab: 'reg'}; save(); render(); };
  window.regOpen = function(po){
    var r = build().filter(function(x){ return x.po === po; })[0], box = $('regDetail'); if (!r || !box) return;
    var l = r.life || {}, nx = r.next;
    var tl = STEPS.map(function(s){ var m = r.m[s]; return '<div class="st ' + (m ? 'ok' : s === nx && r.status === 'Open' ? 'nx' : '') + '"><b>' + (m ? '✅ ' : s === nx && r.status === 'Open' ? '⏳ ' : '○ ') + E(s) + '</b><br><span class="hint">'
      + (m ? (m.date ? fmt(m.date) : 'done, date not recorded') + ' · ' + E(m.by) : s === nx && r.status === 'Open' ? 'next · ' + E(OWNER[s] || '') : 'not recorded') + '</span></div>'; }).join('');
    var ed = EDIT.map(function(f){ var v = l[f[0]] || ''; return '<div><label>' + E(f[1]) + '</label>' + (f[2] === 'select' ? '<select id="regF_' + f[0] + '">' + f[3].map(function(o){ return '<option' + (o === v ? ' selected' : '') + '>' + E(o) + '</option>'; }).join('') + '</select>'
      : '<input id="regF_' + f[0] + '" type="' + (f[2] === 'date' ? 'date' : 'text') + '" value="' + E(v) + '">') + '</div>'; }).join('');
    var hist = (l.h || []).slice(-8).reverse().map(function(h){ return E(new Date(h.t).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'})) + ' · ' + E(h.f) + ': ' + E(h.from || '—') + ' → ' + E(h.to || '—'); }).join('<br>');
    box.innerHTML = '<div class="card" style="margin:8px 0;border-style:dashed"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><b class="mono" style="font-size:16px">' + E(r.po) + '</b><span class="h2-sub">' + E(r.buyer || '') + ' · ' + E(r.wh || '') + ' · ' + E(r.dist || '') + '</span>'
      + '<span class="lc-p ' + (r.status === 'Open' ? 'v' : r.status === 'Completed' ? 'g' : 'a') + '">' + E(r.status) + '</span>' + r.flags.map(function(f){ return '<span class="lc-p r">' + E(f) + '</span>'; }).join('') + '<span style="flex:1"></span><button class="btn-ghost btn-sm" onclick="document.getElementById(\'regDetail\').innerHTML=\'\'">Close</button></div>'
      + '<div class="hint" style="margin:4px 0">Qty ' + (r.qty || '—') + ' · value ' + (r.val ? rs(r.val) : '—') + (r.inv ? ' · invoice ' + E(r.inv) : '') + (r.awb ? ' · AWB ' + E(r.awb) : '') + (r.car ? ' · ' + E(r.car) : '') + ' · sources: ' + E(Object.keys(r.src).join(', ')) + '</div>'
      + '<div id="regTl">' + tl + '</div><div id="regEdit">' + ed + '<div><label>Reason for this change (audit log)</label><input id="regWhy" type="text" placeholder="optional"></div></div>'
      + '<div class="row" style="margin:10px 0 0;gap:8px"><button class="btn-main btn-sm" onclick="regSave(\'' + E(r.po).replace(/'/g, '') + '\')">Save</button>'
      + (window.lcOpen ? '<button class="btn-ghost btn-sm" onclick="lcOpen(\'' + E(r.po).replace(/'/g, '') + '\')">Full lifecycle record</button>' : '') + '</div>'
      + (hist ? '<div class="hint" style="margin-top:8px"><b>Recent changes</b><br>' + hist + '</div>' : '') + '</div>';
    box.scrollIntoView({behavior: 'smooth', block: 'start'});
  };
  window.regExport = function(kind){
    var H = ['PO', 'Buyer', 'Warehouse', 'Zone', 'Distributor', 'PO date', 'Qty', 'Value', 'Status', 'Current milestone', 'Milestones done', 'Next action', 'Owner', 'Waiting on', 'Age (days)', 'Invoice', 'AWB', 'Flags', 'Sources']
      .concat(STEPS.map(function(s){ return s + ' date'; }));
    var rows = CUR.map(function(r){ return [r.po, r.buyer || '', r.wh || '', r.zone || '', r.dist || '', iso(r.date || (r.m['PO Received'] || {}).date), r.qty || '', r.val || '', r.status, r.cur, r.done, r.status === 'Open' ? r.next || '' : '', r.owner, r.side, r.status === 'Open' ? r.ageDays : '',
      r.inv || '', r.awb || '', r.flags.join('; '), Object.keys(r.src).join(', ')].concat(STEPS.map(function(s){ return r.m[s] ? (r.m[s].date || 'done') : ''; })); });
    var name = 'PO_Register_' + ymd(new Date());
    if (kind === 'xlsx' && window.XLSX){ var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([H].concat(rows)), 'PO Register'); XLSX.writeFile(wb, name + '.xlsx'); return; }
    var q = function(v){ v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + [H].concat(rows).map(function(r){ return r.map(q).join(','); }).join('\n')], {type: 'text/csv'}));
    a.download = name + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  /* ---------- migration: safety copy before the first run ---------- */
  function migrate(){
    if (ls('po_erp_schema') === '1') return Promise.resolve();
    var p = window.poBackupNow ? window.poBackupNow('Automatic copy before PO Register (v7.2)') : Promise.resolve();
    return p.then(function(){ ls('po_erp_schema', '1'); }, function(){ /* backup failed: do not mark, try again next time */ });
  }
  function boot(){ navItem(); page(); migrate();
    document.addEventListener('po:nav', function(e){ if (e.detail !== 'register') return;
      var t = $('pageTitle'), d = $('pageDesc'); if (t) t.textContent = 'PO Register'; if (d) d.textContent = 'Every PO in one record: milestones from PO received to GRN, who it is waiting on, ageing and audit.';
      var det = $('regDetail'); if (det) det.innerHTML = ''; setTimeout(render, 20); });
    if (window.poWatch) poWatch(function(){ var det = $('regDetail');   // never redraw under an open PO panel or while typing
      if (document.body.dataset.page === 'register' && !(det && det.innerHTML) && !(document.activeElement && /^reg/.test(document.activeElement.id || ''))) render(); });
    try{ if (window.CMDS) CMDS.push(['Open PO Register', 'register po control tower milestones search', function(){ navTo('register'); }]); }catch(e){}
    if (/register/.test(location.hash)) setTimeout(function(){ navTo('register'); }, 50); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
})();
