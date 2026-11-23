import asyncio, json, os, sys
from harness import route, CHROME
from playwright.async_api import async_playwright
HERE = os.path.dirname(os.path.abspath(__file__))
EXPECT = sys.argv[2].split(',')
async def boot(p, path, saved):
    b = await p.chromium.launch(executable_path=CHROME)
    c = await b.new_context(viewport={'width': 1440, 'height': 900}); await c.route('**/*', route)
    pg = await c.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto('file://' + path); await pg.evaluate('localStorage.clear()')
    if saved is not None:
        seed = json.load(open(os.path.join(HERE, 'seed.json'))); seed['po_pro_seen'] = '1'; seed['po_all_skin'] = saved
        await pg.evaluate('(d)=>{for(const k in d)localStorage.setItem(k,d[k])}', seed)
    await pg.goto('file://' + path); await pg.wait_for_timeout(1200)
    return b, pg, errs
async def main(path):
    ok = True
    async with async_playwright() as p:
        b, pg, errs = await boot(p, path, None)
        first = await pg.evaluate('document.documentElement.dataset.skin'); await b.close()
        print('first run starts on:', first); ok &= first == EXPECT[0]
        b, pg, errs = await boot(p, path, 'neon')
        fb = await pg.evaluate('document.documentElement.dataset.skin'); await b.close()
        print('saved removed look (neon) ->', fb); ok &= fb == EXPECT[0]
        b, pg, errs = await boot(p, path, 'material')
        kept = await pg.evaluate('document.documentElement.dataset.skin')
        print('saved kept look (material) ->', kept); ok &= kept == 'material'
        await pg.evaluate('openStyle()'); await pg.wait_for_timeout(500)
        opts = await pg.evaluate("[...document.querySelectorAll('#styleGrid .sopt')].map(b=>b.dataset.id)")
        heads = await pg.evaluate("[...document.querySelectorAll('#styleGrid .sgroup')].map(h=>h.innerText.replace(/\\s+/g,' '))")
        print('picker shows:', opts, heads); ok &= opts == EXPECT
        for i, sid in enumerate(EXPECT):
            await pg.click(f'#styleGrid .sopt[data-id="{sid}"]'); await pg.wait_for_timeout(1200)
            got = await pg.evaluate("[document.documentElement.dataset.skin, localStorage.getItem('po_all_skin')]")
            ok &= got == [sid, sid]
        print('clicking each look applies and saves it:', ok)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        res = []
        for i, sid in enumerate(EXPECT):     # number keys inside the open picker
            await pg.evaluate('openStyle()'); await pg.wait_for_timeout(300)
            await pg.keyboard.press(str(i + 1)); await pg.wait_for_timeout(1100)
            res.append(await pg.evaluate('document.documentElement.dataset.skin'))
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        print('keys 1..%d select:' % len(EXPECT), res); ok &= res == EXPECT
        print('page errors:', errs); ok &= not errs
        await b.close()
    print('LOOKS TESTS PASSED' if ok else 'LOOKS TESTS FAILED'); sys.exit(0 if ok else 1)
asyncio.run(main(os.path.abspath(sys.argv[1])))
