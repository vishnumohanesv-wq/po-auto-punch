"""Phase 0 checks: Record Book export (bkRows clash), ASN 'Clear all' (asnClear clash), idle background work."""
import asyncio, json, os, sys
from harness import route, CHROME
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
async def run(path):
    R = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': 1440, 'height': 900}, accept_downloads=True); await c.route('**/*', route)
        pg = await c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.add_init_script("window.__jp=0; const _p=JSON.parse; JSON.parse=function(){ window.__jp++; return _p.apply(this, arguments); };")
        seed = json.load(open(os.path.join(HERE, 'seed.json'))); seed.update({'po_all_skin': 'graphite', 'po_pro_seen': '1', 'po_ap_alert_day': '2099-01-01'})
        await pg.goto('file://' + path); await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.wait_for_timeout(3000)
        # 1. idle background work on the dashboard
        await pg.evaluate("navTo('dash')"); await pg.wait_for_timeout(1500)
        a = await pg.evaluate("window.__jp"); await pg.wait_for_timeout(10000); R['idleParses10s'] = await pg.evaluate("window.__jp") - a
        # 2. Record Book CSV export
        await pg.evaluate("navTo('book')"); await pg.wait_for_timeout(500)
        await pg.evaluate("[...document.querySelectorAll('#viewBook button')].find(b=>b.textContent.trim()==='All time').click()"); await pg.wait_for_timeout(300)
        R['bookRowsShown'] = await pg.evaluate("bkFiltered().length")
        try:
            async with pg.expect_download(timeout=4000) as d: await pg.evaluate("bkCsv()")
            f = await (await d.value).path(); txt = open(f, encoding='utf-8').read(); R['bookCsv'] = [txt.split('\n')[0], txt.count('\n')]
        except Exception: R['bookCsv'] = 'no file'
        # 3. ASN builder 'Clear all' + PO list cleaner 'Clear'
        await pg.evaluate("asnList.push({po:'TEST1'}); asnInvs.push({}); document.getElementById('asnIn').value='4200000001'")
        await pg.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Clear all' && /asnClear/.test(b.getAttribute('onclick')||'')).click()")
        R['asnAfterClearAll'] = await pg.evaluate("[asnList.length, asnInvs.length]")
        await pg.evaluate("document.getElementById('asnIn').value='4200000001'; document.querySelector('#asnCard button[onclick*=\"Clear\"]').click()")
        R['poListAfterClear'] = await pg.evaluate("document.getElementById('asnIn').value")
        R['errors'] = errs
        await b.close()
    return R
async def main(old, new):
    B = await run(new); A = await run(old) if old != '-' else {k: '(no baseline)' for k in B}
    for k in A: print(f'{k:18} v6.3: {A[k]!r:60} v7: {B[k]!r}')
    ok = (B['bookCsv'] != 'no file' and B['bookCsv'][0].startswith('Date,Time,Buyer,PO') and B['asnAfterClearAll'] == [0, 0]
          and B['poListAfterClear'] == '' and not B['errors'] and (old == '-' or B['idleParses10s'] < A['idleParses10s']))
    print('PHASE0 TESTS PASSED' if ok else 'PHASE0 TESTS FAILED'); sys.exit(0 if ok else 1)
if __name__ == '__main__':
    asyncio.run(main(sys.argv[1] if sys.argv[1] == '-' else os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])))
