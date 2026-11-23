"""PO Register: assembly from all stores, milestones + sources, blocker side, duplicates, audited edits, safety copy, export, no data changes."""
import asyncio, json, os, sys, datetime, csv, io
from harness import route, CHROME
from appttest import MASTER
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
async def main(path):
    ok = True
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': 1440, 'height': 1000}, accept_downloads=True); await c.route('**/*', route)
        pg = await c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept('Test User')))
        await pg.clock.install(time=datetime.datetime(2026, 11, 19, 10, 0))
        seed = json.load(open(os.path.join(HERE, 'seed.json')))
        lo = [{'po': '4200099001', 'date': '17.11.2026', 'qty': 120, 'val': 25000, 'items': [['8908022401732', 60, 450, 266.95, 315, 18900]], 'src': 'excel'},
              {'po': '4200099002', 'date': '18.11.2026', 'qty': 120, 'val': 25000.4, 'items': [['8908022401732', 60, 450, 266.95, 315, 18900]], 'src': 'excel'}]
        hold = [{'id': 'h1', 'dr': '2026-11-18', 'chan': 'FirstCry', 'po': 'PO-HELD-1', 'city': 'Chennai', 'node': 'Emiza BLR', 'qty': 10, 'val': 9000, 'st': 'On Hold', 'cat': 'MOQ', 'res': 'Pending'}]
        life = {'PO-TODAY-1': {'ck_verified': '2026-11-18', 'courier': 'SELF', 'h': []}}
        seed.update({'po_all_skin': 'graphite', 'po_pro_seen': '1', 'po_ap_alert_day': '2099-01-01', 'ms_master': json.dumps(MASTER),
                     'po_lo_extra': json.dumps(lo), 'po_hold_list': json.dumps(hold), 'po_life': json.dumps(life)})
        await pg.goto('file://' + path); await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.wait_for_timeout(2500)
        NEW = ['po_audit', 'po_erp_user', 'po_erp_schema', 'po_erp_view']
        snap = "(N)=>JSON.stringify(Object.keys(localStorage).filter(k=>!N.includes(k)&&!/^po_desk$|^po_dk_ms$|^po_ap_/.test(k)).sort().map(k=>[k,localStorage.getItem(k)]))"
        before = await pg.evaluate(snap, NEW)
        await pg.evaluate("navTo('register')"); await pg.wait_for_timeout(900)
        title = await pg.evaluate("document.getElementById('pageTitle').textContent"); vis = await pg.evaluate("getComputedStyle(document.getElementById('viewRegister')).display")
        print('page:', title, vis); ok &= title == 'PO Register' and vis == 'block'
        R = await pg.evaluate("Object.fromEntries(poRegister().map(r=>[r.po,{buyer:r.buyer,src:Object.keys(r.src),m:Object.fromEntries(Object.entries(r.m).map(([k,v])=>[k,v.date+'|'+v.by])),next:r.next,side:r.side,status:r.status,flags:r.flags}]))")
        print('register POs:', len(R))
        x = R['TEST-PUR-62']; print('  TEST-PUR-62 (Master, confirmed):', x['next'], x['side'], x['m'].get('Appointment Confirmed'), x['src'])
        ok &= x['m'].get('Appointment Confirmed') == '2026-11-20|Master' and x['next'] == 'Dispatched' and x['side'] == 'Tuco'
        y = R['TEST-FC-002']; print('  TEST-FC-002 (requested, not confirmed):', y['next'], y['side']); ok &= y['next'] == 'Appointment Confirmed' and y['side'] == 'Buyer'
        z = R['PO-DELIVERED']; print('  PO-DELIVERED:', z['next'], z['side'], z['m'].get('Delivered')); ok &= z['next'] == 'GRN Completed' and z['side'] == 'Buyer'
        print('  PO-CANCELLED:', R['PO-CANCELLED']['status']); ok &= R['PO-CANCELLED']['status'] == 'Cancelled'
        print('  PO-HELD-1:', R['PO-HELD-1']['status'], R['PO-HELD-1']['src']); ok &= R['PO-HELD-1']['status'] == 'On hold'
        print('  PO-TODAY-1 lifecycle verified:', R['PO-TODAY-1']['m'].get('PO Verified')); ok &= R['PO-TODAY-1']['m'].get('PO Verified') == '2026-11-18|Lifecycle'
        print('  duplicates:', R['4200099001']['flags'], R['4200099002']['flags']); ok &= any('duplicate of 4200099002' in f for f in R['4200099001']['flags'])
        desk = [k for k, v in R.items() if 'Dispatch' in v['src'] and 'Packing Completed' in v['m']][:1]
        print('  a Dispatch-board PO with packing done:', desk, R[desk[0]]['m']['Packing Completed'] if desk else None); ok &= bool(desk)
        # search by SKU / EAN from Purplle batch
        await pg.fill('#regQ', '8908022401732'); await pg.wait_for_timeout(400)
        hits = await pg.evaluate("[...document.querySelectorAll('#regCard tbody tr')].map(t=>t.querySelector('td').innerText)"); print('  search by EAN:', hits)
        ok &= set(hits) >= {'4200099001', '4200099002'}
        await pg.evaluate("regClear()"); await pg.wait_for_timeout(300)
        after_view = await pg.evaluate(snap, NEW); print('existing data unchanged by viewing:', before == after_view); ok &= before == after_view
        # audited edit through lcSave
        await pg.evaluate("regOpen('TEST-FC-002')"); await pg.wait_for_timeout(300)
        tl = await pg.evaluate("document.getElementById('regTl').innerText"); ok &= 'Appointment Confirmed' in tl and 'next' in tl
        await pg.fill('#regF_owner', 'Anshuman'); await pg.select_option('#regF_delay', 'Buyer appointment delay'); await pg.fill('#regWhy', 'Buyer slot full')
        await pg.evaluate("regSave('TEST-FC-002')"); await pg.wait_for_timeout(500)
        aud = await pg.evaluate("JSON.parse(localStorage.po_audit)"); lf = await pg.evaluate("JSON.parse(localStorage.po_life)['TEST-FC-002']")
        print('audit:', [(a['u'], a['f'], a['from'], a['to'], a['why']) for a in aud]); print('po_life:', {k: lf[k] for k in ('owner', 'delay')}, 'field history:', len(lf.get('h', [])))
        ok &= len(aud) == 2 and aud[0]['u'] == 'Test User' and aud[0]['why'] == 'Buyer slot full' and lf['owner'] == 'Anshuman' and len(lf['h']) == 2
        # only po_life (the edited PO) + new keys changed
        after = json.loads(await pg.evaluate(snap, NEW)); bef = json.loads(before)
        changed = [k for (k, v), (k2, v2) in zip(sorted(bef), sorted(after)) if v != v2]; print('keys changed by the edit:', changed); ok &= changed == ['po_life']
        # safety copy before first run
        bk = await pg.evaluate("new Promise(r=>{const q=indexedDB.open('po_punch_pro',1);q.onsuccess=()=>{const t=q.result.transaction('backups').objectStore('backups').getAll();t.onsuccess=()=>r(t.result.map(x=>x.label))}})")
        print('safety copies:', bk, '| schema', await pg.evaluate("localStorage.po_erp_schema")); ok &= any('PO Register' in l for l in bk)
        # export
        async with pg.expect_download() as d: await pg.evaluate("regExport('csv')")
        f = await (await d.value).path(); rows = list(csv.reader(io.open(f, encoding='utf-8-sig'))); print('CSV:', rows[0][:8], len(rows) - 1, 'rows'); ok &= rows[0][0] == 'PO' and len(rows) > 5
        await pg.evaluate("regOpen('TEST-FC-002')"); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/reg_detail.png')
        await pg.evaluate("document.getElementById('regDetail').innerHTML=''; window.scrollTo(0,0)"); await pg.wait_for_timeout(300); await pg.screenshot(path='/tmp/reg_list.png')
        print('page errors:', errs); ok &= not errs
        await b.close()
    print('REGISTER TESTS PASSED' if ok else 'REGISTER TESTS FAILED'); sys.exit(0 if ok else 1)
if __name__ == '__main__':
    asyncio.run(main(os.path.abspath(sys.argv[1])))
