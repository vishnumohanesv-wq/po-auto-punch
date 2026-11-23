/* ===== New POs from mail (v6.1) =====
   Talks to the "PO Mail Watcher" Apps Script (POST, key in the body). New PO emails are listed here;
   each is downloaded and run through the normal PO reader (same spot check as an upload), then marked
   processed in Gmail, and the result is emailed by the script to NOTIFY_TO (vishnu@tucokids.com). */
(function(){
  if (window.__poMail) return; window.__poMail = 1;
  var KU = 'po_pm_url', KK = 'po_pm_key', KA = 'po_pm_auto', KL = 'po_pm_last', KDONE = 'po_pm_done';
  var ITEMS = [], BUSY = false, ERR = '', LASTUSE = 0, OPEN = false;
  function $(i){ return document.getElementById(i); }
  function E(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function ls(k, v){ try{ if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){ return null; } }
  function toast(m){ try{ showToast(m); }catch(e){} }
  function cfg(){ return {url: ls(KU) || '', key: ls(KK) || ''}; }
  function ready(){ var c = cfg(); return /^https:\/\/script\.google(usercontent)?\.com\//.test(c.url) && c.key; }
  function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
  ['pointerdown', 'keydown'].forEach(function(ev){ document.addEventListener(ev, function(){ LASTUSE = Date.now(); }, true); });

  async function api(action, extra){
    var c = cfg(); if (!ready()) throw new Error('Mail watcher not set up');
    var body = Object.assign({key: c.key, action: action}, extra || {});
    var r = await fetch(c.url, {method: 'POST', body: JSON.stringify(body)});      // text/plain: no CORS preflight
    var j = await r.json(); if (!j.ok) throw new Error(j.error || 'Mail watcher error'); return j;
  }
  function done(){ try{ return JSON.parse(ls(KDONE) || '{}'); }catch(e){ return {}; } }
  function markLocal(id, res){ var d = done(); d[id] = res; var k = Object.keys(d); if (k.length > 300) k.slice(0, k.length - 300).forEach(function(x){ delete d[x]; }); ls(KDONE, JSON.stringify(d)); }

  /* ---------- check mail ---------- */
  async function refresh(force){
    if (!ready()){ paint(); return; }
    try{ var j = await api(force ? 'check' : 'list'); ERR = ''; var d = done();
      ITEMS = (j.items || []).filter(function(x){ return !d[x.id]; }); ls(KL, String(Date.now()));
      var fresh = ITEMS.filter(function(x){ return x.status === 'new'; });
      if (fresh.length) desk(fresh);
      paint(); badge();
      if (fresh.length && ls(KA) !== '0' && canAuto()) processAll(true);
    }catch(e){ ERR = String(e.message || e); paint(); }
  }
  window.pmCheck = function(){ toast('Checking mail…'); refresh(true); };
  var notified = {};
  function desk(list){   // desktop notification once per mail (uses the permission from Appointments, if given)
    var n = list.filter(function(x){ return !notified[x.id]; }); n.forEach(function(x){ notified[x.id] = 1; });
    if (!n.length) return;
    try{ if (ls('po_ap_notify') === '1' && window.Notification && Notification.permission === 'granted'){
      var by = {}; n.forEach(function(x){ by[x.channel] = (by[x.channel] || 0) + 1; });
      var t = new Notification('PO Punch: ' + n.length + ' new PO' + (n.length > 1 ? 's' : '') + ' in mail', {body: Object.keys(by).map(function(k){ return k + ' ' + by[k]; }).join(' · '), tag: 'po-mail-' + n[0].id});
      t.onclick = function(){ window.focus(); navTo('inbox'); t.close(); }; } }catch(e){}
  }
  function canAuto(){ // don't take over PO Processing while someone is working on a PO there
    var busyHere = document.body.dataset.nav === 'convert' && (typeof lastItems !== 'undefined' && lastItems && lastItems.length) && Date.now() - LASTUSE < 3 * 60e3;
    return !BUSY && !busyHere;
  }

  /* ---------- check & process one PO ---------- */
  function b64file(j){ var bin = atob(j.b64), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return new File([u], j.name, {type: j.mime || (/\.pdf$/i.test(j.name) ? 'application/pdf' : '')}); }
  function g(n){ try{ return eval(n); }catch(e){ return undefined; } }
  function summary(item){
    var ps = (($('pdfStatus') || {}).innerText || '').replace(/\n{2,}/g, '\n').trim();
    var R = g('rows') || [], q = 0, v = 0; R.forEach(function(r){ q += +r.qty || 0; v += (+r.qty || 0) * (+r.price || 0); });
    var po = ''; try{ po = hdrVal('PO Number') || ''; }catch(e){}
    var chk = (($('poChk') || {}).textContent || ''), corr = (chk.match(/⚠ \d+ corrected · [+−]₹[\d,.]+/) || [''])[0];
    var bad = /error to check|⚠|could not|not a |unmapped|mismatch|not found|nothing readable/i.test(ps) || !R.length;
    var lines = [(bad ? '⚠ CHECK' : '✔ Checks passed') + ' · ' + (item.channel || '') + ' · PO ' + (po || item.po || '—'),
      R.length ? R.length + ' SKU rows · ' + q + ' pcs · ₹' + v.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' (EasyEcom rows ready)' : 'No punch rows were produced.',
      corr ? corr.replace('⚠', 'MRP correction:') : ''].filter(String);
    ps.split('\n').slice(0, 8).forEach(function(l){ if (l.trim()) lines.push('  ' + l.trim()); });
    return {ok: !bad, po: po || item.po, text: lines.join('\n')};
  }
  async function processOne(item, quiet){
    if (!item.files || !item.files.length){ toast('No PO file in that mail. Open the mail.'); return null; }
    var files = [];
    for (var i = 0; i < item.files.length; i++){ var j = await api('file', {fileId: item.files[i]}); files.push(b64file(j)); }
    var pdfs = files.filter(function(f){ return /\.pdf$/i.test(f.name); }), use = pdfs.length ? pdfs : files;   // FirstCry sends PDF + Excel: the PDF is read
    if (document.body.dataset.page !== 'convert' && !quiet) navTo('convert');
    var ps0 = $('pdfStatus'); if (ps0) ps0.innerHTML = '<span data-pm="1">📬 Reading ' + E(use.map(function(f){ return f.name; }).join(', ')) + ' from mail…</span>';
    var rows0 = g('rows');
    await hgRoute(use);
    var fin = false;                                                            // wait for the reader's real result (2-page PDFs can take a while)
    for (var t = 0; t < 90; t++){ await sleep(500); var el = $('pdfStatus'); if (!el) break;
      var busy = el.querySelector('[data-pm],.skel') || !el.innerText.trim() || /^reading/i.test(el.innerText.trim());
      if (!busy){ fin = true; break; } }
    await sleep(500);
    var s = summary(item), rows1 = g('rows') || [];
    var read = fin && rows1.length && rows1 !== rows0;
    if (!read){                                                                 // nothing was read: keep it as new, don't mark processed, don't email
      s.ok = false; s.failed = true;
      s.text = '⚠ Could not read this PO automatically (' + use.map(function(f){ return f.name; }).join(', ') + '). Open the mail and upload the PO, or press Retry.\n' + s.text;
      item.failed = s.text; return s;
    }
    try{ await api('done', {id: item.id, po: s.po, ok: s.ok, result: s.text}); }catch(e){ s.text += '\n(could not report back: ' + e.message + ')'; }
    markLocal(item.id, {at: Date.now(), ok: s.ok, po: s.po, ch: item.channel, text: s.text, id: item.id});
    ITEMS = ITEMS.filter(function(x){ return x.id !== item.id; });
    return s;
  }
  window.pmProcess = async function(id){
    var it = ITEMS.filter(function(x){ return x.id === id; })[0]; if (!it || BUSY) return;
    BUSY = true; paint(); try{ var s = await processOne(it, false); if (s) toast((s.ok ? '✅ ' : '⚠ ') + 'PO ' + s.po + (s.ok ? ' checked & processed' : ': please check')); }
    catch(e){ toast('Could not process: ' + e.message); } BUSY = false; paint(); badge();
  };
  async function processAll(auto){
    var list = ITEMS.filter(function(x){ return x.status === 'new' && !needsPdf(x) && !(auto && x.failed); }); if (!list.length || BUSY) return;
    BUSY = true; paint(); var ok = 0, chk = 0;
    for (var i = 0; i < list.length; i++){ try{ var s = await processOne(list[i], auto); if (s){ if (s.ok) ok++; else chk++; } }catch(e){ chk++; } paint(); }
    BUSY = false; paint(); badge();
    toast('📬 ' + list.length + ' mail PO' + (list.length > 1 ? 's' : '') + ' processed · ' + ok + ' ✔' + (chk ? ' · ' + chk + ' to check' : '') + ' · report sent');
  }
  window.pmProcessAll = function(){ processAll(false); };
  window.pmReopen = async function(id){ try{ await api('reopen', {id: id}); var d = done(); delete d[id]; ls(KDONE, JSON.stringify(d)); toast('Put back as new'); refresh(false); }catch(e){ toast('Could not reopen: ' + e.message); } };
  window.pmAuto = function(on){ ls(KA, on ? '1' : '0'); paint(); };

  /* ---------- setup ---------- */
  window.pmCopyScript = function(){ var s = ($('pmGsSrc') || {}).textContent || ''; try{ copyText(s.trim()); toast('Apps Script copied: paste it into script.google.com'); }catch(e){} };
  window.pmSave = async function(){
    var u = (($('pmUrl') || {}).value || '').trim(), k = (($('pmKey') || {}).value || '').trim();
    if (!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(u)){ toast('Paste the Web app URL that ends with /exec'); return; }
    if (!k){ toast('Paste the KEY you set in the script'); return; }
    ls(KU, u); ls(KK, k);
    try{ var j = await api('ping'); toast('✅ Connected to ' + (j.mailbox || 'the mailbox') + ' · reports go to ' + j.notify); OPEN = false; refresh(true); }catch(e){ toast('Could not connect: ' + e.message); paint(); }
  };
  window.pmSetup = function(){ OPEN = !OPEN; paint(); };
  window.pmForget = function(){ if (!confirm('Disconnect the mail watcher from this browser?')) return; ls(KU, null); ls(KK, null); ITEMS = []; paint(); badge(); };

  /* ---------- UI: PO Inbox page (own menu item) ---------- */
  var TAB = 'new', CH = '', Q = '', SEL = {};
  function msSet(){ try{ var m = JSON.parse(ls('ms_master') || 'null'); var s = {}; ((m && m.rows) || []).forEach(function(r){ if (r && r.po) s[String(r.po).trim().toLowerCase()] = 1; }); return s; }catch(e){ return {}; } }
  function age(iso){ var m = Math.round((Date.now() - Date.parse(iso)) / 60000); return m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' d ago'; }
  function navItem(){
    if ($('niInbox')) return; var src = document.querySelector('#side button[data-n="convert"]'); if (!src) return;
    var ni = src.closest('.ni'), c = ni.cloneNode(true); c.id = 'niInbox';
    var b = c.querySelector('button'); b.dataset.n = 'inbox'; b.setAttribute('onclick', "navTo('inbox')"); b.title = 'New POs from mail (ops@tucokids.com)';
    var q = b.querySelector('q'); if (q) q.remove(); var sp = b.querySelector('span'); if (sp) sp.textContent = 'PO Inbox';
    var svg = b.querySelector('svg'); if (svg) svg.outerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>';
    var st = c.querySelector('.nstar'); if (st){ st.dataset.star = 'inbox'; st.setAttribute('onclick', "navStar('inbox',event)"); }
    ni.parentNode.insertBefore(c, ni.nextSibling);
  }
  function page(){
    var w = document.querySelector('.wrap'); if (!w) return null; var v = $('viewInbox');
    if (!v){ v = document.createElement('div'); v.id = 'viewInbox'; v.innerHTML = '<div class="card" id="pmCard"></div>'; var vc = $('viewConvert'); w.insertBefore(v, vc ? vc.nextSibling : null);
      var s = document.createElement('style'); s.textContent = '#viewInbox{display:none}body[data-page="inbox"] #viewInbox{display:block}'
        + 'body[data-page="inbox"] .wrap>[id^="view"]:not(#viewInbox),body[data-page="inbox"] #jumpBar,body[data-page="inbox"] .wrap>#outputCard{display:none!important}'
        + '#pmCard .pm-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin:10px 0}#pmCard .pm-tiles .kpi{cursor:pointer;text-align:left}'
        + '#pmCard .pm-tiles .kpi.on{outline:2px solid var(--accent,#c6f432)}#pmCard td.ck{width:28px}'; document.head.appendChild(s); }
    return $('pmCard');
  }
  function banner(){
    var vc = $('viewConvert'); if (!vc) return; var b = $('pmBanner'), n = ITEMS.filter(function(x){ return x.status === 'new' && !x.failed; }).length;
    if (!n || !ready()){ if (b) b.remove(); return; }
    if (!b){ b = document.createElement('div'); b.id = 'pmBanner'; b.className = 'lc-note'; b.style.cssText = 'display:flex;gap:10px;align-items:center;margin:0 0 10px'; vc.insertBefore(b, vc.firstChild); }
    b.innerHTML = '📬 <b>' + n + ' new PO' + (n > 1 ? 's' : '') + ' in mail</b><button class="btn-main btn-sm" onclick="navTo(\'inbox\')">Open PO Inbox</button>';
  }
  window.pmTab = function(t){ TAB = t; SEL = {}; paint(); };
  window.pmCh = function(c){ CH = CH === c ? '' : c; SEL = {}; paint(); };
  window.pmQ = function(v){ Q = String(v || '').trim().toLowerCase(); paint(); var q = $('pmQ'); if (q){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); } };
  window.pmSel = function(id, on){ if (on) SEL[id] = 1; else delete SEL[id]; var n = Object.keys(SEL).length, a = $('pmSelBar'); if (a) a.style.display = n ? '' : 'none'; var c = $('pmSelN'); if (c) c.textContent = n; };
  window.pmSelAll = function(on){ document.querySelectorAll('#pmCard input[data-pm]').forEach(function(i){ i.checked = on; pmSel(i.dataset.pm, on); }); };
  window.pmProcessSel = async function(){ var ids = Object.keys(SEL); if (!ids.length || BUSY) return; BUSY = true; paint(); var ok = 0, chk = 0;
    for (var i = 0; i < ids.length; i++){ var it = ITEMS.filter(function(x){ return x.id === ids[i]; })[0]; if (!it || it.status !== 'new') continue; try{ var s = await processOne(it, true); if (s && !s.failed && s.ok) ok++; else chk++; }catch(e){ chk++; } paint(); }
    BUSY = false; SEL = {}; paint(); badge(); toast('📬 ' + ids.length + ' processed · ' + ok + ' ✔' + (chk ? ' · ' + chk + ' to check' : '')); };
  function needsPdf(x){ return /^FirstCry/.test(x.channel || '') && (x.names || []).length && !(x.names || []).some(function(n){ return /\.pdf$/i.test(n); }); }
  window.pmRefetch = async function(id){ toast('Downloading the PO files again…');
    try{ var j = await api('refetch', {id: id}); toast('Got ' + (j.names || []).join(', ')); refresh(false); }
    catch(e){ toast(/Unknown action/.test(e.message) ? 'Update the PO Mail Watcher script to v1.2 first (it adds Re-fetch)' : 'Could not re-fetch: ' + e.message); } };
  window.pmRefetchAll = async function(){ var L = ITEMS.filter(function(x){ return x.status === 'new' && needsPdf(x); }), ok = 0;
    for (var i = 0; i < L.length; i++){ try{ await api('refetch', {id: L[i].id}); ok++; }catch(e){ if (/Unknown action/.test(e.message)){ toast('Update the PO Mail Watcher script to v1.2 first (it adds Re-fetch)'); return; } } }
    toast('Re-fetched ' + ok + ' of ' + L.length); refresh(false); };
  window.pmDismiss = async function(){ var ids = Object.keys(SEL); if (!ids.length) return; if (!confirm('Mark ' + ids.length + ' mail' + (ids.length > 1 ? 's' : '') + ' as "not a PO"? They leave the inbox (no email is sent).')) return;
    for (var i = 0; i < ids.length; i++){ try{ await api('dismiss', {id: ids[i]}); }catch(e){} markLocal(ids[i], {at: Date.now(), ok: true, po: '', ch: 'dismissed', text: 'Not a PO', dismissed: 1}); }
    ITEMS = ITEMS.filter(function(x){ return !SEL[x.id]; }); SEL = {}; paint(); badge(); toast('Removed from the inbox'); };

  function paint(){
    navItem(); banner(); var c = page(); if (!c) return;
    var setup = '<div class="hint" style="margin:8px 0">Get new POs from Gmail automatically, from every channel. <b>One-time setup:</b>'
      + '<ol style="margin:6px 0 6px 18px;padding:0"><li>Click <b>Copy Apps Script</b> and paste it into a new project at <a href="https://script.google.com" target="_blank" rel="noopener">script.google.com</a>, signed in to <b>ops@tucokids.com</b> (the main PO mailbox).</li>'
      + '<li>Set <code>KEY</code> at the top (any secret). <code>NOTIFY_TO</code> is vishnu@tucokids.com only (leave it empty for no emails); then run <b>setup</b> once and allow access.</li>'
      + '<li>Deploy → New deployment → Web app · Execute as <b>Me</b> · Who has access <b>Anyone</b>. Paste the <code>/exec</code> URL and the key below.</li></ol>'
      + '<div class="row" style="gap:8px;flex-wrap:wrap;margin:0"><button class="btn-ghost btn-sm" onclick="pmCopyScript()">Copy Apps Script</button>'
      + '<input id="pmUrl" placeholder="https://script.google.com/macros/s/…/exec" style="flex:2;min-width:260px" value="' + E(cfg().url) + '">'
      + '<input id="pmKey" type="password" placeholder="KEY" style="flex:1;min-width:120px" value="' + E(cfg().key) + '">'
      + '<button class="btn-main btn-sm" onclick="pmSave()">Save &amp; test</button>' + (ready() ? '<button class="btn-ghost btn-sm" onclick="pmForget()">Disconnect</button>' : '') + '</div></div>';
    if (!ready()){ c.innerHTML = '<h2>📬 PO Inbox <span class="h2-sub">not set up · watches ops@tucokids.com, checks and processes new POs from every channel</span></h2>' + setup; return; }
    var M = msSet(), d = done(), last = +ls(KL) || 0;
    var done_ = Object.keys(d).map(function(k){ var r = d[k]; r.id = r.id || k; return r; }).filter(function(r){ return !r.dismissed; }).sort(function(a, b){ return b.at - a.at; }).slice(0, 60);
    var groups = {new: ITEMS.filter(function(x){ return x.status === 'new' && !x.failed; }), look: ITEMS.filter(function(x){ return x.status !== 'new'; }),
      failed: ITEMS.filter(function(x){ return x.failed; }), done: done_};
    var src = groups[TAB] || groups.new, chans = {};
    (TAB === 'done' ? done_.map(function(r){ return {channel: r.ch}; }) : src).forEach(function(x){ chans[x.channel] = (chans[x.channel] || 0) + 1; });
    var list = src.filter(function(x){ var ch = TAB === 'done' ? x.ch : x.channel; return (!CH || ch === CH) && (!Q || [x.po, x.subject, ch, (x.names || []).join(' ')].join(' ').toLowerCase().indexOf(Q) >= 0); });
    var inM = function(po){ return po && M[String(po).trim().toLowerCase()] ? '<span class="lc-p g">✔ In Master</span>' : '<span class="lc-p a">not in Master yet</span>'; };
    var tabs = [['new', '🆕 New', groups.new.length], ['look', '👀 Needs a look', groups.look.length], ['failed', '⚠ Not read', groups.failed.length], ['done', '✅ Processed', done_.length]];
    var head = TAB === 'done' ? '<tr><th>Channel</th><th>PO</th><th>Result</th><th>Processed</th><th>Master</th></tr>'
      : '<tr><th class="ck"><input type="checkbox" onchange="pmSelAll(this.checked)" title="Select all shown"></th><th>Channel</th><th>PO</th><th>Subject</th><th>Received</th><th>File</th><th>Master</th><th></th></tr>';
    var body = list.map(function(x){
      if (TAB === 'done') return '<tr><td><span class="lc-p v">' + E(x.ch || '') + '</span></td><td><b class="mono">' + E(x.po || '—') + '</b></td><td title="' + E(x.text || '') + '">' + (x.ok ? '✅ checked &amp; processed' : '⚠ check') + '</td><td>' + E(age(new Date(x.at).toISOString())) + '</td><td>' + inM(x.po) + '</td></tr>';
      return '<tr><td class="ck"><input type="checkbox" data-pm="' + E(x.id) + '" ' + (SEL[x.id] ? 'checked' : '') + ' onchange="pmSel(this.dataset.pm,this.checked)"></td><td><span class="lc-p ' + (x.status === 'new' ? 'v' : 'a') + '">' + E(x.channel) + '</span></td><td><b class="mono">' + E(x.po || '—') + '</b></td>'
        + '<td style="max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + E(x.subject) + '">' + E(x.subject) + '</td><td>' + E(age(x.at)) + '</td><td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + E((x.names || []).join(', ')) + '">' + ((x.names || []).map(function(n){ return '<span class="lc-p ' + (/\.pdf$/i.test(n) ? 'g' : 'v') + '" style="margin-right:3px">' + E(n.split('.').pop().toUpperCase()) + '</span>'; }).join('') || '—') + '</td><td>' + (x.po ? inM(x.po) : '') + '</td>'
        + '<td style="white-space:normal;min-width:230px">' + (x.failed ? '<span class="lc-p r" title="' + E(x.failed) + '">⚠ not read</span> ' : '')
        + (needsPdf(x) ? '<span class="lc-p a" title="The app reads FirstCry POs from the PDF; only the Excel was downloaded">PDF missing</span> <button class="btn-main btn-sm" onclick="pmRefetch(\'' + E(x.id) + '\')">Re-fetch files</button> ' : '')
        + (x.status === 'new' && !needsPdf(x) ? '<button class="btn-main btn-sm" ' + (BUSY ? 'disabled' : '') + ' onclick="pmProcess(\'' + E(x.id) + '\')">' + (x.failed ? 'Retry' : 'Check &amp; process') + '</button> ' : needsPdf(x) ? '' : '<span class="lc-p a">' + (x.status === 'check' ? '⚠ unknown channel' : '⚠ no PO file') + '</span> ')
        + '<a class="btn-ghost btn-sm" href="' + E(x.link) + '" target="_blank" rel="noopener">Open mail</a></td></tr>'; }).join('');
    c.innerHTML = '<h2>📬 PO Inbox <span class="h2-sub">ops@tucokids.com' + (last ? ' · checked ' + E(age(new Date(last).toISOString())) : '') + (BUSY ? ' · ⏳ processing…' : '') + '</span></h2>'
      + (ERR ? '<div class="lc-note" style="color:var(--danger,#e5484d)">⚠ ' + E(ERR) + '</div>' : '')
      + '<div class="pm-tiles">' + tabs.map(function(t){ return '<button class="kpi ' + (TAB === t[0] ? 'on' : '') + '" onclick="pmTab(\'' + t[0] + '\')"><small>' + t[1] + '</small><b>' + t[2] + '</b></button>'; }).join('') + '</div>'
      + '<div class="lc-tabs">' + Object.keys(chans).sort().map(function(k){ return '<button class="lc-tab ' + (CH === k ? 'on' : '') + '" onclick="pmCh(\'' + E(k).replace(/'/g, '') + '\')">' + E(k) + ' <b>' + chans[k] + '</b></button>'; }).join('') + (CH ? '<button class="lc-tab" onclick="pmCh(\'' + E(CH) + '\')">All channels ✕</button>' : '') + '</div>'
      + '<div class="hx-tools" style="margin:8px 0;flex-wrap:wrap"><input id="pmQ" type="search" placeholder="Search PO, subject, file" style="flex:1;min-width:220px" value="' + E(Q) + '" oninput="pmQ(this.value)">'
      + '<button class="btn-ghost btn-sm" onclick="pmCheck()">⟳ Check mail now</button>'
      + (groups.new.filter(function(x){ return !needsPdf(x); }).length ? '<button class="btn-main btn-sm" ' + (BUSY ? 'disabled' : '') + ' onclick="pmProcessAll()">Check &amp; process all ' + groups.new.filter(function(x){ return !needsPdf(x); }).length + '</button>' : '')
      + (groups.new.filter(needsPdf).length ? '<button class="btn-ghost btn-sm" onclick="pmRefetchAll()">Re-fetch ' + groups.new.filter(needsPdf).length + ' missing PDF' + (groups.new.filter(needsPdf).length > 1 ? 's' : '') + '</button>' : '')
      + '<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" ' + (ls(KA) !== '0' ? 'checked' : '') + ' onchange="pmAuto(this.checked)"> Auto check &amp; process</label>'
      + '<button class="btn-ghost btn-sm" onclick="pmSetup()">Settings</button></div>'
      + '<div id="pmSelBar" class="lc-note" style="display:none;gap:8px;align-items:center"><b id="pmSelN">0</b> selected <button class="btn-main btn-sm" onclick="pmProcessSel()">Check &amp; process selected</button><button class="btn-ghost btn-sm" onclick="pmDismiss()">Not a PO (remove)</button></div>'
      + (OPEN ? setup : '')
      + (list.length ? '<div class="lc-tw"><table class="lc-t"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' : '<div class="lc-empty">Nothing here.</div>')
      + '<div class="hint" style="margin-top:8px">Processed POs are checked against the Master: <b>✔ In Master</b> once the PO row is in the Master sheet (Update Master or your sheet). <a href="#" onclick="pmReopenAsk();return false">Put a mail PO back as new</a></div>';
    if (Object.keys(SEL).length){ var a = $('pmSelBar'); if (a) a.style.display = 'flex'; var n = $('pmSelN'); if (n) n.textContent = Object.keys(SEL).length; }
  }
  function badge(){
    navItem(); var b = document.querySelector('#side button[data-n="inbox"]'); if (!b) return;
    var q = $('nbMail'); if (!q){ q = document.createElement('q'); q.id = 'nbMail'; b.appendChild(q); }
    var n = ITEMS.filter(function(x){ return x.status === 'new'; }).length; q.style.display = n ? '' : 'none'; q.textContent = n; q.title = n ? n + ' new POs in mail' : '';
  }
  function hookBell(){ var _al = window.apAlerts; if (_al && _al.__pm) return;   // bell: attach after every other script has set its alerts
  window.apAlerts = function(){ var a = []; try{ a = _al ? _al() : []; }catch(e){}
    var n = ITEMS.filter(function(x){ return x.status === 'new'; }).length;
    if (n) a.unshift({c: 'var(--accent)', t: n + ' new PO' + (n > 1 ? 's' : '') + ' in mail', s: 'Check and process them', go: 'inbox'});
    var k = ITEMS.length - n; if (k) a.push({c: 'var(--warn)', t: k + ' mail PO' + (k > 1 ? 's need' : ' needs') + ' a look', s: 'Unknown channel or no PO file', go: 'inbox'});
    return a; }; window.apAlerts.__pm = 1; }

  document.addEventListener('po:nav', function(e){ var k = e.detail; if (k === 'inbox'){ var t = $('pageTitle'), d = $('pageDesc'); if (t) t.textContent = 'PO Inbox'; if (d) d.textContent = 'New POs from ops@tucokids.com: check, process and track them against the Master.'; }
    if (k === 'inbox' || k === 'convert') setTimeout(paint, 30); });
  function boot(){ hookBell(); paint(); badge(); if (/mail|inbox/.test(location.hash)){ try{ navTo('inbox'); }catch(e){} }
    setTimeout(function(){ refresh(false); }, 4000); setInterval(function(){ refresh(false); }, 10 * 60e3); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
  window.pmReopenAsk = async function(){ var po = prompt('PO number to put back as new (e.g. pin127261120xhd804e):'); if (!po) return;
    try{ var j = await api('list_all'); }catch(e){ j = null; }
    var hit = j && j.items ? j.items.filter(function(x){ return String(x.po).toLowerCase() === po.trim().toLowerCase(); })[0] : null;
    if (!hit){ toast('Not found in the mail log'); return; } pmReopen(hit.id); };
  window.pmPaint = paint; window.pmRefresh = refresh;
})();
