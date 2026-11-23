/* ===== Appointments from the Master Tracker + daily alerts (v5.5) =====
   Reads the rows the app already syncs from the Master Dispatch Tracker (window.msRowsAll).
   Summary tiles, a 7-day strip, tabs (today incl. delivered, tomorrow, next 7 days grouped by date,
   missed, delivered late, requested, ready with no appointment), result marks, menu badge,
   bell notifications, a once-a-day summary and optional desktop notifications. Writes nothing. */
(function(){
  if (window.__apMaster) return; window.__apMaster = 1;
  var KTAB = 'po_ap_tab', KDAY = 'po_ap_alert_day', KNOT = 'po_ap_notify', TAB = 'today', Q = '', DAY = '';
  function $(i){ return document.getElementById(i); }
  function E(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function ls(k, v){ try{ if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; } }
  function d0(){ var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function dO(iso){ var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], m[2] - 1, +m[3]) : null; }
  function ymd(d){ return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function fmt(d){ return d ? d.toLocaleDateString('en-IN', {day: '2-digit', month: 'short', weekday: 'short'}) : '—'; }
  function dd(a, b){ return Math.round((b - a) / 864e5); }
  function rel(n){ return n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : n === -1 ? 'Yesterday' : n < 0 ? (-n) + ' days ago' : 'In ' + n + ' days'; }
  function master(){ try{ return JSON.parse(ls('ms_master') || 'null'); }catch(e){ return null; } }
  function rows(){ try{ return (window.msRowsAll && window.msRowsAll()) || []; }catch(e){ return []; } }
  function closed(r){ return /cancel|\brto\b/i.test((r.stat || '') + ' ' + (r.issue || '')); }
  function isReq(r){ return !r.apOk && /request|pending|await|waiting/i.test(r.apSt || ''); }
  function isRej(r){ return /reject|declin/i.test(r.apSt || ''); }

  /* one record per Master row: appointment date, days from today, delivered-on/late */
  function model(){
    var T = d0();
    return rows().filter(function(r){ return !closed(r); }).map(function(r){
      var a = dO(r.apD), dl = dO(r.delD), x = {r: r, a: a, n: a ? dd(T, a) : null, dl: dl};
      x.late = !!(r.del && a && dl && dl > a);
      x.missed = !!(a && x.n < 0 && !r.del);
      return x; });
  }
  function sortA(L){ return L.sort(function(x, y){ return (x.a || 0) - (y.a || 0) || String(x.r.po).localeCompare(y.r.po); }); }
  function groups(){
    var L = model(), live = L.filter(function(x){ return !x.r.del; });
    var f = function(src, fn){ return sortA(src.filter(fn)); };
    return {
      L: L,
      today: f(L,    function(x){ return x.a && x.n === 0; }),                      // all of today, delivered too
      tom:   f(live, function(x){ return x.a && x.n === 1; }),
      week:  f(live, function(x){ return x.a && x.n >= 0 && x.n <= 7; }),
      missed:f(live, function(x){ return x.missed; }),
      late:  f(L,    function(x){ return x.late && x.n >= -30; }),
      req:   f(live, function(x){ return isReq(x.r); }),
      need:  f(live, function(x){ return !x.a && !x.r.apSt && (x.r.lbl || x.r.packed || x.r.dsp); })
    };
  }
  function onTime(G){   // delivered in the last 30 days with an appointment date: share delivered on/before it
    var d = G.L.filter(function(x){ return x.r.del && x.a && x.n >= -30 && x.n <= 0; });
    if (!d.length) return null;
    return Math.round(d.filter(function(x){ return !x.late; }).length / d.length * 100);
  }
  var TABS = [['today', 'Today'], ['tom', 'Tomorrow'], ['week', 'Next 7 days'], ['missed', 'Missed'],
              ['late', 'Delivered late (30 days)'], ['req', 'Requested, not confirmed'], ['need', 'Ready, no appointment']];

  /* marks */
  function apMark(x){
    var s = x.r.apSt || (x.r.apOk ? 'Confirmed' : '');
    if (x.r.apOk) return '<span class="lc-p g">✅ ' + E(s || 'Confirmed') + '</span>';
    if (isRej(x.r)) return '<span class="lc-p r">❌ ' + E(s) + '</span>';
    if (isReq(x.r)) return '<span class="lc-p a">🕓 ' + E(s) + '</span>';
    return s ? '<span class="lc-p v">' + E(s) + '</span>' : '<span class="lc-p v">➖ Not set</span>';
  }
  function result(x){
    var r = x.r;
    if (r.del) return x.late ? '<span class="lc-p a">📦 Delivered late' + (x.dl ? ' · ' + E(fmt(x.dl)) : '') + '</span>'
                             : '<span class="lc-p g">📦 Delivered' + (x.dl ? ' · ' + E(fmt(x.dl)) : '') + '</span>';
    if (x.missed) return '<span class="lc-p r">⚠️ Missed · ' + (-x.n) + 'd</span>';
    if (r.dsp) return '<span class="lc-p v">🚚 Dispatched</span>';
    if (r.lbl) return '<span class="lc-p a">📋 Ready to dispatch</span>';
    if (r.packed) return '<span class="lc-p a">📦 Packed</span>';
    return '<span class="lc-p a">⏳ Packing pending</span>';
  }
  function relPill(x){ return x.a ? '<span class="lc-p ' + (x.n < 0 ? 'r' : x.n <= 1 ? 'a' : 'v') + '">' + rel(x.n) + '</span>' : ''; }
  function match(x){ if (DAY && (!x.a || ymd(x.a) !== DAY)) return false; if (!Q) return true; var r = x.r;
    return [r.po, r.dist, r.ch, r.zone, r.wh, r.awb, r.car, r.apSt].join(' ').toLowerCase().indexOf(Q) >= 0; }

  var HEAD = ['PO number', 'Distributor', 'Channel', 'Zone', 'WH from', 'Appt date', 'AWB', 'Qty', 'Boxes', 'Transporter', 'Appointment', 'Result'];
  function row(x){ var r = x.r;
    return '<tr><td><b class="mono">' + E(r.po) + '</b></td><td>' + E(r.dist || '—') + '</td><td>' + E(r.ch || '—') + '</td><td>' + E(r.zone || '—')
      + '</td><td>' + E(r.wh || '—') + '</td><td>' + E(fmt(x.a)) + ' ' + relPill(x) + '</td><td class="mono">' + E(r.awb || '—') + '</td><td>' + (r.qty || '—')
      + '</td><td>' + (r.boxes || '—') + '</td><td>' + E(r.car || '—') + '</td><td>' + apMark(x) + '</td><td>' + result(x) + '</td></tr>'; }
  function table(list, byDate){
    if (!list.length) return '<div class="lc-empty">' + (DAY || Q ? 'Nothing matches this filter.' : 'No appointments here.') + '</div>';
    var body = '', last = null;
    list.forEach(function(x){
      if (byDate){ var k = x.a ? ymd(x.a) : ''; if (k !== last){ last = k;
        var n = list.filter(function(y){ return (y.a ? ymd(y.a) : '') === k; }), q = n.reduce(function(s, y){ return s + (+y.r.qty || 0); }, 0);
        body += '<tr><td colspan="' + HEAD.length + '" style="font-weight:700;padding-top:14px">' + E(x.a ? fmt(x.a) + ' · ' + rel(x.n) : 'No date') + ' — ' + n.length + ' PO' + (n.length > 1 ? 's' : '') + ' · ' + q + ' qty</td></tr>'; } }
      body += row(x); });
    return '<div class="lc-tw"><table class="lc-t"><thead><tr>' + HEAD.map(function(h){ return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }
  function kpi(tab, label, val, sub, col){
    return '<button class="kpi" style="--kc:' + col + '" onclick="apTab(\'' + tab + '\')"><small>' + E(label) + '</small><b>' + val + '</b><span>' + E(sub) + '</span></button>'; }
  function strip(G){
    var T = d0(), out = [];
    for (var i = 0; i <= 7; i++){ var d = new Date(T); d.setDate(T.getDate() + i); var k = ymd(d);
      var n = (i === 0 ? G.today : G.week).filter(function(x){ return x.a && ymd(x.a) === k; }).length;
      out.push('<button class="lc-tab ' + (DAY === k ? 'on' : '') + '" onclick="apDay(\'' + k + '\')">' + E(d.toLocaleDateString('en-IN', {weekday: 'short', day: '2-digit', month: 'short'})) + ' <b>' + n + '</b></button>'); }
    return '<div class="lc-tabs" aria-label="Appointments by date"><span class="h2-sub" style="align-self:center;margin-right:4px">By date</span>' + out.join('') + (DAY ? '<button class="lc-tab" onclick="apDay(\'\')">Show all dates ✕</button>' : '') + '</div>';
  }

  function paint(){
    var box = $('apMaster'), host = $('lcBody');
    if (!host) return;
    if (!box){ box = document.createElement('div'); box.id = 'apMaster'; box.className = 'card'; host.parentNode.insertBefore(box, host); }
    var on = document.body.dataset.nav === 'appt'; box.style.display = on ? '' : 'none'; if (!on) return;
    var m = master(), R = rows();
    if (!R.length){
      box.innerHTML = '<h2>Appointments from your Master Tracker</h2><div class="lc-empty">Your Master Tracker is not synced in this browser yet. Sync it once and every appointment, '
        + 'with today, tomorrow and the next 7 days, shows up here automatically.<br><br><button class="btn-main btn-sm" onclick="msOpen()">Sync master sheet</button></div>';
      return;
    }
    var G = groups(), cur = G[TAB] ? TAB : 'today', list = G[cur].filter(match), ot = onTime(G);
    var todayOpen = G.today.filter(function(x){ return !x.r.del; }).length;
    var when = m && m.at ? new Date(m.at).toLocaleString('en-IN', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}) : '';
    var notif = ls(KNOT) === '1' && window.Notification && Notification.permission === 'granted';
    var focus = document.activeElement && document.activeElement.id === 'apQ';
    var aopen = ls('po_ap_open') !== '0';
    box.innerHTML = '<details' + (aopen ? ' open' : '') + ' ontoggle="apOpen(this.open)"><summary style="cursor:pointer;display:flex;align-items:center;gap:10px;flex-wrap:wrap;list-style-position:inside"><b style="font-size:18px">Appointments from your Master Tracker</b> <span class="h2-sub">' + R.length + ' POs' + (when ? ' · synced ' + E(when) : '') + '</span>'
      + '<span class="h2-sub">' + G.today.length + ' today · ' + G.tom.length + ' tomorrow · ' + G.week.length + ' next 7 days' + (G.missed.length ? ' · <span style="color:var(--danger,#e5484d)">⚠ ' + G.missed.length + ' missed</span>' : '') + '</span></summary>'
      + (G.missed.length ? '<div class="lc-note" style="color:var(--danger,#e5484d)"><b>⚠️ ' + G.missed.length + ' missed appointment' + (G.missed.length > 1 ? 's' : '') + '</b>: the date has passed and the PO is not marked delivered. '
        + '<button class="linkbtn" onclick="apTab(\'missed\')">Review them</button></div>' : '')
      + '<div class="cc-kpis" style="margin:12px 0">'
      + kpi('today', 'Today', G.today.length, todayOpen ? todayOpen + ' not delivered yet' : (G.today.length ? 'all delivered' : 'none booked'), '#f5a300')
      + kpi('tom', 'Tomorrow', G.tom.length, G.tom.filter(function(x){ return !x.r.dsp; }).length + ' still to dispatch', '#8f7cff')
      + kpi('week', 'Next 7 days', G.week.length, G.week.reduce(function(s, x){ return s + (+x.r.qty || 0); }, 0) + ' qty', '#43a6ff')
      + kpi('missed', 'Missed', G.missed.length, 'date passed, not delivered', '#e5484d')
      + kpi('req', 'Requested', G.req.length, 'waiting for buyer confirmation', '#d98a00')
      + kpi('late', 'On-time delivery', ot == null ? '—' : ot + '%', 'last 30 days · ' + G.late.length + ' late', '#1fa971')
      + '</div>'
      + strip(G)
      + '<div class="lc-tabs">' + TABS.map(function(t){ return '<button class="lc-tab ' + (cur === t[0] ? 'on' : '') + '" onclick="apTab(\'' + t[0] + '\')">' + E(t[1]) + ' <b>' + G[t[0]].length + '</b></button>'; }).join('') + '</div>'
      + '<div class="hx-tools"><input id="apQ" type="search" style="flex:1;min-width:260px" placeholder="Search PO, distributor, AWB, transporter" value="' + E(Q) + '" oninput="apSearch(this.value)">'
      + '<button class="btn-ghost btn-sm" onclick="apCopy()">Copy list for WhatsApp</button>'
      + '<button class="btn-ghost btn-sm" onclick="msSync()">Sync master now</button>'
      + '<button class="btn-ghost btn-sm" onclick="apNotify()">' + (notif ? 'Desktop alerts: on' : 'Turn on desktop alerts') + '</button></div>'
      + table(list, cur === 'week' && !DAY) + '</details>';
    if (focus){ var q = $('apQ'); if (q){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
  }

  window.apOpen = function(o){ ls('po_ap_open', o ? '1' : '0'); };
  window.apTab = function(t){ TAB = t; DAY = ''; ls(KTAB, t); paint(); };
  window.apDay = function(k){ DAY = k; TAB = k === ymd(d0()) ? 'today' : 'week'; paint(); };
  window.apSearch = function(v){ Q = String(v || '').trim().toLowerCase(); paint(); };
  window.apCopy = function(){
    var G = groups(), cur = G[TAB] ? TAB : 'today', list = G[cur].filter(match), name = (TABS.filter(function(t){ return t[0] === cur; })[0] || [0, ''])[1];
    if (DAY){ var dd_ = dO(DAY); name = fmt(dd_); }
    if (!list.length){ window.showToast && showToast('Nothing to copy in ' + name); return; }
    var txt = '*Appointments: ' + name + ' (' + fmt(d0()) + ')*\n' + list.map(function(x, i){ var r = x.r;
      var res = r.del ? (x.late ? 'Delivered late' : 'Delivered') : x.missed ? 'MISSED' : r.dsp ? 'Dispatched' : 'Not dispatched';
      return (i + 1) + '. ' + r.po + ' · ' + (r.dist || r.ch || '') + ' · ' + (r.wh || '') + ' · ' + fmt(x.a) + ' · ' + (r.qty || 0) + ' qty · ' + (r.boxes || 0) + ' box · '
        + (r.car || '—') + (r.awb ? ' · AWB ' + r.awb : '') + ' · ' + (r.apSt || (r.apOk ? 'Confirmed' : 'Not set')) + ' · ' + res; }).join('\n');
    try{ copyText(txt); window.showToast && showToast(list.length + ' appointments copied. Paste into WhatsApp.'); }catch(e){ window.showToast && showToast('Could not copy'); }
  };
  window.apNotify = function(){
    if (!window.Notification){ window.showToast && showToast('This browser does not support desktop notifications'); return; }
    if (ls(KNOT) === '1' && Notification.permission === 'granted'){ ls(KNOT, '0'); window.showToast && showToast('Desktop alerts turned off'); paint(); return; }
    Notification.requestPermission().then(function(p){
      if (p === 'granted'){ ls(KNOT, '1'); window.showToast && showToast('Desktop alerts on. You get one each day while this tab is open.'); }
      else window.showToast && showToast('Notifications are blocked for this site in your browser settings');
      paint();
    });
  };

  /* bell notifications (hooked into the existing notification centre) */
  window.apAlerts = function(){
    if (!rows().length) return [];
    var G = groups(), a = [], todayOpen = G.today.filter(function(x){ return !x.r.del; }).length;
    if (G.missed.length) a.push({c: 'var(--danger)', t: G.missed.length + ' missed appointment' + (G.missed.length > 1 ? 's' : ''), s: 'Date passed, not delivered. Check delivery or reschedule', go: 'appt'});
    if (todayOpen) a.push({c: 'var(--warn)', t: todayOpen + ' appointment' + (todayOpen > 1 ? 's' : '') + ' today', s: 'Not delivered yet. Make sure they are on the way', go: 'appt'});
    if (G.tom.length) a.push({c: 'var(--accent)', t: G.tom.length + ' appointment' + (G.tom.length > 1 ? 's' : '') + ' tomorrow', s: 'Plan dispatch today', go: 'appt'});
    return a;
  };

  /* menu badge: today not delivered + missed */
  function badge(){
    var b = document.querySelector('#side button[data-n="appt"]'); if (!b) return;
    var q = $('nbAppt'); if (!q){ q = document.createElement('q'); q.id = 'nbAppt'; b.appendChild(q); }
    var n = 0; if (rows().length){ var G = groups(); n = G.today.filter(function(x){ return !x.r.del; }).length + G.missed.length; }
    q.style.display = n ? '' : 'none'; q.textContent = n; q.title = n ? n + ' appointments today or missed' : '';
  }

  /* once-a-day summary (and desktop notification if turned on) */
  function daily(){
    if (!rows().length) return;
    var key = ymd(d0()); if (ls(KDAY) === key) return;
    var G = groups(); ls(KDAY, key);
    if (!G.today.length && !G.tom.length && !G.missed.length) return;
    var msg = 'Appointments: ' + G.today.length + ' today, ' + G.tom.length + ' tomorrow' + (G.missed.length ? ', ' + G.missed.length + ' missed (date passed, not delivered)' : '');
    var p = $('apDaily'); if (p) p.remove();
    p = document.createElement('div'); p.id = 'apDaily'; p.className = 'card'; p.setAttribute('role', 'alert');
    p.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:1500;max-width:360px;margin:0;box-shadow:0 18px 40px -12px rgba(0,0,0,.45)';
    p.innerHTML = '<b>Today\'s appointments</b><div class="hint" style="margin:6px 0 12px">' + E(msg) + '</div>'
      + '<div class="row" style="margin:0"><button class="btn-main btn-sm" onclick="apTab(\'' + (G.missed.length ? 'missed' : G.today.length ? 'today' : 'tom') + '\');navTo(\'appt\');this.closest(\'#apDaily\').remove()">View appointments</button>'
      + '<button class="btn-ghost btn-sm" onclick="this.closest(\'#apDaily\').remove()">Dismiss</button></div>';
    document.body.appendChild(p);
    if (ls(KNOT) === '1' && window.Notification && Notification.permission === 'granted'){
      try{ var n = new Notification('PO Punch: today\'s appointments', {body: msg, tag: 'po-appt-' + key}); n.onclick = function(){ window.focus(); navTo('appt'); n.close(); }; }catch(e){}
    }
  }

  var s = ls(KTAB); if (s && s !== 'over') TAB = s;
  var _n = window.navTo; window.navTo = function(k){ _n(k); paint(); };
  function tick(){ try{ badge(); if (document.body.dataset.nav === 'appt' && !(document.activeElement && document.activeElement.id === 'apQ')) paint(); daily(); }catch(e){ console.error('appointments', e); } }
  var _sync = window.msSync;            // refresh right after a Master sync finishes
  if (_sync) window.msSync = function(){ var r = _sync.apply(this, arguments); setTimeout(tick, 1500); setTimeout(tick, 6000); return r; };
  setTimeout(tick, 2500); setInterval(tick, 60000);
  window.apMasterPaint = paint;
})();
