/* ===== Dispatch Management follows the Master Tracker (v6.0) =====
   The Master (synced into ms_master) is the source of truth for each PO's stage:
     cancelled / RTO -> removed · delivered or dispatched -> Dispatched (4) · label -> Ready for Dispatch (3)
     packed -> Packing Completed (2) · not packed -> stays Processing / Packing Pending (0/1).
   A board change made after the last Master sync is kept (it has not reached the Master yet).
   Open Master POs (not dispatched, not cancelled, PO date within 45 days) are added to the board.
   Channel, warehouse, zone, distributor, qty, value and boxes are taken from the Master. */
(function(){
  if (window.__dkMaster) return; window.__dkMaster = 1;
  var DAYS = 45;
  function $(i){ return document.getElementById(i); }
  function E(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function master(){ try{ var m = JSON.parse(localStorage.getItem('ms_master') || 'null'); return m && m.rows && m.rows.length ? m : null; }catch(e){ return null; } }
  function key(po){ return String(po || '').trim().toLowerCase(); }
  function closed(r){ return /cancel|\brto\b/i.test((r.stat || '') + ' ' + (r.issue || '')); }
  function stOf(r){ return (r.del || r.dsp) ? 4 : r.lbl ? 3 : r.packed ? 2 : -1; }   // -1 = not packed per Master
  function ms(d){ var m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? new Date(+m[1], m[2] - 1, +m[3], 10).getTime() : 0; }
  function setStage(x, s, when){ var t = (x.t || []).slice(0, s + 1); while (t.length < s + 1) t.push(when); t[s] = when; x.t = t; x.stage = s; }
  var last = null;

  function sync(manual){
    var M = master(); if (!M){ if (manual) try{ showToast('Sync your Master Tracker first (Sync master sheet)'); }catch(e){} paintBar(); return null; }
    var d = dkLoad(), at = +M.at || Date.now(), by = {}, S = {moved: {}, added: 0, removed: 0, kept: 0, filled: 0, notIn: 0, total: M.rows.length, at: at};
    M.rows.forEach(function(r){ if (r && r.po) by[key(r.po)] = r; });
    var keep = [];
    d.items.forEach(function(x){
      var r = by[key(x.po)];
      if (!r){ if (x.stage < 4) S.notIn++; keep.push(x); return; }
      if (closed(r)){ S.removed++; return; }                                   // cancelled / RTO in the Master
      var f = 0;                                                               // details from the Master
      [['chan', r.ch], ['wh', r.wh], ['zone', r.zone], ['to', r.dist]].forEach(function(p){ if (p[1] && x[p[0]] !== p[1]){ x[p[0]] = p[1]; f = 1; } });
      if (r.qty > 0 && +x.qty !== r.qty){ x.qty = r.qty; f = 1; } if (r.val > 0 && Math.abs((+x.val || 0) - r.val) > 0.5){ x.val = r.val; f = 1; }
      if (r.boxes > 0 && String(x.boxes) !== String(r.boxes)){ x.boxes = String(r.boxes); f = 1; }
      if (f) S.filled++;
      var want = stOf(r), lastT = (x.t && x.t.length) ? x.t[x.t.length - 1] : 0;
      if (want === -1){                                                        // Master: not packed yet
        if (x.stage >= 2){ if (lastT > at){ S.kept++; } else { setStage(x, 1, at); S.moved['Packing Pending'] = (S.moved['Packing Pending'] || 0) + 1; } }
      } else if (want !== x.stage){
        if (want < x.stage && lastT > at){ S.kept++; }                          // newer board change, not in the Master yet
        else { setStage(x, want, want === 4 ? (ms(r.dspD) || ms(r.delD) || at) : at); var n = DK_ST[want]; S.moved[n] = (S.moved[n] || 0) + 1; }
      }
      keep.push(x);
    });
    var have = {}; keep.forEach(function(x){ have[key(x.po)] = 1; });
    var cut = Date.now() - DAYS * 864e5;
    M.rows.forEach(function(r){
      if (!r || !r.po || have[key(r.po)] || closed(r) || r.dsp || r.del) return;
      var t0 = ms(r.d); if (t0 && t0 < cut) return;
      var x = {po: r.po, chan: r.ch || '', wh: r.wh || '', zone: r.zone || '', to: r.dist || '', val: +r.val || 0, qty: +r.qty || 0, addr: '', boxes: r.boxes > 0 ? String(r.boxes) : '', row: '', stage: 0, t: [t0 || at], src: 'master'};
      var s = stOf(r); if (s > 0) setStage(x, s, at);
      keep.push(x); have[key(r.po)] = 1; S.added++;
    });
    d.items = keep; dkSave(d);
    var prev = last; if (!prev){ try{ prev = JSON.parse(localStorage.getItem('po_dk_ms') || 'null'); }catch(e){} }
    var none = !Object.keys(S.moved).length && !S.added && !S.removed && !S.filled;
    if (none && prev && prev.at === S.at){ S.moved = prev.moved; S.added = prev.added; S.removed = prev.removed; S.filled = prev.filled; }   // keep what this Master sync changed
    last = S; try{ localStorage.setItem('po_dk_ms', JSON.stringify(S)); }catch(e){}
    try{ dkRender(); }catch(e){}
    paintBar();
    if (manual) try{ showToast('Dispatch board synced with the Master'); }catch(e){}
    return S;
  }
  window.dkMasterSync = function(){ return sync(true); };

  function paintBar(){
    var list = $('dkList'); if (!list) return;
    var bar = $('dkMsBar'); if (!bar){ bar = document.createElement('div'); bar.id = 'dkMsBar'; bar.className = 'lc-note'; bar.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:8px 0';
      list.parentNode.insertBefore(bar, list); }
    var S = last; if (!S){ try{ S = JSON.parse(localStorage.getItem('po_dk_ms') || 'null'); }catch(e){} }
    var M = master();
    if (!M){ bar.innerHTML = '<span>The board follows your Master Tracker once it is synced.</span><button class="btn-main btn-sm" onclick="msOpen()">Sync master sheet</button>'; return; }
    var when = new Date(+M.at).toLocaleString('en-IN', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'});
    var bits = [];
    if (S){ Object.keys(S.moved).forEach(function(k){ bits.push(S.moved[k] + ' → ' + k); });
      if (S.added) bits.push(S.added + ' added from Master'); if (S.removed) bits.push(S.removed + ' cancelled/RTO removed');
      if (S.filled) bits.push(S.filled + ' details updated'); if (S.kept) bits.push(S.kept + ' newer board change' + (S.kept > 1 ? 's' : '') + ' kept (send with Update Master)'); }
    bar.innerHTML = '<span>📗 <b>Following the Master</b> · ' + E(M.rows.length) + ' POs · synced ' + E(when) + (bits.length ? ' · ' + E(bits.join(' · ')) : ' · everything matches') + '</span>'
      + (S && S.notIn ? '<span style="color:var(--warn,#d98a00)">⚠ ' + S.notIn + ' PO' + (S.notIn > 1 ? 's' : '') + ' on the board ' + (S.notIn > 1 ? 'are' : 'is') + ' not in the Master yet</span>' : '')
      + '<button class="btn-ghost btn-sm" onclick="dkMasterSync()">⟳ Sync with Master</button>';
  }

  var seen = 0;
  function tick(){ try{ var M = master(); if (M && +M.at !== seen){ seen = +M.at; sync(false); } else paintBar(); }catch(e){ console.error('dispatch/master', e); } }
  var _n = window.navTo; window.navTo = function(k){ _n(k); if (k === 'desk') setTimeout(function(){ try{ sync(false); }catch(e){} }, 30); };
  var _s = window.msSync; if (_s) window.msSync = function(){ var r = _s.apply(this, arguments); setTimeout(tick, 1500); setTimeout(tick, 6000); return r; };
  setTimeout(tick, 1800); setInterval(tick, 30000);
})();
