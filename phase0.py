"""Phase 0 stabilisation (v7). Applied by build.py after the feature steps.
   1. po-core script first in the page: event bus (po:nav, po:data), poWatch(), PO_STATE (replaces eval).
   2. navTo: one core function + 'po:nav' event; every safe 'var x=window.navTo; window.navTo=function(k){x(k); ...}'
      wrapper becomes a listener with the same body, in the same order.
   3. DOM pollers (1-6 s setInterval) -> poWatch (runs on data change / navigation / user input + slow safety tick).
   4. Duplicate globals: bkRows (Record Book export was dead), asnClear (ASN builder 'Clear all' did not clear).
   Every edit is checked: the anchor must match exactly the expected number of times."""
import re

CORE = r"""/* ===== PO Punch core (v7): event bus, poWatch, PO_STATE ===== */
(function(){
  if (window.PO_CORE) return;
  var W = [], timer = null, settle = [];
  function runAll(){ for (var i = 0; i < W.length; i++){ try{ W[i](); }catch(e){ if (window.console) console.error('poWatch', e); } } }
  function kick(){ clearTimeout(timer); timer = setTimeout(runAll, 120);
    settle.forEach(clearTimeout); settle = [600, 1500, 3000].map(function(ms){ return setTimeout(runAll, ms); }); }   // catch async work started by the action
  try{ var S = Storage.prototype, si = S.setItem, ri = S.removeItem;
    S.setItem = function(k, v){ var r = si.apply(this, arguments); try{ document.dispatchEvent(new CustomEvent('po:data', {detail: k})); }catch(e){} return r; };
    S.removeItem = function(k){ var r = ri.apply(this, arguments); try{ document.dispatchEvent(new CustomEvent('po:data', {detail: k})); }catch(e){} return r; };
  }catch(e){}
  ['po:data', 'po:nav', 'click', 'input', 'change', 'drop', 'paste', 'keyup', 'visibilitychange'].forEach(function(ev){ document.addEventListener(ev, kick, true); });
  setInterval(function(){ if (document.visibilityState === 'visible') runAll(); }, 10000);                       // safety tick
  window.poWatch = function(fn){ if (typeof fn === 'function'){ W.push(fn); setTimeout(fn, 0); } return fn; };
  window.poOnNav = function(fn){ document.addEventListener('po:nav', function(e){ fn(e.detail); }); };
  var NAMES = ['lastItems', 'lastItemsMode', 'lastHeader', 'lastFullText', 'rows', 'mode', 'FC_DB', 'fcFix', 'fcFixRefresh'];
  window.PO_STATE = {get: function(n){ if (NAMES.indexOf(n) < 0) return undefined;
    try{ switch (n){ case 'lastItems': return lastItems; case 'lastItemsMode': return lastItemsMode; case 'lastHeader': return lastHeader;
      case 'lastFullText': return lastFullText; case 'rows': return rows; case 'mode': return mode; case 'FC_DB': return FC_DB;
      case 'fcFix': return fcFix; case 'fcFixRefresh': return fcFixRefresh; } }catch(e){ return undefined; } }};
  window.PO_CORE = {version: 7};
})();
"""

def match_brace(s, i):
    """s[i] == '{' -> index of the matching '}' (skips strings, template literals, comments)."""
    depth, n, q = 0, len(s), None
    while i < n:
        c = s[i]
        if q:
            if c == '\\': i += 2; continue
            if c == q: q = None
            elif q == '`' and c == '$' and i + 1 < n and s[i + 1] == '{':     # ${ ... } inside a template literal
                j = match_brace(s, i + 1); i = j + 1; continue
            i += 1; continue
        if c in '\'"`': q = c
        elif c == '/' and i + 1 < n and s[i + 1] == '/': i = s.find('\n', i); i = n if i < 0 else i; continue
        elif c == '/' and i + 1 < n and s[i + 1] == '*': i = s.find('*/', i) + 2; continue
        elif c == '{': depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0: return i
        i += 1
    raise ValueError('unbalanced braces')

WRAP = re.compile(r'(?:var|const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*window\.navTo\s*;\s*window\.navTo\s*=\s*function\s*\(\s*k\s*\)\s*\{\s*\1\(\s*k\s*\)\s*;')

ROUTER = re.compile(r'var\s+_n\s*=\s*window\.navTo\s*;\s*window\.navTo\s*=\s*function\s*\(k\)\s*\{\s*var\s+sub\s*=\s*SUB\[k\]')

def convert_nav(h, log):
    '''Wrappers before the page router ran inside it (base view key): -> po:nav-base listeners.
       Wrappers after it ran after it (page key): -> po:nav listeners; po:nav fires once the router has finished.'''
    r = ROUTER.search(h); rpos = r.start() if r else len(h)
    out, pos, n, skipped = [], 0, 0, 0
    for m in WRAP.finditer(h):
        if m.start() < pos: continue
        brace = h.index('{', h.index('function', m.start()))
        try: end = match_brace(h, brace)
        except ValueError: skipped += 1; continue
        body = h[m.end():end]
        if re.search(r'\breturn\b', body) and re.search(r'\breturn\b\s*[^;}\s]', body): skipped += 1; continue   # returns a value: leave it
        ev = 'po:nav-base' if m.start() < rpos else 'po:nav'
        out.append(h[pos:m.start()]); out.append("document.addEventListener('" + ev + "',function(ev){var k=ev.detail;" + body + '})')
        pos = end + 1; n += 1
    out.append(h[pos:]); h2 = ''.join(out)
    r = ROUTER.search(h2)
    if r:                                                       # po:nav after the router has run, with the page key
        end = match_brace(h2, h2.index('{', h2.index('function', r.start())))
        semi = h2.index(';', end) + 1
        h2 = h2[:semi] + "\n(function(){var r=window.navTo; window.navTo=function(k){ r(k); try{ document.dispatchEvent(new CustomEvent('po:nav',{detail:k})); }catch(e){} };})();" + h2[semi:]
        log.append('phase0: page router kept; po:nav fires after it (page key), po:nav-base inside it (view key)')
    log.append('phase0: %d navTo wrappers -> po:nav listeners (%d left as is)' % (n, skipped))
    return h2, n

