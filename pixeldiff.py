"""Pixel comparison of two builds in a given skin: every module, clock frozen, randomness fixed."""
import asyncio, json, os, sys, datetime
from harness import route, NAV, CHROME
from playwright.async_api import async_playwright
from PIL import Image, ImageChops
HERE = os.path.dirname(os.path.abspath(__file__))
FIX = "Math.random=(()=>{let s=42;return()=>(s=(s*16807)%2147483647)/2147483647})();"

async def snap(path, skin, out, vw, vh, settle):
    os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        c = await b.new_context(viewport={'width': vw, 'height': vh}, reduced_motion='no-preference')
        await c.route('**/*', route); await c.add_init_script(FIX)
        pg = await c.new_page()
        await pg.clock.install(time=datetime.datetime(2026, 11, 19, 13, 9, 59))
        seed = json.load(open(os.path.join(HERE, 'seed.json'))); seed['po_all_skin'] = skin; seed['po_pro_seen'] = '1'
        await pg.goto('file://' + path)
        await pg.evaluate('(d)=>{localStorage.clear();for(const k in d)localStorage.setItem(k,d[k])}', seed)
        await pg.goto('file://' + path); await pg.clock.run_for(3000)
        for k in NAV:
            await pg.evaluate(f"navTo('{k}')"); await pg.clock.run_for(settle); await pg.wait_for_timeout(250)
            await pg.screenshot(path=f'{out}/{k}.png', animations='disabled', caret='hide')
        await b.close()

async def main(a, b, skin, vw=1440, vh=900):
    import tempfile; t = tempfile.mkdtemp()
    await snap(a, skin, t + '/a', vw, vh, 4000); await snap(b, skin, t + '/b', vw, vh, 4000)
    bad = 0
    for k in NAV:
        A = Image.open(f'{t}/a/{k}.png').convert('RGB'); B = Image.open(f'{t}/b/{k}.png').convert('RGB')
        box = ImageChops.difference(A, B).getbbox()
        if box: bad += 1; print(f'  {k:13} differs in box {box}')
    print(f'{skin} {vw}x{vh}: {len(NAV) - bad}/{len(NAV)} modules pixel-identical  (shots in {t})')
asyncio.run(main(sys.argv[1], sys.argv[2], sys.argv[3], *map(int, sys.argv[4:6])))
