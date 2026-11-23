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
if os.path.isdir(args.src):                       # legacy/src modules (see tools/split.py)
    import split as _split; src = _split.assemble(args.src)
else:
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

# ======================= FirstCry: EasyEcom MRP is final (v5.6) =======================
# 1. MRP source + auto-correct: when the PO MRP differs from EasyEcom, use the EasyEcom MRP and keep the PO margin
sub1("function fcFixItem(it){\n",
     "function fcAutoOn(){ try{ return localStorage.getItem('po_fc_auto_mrp')!=='0'; }catch(e){ return true; } }\n"
     "let _eeM=null,_eeAt=-1;\n"
     "function eeMrpMap(){ let raw=null; try{ raw=localStorage.getItem('po_ee_mrp'); }catch(e){} const k=raw?raw.length:0; if(k!==_eeAt){ _eeAt=k; try{ _eeM=raw?JSON.parse(raw):null; }catch(e){ _eeM=null; } } return _eeM; }\n"
     "function eeMrpFor(fcid){ let row=null; try{ row=FC_DB.find(r=>r[0]===String(fcid)); }catch(e){}\n"
     "  const sku=row?String(row[1]):'', ee=eeMrpMap();\n"
     "  const bi=(row&&+row[4]>0)?+row[4]:null;\n"
     "  if(ee&&ee.m&&sku&&+ee.m[sku]>0) return {mrp:+ee.m[sku],src:'EasyEcom inventory CSV',sku,name:row?row[2]:'',conflict:(bi!=null&&Math.abs(bi-ee.m[sku])>0.005)?bi:null};\n"
     "  if(row&&+row[4]>0) return {mrp:+row[4],src:'built-in EasyEcom list',sku,name:row[2]};\n"
     "  return null; }\n"
     "window.eeMrpFor=eeMrpFor;\n"
     "function fcFixItem(it){\n", 'firstcry: EasyEcom MRP lookup (CSV first, then built-in)')
sub1("  const f=fcFix[it.code]; if(!f) return it;\n",
     "  const f=fcFix[it.code];\n"
     "  if(!f){ const e=fcAutoOn()?eeMrpFor(it.code):null;\n"
     "    if(!e||e.conflict!=null||!(it.mrp>0)||!(it.main>0)||Math.abs(e.mrp-it.mrp)<0.005) return it;\n"
     "    it._o={mrp:it.mrp,base:it.base,main:it.main,qty:it.qty,amt:it.amt};\n"
     "    const tx=(it.tax!=null?it.tax:0), rate=+(it.main*e.mrp/it.mrp).toFixed(2);\n"
     "    it.mrp=e.mrp; it.main=rate; it.base=+(rate/(1+tx/100)).toFixed(2); it.amt=+(it.base*it.qty*(1+tx/100)).toFixed(2);\n"
     "    it.fixed=true; it.auto=e.src; return it; }\n", 'firstcry: auto-correct MRP mismatch at PO margin')
# 2. the PO-error check uses the same source (CSV first)
sub1("      if(m&&m[4]&&o.mrp&&o.mrp!==m[4]){ const fxd=!!i._o; errs.push({k:'mrp',code:i.code,name:m[2],poMrp:o.mrp,eeMrp:m[4],poRate:o.main,eeRate:fxd?i.main:null,qty:o.qty,poAmt:o.amt,eeAmt:fxd?i.amt:null,fixed:fxd}); }",
     "      const em=eeMrpFor(i.code); if(em&&o.mrp&&Math.abs(o.mrp-em.mrp)>0.005){ const fxd=!!i._o; errs.push({k:'mrp',code:i.code,sku:em.sku,name:(m?m[2]:em.name),poMrp:o.mrp,eeMrp:em.mrp,src:em.src,conflict:(em.conflict!=null?em.conflict:null),poRate:o.main,eeRate:fxd?i.main:null,qty:o.qty,poAmt:o.amt,eeAmt:fxd?i.amt:null,fixed:fxd,auto:i.auto||''}); }",
     'firstcry: MRP check uses EasyEcom CSV when loaded')
# 3. error card wording
sub1("<b>${e.code}</b> · PO MRP ${e.poMrp} vs EasyEcom ${e.eeMrp}",
     "<b>${e.code}</b>${e.sku?' ('+e.sku+')':''} · PO MRP ${e.poMrp} vs EasyEcom ${e.eeMrp}${e.eeRate!=null?' · rate '+vfyMoney(e.poRate)+' → '+vfyMoney(e.eeRate):''}${e.auto?' · <b>corrected to EasyEcom</b>':''}${e.conflict!=null?' · <b>not corrected: built-in list says '+e.conflict+'</b>':''}",
     'firstcry: error line shows corrected rate')
