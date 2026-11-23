"""New POs from mail, end to end against a mock of the PO Mail Watcher web app."""
import asyncio, json, os, sys, base64
from harness import route, CHROME
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
URL = 'https://script.google.com/macros/s/TESTDEPLOY/exec'
PDF = base64.b64encode(open(os.path.join(HERE, 'testdata', 'fc_test_po.pdf'), 'rb').read()).decode()
ITEMS = [{'id': 'm1', 'at': '2026-11-20T10:18:11Z', 'channel': 'FirstCry', 'po': 'TESTPO-1119', 'subject': 'Unbottle Private Limited(North) PONO TESTPO-1119 for TEST STOCKIST',
          'from': 'noreply@firstcry.com', 'files': ['f1'], 'names': ['TESTPO-1119.pdf'], 'status': 'new', 'link': 'https://mail.google.com/x'},
         {'id': 'm3', 'at': '2026-11-20T10:16:17Z', 'channel': 'FirstCry', 'po': 'pinBADLINK0001', 'subject': 'Unbottle Private Limited(South) PONO pinBADLINK0001 for TEST',
          'from': 'noreply@firstcry.com', 'files': ['f2'], 'names': ['pinBADLINK0001.pdf'], 'status': 'new', 'link': 'https://mail.google.com/z'},
         {'id': 'm2', 'at': '2026-11-20T09:00:00Z', 'channel': 'Other (check)', 'po': '', 'subject': 'Purchase order from a new buyer', 'from': 'a@b.com',
          'files': [], 'names': [], 'status': 'check', 'link': 'https://mail.google.com/y'}]
