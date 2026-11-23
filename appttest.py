import asyncio, json, os, sys, datetime
from harness import route, CHROME
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
def row(po, dist, ch, zone, wh, ap, apSt, qty, boxes, car, awb='SELF', **k):
    r = dict(po=po, d='2026-11-10', ch=ch, m='', zone=zone, wh=wh, dist=dist, car=car, val=qty*300, qty=qty, boxes=boxes, dQty=0, fill=None,
             packed=True, lbl=True, dsp=False, dspD='', apD=ap, apSt=apSt, apOk=bool(__import__('re').search('confirm|booked', apSt, 2)),
             inv='', delD='', grn=False, grnD='', pod=False, stat='', issue='', rem='', awb=awb, podUrl='', rel='', invD='', ded=0, dedR='', pay='', src='m')
    r['del'] = False; r.update(k); return r
P = 'Distributor A ( Purplle ) - BLR'
R = [row('TEST-PUR-%02d' % i, P, 'Purplle', 'South - KA', 'Emiza BLR', '2026-11-20', '✅ Confirmed', q, 1, 'SELF / Maharaj') for i, q in zip(range(62, 69), [20,21,30,15,19,69,19])]
R += [row('TEST-FC-001', 'Distributor B - MUM', 'FirstCry', 'West - MH', 'Delhivery MUM', '2026-11-21', 'Confirmed', 186, 6, 'SELF / Maharaj'),
      row('TEST-REL-001', 'Distributor R - Bhiwandi (Reliance)', 'Reliance', 'West - MH', 'Delhivery MUM', '2026-11-21', 'Confirmed', 432, 11, 'SELF / Maharaj'),
      row('TEST-FC-002', 'Distributor C - Hoskote', 'FirstCry', 'South - KA', 'Emiza BLR', '2026-11-21', 'Requested', 366, 10, 'XpressBees', 'AWB-TEST-1'),
      row('TEST-FC-003', 'Distributor C - Hoskote', 'FirstCry', 'South - KA', 'Emiza BLR', '2026-11-21', 'Requested', 228, 7, 'Movin', 'AWB-TEST-2'),
      row('TEST-FC-004', 'Distributor D - Chennai', 'FirstCry', 'South - KA', 'Emiza BLR', '2026-11-25', 'Confirmed', 162, 5, 'Movin', 'AWB-TEST-3'),
      row('TEST-FC-005', 'Distributor B - MUM', 'FirstCry', 'West - MH', 'Delhivery MUM', '2026-11-25', 'Confirmed', 408, 11, 'SELF / Maharaj', ''),
      row('PO-TODAY-1', 'Distributor E - BLR', 'FirstClub', 'South - KA', 'Emiza BLR', '2026-11-19', 'Confirmed', 618, 24, 'SELF / Maharaj', dsp=True),
      row('PO-OVERDUE-1', 'Health & Glow - BLR', 'Health & Glow', 'South - KA', 'Emiza BLR', '2026-11-12', 'Confirmed', 50, 2, 'Movin', dsp=True),
      row('PO-DELIVERED', 'X', 'DMart', 'West - MH', 'Delhivery MUM', '2026-11-12', 'Confirmed', 10, 1, 'SELF', **{'del': True}),
      row('PO-LATE', 'Distributor F', 'DMart', 'West - MH', 'Delhivery MUM', '2026-11-12', 'Confirmed', 40, 2, 'SELF', delD='2026-11-14', **{'del': True}),
      row('PO-TODAY-DONE', 'Distributor G', 'Purplle', 'South - KA', 'Emiza BLR', '2026-11-19', 'Confirmed', 30, 1, 'SELF', dsp=True, delD='2026-11-19', **{'del': True}),
      row('PO-CANCELLED', 'X', 'DMart', 'West - MH', 'Delhivery MUM', '2026-11-20', 'Confirmed', 10, 1, 'SELF', stat='Cancelled'),
      row('PO-NEEDS-APPT', 'Tata 1mg - GGN', 'Tata 1MG', 'North - HR', 'Emiza GGN', '', '', 80, 3, 'Movin')]
MASTER = {'v': 1, 'at': int(datetime.datetime(2026, 11, 19, 15, 10).timestamp() * 1000), 'src': 'url', 'n': len(R), 'rows': R}

