"""PO Punch Pro - Phase 2 build. Deterministic transform of the original file.
Usage: python3 tools/build.py source/po-punch-pro-v4.0.html index.html"""
import sys, re, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import strip

import argparse
ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--looks', default='graphite,pro,emerald,porcelain,indigo,material',
                help="comma-separated look ids to keep (first = default), or 'all' for all 42")
ap.add_argument('--design', choices=['classic', 'enterprise'], default='classic',
                help='classic = original design, skins and animations untouched (default); enterprise = v5.0 redesign')
args = ap.parse_args()
DESIGN = args.design == 'enterprise'
src = open(args.src, encoding='utf-8').read()
h = src
log = []

def sub1(old, new, label):
    """Exact, single-occurrence replacement. Fails loudly if the anchor moved."""
    global h
    n = h.count(old)
    if n != 1:
        raise SystemExit(f'ANCHOR {label}: expected 1 match, found {n}')
    h = h.replace(old, new)
    log.append(label)


# ======================= FIXES (always applied) =======================
# 6b. Backup & Restore fix (audit bug #1).
#  - The later window.bkImport(inp) replaced the original bkImport(file), so the Restore button
#    (which passes a File) silently did nothing, and downloaded 'po-auto-punch' backups had no importer.
#  - Now: accepts an <input> or a File; legacy files restore with the original merge semantics
#    (replace same-named items, keep the rest) after an automatic safety copy; v4 files unchanged.
sub1("window.bkImport=function(inp){ var f=inp.files&&inp.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(){ try{ var j=JSON.parse(r.result); if(!j||j.app!=='PO PUNCH PRO'",
     "function bkLegacyRestore(j,f){ var ks=Object.keys(j.data).filter(function(k){ return /^(po_|rp_|vfy_)/.test(k)&&!/key|secret|token/i.test(k)&&typeof j.data[k]==='string'; });"
     " if(!ks.length){ toast('That backup file has no PO Punch data. Nothing was restored.'); return; }"
     " if(!confirm('Restore '+ks.length+' saved items from '+f.name+'?\\n\\nItems with the same name on this device will be replaced; everything else stays. A safety copy of this device is saved first, so you can roll back.')) return;"
     " backupNow('Automatic copy before restoring '+String(f.name).slice(0,40)).then(function(){ var n=0; ks.forEach(function(k){ try{ localStorage.setItem(k,j.data[k]); n++; }catch(e){} }); toast('Restored '+n+' items. Reloading…'); setTimeout(function(){ location.reload(); },700); })"
     ".catch(function(){ toast('Could not save a safety copy first, so nothing was restored.'); }); }\n"
     "window.bkImport=function(inp){ var f=(inp&&inp.files)?inp.files[0]:inp; if(!f||typeof f.name!=='string') return; var r=new FileReader(); r.onload=function(){ try{ var j=JSON.parse(r.result); if(j&&j.app==='po-auto-punch'&&j.data&&typeof j.data==='object'){ bkLegacyRestore(j,f); return; } if(!j||j.app!=='PO PUNCH PRO'",
     'backup: importer accepts File or input, restores legacy backups safely')
sub1("r.readAsText(f); inp.value=''; };", "r.readAsText(f); if(inp&&inp.files) inp.value=''; };", 'backup: only clear real inputs')
sub1("if(/^po_/.test(k)&&!BK_SKIP.test(k)&&!/key|secret|token/i.test(k)) data[k]=localStorage.getItem(k);",
     "if(/^(po_|rp_|vfy_)/.test(k)&&!BK_SKIP.test(k)&&!/key|secret|token/i.test(k)) data[k]=localStorage.getItem(k);",
     'backup: download includes report and verification data')

# Phones: the action-button row on Quick Commerce / FirstCry Weekly scrolled the page sideways.
# Wrap it below 900px only, so desktop layout and every skin look exactly as before.
i = h.rfind('</body>')
assert h.rfind('</script>') < i, 'last </body> must sit after every script'
h = h[:i] + '<style id="fix-mobile-actions">@media (max-width:900px){.hx-actions{flex-wrap:wrap}}</style>\n' + h[i:]
log.append('fix: action rows wrap on phones')

# Version label (data schema stays 4: nothing about stored data changed)
VER = 'v5.3 Pro'
assert h.count('<span class="vtag">v4.0 Pro</span>') == 2
h = h.replace('<span class="vtag">v4.0 Pro</span>', '<span class="vtag">' + VER + '</span>')
log.append('version label v4.0 -> ' + VER + ' (schema unchanged)')