sub1("${e.fixed?'Your saved rate fix is applied, so the EasyEcom total is lower than the PO total by this line only.':'No rate fix is saved: add one under <b>Sheet &amp; Mapping</b> so the price follows EasyEcom.'",
     "${e.conflict!=null&&!e.fixed?'Not corrected automatically: your EasyEcom CSV says MRP '+e.eeMrp+' for SKU '+e.sku+', but the built-in list says '+e.conflict+' for this FCID. This is often a pack mapped to a single-unit SKU, or an MRP change. Check which is right and save a Rate fix.':e.auto?'Corrected automatically: MRP set to the EasyEcom value ('+e.src+') and the rate keeps the PO margin ('+(e.poRate/e.poMrp*100).toFixed(1)+'% of MRP). EasyEcom rows, CSV and totals use the corrected rate. Ask FirstCry to amend the PO.':e.fixed?'Your saved rate fix is applied to this line; the EasyEcom rows and CSV use it.':'Auto-correct is off and no rate fix is saved, so the PO price is used. Turn auto-correct on in FirstCry rate fix, or save a fix.'",
     'firstcry: error card explains the correction')
# 4. mark corrected rows in the Punch-ready rows table
sub1("  const f = getFiltered();\n  $('rowCountLabel').textContent",
     "  const fixOf=r=>{ try{ if(typeof lastItemsMode==='undefined'||lastItemsMode!=='firstcry'||!lastItems) return null; return lastItems.find(x=>x.code===r.code)||null; }catch(e){ return null; } };\n"
     "  const fixFlag=r=>{ const it=fixOf(r); if(!it) return ''; if(it._o){ const t=(it.auto?'Corrected to the EasyEcom MRP ('+it.auto+')':'Saved rate fix')+': MRP '+it._o.mrp+' → '+it.mrp+', rate ₹'+(+it._o.main).toFixed(2)+' → ₹'+(+it.main).toFixed(2)+', value ₹'+(+it._o.amt).toFixed(2)+' → ₹'+(+it.amt).toFixed(2)+(it.auto?'. Ask FirstCry to amend the PO.':'');\n"
     "      return `<span class=\"flag flag-fix\" title=\"${esc(t)}\">✏️ MRP ${it._o.mrp}→${it.mrp} · was ₹${(+it._o.main).toFixed(2)}${it.auto?'':' · rate fix'}</span>`; }\n"
     "    const e=(typeof eeMrpFor==='function')?eeMrpFor(r.code):null; if(e&&e.conflict!=null&&Math.abs(it.mrp-e.mrp)>0.005) return `<span class=\"flag flag-conf\" title=\"${esc('Not corrected: PO MRP '+it.mrp+', EasyEcom CSV '+e.mrp+', built-in list '+e.conflict+'. Check and save a Rate fix.')}\">❗ check MRP</span>`; return ''; };\n"
     "  const f = getFiltered();\n  $('rowCountLabel').textContent", 'rows table: helpers for correction marks')
sub1("(r.warn?`<span class=\"flag flag-warn\" title=\"${esc(r.warn)}\">check</span>`:'');\n    return `<tr class=\"${!r.mapped?'unmapped':''} ${r.dup?'dup':''}\"",
     "(r.warn?`<span class=\"flag flag-warn\" title=\"${esc(r.warn)}\">check</span>`:'')+fixFlag(r), fx=(fixOf(r)||{})._o;\n    return `<tr class=\"${!r.mapped?'unmapped':''} ${r.dup?'dup':''} ${fx?'fixed-row':''}\"",
     'rows table: corrected rows flagged and highlighted')
# ======================= Purplle bulk punch from the open PO master Excel (v5.9) =======================
sub1("  const pdfs=files.filter(f=>/\\.pdf$/i.test(f.name)), xls=files.filter(f=>/\\.(xlsx?|csv)$/i.test(f.name));\n",
     "  const pdfs=files.filter(f=>/\\.pdf$/i.test(f.name)), xls=files.filter(f=>/\\.(xlsx?|csv)$/i.test(f.name));\n"
     "  if (window.ppIsOpenPo){ const pp=[], rest=[]; for (const f of xls){ if (await ppIsOpenPo(f)) pp.push(f); else rest.push(f); }\n"
     "    if (pp.length){ await ppLoad(pp); xls.length=0; rest.forEach(f=>xls.push(f)); if (!xls.length && !pdfs.length) return; } }\n",
     'router: Purplle open PO master Excel goes to the Purplle bulk punch')
