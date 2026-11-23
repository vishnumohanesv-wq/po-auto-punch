/* ===== Master overview: all-in-one dashboard from the Master Tracker (v7.1) =====
   Top of Executive Overview. Every number comes from the synced Master rows (ms_master). */
(function(){
  if (window.__msDash) return; window.__msDash = 1;
  function $(i){ return document.getElementById(i); }
  function E(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function M(){ try{ var m = JSON.parse(localStorage.getItem('ms_master') || 'null'); return m && m.rows && m.rows.length ? m : null; }catch(e){ return null; } }
  function d0(){ var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function dO(s){ var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; }
  function days(a, b){ return Math.round((b - a) / 864e5); }
  function rs(v){ v = +v || 0; return '₹' + (v >= 1e7 ? (v / 1e7).toFixed(2) + ' Cr' : v >= 1e5 ? (v / 1e5).toFixed(2) + ' L' : Math.round(v).toLocaleString('en-IN')); }
  function closed(r){ return /cancel|\brto\b/i.test((r.stat || '') + ' ' + (r.issue || '')); }
  var last = '';

  function model(){
    var m = M(); if (!m) return null; var T = d0(), R = m.rows.filter(function(r){ return r && r.po && !closed(r); });
    var open = R.filter(function(r){ return !r.dsp && !r.del; });
    var S = {
      m: m, all: R, open: open,
      packing: open.filter(function(r){ return !r.packed && !r.lbl; }),
      ready: open.filter(function(r){ return r.lbl || r.packed; }),
      transit: R.filter(function(r){ return r.dsp && !r.del; }),
      deliv30: R.filter(function(r){ var d = dO(r.delD); return r.del && (!d || days(d, T) <= 30); }),
      grnPend: R.filter(function(r){ return r.del && !r.grn; }),
      apToday: R.filter(function(r){ var a = dO(r.apD); return a && days(T, a) === 0; }),
      apTom: R.filter(function(r){ var a = dO(r.apD); return a && days(T, a) === 1 && !r.del; }),
      missed: R.filter(function(r){ var a = dO(r.apD); return a && days(T, a) < 0 && !r.del; }),
      cancelled: m.rows.filter(function(r){ return r && r.po && closed(r); })
    };
    S.old = open.filter(function(r){ var d = dO(r.d); return d && days(d, T) > 14; });
    S.grnOld = S.grnPend.filter(function(r){ var d = dO(r.delD); return d && days(d, T) > 15; });
    S.tomNotDsp = S.apTom.filter(function(r){ return !r.dsp; });
    S.age = [[0, 2], [3, 7], [8, 14], [15, 1e9]].map(function(b){ return open.filter(function(r){ var d = dO(r.d), n = d ? days(d, T) : 0; return n >= b[0] && n <= b[1]; }); });
    return S;
  }
  function sum(L, k){ return L.reduce(function(s, r){ return s + (+r[k] || 0); }, 0); }
  function group(S, key){
    var G = {}; S.all.forEach(function(r){ var g = r[key] || '—'; (G[g] = G[g] || {n: 0, open: 0, ov: 0, tr: 0, dl: 0, grn: 0}).n++; });
    S.open.forEach(function(r){ var g = G[r[key] || '—']; g.open++; g.ov += +r.val || 0; });
    S.transit.forEach(function(r){ G[r[key] || '—'].tr++; }); S.deliv30.forEach(function(r){ G[r[key] || '—'].dl++; }); S.grnPend.forEach(function(r){ G[r[key] || '—'].grn++; });
    return Object.keys(G).map(function(k){ return [k, G[k]]; }).sort(function(a, b){ return b[1].ov - a[1].ov || b[1].n - a[1].n; });
  }
  function table(title, rows){
    return '<div class="lc-tw" style="margin-top:10px"><table class="lc-t"><thead><tr><th>' + title + '</th><th>POs</th><th>Open</th><th>Open value</th><th>In transit</th><th>Delivered 30 d</th><th>GRN pending</th></tr></thead><tbody>'
      + rows.map(function(x){ var g = x[1]; return '<tr><td><b>' + E(x[0]) + '</b></td><td>' + g.n + '</td><td>' + g.open + '</td><td>' + rs(g.ov) + '</td><td>' + g.tr + '</td><td>' + g.dl + '</td><td>' + (g.grn ? '<span class="lc-p a">' + g.grn + '</span>' : '0') + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function tile(label, val, sub, go, col){ return '<button class="kpi" style="--kc:' + col + ';text-align:left;cursor:pointer" onclick="' + go + '"><small>' + E(label) + '</small><b>' + val + '</b><span>' + E(sub) + '</span></button>'; }
  function inboxN(){ var q = $('nbMail'); return q && q.style.display !== 'none' ? (+q.textContent || 0) : 0; }

  function paint(){
    var vd = $('viewDash'); if (!vd) return;
    var box = $('msDash'); if (!box){ box = document.createElement('div'); box.id = 'msDash'; box.className = 'card'; box.style.marginBottom = '14px'; vd.insertBefore(box, vd.firstChild); }
    if (document.body.dataset.page !== 'dash' && box.innerHTML) return;
    var S = model();
    if (!S){ box.innerHTML = '<h2>Master overview</h2><div class="lc-empty">Sync the Master Tracker once to see every PO, appointment, dispatch and GRN here.<br><br><button class="btn-main btn-sm" onclick="msOpen()">Sync master sheet</button></div>'; return; }
    var sig = S.m.at + '|' + inboxN() + '|' + d0().getTime(); if (sig === last && box.innerHTML) return; last = sig;
    var when = new Date(+S.m.at).toLocaleString('en-IN', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'});
    var alerts = [];
    if (S.missed.length) alerts.push(['r', '⚠ ' + S.missed.length + ' missed appointment' + (S.missed.length > 1 ? 's' : '') + ' (date passed, not delivered)', "apTab&&apTab('missed');navTo('appt')"]);
    if (S.tomNotDsp.length) alerts.push(['a', '🚚 ' + S.tomNotDsp.length + ' PO' + (S.tomNotDsp.length > 1 ? 's' : '') + ' with an appointment tomorrow not dispatched yet', "apTab&&apTab('tom');navTo('appt')"]);
    if (S.old.length) alerts.push(['a', '⏳ ' + S.old.length + ' open PO' + (S.old.length > 1 ? 's' : '') + ' older than 14 days · ' + rs(sum(S.old, 'val')), "navTo('desk')"]);
    if (S.grnOld.length) alerts.push(['a', '🧾 ' + S.grnOld.length + ' delivered PO' + (S.grnOld.length > 1 ? 's' : '') + ' without GRN for 15+ days', "navTo('grn')"]);
    if (inboxN()) alerts.push(['v', '📬 ' + inboxN() + ' new PO' + (inboxN() > 1 ? 's' : '') + ' in mail waiting', "navTo('inbox')"]);
    var ag = S.age, an = ['0–2 days', '3–7 days', '8–14 days', '15+ days'];
    box.innerHTML = '<h2>Master overview <span class="h2-sub">' + S.m.rows.length + ' POs in the Master · synced ' + E(when) + '</span> <button class="btn-ghost btn-sm" onclick="msSync()" style="margin-left:8px">⟳ Sync master now</button></h2>'
      + (alerts.length ? '<div style="display:flex;flex-direction:column;gap:4px;margin:6px 0 10px">' + alerts.map(function(a){ return '<div class="lc-note" style="margin:0;cursor:pointer;color:' + (a[0] === 'r' ? 'var(--danger,#e5484d)' : a[0] === 'a' ? 'var(--warn,#d98a00)' : 'inherit') + '" onclick="' + a[2] + '">' + E(a[1]) + ' →</div>'; }).join('') + '</div>' : '<div class="lc-note" style="color:var(--accent2,#1fa971)">✅ Nothing overdue in the Master.</div>')
      + '<div class="cc-kpis" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px;margin:8px 0">'
      + tile('Open POs', S.open.length, rs(sum(S.open, 'val')) + ' open value', "navTo('desk')", '#8f7cff')
      + tile('Packing pending', S.packing.length, sum(S.packing, 'qty').toLocaleString('en-IN') + ' pcs', "navTo('desk')", '#f5a300')
      + tile('Packed / ready', S.ready.length, 'not dispatched yet', "navTo('desk')", '#2ec4b6')
      + tile('In transit', S.transit.length, rs(sum(S.transit, 'val')), "navTo('dlv')", '#43a6ff')
      + tile('Delivered · 30 d', S.deliv30.length, rs(sum(S.deliv30, 'val')), "navTo('dlv')", '#1fa971')
      + tile('GRN pending', S.grnPend.length, S.grnOld.length + ' over 15 days', "navTo('grn')", '#d98a00')
      + tile('Appointments today', S.apToday.length, S.apTom.length + ' tomorrow', "apTab&&apTab('today');navTo('appt')", '#c6f432')
      + tile('Missed appointments', S.missed.length, 'date passed, not delivered', "apTab&&apTab('missed');navTo('appt')", '#e5484d')
      + tile('PO Inbox', inboxN(), 'new POs in mail', "navTo('inbox')", '#ae90ff')
      + tile('Cancelled / RTO', S.cancelled.length, 'in the Master', "navTo('sheet')", '#6b7280')
      + '</div>'
      + '<div class="lc-tabs" style="margin:4px 0"><span class="h2-sub" style="align-self:center">Open PO ageing:</span>' + ag.map(function(L, i){ return '<span class="lc-tab' + (i === 3 && L.length ? ' on' : '') + '">' + an[i] + ' <b>' + L.length + '</b> · ' + rs(sum(L, 'val')) + '</span>'; }).join('') + '</div>'
      + '<details open><summary style="cursor:pointer;margin-top:8px"><b>By channel and warehouse</b></summary>' + table('Channel', group(S, 'ch')) + table('Warehouse', group(S, 'wh')) + '</details>';
  }
  document.addEventListener('po:nav', function(e){ if (e.detail === 'dash'){ last = ''; setTimeout(paint, 30); } });
  if (window.poWatch) poWatch(function(){ if (document.body.dataset.page === 'dash') paint(); });
  setTimeout(paint, 1500);
  window.msDashPaint = function(){ last = ''; paint(); };
})();
