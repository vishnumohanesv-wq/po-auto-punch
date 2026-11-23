import os
import asyncio, json, sys, tempfile
ORIG, BUILD = sys.argv[1], sys.argv[2]
TMP = tempfile.mkdtemp()
from harness import route
from playwright.async_api import async_playwright
from harness import CHROME

async def page(p, path):
    b = await p.chromium.launch(executable_path=CHROME)
    c = await b.new_context(viewport={'width':1440,'height':900}, accept_downloads=True); await c.route('**/*', route)
    pg = await c.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
    seed = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'seed.json')))
    await pg.goto('file://'+path)
    await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
    await pg.goto('file://'+path); await pg.wait_for_timeout(1200)
    return b, pg, errs

async def main():
    async with async_playwright() as p:
        # 1. Make a legacy download backup in the ORIGINAL v4.0 app
        b, pg, _ = await page(p, ORIG)
        await pg.evaluate("localStorage.setItem('rp_meta','{\"x\":1}')")
        await pg.evaluate("navTo('backup')"); await pg.wait_for_timeout(300)
        async with pg.expect_download() as d: await pg.evaluate("bkExport()")
        dl = await d.value; await dl.save_as(TMP+'/legacy_backup.json'); await b.close()
        j = json.load(open(TMP+'/legacy_backup.json'))
        print('legacy file:', j['app'], len(j['data']), 'keys; book entries', len(json.loads(j['data']['po_record_book'])))

        # 2. New build: damage data, add a key that is NOT in the backup, restore via the legacy Restore input
        b, pg, errs = await page(p, BUILD)
        await pg.evaluate("localStorage.setItem('po_record_book','[]'); localStorage.setItem('po_gs_url','https://example/keep-me'); localStorage.setItem('rp_meta','{\"x\":9}')")
        await pg.evaluate("navTo('backup')"); await pg.wait_for_timeout(500)
        inp = pg.locator('input[type=file][onchange*="bkImport(this.files[0])"]')
        print('legacy restore input found:', await inp.count())
        await inp.set_input_files(TMP+'/legacy_backup.json')
        await pg.wait_for_timeout(2500)   # safety copy + reload
        book = await pg.evaluate("JSON.parse(localStorage.getItem('po_record_book')||'[]').length")
        keep = await pg.evaluate("localStorage.getItem('po_gs_url')")
        copies = await pg.evaluate("new Promise(r=>{const q=indexedDB.open('po_punch_pro',1);q.onsuccess=()=>{const t=q.result.transaction('backups').objectStore('backups').getAll();t.onsuccess=()=>r(t.result.map(x=>[x.label,x.keys,(JSON.parse(x.data.po_record_book||'[]')).length]))}})")
        print('after restore: book entries', book, '| non-backup key kept:', keep, '| rp_meta', await pg.evaluate("localStorage.getItem('rp_meta')"))
        print('safety copies:', copies)

        # 3. New-format download from the new build includes rp_ keys
        async with pg.expect_download() as d: await pg.evaluate("bkExport()")
        dl = await d.value; await dl.save_as(TMP+'/new_download.json')
        nj = json.load(open(TMP+'/new_download.json'))
        print('new download:', nj['app'], 'rp_ keys:', [k for k in nj['data'] if k.startswith('rp_')], '| secrets leaked:', [k for k in nj['data'] if 'gs_url' in k or 'key' in k])

        # 4. A v4 'PO PUNCH PRO' safety-copy file via the rollback card still goes to safety copies
        await pg.evaluate("""(()=>{ const blob=new File([JSON.stringify({app:'PO PUNCH PRO',schema:4,data:{po_record_book:'[]'}})],'v4copy.json'); bkImport(blob); })()""")
        await pg.wait_for_timeout(800)
        n2 = await pg.evaluate("new Promise(r=>{const q=indexedDB.open('po_punch_pro',1);q.onsuccess=()=>{const t=q.result.transaction('backups').objectStore('backups').getAll();t.onsuccess=()=>r(t.result.map(x=>x.label))}})")
        print('copies after v4-format import:', n2, '| book untouched:', await pg.evaluate("JSON.parse(localStorage.getItem('po_record_book')).length"))

        # 5. Junk file: nothing changes
        before = await pg.evaluate("JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))")
        await pg.evaluate("bkImport(new File(['not json'],'junk.json'))"); await pg.wait_for_timeout(600)
        after = await pg.evaluate("JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))")
        print('junk file left data unchanged:', before == after)
        print('page errors:', errs)
        assert book == 36, 'legacy backup did not restore'
        assert keep == 'https://example/keep-me', 'restore removed data that was not in the backup'
        assert any(c[0].startswith('Automatic copy before restoring') and c[2] == 0 for c in copies), 'no safety copy (of the pre-restore state) before restore'
        assert 'rp_meta' in nj['data'] and not [k for k in nj['data'] if 'gs_url' in k or 'key' in k], 'download contents wrong'
        assert before == after and not errs
        print('RESTORE TESTS PASSED')
        await b.close()
asyncio.run(main())
