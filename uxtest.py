"""Less-scrolling checks: page height compact vs comfortable, checklist fold/hide/show, jump bar, appointments fold."""
import asyncio, json, os, sys
from harness import route, CHROME
from appttest import MASTER
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
async def run(path, pdf, dens, skin, shots=False):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': 1440, 'height': 900}); await c.route('**/*', route)
        pg = await c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        seed = json.load(open(os.path.join(HERE, 'seed.json')))
        seed.update({'po_all_skin': skin, 'po_pro_seen': '1', 'po_density': dens, 'ms_master': json.dumps(MASTER), 'po_ap_alert_day': '2099-01-01'})
        await pg.goto('file://' + path); await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.wait_for_timeout(1500)
        H = {}
        for v in ['dash', 'appt', 'desk']:
            await pg.evaluate(f"navTo('{v}')"); await pg.wait_for_timeout(900); H[v] = await pg.evaluate('document.documentElement.scrollHeight')
        await pg.evaluate("navTo('convert')"); await pg.set_input_files('#pdfInput', pdf); await pg.wait_for_timeout(3800)
        H['convert (PO loaded)'] = await pg.evaluate('document.documentElement.scrollHeight')
        info = await pg.evaluate("""()=>({jump:[...document.querySelectorAll('#jumpBar button')].map(b=>b.innerText),
            chkOpen: !!document.querySelector('#poChk details[open]'), chkSummary: (document.querySelector('#poChk summary')||{}).innerText||'',
            dens: document.documentElement.dataset.density, btn:(document.getElementById('densBtn')||{}).innerText})""")
        if shots: await pg.screenshot(path=f'/tmp/ux_{dens}_{skin}.png')
        res = {'H': H, 'info': info, 'errs': errs}
        if dens == 'compact':
            await pg.evaluate("fcChkHide(true)"); await pg.wait_for_timeout(200)
            res['hidden'] = await pg.evaluate("document.getElementById('poChk').innerText")
            await pg.reload(); await pg.wait_for_timeout(1200); await pg.evaluate("navTo('convert')"); await pg.set_input_files('#pdfInput', pdf); await pg.wait_for_timeout(3500)
            res['hiddenAfterReload'] = await pg.evaluate("document.getElementById('poChk').innerText")
            await pg.evaluate("fcChkHide(false)"); await pg.wait_for_timeout(200)
            await pg.click('#poChk summary'); await pg.wait_for_timeout(200)
            res['openAfterClick'] = await pg.evaluate("[!!document.querySelector('#poChk details[open]'), localStorage.po_chk_open]")
            await pg.evaluate("poJump('outputCard')"); await pg.wait_for_timeout(2200)
            res['jumpLands'] = await pg.evaluate("Math.round(document.getElementById('outputCard').getBoundingClientRect().top)")
            res['jumpBarStuck'] = await pg.evaluate("Math.round(document.getElementById('jumpBar').getBoundingClientRect().top)")
            res['toTop'] = await pg.evaluate("document.getElementById('toTop').style.display")
            await pg.click('#densBtn'); await pg.wait_for_timeout(200)
            res['toggle'] = await pg.evaluate("[document.documentElement.dataset.density, localStorage.po_density, document.getElementById('densBtn').innerText]")
            await pg.evaluate("navTo('appt')"); await pg.wait_for_timeout(500)
            await pg.click('#apMaster summary'); await pg.wait_for_timeout(200)
            res['apFold'] = await pg.evaluate("[!!document.querySelector('#apMaster details[open]'), localStorage.po_ap_open, (document.querySelector('#apMaster summary')||{}).innerText]")
            res['errs'] = errs
        await b.close(); return res
async def main(path, pdf):
    ok = True
    for skin in ['graphite', 'pro']:
        C = await run(path, pdf, 'compact', skin, shots=True); N = await run(path, pdf, 'comfortable', skin, shots=True)
        print(f'== {skin}: page height (px) comfortable → compact')
        for k in N['H']: print(f'   {k:20} {N["H"][k]:6} → {C["H"][k]:6}  ({round((1 - C["H"][k] / N["H"][k]) * 100)}% less)')
        print('   jump bar:', C['info']['jump']); print('   checklist starts folded:', not C['info']['chkOpen'], '| summary:', C['info']['chkSummary'].replace('\n', ' '))
        print('   hide → one line:', repr(C['hidden']), '| after reload:', repr(C['hiddenAfterReload'][:40]))
        print('   unfold remembered:', C['openAfterClick'], '| jump lands at', C['jumpLands'], 'px, bar stuck at', C['jumpBarStuck'], '| ↑Top shown:', C['toTop'] == '')
        print('   switch:', C['toggle'], '| appointments fold:', C['apFold'][:2], C['apFold'][2][:70].replace('\n', ' '))
        print('   errors:', C['errs'], N['errs'])
        ok &= all(C['H'][k] <= N['H'][k] for k in N['H']) and C['H']['convert (PO loaded)'] < N['H']['convert (PO loaded)']
        ok &= 'Rows' in C['info']['jump'] and not C['info']['chkOpen'] and '1 corrected' in C['info']['chkSummary']
        ok &= C['hidden'].startswith('Show') and C['hiddenAfterReload'].startswith('Show') and C['openAfterClick'] == [True, '1']
        ok &= 0 <= C['jumpLands'] <= 120 and C['jumpBarStuck'] <= 2 and C['toTop'] == ''
        ok &= C['toggle'][:2] == ['comfortable', 'comfortable'] and C['apFold'][:2] == [False, '0'] and not C['errs'] and not N['errs']
    print('UX TESTS PASSED' if ok else 'UX TESTS FAILED'); sys.exit(0 if ok else 1)
if __name__ == '__main__':
    asyncio.run(main(os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])))
