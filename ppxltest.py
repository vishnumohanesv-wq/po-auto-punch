"""Purplle open PO master Excel → bulk punch. Usage: ppxltest.py index.html openpo.xlsx expected.json"""
import asyncio, json, os, sys
from harness import route, CHROME
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
async def main(path, xl, expf):
    exp = json.load(open(expf)); ok = True
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': 1440, 'height': 1000}); await c.route('**/*', route)
        pg = await c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        import datetime; d, m_, y = map(int, exp['date'].split('.'))
        await pg.clock.set_system_time(datetime.datetime(y, m_, d, 10, 0) + datetime.timedelta(days=1))   # 'today' = day after the POs (batch hides POs older than 3 weeks)
        seed = json.load(open(os.path.join(HERE, 'seed.json'))); seed.update({'po_all_skin': 'graphite', 'po_pro_seen': '1', 'po_ap_alert_day': '2099-01-01'})
        await pg.goto('file://' + path); await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.wait_for_timeout(1200); await pg.evaluate("navTo('convert')")
        await pg.set_input_files('#pdfInput', xl); await pg.wait_for_timeout(2500)
        st = await pg.evaluate("document.getElementById('pdfStatus').innerText"); print('status:', st.split('\n')[0]); [print('   ', l) for l in st.split('\n')[1:4]]
        got = await pg.evaluate("loExtra().filter(r=>r.src==='excel').map(r=>[r.po,r.date,r.items.length,r.qty,r.val])")
        print('records:', len(got), got[:2], '...')
        for po, d, n, q, v in got:
            e = exp['pos'].get(po); ok &= bool(e) and e[0] == n and e[1] == q and abs(e[2] - v) < 0.02
        ok &= len(got) == len(exp['pos']) and all(g[1] == exp['date'] for g in got)
        mode = await pg.evaluate("mode"); vis = await pg.evaluate("getComputedStyle(document.getElementById('loCard')).display")
        rows = await pg.evaluate("document.querySelectorAll('#loPOs input[type=checkbox]').length")
        foot = await pg.evaluate("document.getElementById('loPOFoot').innerText.replace(/\\s+/g,' ')")
        print('mode:', mode, '| batch card:', vis, '| PO rows:', rows, '| footer:', foot)
        ok &= mode == 'purplle' and vis != 'none' and rows == len(exp['pos']) and exp['footer'] in foot
        desk = await pg.evaluate("(P)=>dkLoad().items.filter(i=>P.includes(i.po)).length", list(exp['pos'])); print('in Dispatch Management:', desk); ok &= desk == len(exp['pos'])
        comb = await pg.evaluate("[...document.querySelectorAll('#loComb tr')].length"); cq = await pg.evaluate("(document.getElementById('loFoot')||{}).innerText||''")
        print('combined punch rows:', comb, '| combined footer:', cq.replace('\n', ' ')[:120])
        line = await pg.evaluate("(()=>{const r=loExtra().find(r=>r.po===arguments[0]); return r?r.items[0]:null})", ) if False else await pg.evaluate("loExtra().find(r=>r.src==='excel').items[0]")
        print('first line [EAN, qty, MRP, net, incl GST, line total]:', line); ok &= line == exp['first']
        # the Purplle batch card's own bulk box takes the same file
        await pg.evaluate("localStorage.setItem('po_lo_extra','[]'); loSel=null; renderLoBatch()"); await pg.wait_for_timeout(300)
        await pg.set_input_files('#lbFile', xl); await pg.wait_for_timeout(2500)
        n2 = await pg.evaluate("loExtra().filter(r=>r.src==='excel').length"); print('via the batch card bulk box:', n2, 'POs'); ok &= n2 == len(exp['pos'])
        # a non-Purplle Excel still goes to the Health & Glow reader
        await pg.set_input_files('#pdfInput', os.path.join(HERE, 'testdata', 'hg_like.xlsx')); await pg.wait_for_timeout(1500)
        hg = await pg.evaluate("typeof hgQ!=='undefined' && hgQ ? hgQ.length : -1"); print('other Excel → Health & Glow queue:', hg); ok &= hg >= 1
        print('page errors:', errs); ok &= not errs
        await b.close()
    print('PURPLLE EXCEL TESTS PASSED' if ok else 'PURPLLE EXCEL TESTS FAILED'); sys.exit(0 if ok else 1)
if __name__ == '__main__':
    asyncio.run(main(os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2]), os.path.abspath(sys.argv[3])))