async def main(path, skin='graphite'):
    ok = True
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': 1440, 'height': 900}, permissions=[]); await c.route('**/*', route)
        pg = await c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.clock.install(time=datetime.datetime(2026, 11, 19, 9, 30))
        seed = json.load(open(os.path.join(HERE, 'seed.json'))); seed.update({'po_all_skin': skin, 'po_pro_seen': '1', 'ms_master': json.dumps(MASTER)})
        await pg.goto('file://' + path)
        await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.clock.run_for(4000); await pg.wait_for_timeout(300)
        popup = await pg.evaluate("(document.getElementById('apDaily')||{}).innerText||''")
        print('daily popup:', popup.replace('\n', ' | ')); ok &= '2 today, 7 tomorrow, 1 missed' in popup
        badge = await pg.evaluate("(document.getElementById('nbAppt')||{}).textContent")
        print('menu badge:', badge); ok &= badge == '2'
        await pg.evaluate("ntfToggle()"); await pg.wait_for_timeout(200)
        bell = await pg.evaluate("document.getElementById('ntfPop').innerText"); print('bell:', bell.replace('\n', ' | ')[:300])
        ok &= '1 missed appointment' in bell and '1 appointment today' in bell and '7 appointments tomorrow' in bell
        await pg.evaluate("ntfToggle()")
        await pg.evaluate("navTo('appt')"); await pg.wait_for_timeout(400)
        tabs = await pg.evaluate("[...document.querySelectorAll('#apMaster .lc-tab')].map(b=>b.innerText.replace(/\\s+/g,' '))")
        print('tabs:', tabs)
        ok &= tabs[-7:] == ['Today 2', 'Tomorrow 7', 'Next 7 days 14', 'Missed 1', 'Delivered late (30 days) 1', 'Requested, not confirmed 2', 'Ready, no appointment 1']
        strip = tabs[:8]; print('7-day strip:', strip); ok &= strip[0].endswith(' 2') and '19' in strip[0] and strip[1].endswith(' 7') and '20' in strip[1]
        kpis = await pg.evaluate("[...document.querySelectorAll('#apMaster .kpi')].map(k=>k.innerText.replace(/\\s+/g,' '))")
        print('tiles:', kpis); ok &= any('on-time delivery 67%' in k.lower() for k in kpis) and any(k.lower().startswith('missed 1') for k in kpis)
        await pg.evaluate("apTab('today')"); await pg.wait_for_timeout(200)
        res = await pg.evaluate("[...document.querySelectorAll('#apMaster tbody tr td:last-child')].map(t=>t.innerText)")
        print('today results:', res); ok &= any('Delivered' in r for r in res) and any('Dispatched' in r for r in res)
        await pg.evaluate("apTab('missed')"); await pg.wait_for_timeout(200)
        res = await pg.evaluate("document.querySelector('#apMaster tbody tr td:last-child').innerText"); print('missed result:', res); ok &= 'Missed' in res
        await pg.evaluate("apDay('2026-11-21')"); await pg.wait_for_timeout(200)
        n = await pg.evaluate("document.querySelectorAll('#apMaster tbody tr').length"); print('date filter 21 Nov rows:', n); ok &= n == 4
        await pg.evaluate("apTab('week')"); await pg.wait_for_timeout(200)
        n = await pg.evaluate("document.querySelectorAll('#apMaster tbody tr').length"); print('next 7 days rows incl. 4 date headers:', n); ok &= n == 18
        await pg.evaluate("apTab('tom')"); await pg.wait_for_timeout(200)
        n = await pg.evaluate("document.querySelectorAll('#apMaster tbody tr').length"); print('tomorrow rows:', n); ok &= n == 7
        await pg.screenshot(path='/tmp/appt_tom.png')
        await pg.evaluate("apTab('week')"); await pg.fill('#apQ', 'distributor c'); await pg.wait_for_timeout(300)
        n = await pg.evaluate("document.querySelectorAll('#apMaster tbody tr').length"); print('search "distributor c" in next 7 days (incl. date header):', n); ok &= n == 3
        got = await pg.evaluate("window.__copied=null; window.copyText=t=>{window.__copied=t}; apCopy(); window.__copied")
        print('whatsapp copy:\n  ' + (got or '').replace('\n', '\n  ')); ok &= bool(got) and got.count('\n') == 2 and 'Not dispatched' in got
        await pg.fill('#apQ', ''); await pg.evaluate("apTab('week')"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='/tmp/appt_week.png', full_page=False)
        both = await pg.evaluate("[document.getElementById('apMaster').style.display, !!document.getElementById('lcBody')]")
        await pg.evaluate("navTo('dlv')"); await pg.wait_for_timeout(200)
        hidden = await pg.evaluate("document.getElementById('apMaster').style.display")
        print('section shown on Appointments, hidden elsewhere, manual section kept:', both, hidden); ok &= both == ['', True] and hidden == 'none'
        await pg.reload(); await pg.clock.run_for(4000)
        again = await pg.evaluate("!!document.getElementById('apDaily')"); print('popup again after reload same day:', again); ok &= not again
        print('page errors:', errs); ok &= not errs
        await b.close()
    print('APPOINTMENT TESTS PASSED' if ok else 'APPOINTMENT TESTS FAILED'); sys.exit(0 if ok else 1)
if __name__ == "__main__":
    asyncio.run(main(os.path.abspath(sys.argv[1]), *(sys.argv[2:3])))
