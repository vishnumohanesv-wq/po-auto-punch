"""Dispatch board follows the Master: stage mapping, newer-board-change rule, add / remove / fill, summary bar."""
import asyncio, json, os, sys, datetime
from harness import route, CHROME
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
NOW = datetime.datetime(2026, 11, 20, 15, 0); AT = int(datetime.datetime(2026, 11, 20, 14, 0).timestamp() * 1000)
def T(h): return int((NOW - datetime.timedelta(hours=h)).timestamp() * 1000)
def mr(po, **k):
    r = dict(po=po, d='2026-11-15', ch='FirstCry', zone='South - KA', wh='Emiza BLR', dist='Dist ' + po, car='', val=1000, qty=10, boxes=0,
             packed=False, lbl=False, dsp=False, dspD='', apD='', apSt='', apOk=False, delD='', stat='', issue='', src='m'); r['del'] = False; r.update(k); return r
ROWS = [mr('pinA', dsp=True, dspD='2026-11-19'), mr('pinB', packed=True, boxes=6), mr('pinC', packed=True, lbl=True), mr('pinD', stat='Cancelled'),
        mr('pinE'), mr('pinF'), mr('pinNEW', packed=True, qty=50, val=9000), mr('pinOLD', d='2026-09-01'), mr('pinDONE', **{'del': True})]
DESK = [dict(po=p, chan='', wh='', zone='', to='', val=0, qty=0, addr='', boxes='', row='', stage=s, t=t) for p, s, t in
        [('pinA', 0, [T(80)]), ('pinB', 1, [T(70), T(60)]), ('pinC', 0, [T(50)]), ('pinD', 0, [T(40)]),
         ('pinE', 2, [T(30), T(29), T(28)]),          # board says Packed earlier, Master says not packed -> back to Packing Pending
         ('pinF', 3, [T(9), T(1), T(0.9), T(0.5)]),   # board moved after the Master sync (14:00) -> kept
         ('pinLOCAL', 0, [T(2)])]]                    # not in the Master
async def main(path):
    ok = True
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': 1440, 'height': 1000}); await c.route('**/*', route)
        pg = await c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.clock.set_system_time(NOW)
        seed = json.load(open(os.path.join(HERE, 'seed.json')))
        seed.update({'po_all_skin': 'graphite', 'po_pro_seen': '1', 'po_ap_alert_day': '2099-01-01',
                     'po_desk': json.dumps({'items': DESK, 'next': '', 'tags': {}, 'ltag': '@', 'boxes': False, 'v2': 1}),
                     'ms_master': json.dumps({'v': 1, 'at': AT, 'src': 'url', 'n': len(ROWS), 'rows': ROWS})})
        await pg.goto('file://' + path); await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.wait_for_timeout(2500); await pg.evaluate("navTo('desk')"); await pg.wait_for_timeout(600)
        st = await pg.evaluate("Object.fromEntries(dkLoad().items.map(x=>[x.po,[x.stage,x.wh,x.boxes,x.qty,x.t.length]]))")
        for k, v in st.items(): print(f'   {k:9} stage {v[0]} wh={v[1]!r} boxes={v[2]!r} qty={v[3]} t-len={v[4]}')
        exp = {'pinA': 4, 'pinB': 2, 'pinC': 3, 'pinE': 1, 'pinF': 3, 'pinNEW': 2, 'pinLOCAL': 0}
        ok &= all(st.get(k, [None])[0] == v for k, v in exp.items())
        ok &= 'pinD' not in st and 'pinOLD' not in st and 'pinDONE' not in st
        ok &= st['pinB'][2] == '6' and st['pinB'][1] == 'Emiza BLR' and st['pinNEW'][3] == 50 and all(v[4] == v[0] + 1 for v in st.values())
        bar = await pg.evaluate("document.getElementById('dkMsBar').innerText"); print('bar:', bar.replace('\n', ' | '))
        ok &= 'Following the Master' in bar and 'cancelled/RTO removed' in bar and 'kept' in bar and 'not in the Master yet' in bar and '1 added from Master' in bar
        tabs = await pg.evaluate("[...document.querySelectorAll('#dkTabs button, .dk-tabs button, [onclick^=\"dkTab\"]')].map(b=>b.innerText.replace(/\\s+/g,' ')).slice(0,8)")
        print('tabs:', tabs)
        # idempotent: a second sync changes nothing
        before = await pg.evaluate("localStorage.po_desk"); await pg.evaluate("dkMasterSync()"); after = await pg.evaluate("localStorage.po_desk")
        print('second sync changes nothing:', before == after); ok &= before == after
        print('page errors:', errs); ok &= not errs
        await pg.screenshot(path='/tmp/dk_sync.png')
        await b.close()
    print('DISPATCH MASTER TESTS PASSED' if ok else 'DISPATCH MASTER TESTS FAILED'); sys.exit(0 if ok else 1)
if __name__ == '__main__':
    asyncio.run(main(os.path.abspath(sys.argv[1])))
