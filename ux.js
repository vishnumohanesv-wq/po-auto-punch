/* ===== Less scrolling (v5.8): compact density, PO Processing jump bar, back to top =====
   Compact changes spacing and the oversized page titles only: every look keeps its colours,
   fonts, shapes and animations. Switch with the "Compact" button next to Style (remembered). */
(function(){
  if (window.__poUx) return; window.__poUx = 1;
  function $(i){ return document.getElementById(i); }
  function ls(k, v){ try{ if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){ return null; } }
  var H = document.documentElement;
  function dens(){ return H.getAttribute('data-density') || 'compact'; }

  var CSS = [
    /* page header: the oversized titles are the main source of scrolling */
    'html[data-density="compact"] .pagehead h1,html[data-density="compact"] #pageTitle{font-size:clamp(26px,2.6vw,38px)!important;line-height:1.08!important;margin-bottom:4px!important;letter-spacing:-.02em}',
    'html[data-density="compact"] .pagehead{padding-top:6px!important;padding-bottom:10px!important;margin-bottom:12px!important;gap:10px!important}',
    'html[data-density="compact"] .pagehead .sub{font-size:13px!important;margin-top:2px!important}',
    /* cards, tiles, sections */
    'html[data-density="compact"] .wrap .card{padding:14px 16px!important;margin-bottom:12px!important}',
    'html[data-density="compact"] .wrap .card>h2{margin-bottom:8px!important}',
    'html[data-density="compact"] .kpi,html[data-density="compact"] .cc-k,html[data-density="compact"] .tcard,html[data-density="compact"] .cc-tile{padding:10px 12px!important;min-height:0!important}',
    'html[data-density="compact"] .cc-kpis,html[data-density="compact"] .totals{gap:8px!important;margin-bottom:10px!important}',
    'html[data-density="compact"] .sec-title{margin-top:10px!important}',
    'html[data-density="compact"] .lc-tabs{margin:6px 0!important;gap:6px!important}',
    'html[data-density="compact"] .lc-note{margin:4px 0!important}',
    /* tables */
    'html[data-density="compact"] .wrap td,html[data-density="compact"] .wrap th{padding-top:6px!important;padding-bottom:6px!important}',
    'html[data-density="compact"] .edit-input{padding-top:5px!important;padding-bottom:5px!important}',
    /* sidebar */
    'html[data-density="compact"] #side nav button{padding-top:6px!important;padding-bottom:6px!important}',
    /* jump bar + back to top (both densities) */
    '#jumpBar{position:sticky;top:0;z-index:40;display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:8px 10px;margin:0 0 12px;border-radius:12px;'
      + 'background:color-mix(in srgb,var(--panel,#1b1b1f) 88%,transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid var(--border,rgba(127,127,127,.25))}',
    '#jumpBar b{font-size:12px;opacity:.7;margin-right:4px}',
    '#toTop{position:fixed;right:18px;bottom:18px;z-index:1400;display:none}',
    '.card.is-folded>:not(h2){display:none!important}',
    '.card.is-folded>h2{margin-bottom:0!important}',
    '#qcBox.is-folded{display:none!important}'
  ].join('\n');

  function css(){ if ($('poUxCss')) return; var s = document.createElement('style'); s.id = 'poUxCss'; s.textContent = CSS; document.head.appendChild(s); }

  /* Compact switch next to the Style button */
  function btn(){
    var st = $('styleBtn'); if (!st || $('densBtn')) { label(); return; }
    var b = document.createElement('button'); b.id = 'densBtn'; b.className = st.className; b.type = 'button';
    b.title = 'Compact layout: less spacing, less scrolling. Your look and animations stay the same.';
    b.onclick = function(){ setDens(dens() === 'compact' ? 'comfortable' : 'compact'); };
    st.parentNode.insertBefore(b, st); label();
  }
  function label(){ var b = $('densBtn'); if (b) b.textContent = dens() === 'compact' ? '▤ Compact' : '☰ Comfortable'; }
  function setDens(d){ H.setAttribute('data-density', d); ls('po_density', d); label();
    try{ window.showToast && showToast(d === 'compact' ? 'Compact layout on: less scrolling' : 'Comfortable layout: original spacing'); }catch(e){} }
  window.poSetDensity = setDens;

  /* PO Processing jump bar */
  var JUMPS = [['pdfStatus', 'Check'], ['poChk', 'Before you punch'], ['totals', 'Totals'], ['outputCard', 'Rows'], ['rowsBox', 'Copy all rows'], ['refCard', 'PO details'], ['rowCard', 'Master row'], ['dashCard', 'Summary']];
  function shown(el){ return el && el.offsetParent !== null && el.getClientRects().length > 0 && (el.textContent || '').trim().length > 0; }
  function scroller(){ var e = $('viewConvert') || document.body;
    for (var p = e.parentElement; p && p !== document.body; p = p.parentElement){ var cs = getComputedStyle(p); if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 4) return p; }
    return document.scrollingElement || document.documentElement; }
  window.poJump = function(id){ var el = $(id); if (!el) return; var bar = $('jumpBar');
    el.style.scrollMarginTop = ((bar ? bar.offsetHeight : 0) + 14) + 'px'; el.scrollIntoView({behavior: 'smooth', block: 'start'}); };
  function jump(){
    var view = $('viewConvert'); if (!view) return;
    var on = document.body.dataset.nav === 'convert' && shown($('outputCard'));
    var bar = $('jumpBar');
    if (!on){ if (bar) bar.style.display = 'none'; return; }
    if (!bar){ bar = document.createElement('div'); bar.id = 'jumpBar'; bar.setAttribute('aria-label', 'Jump to section'); view.insertBefore(bar, view.firstChild); }
    var html = '<b>Jump to</b>' + JUMPS.filter(function(j){ return shown($(j[0])); }).map(function(j){ return '<button class="btn-ghost btn-sm" onclick="poJump(\'' + j[0] + '\')">' + j[1] + '</button>'; }).join('');
    if (bar.innerHTML !== html) bar.innerHTML = html; bar.style.display = '';
  }

  /* PO Processing: punch-ready rows straight after the totals (main action first) */
  function arrange(){ var o = $('outputCard'), t = $('totals'), r = $('refCard');
    if (o && t && r && o.dataset.moved !== '1' && t.parentNode === o.parentNode){ t.parentNode.insertBefore(o, r); o.dataset.moved = '1'; } }

  /* fold buttons on section cards; Quick copy folded behind a button */
  var FOLD_DEF = {dashCard: 1, qcBox: 1};
  function folds(){ try{ return JSON.parse(ls('po_fold') || '{}'); }catch(e){ return {}; } }
  function isFolded(id){ var f = folds(); return f[id] == null ? !!FOLD_DEF[id] : !!f[id]; }
  window.poFold = function(id){ var f = folds(); f[id] = isFolded(id) ? 0 : 1; ls('po_fold', JSON.stringify(f)); foldify(); };
  function foldify(){
    ['outputCard', 'refCard', 'rowCard', 'dashCard'].forEach(function(id){ var c = $(id); if (!c) return; var h = c.querySelector(':scope > h2'); if (!h) return;
      var b = h.querySelector('.fold-btn'); if (!b){ b = document.createElement('button'); b.className = 'btn-ghost btn-sm fold-btn'; b.type = 'button'; b.style.marginLeft = '8px';
        b.onclick = function(e){ e.stopPropagation(); poFold(id); }; h.appendChild(b); }
      var fo = isFolded(id); c.classList.toggle('is-folded', fo); b.textContent = fo ? '▸ Show' : '▾ Hide'; b.title = fo ? 'Show this section' : 'Fold this section'; });
    var q = $('qcBox'); if (q){ var qb = $('qcFoldBtn');
      if (!qb){ qb = document.createElement('button'); qb.id = 'qcFoldBtn'; qb.className = 'btn-ghost btn-sm'; qb.type = 'button'; qb.style.margin = '6px 0'; qb.onclick = function(){ poFold('qcBox'); }; q.parentNode.insertBefore(qb, q); }
      var qf = isFolded('qcBox'); q.classList.toggle('is-folded', qf); qb.textContent = qf ? '▸ Show quick copy chips' : '▾ Hide quick copy chips'; }
  }

  /* back to top */
  function top(){
    var t = $('toTop'); if (!t){ t = document.createElement('button'); t.id = 'toTop'; t.className = 'btn-ghost btn-sm'; t.textContent = '↑ Top'; t.title = 'Back to top';
      document.body.appendChild(t); }
    var s = scroller(); t.onclick = function(){ s.scrollTo({top: 0, behavior: 'smooth'}); };
    t.style.display = (s.scrollTop || window.scrollY) > 700 ? '' : 'none';
  }

  function boot(){ if (!H.getAttribute('data-density')) H.setAttribute('data-density', ls('po_density') || 'compact');
    css(); btn(); arrange(); foldify(); jump(); top();
    document.addEventListener('scroll', function(){ top(); }, {passive: true, capture: true});
    setInterval(function(){ try{ btn(); arrange(); foldify(); jump(); }catch(e){} }, 1200);
    var _n = window.navTo; window.navTo = function(k){ _n(k); setTimeout(jump, 50); }; }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
})();
