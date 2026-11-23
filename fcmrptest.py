"""FirstCry MRP auto-correct, end to end: upload a FirstCry-format PO PDF, check rows, EasyEcom CSV, PO check, checklist,
EasyEcom inventory CSV import, MRP check CSV, auto-correct off, manual fix wins. Usage: fcmrptest.py index.html test.pdf inventory.csv"""
import asyncio, json, os, sys, csv, io
from harness import route, CHROME
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
async def main(path, pdf, inv):
    ok = True
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': 1440, 'height': 1000}, accept_downloads=True); await c.route('**/*', route)
        pg = await c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        seed = json.load(open(os.path.join(HERE, 'seed.json'))); seed.update({'po_all_skin': 'graphite', 'po_pro_seen': '1', 'po_ap_alert_day': '2099-01-01'})
        await pg.goto('file://' + path)
        await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.wait_for_timeout(1200)
        await pg.evaluate("navTo('convert')"); await pg.wait_for_timeout(300)
        async def upload():
            await pg.set_input_files('#pdfInput', pdf)
            await pg.wait_for_timeout(3500)
        await upload()
        st = await pg.evaluate("[lastItemsMode, lastItems.map(i=>[i.code,i.mrp,i.main,i.qty,i.amt,!!i.auto])]")
        print('mode + items:', st)
        sh = [x for x in st[1] if x[0] == '22439293'][0]
        ok &= st[0] == 'firstcry' and sh[1] == 450 and sh[2] == 292.5 and sh[5]
        ok &= all(x[5] is False for x in st[1] if x[0] != '22439293')
        chk = await pg.evaluate("document.getElementById('pdfStatus').innerText")
        line = [l for l in chk.split('\n') if '22439293' in l]; print('PO check line:', line[:2])
        ok &= any('rate ₹162.5 → ₹292.5' in l and 'corrected to EasyEcom' in l for l in line)
        print('qty/amount check:', [l for l in chk.split('\n') if l.startswith('✓ Qty') or l.startswith('✓ Amount') or 'Amount' in l][:3])
        box = await pg.evaluate("(document.getElementById('poChk')||{}).textContent||''")
        print('checklist:', box[:600].replace('\n', ' | ')); ok &= 'MRP 250 → 450' in box and 'rate ₹162.50 → ₹292.50' in box and 'amend the PO' in box
        marks = await pg.evaluate("[...document.querySelectorAll('#tbody tr')].map(tr=>[tr.querySelector('.code').innerText, tr.classList.contains('fixed-row'), (tr.querySelector('.flag-fix')||{}).innerText||''])")
        print('row marks:', marks); ok &= [m for m in marks if m[1]] == [['22439293', True, '✏️ MRP 250→450 · was ₹162.50']]
        rows = await pg.evaluate("(document.getElementById('out')||document.querySelector('textarea.out,#tsvOut,pre'))?.innerText||''")
        ee = await pg.evaluate("rows.map(r=>[r.sku||r.code, r.qty, r.price])")
        print('EasyEcom rows (sku, qty, price):', ee); ok &= any(abs(float(r[2]) - 292.5) < 0.01 and r[1] == 72 for r in ee)
        async with pg.expect_download() as d: await pg.evaluate("fcMrpReport()")
        f = await (await d.value).path(); R = list(csv.reader(io.open(f, encoding='utf-8-sig')))
        print('MRP check CSV:', R[0][:6], '...'); [print('   ', r) for r in R[1:]]
        ok &= any(r[1] == '22439293' and r[13] == 'Corrected to EasyEcom MRP' for r in R)
        # EasyEcom inventory CSV becomes the MRP source
        await pg.set_input_files('#fcMrpBox input[type=file]', inv); await pg.wait_for_timeout(600)
        src = await pg.evaluate("[eeMrpFor('22439293'), JSON.parse(localStorage.po_ee_mrp).n]"); print('after CSV import:', src)
        ok &= src[0]['src'] == 'EasyEcom inventory CSV' and src[0]['mrp'] == 450
        async with pg.expect_download() as d: await pg.evaluate("fcMrpCompare()")
        f = await (await d.value).path(); R = list(csv.reader(io.open(f, encoding='utf-8-sig')))
        dif = [r for r in R[1:] if r[5].startswith('Different')]; print('built-in vs CSV: %d rows, %d with a DIFFERENT MRP:' % (len(R) - 1, len(dif))); [print('    ', r) for r in dif]
        # conflict: built-in 600 vs EasyEcom CSV 300 for FCID 16079373 (pack vs unit) -> not corrected, flagged
        await pg.set_input_files('#pdfInput', os.path.join(os.path.dirname(pdf), 'fc_conflict_po.pdf')); await pg.wait_for_timeout(3500)
        cf = await pg.evaluate("lastItems.filter(i=>i.code==='16079373').map(i=>[i.mrp,i.main,!!i._o])[0]"); print('conflict line (PO MRP 600):', cf); ok &= cf == [600, 390, False]
        cm = await pg.evaluate("(document.querySelector('#tbody .flag-conf')||{}).innerText"); print('   row flag:', cm); ok &= cm == '❗ check MRP'
        box = await pg.evaluate("document.getElementById('poChk').textContent"); print('   flagged:', [l for l in box.split('\n') if '16079373' in l][:1]); ok &= 'needs your decision' in box
        chk = await pg.evaluate("document.getElementById('pdfStatus').innerText"); ok &= 'not corrected: built-in list says 600' in chk
        # auto-correct off -> PO price used, error still shown, checklist warns
        await pg.evaluate("fcAutoToggle(false)"); await upload()
        sh = await pg.evaluate("lastItems.filter(i=>i.code==='22439293').map(i=>[i.mrp,i.main,!!i._o])[0]"); print('auto off:', sh); ok &= sh == [250, 162.5, False]
        box = await pg.evaluate("document.getElementById('poChk').textContent"); ok &= 'NOT corrected' in box
        # manual fix wins over auto
        await pg.evaluate("fcAutoToggle(true); fcFix['22439293']={mrp:450,rate:300,qty:''}; fcFixSave();"); await upload()
        sh = await pg.evaluate("lastItems.filter(i=>i.code==='22439293').map(i=>[i.mrp,i.main,i.auto||''])[0]"); print('manual fix wins:', sh); ok &= sh == [450, 300, '']
        await pg.evaluate("delete fcFix['22439293']; fcFixSave();"); await upload()
        await pg.evaluate("document.getElementById('tbody').scrollIntoView({block:'center'})"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='/tmp/fc_rows.png', full_page=False)
        await pg.screenshot(path='/tmp/fc_check.png', full_page=False)
        await pg.evaluate("document.getElementById('poChk').scrollIntoView()"); await pg.wait_for_timeout(200)
        await pg.screenshot(path='/tmp/fc_chk.png', full_page=False)
        print('page errors:', errs); ok &= not errs
        await b.close()
    print('FIRSTCRY MRP TESTS PASSED' if ok else 'FIRSTCRY MRP TESTS FAILED'); sys.exit(0 if ok else 1)
if __name__ == '__main__':
    asyncio.run(main(os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2]), os.path.abspath(sys.argv[3])))
