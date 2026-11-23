"""Master overview dashboard: every tile equals the same rules computed independently from the Master sample."""
import asyncio, json, os, sys, datetime
from harness import route, CHROME
from appttest import MASTER
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__)); TODAY = datetime.date(2026, 11, 19)
def D(s): return datetime.date.fromisoformat(s) if s else None
def expected():
    import re
    R = [r for r in MASTER['rows'] if not re.search(r'cancel|\brto\b', (r['stat'] or '') + ' ' + (r['issue'] or ''), re.I)]
    op = [r for r in R if not r['dsp'] and not r['del']]
    return {'Open POs': len(op), 'Packing pending': len([r for r in op if not r['packed'] and not r['lbl']]), 'Packed / ready': len([r for r in op if r['lbl'] or r['packed']]),
            'In transit': len([r for r in R if r['dsp'] and not r['del']]), 'GRN pending': len([r for r in R if r['del'] and not r['grn']]),
            'Appointments today': len([r for r in R if D(r['apD']) == TODAY]), 'Missed appointments': len([r for r in R if D(r['apD']) and D(r['apD']) < TODAY and not r['del']]),
            'Cancelled / RTO': len(MASTER['rows']) - len(R)}
async def main(path):
    ok = True
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': 1440, 'height': 1000}); await c.route('**/*', route)
        pg = await c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime(2026, 11, 19, 9, 30))
        seed = json.load(open(os.path.join(HERE, 'seed.json'))); seed.update({'po_all_skin': 'graphite', 'po_pro_seen': '1', 'ms_master': json.dumps(MASTER), 'po_ap_alert_day': '2026-11-19'})
        await pg.goto('file://' + path); await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.clock.run_for(3000); await pg.evaluate("navTo('dash')"); await pg.clock.run_for(800); await pg.wait_for_timeout(300)
        tiles = await pg.evaluate("Object.fromEntries([...document.querySelectorAll('#msDash .kpi')].map(k=>[k.querySelector('small').textContent.trim(), +k.querySelector('b').textContent]))")
        E = expected()
        for k, v in E.items():
            g = next((tiles[t] for t in tiles if t.lower() == k.lower()), None); print(f'   {k:20} dashboard {g!s:>4}   expected {v}'); ok &= g == v
        txt = await pg.evaluate("document.getElementById('msDash').innerText")
        print('   alerts:', [l for l in txt.split('\n') if '→' in l]); ok &= 'missed appointment' in txt and 'channel' in txt.lower() and 'warehouse' in txt.lower()
        first = await pg.evaluate("document.getElementById('viewDash').firstElementChild.id"); print('   placed first on Executive Overview:', first == 'msDash'); ok &= first == 'msDash'
        await pg.evaluate("[...document.querySelectorAll('#msDash .kpi')].find(k=>/missed/i.test(k.textContent)).click()"); await pg.wait_for_timeout(400)
        pgk = await pg.evaluate("document.body.dataset.page"); print('   clicking Missed opens:', pgk); ok &= pgk == 'appt'
        await pg.evaluate("navTo('dash')"); await pg.wait_for_timeout(400); await pg.screenshot(path='/tmp/msdash.png')
        print('   page errors:', errs); ok &= not errs
        await b.close()
    print('DASHBOARD TESTS PASSED' if ok else 'DASHBOARD TESTS FAILED'); sys.exit(0 if ok else 1)
if __name__ == '__main__':
    asyncio.run(main(os.path.abspath(sys.argv[1])))