i = h.rfind('</body>')
h = h[:i] + '<script id="purplle-xl">' + open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'purplle_xl.js'), encoding='utf-8').read() + '</script>\n' + h[i:]
log.append('purplle: open PO master Excel reader')

# Dispatch Management follows the Master Tracker (tools/dk_master.js)
i = h.rfind('</body>')
h = h[:i] + '<script id="dk-master">' + open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dk_master.js'), encoding='utf-8').read() + '</script>\n' + h[i:]
log.append('dispatch: board follows the Master')

# New POs from mail: app side (tools/po_mail.js) + the Apps Script source for "Copy Apps Script"
_gs = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'PO_Mail_Watcher.gs'), encoding='utf-8').read()
assert '</script' not in _gs.lower()
i = h.rfind('</body>')
h = h[:i] + '<script type="text/plain" id="pmGsSrc">' + _gs + '</script>\n<script id="po-mail">' + open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'po_mail.js'), encoding='utf-8').read() + '</script>\n' + h[i:]
log.append('mail: New POs from mail (app + Apps Script)')

# PO Register & Control Tower (tools/erp_register.js) + backupNow exposed for its migration step
sub1("window.bkMake=function(){ backupNow('Manual backup')", "window.poBackupNow=backupNow;window.bkMake=function(){ backupNow('Manual backup')", 'register: expose backupNow for safe migration')
i = h.rfind('</body>')
h = h[:i] + '<script id="erp-register">' + open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'erp_register.js'), encoding='utf-8').read() + '</script>\n' + h[i:]
log.append('register: PO Register & Control Tower')

# Master overview dashboard at the top of Executive Overview (tools/ms_dash.js)
i = h.rfind('</body>')
h = h[:i] + '<script id="ms-dash">' + open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ms_dash.js'), encoding='utf-8').read() + '</script>\n' + h[i:]
log.append('dashboard: Master overview')

# FirstCry EasyEcom-MRP UI: switch, inventory CSV import, MRP check CSV, checklist (tools/fc_mrp.js)
i = h.rfind('</body>')
h = h[:i] + '<script id="fc-mrp">' + open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fc_mrp.js'), encoding='utf-8').read() + '</script>\n' + h[i:]
log.append('firstcry: MRP tools and Before-you-punch checklist')

# Less scrolling: compact density switch, PO Processing jump bar, back to top (tools/ux.js)
i = h.rfind('</body>')
h = h[:i] + '<script id="po-ux">' + open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ux.js'), encoding='utf-8').read() + '</script>\n' + h[i:]
log.append('ux: compact switch, jump bar, back to top')

# Appointments from the Master Tracker + daily alerts (tools/appt_master.js)
sub1("  if(st.holdOn) a.push({c:'var(--warn)',t:st.holdOn+' PO'+(st.holdOn>1?'s':'')+' on hold',s:'Release or cancel them',go:'hold'});\n  return a;",
     "  if(st.holdOn) a.push({c:'var(--warn)',t:st.holdOn+' PO'+(st.holdOn>1?'s':'')+' on hold',s:'Release or cancel them',go:'hold'});\n  try{ if(window.apAlerts) window.apAlerts().forEach(function(x){ a.push(x); }); }catch(e){}\n  return a;",
     'appointments: bell notifications')
i = h.rfind('</body>')
h = h[:i] + '<script id="appt-master">' + open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'appt_master.js'), encoding='utf-8').read() + '</script>\n' + h[i:]
log.append('appointments: master section, badge, daily alert')

# Version label (data schema stays 4: nothing about stored data changed)
VER = 'v7.2 Pro'
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
    assert h.count("document.documentElement.setAttribute('data-skin',s);") == 1
    h = h.replace("document.documentElement.setAttribute('data-skin',s);", "document.documentElement.setAttribute('data-skin',s);try{document.documentElement.setAttribute('data-density',localStorage.getItem('po_density')||'compact')}catch(e){}")
    log.append('ux: density set at boot (no flash)')
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

# ======================= PHASE 0 (v7): stabilisation =======================
import phase0
h = phase0.apply(h, log, sub1)

if __name__ == '__main__':
    open(args.out, 'w', encoding='utf-8').write(h)
    print('design:', args.design); print('\n'.join(log)); print(len(src), '->', len(h))