async def main(path, auto):
    calls = []; ok = True
    async def mock(r):
        if r.request.method == 'OPTIONS': return await r.fulfill(status=204)
        q = json.loads(r.request.post_data or '{}'); calls.append(q)
        if q.get('key') != 'K1': body = {'ok': False, 'error': 'Wrong key'}
        elif q['action'] == 'ping': body = {'ok': True, 'notify': 'vishnu@tucokids.com'}
        elif q['action'] in ('list', 'check'): body = {'ok': True, 'items': [i for i in ITEMS if not any(c.get('action') == 'done' and c.get('id') == i['id'] for c in calls)]}
        elif q['action'] == 'file': body = {'ok': True, 'name': 'TESTPO-1119.pdf', 'mime': 'application/pdf', 'b64': PDF} if q['fileId'] == 'f1' else {'ok': True, 'name': 'pinBADLINK0001.pdf', 'mime': 'application/pdf', 'b64': base64.b64encode(b'<html>login</html>').decode()}
        elif q['action'] in ('reopen', 'dismiss'): body = {'ok': True}
        elif q['action'] == 'list_all': body = {'ok': True, 'items': [{'id': i['id'], 'po': i['po'], 'channel': i['channel'], 'status': i['status']} for i in ITEMS]}
        elif q['action'] == 'done': body = {'ok': True}
        else: body = {'ok': False, 'error': 'Unknown action'}
        await r.fulfill(status=200, content_type='application/json', body=json.dumps(body))
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': 1440, 'height': 1000}); await c.route('**/*', route); await c.route(URL, mock)
        pg = await c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        seed = json.load(open(os.path.join(HERE, 'seed.json')))
        seed.update({'po_all_skin': 'graphite', 'po_pro_seen': '1', 'po_ap_alert_day': '2099-01-01', 'po_pm_url': URL, 'po_pm_key': 'K1', 'po_pm_auto': '1' if auto else '0'})
        await pg.goto('file://' + path); await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.wait_for_timeout(1200); await pg.evaluate("navTo('dash')")
        await pg.wait_for_timeout(4500 if not auto else 12000)
        badge = await pg.evaluate("(document.getElementById('nbMail')||{}).textContent||''")
        if not auto:
            print('manual: badge', repr(badge)); ok &= badge == '2'
            bell = await pg.evaluate("apAlerts().map(a=>a.t)"); print('   bell:', bell); ok &= '2 new POs in mail' in bell and '1 mail PO needs a look' in bell
            await pg.evaluate("navTo('inbox')"); await pg.wait_for_timeout(400)
            vis = await pg.evaluate("[getComputedStyle(document.getElementById('viewInbox')).display, getComputedStyle(document.getElementById('viewConvert')).display, document.getElementById('pageTitle').textContent, !!document.querySelector('#side button[data-n=inbox]')]")
            print('   inbox page (inbox shown, convert hidden, title, menu item):', vis); ok &= vis[0] != 'none' and vis[1] == 'none' and vis[2] == 'PO Inbox' and vis[3]
            card = await pg.evaluate("document.getElementById('pmCard').innerText"); print('   inbox:', card.replace('\n', ' | ')[:300]); ok &= 'TESTPO-1119' in card
            await pg.evaluate("pmTab('look')"); await pg.wait_for_timeout(200); ok &= 'unknown channel' in await pg.evaluate("document.getElementById('pmCard').innerText")
            await pg.evaluate("pmTab('new')"); await pg.wait_for_timeout(200)
            await pg.click("#pmCard button:has-text('Check & process all')"); await pg.wait_for_timeout(20000)
        dn = [x for x in calls if x.get('action') == 'done']
        print(('auto' if auto else 'manual') + ': done calls', len(dn)); ok &= len(dn) == 1
        if dn:
            print('   reported:', dn[0]['id'], dn[0].get('po'), 'ok=', dn[0].get('ok')); print('   ' + dn[0]['result'].replace('\n', '\n   ')[:700])
            ok &= dn[0]['id'] == 'm1' and '3 SKU rows' in dn[0]['result'] and '144 pcs' in dn[0]['result']
        st = await pg.evaluate("[mode, (lastItems||[]).length, readHist().length]"); print('   app state (mode, items, history):', st); ok &= st[0] == 'firstcry' and st[1] == 3
        badge = await pg.evaluate("(document.getElementById('nbMail')||{}).textContent||''"); print('   badge after (bad link still waiting):', repr(badge)); ok &= badge == '1'
        await pg.evaluate("navTo('inbox'); pmTab('failed')"); await pg.wait_for_timeout(300)
        nr = await pg.evaluate("document.getElementById('pmCard').innerText"); print('   bad link row:', [l for l in nr.split('\n') if 'BADLINK' in l][:1]); ok &= 'not read' in nr and 'Retry' in nr
        ok &= not any(c.get('action') == 'done' and c.get('id') == 'm3' for c in calls)
        await pg.evaluate("navTo('inbox'); pmTab('done')"); await pg.wait_for_timeout(300)
        card = await pg.evaluate("document.getElementById('pmCard').innerText"); print('   processed tab:', [l for l in card.split('\n') if 'TESTPO' in l][:1]); ok &= 'TESTPO-1119' in card and 'in master' in card.lower()
        await pg.evaluate("pmTab('look')"); await pg.wait_for_timeout(200)
        await pg.evaluate("document.querySelector('#pmCard input[data-pm=m2]').click()"); await pg.wait_for_timeout(100)
        await pg.evaluate("window.confirm=()=>true; pmDismiss()"); await pg.wait_for_timeout(600)
        dm = [x for x in calls if x.get('action') == 'dismiss']; print('   not a PO → dismiss calls:', len(dm)); ok &= len(dm) == 1 and dm[0]['id'] == 'm2'
        await pg.evaluate("document.getElementById('pmCard').scrollIntoView()"); await pg.screenshot(path='/tmp/mail_%s.png' % ('auto' if auto else 'manual'))
        # wrong key shows an error, no crash
        await pg.evaluate("localStorage.setItem('po_pm_key','WRONG'); pmRefresh(false)"); await pg.wait_for_timeout(800)
        er = await pg.evaluate("document.getElementById('pmCard').innerText"); print('   wrong key →', [l for l in er.split('\n') if 'Wrong key' in l][:1]); ok &= 'Wrong key' in er
        print('   page errors:', errs); ok &= not errs
        await b.close()
    return ok
async def run(path):
    a = await main(path, False); b_ = await main(path, True)
    print('MAIL TESTS PASSED' if a and b_ else 'MAIL TESTS FAILED'); sys.exit(0 if a and b_ else 1)
if __name__ == '__main__':
    asyncio.run(run(os.path.abspath(sys.argv[1])))