# ======================= LOOKS: keep a chosen set (default 6) =======================
if not DESIGN and args.looks != 'all':
    import json
    KEEP = [x.strip() for x in args.looks.split(',') if x.strip()]
    pers = json.loads(re.search(r'window\.PERS=(\{.*?\}\});', h).group(1))
    all_ids = re.findall(r"\{\s*['\"]?id['\"]?\s*:\s*['\"]([\w-]+)['\"]", h[h.find('const LOOKS=['):h.find('function getSkin()')])
    missing = [k for k in KEEP if k not in all_ids]
    if missing: raise SystemExit('unknown look ids: %s (available: %s)' % (missing, all_ids))
    keep_attr = {}
    for k in KEEP:
        for a, v in pers.get(k, {}).items(): keep_attr.setdefault(a, set()).add(v)
    keep_attr.setdefault('lay', set()).add('side')        # style-picker previews default to 'side'
    strip.KEEP_SKINS = set(KEEP); strip.KEEP_ATTR = keep_attr
    D = KEEP[0]; ids_js = '{' + ','.join('"%s":1' % k for k in KEEP) + '}'
    # boot: unknown or removed saved look -> default; first run -> default
    sub1("localStorage.setItem('po_all_skin','pro')}s=localStorage.getItem('po_all_skin')||'pro'}",
         "localStorage.setItem('po_all_skin','%s')}s=localStorage.getItem('po_all_skin')||'%s'}" % (D, D), 'looks: first-run default ' + D)
    sub1("if(!c[s])s='pro';", "if(!%s[s])s='%s';" % (ids_js, D), 'looks: removed look falls back to ' + D)
    # LOOKS: keep only the chosen ones, in the chosen order (picker, shortcuts, setSkin fallback all follow)
    sub1("function getSkin(){return document.documentElement.getAttribute('data-skin')||'pro'}",
         "(function(){var K=%s,k=K.map(function(id){return LOOKS.find(function(l){return l.id===id;});}).filter(Boolean);LOOKS.splice(0,LOOKS.length);Array.prototype.push.apply(LOOKS,k);})();\n"
         "function getSkin(){return document.documentElement.getAttribute('data-skin')||'%s'}" % (json.dumps(KEEP), D), 'looks: list trimmed to %d' % len(KEEP))
    # picker headings were written for 42 looks in 4 groups
    sub1("const head=i===0?'<div class=\"sgroup\">Colour themes <small>same layout, new look</small></div>'",
         "const head=i===0?'<div class=\"sgroup\">Looks <small>pick one; press 1 to %d</small></div>'" % len(KEEP), 'looks: picker heading')
    h = strip.run(h)
    log.append('looks: kept %s; css %s' % (','.join(KEEP), dict(strip.stats)))
    # fonts: drop Google Fonts links whose families no remaining CSS/JS mentions
    body = re.sub(r'<link href="https://fonts\.googleapis\.com[^>]*>', '', h)
    for link in re.findall(r'<link href="https://fonts\.googleapis\.com/css2\?[^"]*" rel="stylesheet">\n?', h):
        fams = [f.split(':')[0].replace('+', ' ') for f in re.findall(r'family=([^&"]+)', link)]
        if not any(("'%s'" % f) in body or ('"%s"' % f) in body for f in fams):
            h = h.replace(link, ''); log.append('fonts: dropped ' + ', '.join(fams))

# ======================= OPTIONAL REDESIGN (--design enterprise) =======================
if DESIGN:
    # 1. Boot: always start in the Enterprise look (the 41 retired skins are no longer selectable)
    sub1("if(!c[s])s='pro';document.documentElement.setAttribute('data-skin',s);",
         "s='enterprise';try{localStorage.setItem('po_all_skin','enterprise')}catch(e){}document.documentElement.setAttribute('data-skin',s);",
         'boot: force enterprise skin')

    # 2. Register the Enterprise look first in LOOKS so setSkin()/getSkin() resolve to it
    sub1("const LOOKS=[\n",
         "const LOOKS=[\n {id:'enterprise',mode:'light',name:'Enterprise',d:'Midnight navy, white and slate with a violet accent.',c:'#F4F6FA',v:{bg:'#F4F6FA',side:'#0B1530',card:'#fff',line:'#E3E8F0',a:'#5B4CDB',ink:'#0F172A'}},\n",
         'LOOKS: register enterprise')

    # 3. setSkin: any request resolves to enterprise (keyboard shortcuts / old saved ids can't re-enable retired skins)
    sub1("function setSkin(id){\n  const s=LOOKS.find(x=>x.id===id)||LOOKS[0];",
         "function setSkin(id){\n  const s=LOOKS[0];",
         'setSkin: lock to enterprise')

    # 4. Strip CSS for retired skins and skin-only layout personalities
    h = strip.run(h)
    log.append('css: stripped retired skins %s' % dict(strip.stats))

    # 5. Fonts: keep Manrope + IBM Plex Mono only (the other 8 families served retired skins)
    for fam in ['Sora:wght','DM+Sans:wght','Chakra+Petch:wght','Instrument+Sans:wght','Nunito:wght']:
        m = re.search(r'<link href="https://fonts\.googleapis\.com/css2\?family=' + re.escape(fam) + r'[^"]*" rel="stylesheet">\n?', h)
        if not m: raise SystemExit('font link missing ' + fam)
        h = h.replace(m.group(0), '')
    log.append('fonts: dropped 8 unused families (5 requests)')

    # 6. Appearance control: the Style picker is retired; its entry points toggle light/dark/auto instead
    sub1("function openStyle(){buildStyleGrid();",
         "function openStyle(){ if(typeof toggleTheme==='function'){ toggleTheme(); return; } buildStyleGrid();",
         'openStyle -> theme toggle')
    sub1("['🎨 Change style','style theme skin look design',()=>openStyle()]",
         "['🌓 Switch light / dark / auto','style theme dark light mode appearance',()=>openStyle()]",
         'command palette label')

    # 7. Design-system layer, appended after every other stylesheet
    ds = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ds.css'), encoding='utf-8').read().replace('E{', 'html[data-skin="enterprise"]{')
    ds = re.sub(r'(?<![\w-])E(?=[ \[:.#])', 'html[data-skin="enterprise"]', ds)
    i = h.rfind('</body>')
    assert h.rfind('</script>') < i, 'last </body> must sit after every script'
    h = h[:i] + '<style id="ds-enterprise">' + ds + '</style>\n' + h[i:]
    log.append('css: enterprise design layer')

if __name__ == '__main__':
    open(args.out, 'w', encoding='utf-8').write(h)
    print('design:', args.design); print('\n'.join(log)); print(len(src), '->', len(h))