def apply(h, log, sub1):
    # core script before the first script of the page
    i = h.find('<script'); assert i > 0
    h = h[:i] + '<script id="po-core">' + CORE + '</script>\n' + h[i:]
    log.append('phase0: po-core (event bus, poWatch, PO_STATE) loads first')
    # core navTo + event
    assert h.count('function navTo(k){') == 1
    h = h.replace('function navTo(k){', "function navTo(k){ navToCore(k); try{ document.dispatchEvent(new CustomEvent('po:nav-base',{detail:k})); }catch(e){} }\nfunction navToCore(k){", 1)
    h, n = convert_nav(h, log)
    # pollers -> poWatch
    P = [('setInterval(navBadges,1000);', 'poWatch(navBadges);'), ('setInterval(hdBadge,2000);', 'poWatch(hdBadge);'),
         ('setInterval(badges,1000);', 'poWatch(badges);'), ('setInterval(sideFoot,6000);', 'poWatch(sideFoot);'),
         ('setInterval(hideZero,1500);', 'poWatch(hideZero);'),
         ('setInterval(function(){ try{ lbPaint(); }catch(e){} },1500);', 'poWatch(function(){ try{ lbPaint(); }catch(e){} });'),
         ('setInterval(function(){ try{ irPaint(); }catch(e){} },1500);', 'poWatch(function(){ try{ irPaint(); }catch(e){} });'),
         ('setInterval(function(){ try{ ezFold(); ezSteps(); }catch(e){} },1200);', 'poWatch(function(){ try{ ezFold(); ezSteps(); }catch(e){} });'),
         ('setInterval(function(){ try{ ip_paint(false); }catch(e){} },1500);', 'poWatch(function(){ try{ ip_paint(false); }catch(e){} });'),
         ('setInterval(paintChip,30000);', 'poWatch(paintChip);'),
         ('setInterval(function(){ try{ btn(); arrange(); foldify(); jump(); }catch(e){} }, 1200);', 'poWatch(function(){ try{ btn(); arrange(); foldify(); jump(); }catch(e){} });'),
         ('setTimeout(tick, 1800); setInterval(tick, 30000);', 'setTimeout(tick, 1800); poWatch(tick);')]
    k = 0
    for a, b in P:
        c = h.count(a)
        if c != 1: raise SystemExit('phase0 poller anchor %r found %d times' % (a[:50], c))
        h = h.replace(a, b); k += 1
    log.append('phase0: %d DOM pollers -> poWatch (change-driven); clocks and time-based jobs kept' % k)
    # duplicate globals
    for a, b in [('function bkRows(){ return bkFiltered()', 'function bkBookRows(){ return bkFiltered()'),
                 ('function bkCsv(){ const r=bkRows();', 'function bkCsv(){ const r=bkBookRows();'),
                 ("const r=bkRows(); if(!r.length) return; if(!window.XLSX){ bkCsv(); return; }", "const r=bkBookRows(); if(!r.length) return; if(!window.XLSX){ bkCsv(); return; }"),
                 ("window.asnClear=function(){ g('asnIn').value=''; run(); g('asnIn').focus(); };", "window.asnPoClear=function(){ g('asnIn').value=''; run(); g('asnIn').focus(); };")]:
        if h.count(a) != 1: raise SystemExit('phase0 anchor %r found %d times' % (a[:60], h.count(a)))
        h = h.replace(a, b)
    m = re.search(r'(onclick="asnPaste\(\)">Paste from clipboard</button>\s*<button class="btn-ghost btn-sm" onclick=")asnClear\(\)(">Clear</button>)', h)
    assert m and len(re.findall(r'onclick="asnPaste\(\)">Paste from clipboard', h)) == 1
    h = h[:m.start()] + m.group(1) + 'asnPoClear()' + m.group(2) + h[m.end():]
    log.append('phase0: bkRows split (Record Book export works again); asnClear split (ASN builder Clear all works again)')
    # eval() in add-on scripts -> PO_STATE
    for a in ["function g(n){ try{ return eval(n); }catch(e){ return undefined; } }",
              "function g(name){ try{ return eval(name); }catch(e){ return undefined; } }       // read app globals declared with let/const"]:
        if h.count(a) != 1: raise SystemExit('phase0 eval anchor missing')
        h = h.replace(a, "function g(n){ return window.PO_STATE ? PO_STATE.get(n) : undefined; }")
    assert not re.search(r'(?<![\w.$])eval\(', re.sub(r'<script type="text/plain".*?</script>', '', h, flags=re.S))
    log.append('phase0: eval() removed (PO_STATE)')
    return h
